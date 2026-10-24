import { eq, sql } from "drizzle-orm";

import { warrantyFor } from "./brand-info.ts";
import { type Database } from "./client.ts";
import { type Alternative, findAlternatives } from "./compare.ts";
import {
  extractConstructionFacts,
  extractOwnershipFacts,
  extractMovementFacts,
  family,
  type Family,
  type MovementFacts,
  priceBand,
  type WatchSource,
} from "./facts.ts";
import {
  aiguilleScore,
  type Availability,
  categoryFor,
  communityScore,
  type CommunityScore,
  type Confidence,
  constructionPoints,
  dataConfidence,
  movementPoints,
  percentile,
  type Pillars,
  priorMean,
  relativePillar,
  reviewMean,
  type ReviewRatings,
  valuePillar,
} from "./rating.ts";
import { brands, calibers, collections, reviews, watches, watchScores } from "./schema.ts";

const AVAILABILITY_ORDER: Availability[] = ["in_stock", "preorder", "out_of_stock", "unknown"];

interface Offer {
  source: string;
  priceCents: number | null;
  availability: Availability;
}

export interface ScoreInput extends WatchSource {
  id: number;
  priceCents: number | null;
  discontinued: boolean;
  officialSource: string;
  brandSlug: string;
  /** Dernier relevé français de chaque source (officielle et revendeurs). */
  offers: Offer[];
  reviews: ReviewRatings[];
}

export interface ComputedScore {
  score: number;
  confidence: Confidence;
  pillars: Pillars;
  family: Family;
  priceBand: string | null;
  categoryLabel: string;
  categorySize: number;
  categoryRank: number;
  community: CommunityScore | null;
  movement: MovementFacts;
  /** Montres au moins aussi bien équipées et moins chères (compare.ts). */
  alternatives: Alternative[];
}

/**
 * Note Aiguille de toutes les montres (chacune comparée à sa catégorie) et avis de la
 * communauté. Les montres plus produites sont notées mais ne servent pas de comparaison.
 */
export function buildScores(inputs: ScoreInput[]): Map<number, ComputedScore> {
  const prior = priorMean(inputs.flatMap((w) => w.reviews.map(reviewMean)));

  const prepared = inputs.map((w) => {
    const m = extractMovementFacts(w);
    const c = extractConstructionFacts(w);
    const o = extractOwnershipFacts(w);
    const f = family(w, m, c);
    return {
      w,
      m,
      c,
      o,
      family: f,
      band: priceBand(w.priceCents),
      movement: movementPoints(m),
      construction: constructionPoints(c, f),
    };
  });
  const byId = new Map(prepared.map((p) => [p.w.id, p]));
  const comparable = prepared
    // Pièces vintage : vendues d'occasion par la marque, jamais comparées aux montres neuves.
    .filter((p) => !p.w.discontinued && p.o.vintageYear === null)
    .map((p) => ({ id: p.w.id, band: p.band, family: p.family, priceCents: p.w.priceCents }));

  const result = new Map<number, ComputedScore>();
  const categories = new Map<number, number[]>();
  for (const p of prepared) {
    const category = categoryFor(
      { id: p.w.id, band: p.band, family: p.family, priceCents: p.w.priceCents },
      comparable,
    );
    const peers = category.memberIds.map((id) => byId.get(id)!);
    const equipment = (q: (typeof prepared)[number]) => q.movement.points + q.construction.points;
    const prices = peers.map((q) => q.w.priceCents).filter((v): v is number => v !== null);

    const retailers = p.w.offers.filter((o) => o.source !== p.w.officialSource);
    const selling = retailers.filter(
      (o) =>
        o.priceCents !== null && (o.availability === "in_stock" || o.availability === "preorder"),
    );
    const availability =
      AVAILABILITY_ORDER.find((a) =>
        p.w.offers.some((o) => o.priceCents !== null && o.availability === a),
      ) ?? "unknown";

    const pillars: Pillars = {
      movement: relativePillar(
        p.movement,
        peers.map((q) => q.movement.points),
        "Mouvement mieux doté que",
      ),
      construction: relativePillar(
        p.construction,
        peers.map((q) => q.construction.points),
        "Construction plus soignée que",
      ),
      value: valuePillar(
        percentile(equipment(p), peers.map(equipment)),
        // « Moins chère que X % » : part des montres comparables plus chères.
        p.w.priceCents === null ? 50 : 100 - percentile(p.w.priceCents, prices),
        {
          catalogPriceCents: p.w.priceCents,
          bestRetailerPriceCents: selling.length
            ? Math.min(...selling.map((o) => o.priceCents!))
            : null,
          availability,
          retailerCount: retailers.filter((o) => o.priceCents !== null).length,
          discontinued: p.w.discontinued,
        },
      ),
    };

    result.set(p.w.id, {
      score: aiguilleScore(pillars),
      confidence: dataConfidence(p.m, p.c, peers.length, p.w.priceCents !== null),
      pillars,
      family: p.family,
      priceBand: p.band,
      categoryLabel: category.label,
      categorySize: peers.length,
      categoryRank: 0,
      community: communityScore(p.w.reviews, prior),
      movement: p.m,
      alternatives: [],
    });
    categories.set(p.w.id, category.memberIds);
  }

  // Rang dans la catégorie, une fois toutes les notes connues (1 = meilleure).
  for (const [id, members] of categories) {
    const own = result.get(id)!;
    own.categoryRank =
      1 + members.filter((m) => m !== id && result.get(m)!.score > own.score).length;
  }

  // Comparaison technique (sans note) : alternatives mieux équipées pour moins cher.
  const alternatives = findAlternatives(
    prepared.map((p) => ({
      id: p.w.id,
      name: p.w.name,
      priceCents: p.w.priceCents,
      family: p.family,
      diameterMm: p.w.diameterMm,
      vintage: p.o.vintageYear !== null,
      available: !p.w.discontinued && p.o.vintageYear === null,
      movement: p.m,
      construction: p.c,
      ownership: p.o,
      warrantyMonths: warrantyFor(p.w.brandSlug, p.o.warrantyMonths)?.months ?? null,
    })),
  );
  for (const [id, list] of alternatives) result.get(id)!.alternatives = list;
  return result;
}

const mostFrequent = (values: (number | null)[]): number | null => {
  const counts = new Map<number, number>();
  for (const v of values) if (v !== null) counts.set(v, (counts.get(v) ?? 0) + 1);
  return [...counts].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
};

/**
 * Recalcule et enregistre la note de toutes les montres et la base des calibres. Appelé par le
 * scraper après chaque collecte et par le site après chaque avis (~1 500 lignes : rapide).
 */
export async function refreshScores(db: Database): Promise<number> {
  const rows = await db
    .select({
      id: watches.id,
      brandId: watches.brandId,
      status: watches.status,
      brandSlug: brands.slug,
      name: watches.name,
      collectionName: collections.name,
      movement: watches.movement,
      caliber: watches.caliber,
      diameterMm: watches.diameterMm,
      waterResistanceM: watches.waterResistanceM,
      powerReserveH: watches.powerReserveH,
      caseMaterial: watches.caseMaterial,
      crystal: watches.crystal,
      rawSpecs: watches.rawSpecs,
      priceCents: watches.catalogPriceCents,
      officialUrl: watches.officialUrl,
    })
    .from(watches)
    .innerJoin(brands, eq(brands.id, watches.brandId))
    .leftJoin(collections, eq(collections.id, watches.collectionId));
  if (rows.length === 0) return 0;

  // Dernier relevé français de chaque couple (montre, source).
  const latest = await db.execute<{
    watch_id: number;
    source: string;
    price_cents: number | null;
    availability: Availability;
  }>(sql`
    select distinct on (watch_id, source) watch_id, source, price_cents, availability
    from price_observations
    where country = 'FR'
    order by watch_id, source, observed_at desc`);
  const offers = new Map<number, Offer[]>();
  for (const o of latest) {
    const list = offers.get(o.watch_id) ?? [];
    list.push({ source: o.source, priceCents: o.price_cents, availability: o.availability });
    offers.set(o.watch_id, list);
  }

  const published = await db
    .select({
      watchId: reviews.watchId,
      finishing: reviews.finishing,
      design: reviews.design,
      comfort: reviews.comfort,
      legibility: reviews.legibility,
      accuracy: reviews.accuracy,
      value: reviews.value,
    })
    .from(reviews)
    .where(eq(reviews.status, "published"));
  const byWatch = new Map<number, ReviewRatings[]>();
  for (const { watchId, ...ratings } of published) {
    byWatch.set(watchId, [...(byWatch.get(watchId) ?? []), ratings]);
  }

  const scores = buildScores(
    rows.map((r) => ({
      ...r,
      discontinued: r.status === "discontinued",
      officialSource: `${r.brandSlug}-officiel`,
      offers: offers.get(r.id) ?? [],
      reviews: byWatch.get(r.id) ?? [],
    })),
  );

  const computedAt = new Date();
  const values = [...scores].map(([watchId, s]) => ({
    watchId,
    score: s.score,
    confidence: s.confidence,
    pillars: s.pillars,
    family: s.family,
    priceBand: s.priceBand,
    categoryLabel: s.categoryLabel,
    categorySize: s.categorySize,
    categoryRank: s.categoryRank,
    reviewCount: s.community?.count ?? 0,
    reviewAverage: s.community?.average ?? null,
    communityScore: s.community?.bayesian ?? null,
    communityConfidence: s.community?.confidence ?? null,
    alternatives: s.alternatives,
    computedAt,
  }));
  // Par paquets : une seule requête de plusieurs milliers de lignes dépasse les limites du driver.
  for (let i = 0; i < values.length; i += 500) {
    await db
      .insert(watchScores)
      .values(values.slice(i, i + 500))
      .onConflictDoUpdate({
        target: watchScores.watchId,
        set: {
          score: sql`excluded.score`,
          confidence: sql`excluded.confidence`,
          pillars: sql`excluded.pillars`,
          family: sql`excluded.family`,
          priceBand: sql`excluded.price_band`,
          categoryLabel: sql`excluded.category_label`,
          categorySize: sql`excluded.category_size`,
          categoryRank: sql`excluded.category_rank`,
          reviewCount: sql`excluded.review_count`,
          reviewAverage: sql`excluded.review_average`,
          communityScore: sql`excluded.community_score`,
          communityConfidence: sql`excluded.community_confidence`,
          alternatives: sql`excluded.alternatives`,
          computedAt: sql`excluded.computed_at`,
        },
      });
  }

  await refreshCalibers(db, rows, scores, computedAt);
  return values.length;
}

/** Base des calibres : regroupe les faits publiés par calibre et par marque. */
async function refreshCalibers(
  db: Database,
  rows: { id: number; brandId: number; status: string; officialUrl: string | null }[],
  scores: Map<number, ComputedScore>,
  updatedAt: Date,
) {
  const groups = new Map<string, { brandId: number; name: string; ids: number[] }>();
  for (const r of rows) {
    const caliber = scores.get(r.id)!.movement.caliber;
    if (!caliber) continue;
    const key = `${r.brandId}|${caliber.toUpperCase()}`;
    const g = groups.get(key) ?? { brandId: r.brandId, name: caliber, ids: [] };
    g.ids.push(r.id);
    groups.set(key, g);
  }
  const urls = new Map(rows.map((r) => [r.id, r.officialUrl]));
  const values = [...groups.values()].map((g) => {
    const facts = g.ids.map((id) => scores.get(id)!.movement);
    return {
      brandId: g.brandId,
      name: g.name,
      type: facts.find((f) => f.type)?.type ?? null,
      frequencyVph: mostFrequent(facts.map((f) => f.frequencyVph)),
      powerReserveH: mostFrequent(facts.map((f) => f.powerReserveH)),
      watchCount: g.ids.length,
      siliconCount: facts.filter((f) => f.siliconHairspring).length,
      antimagneticCount: facts.filter((f) => f.antimagnetic).length,
      chronometerCount: facts.filter((f) => f.chronometer).length,
      complications: [...new Set(facts.flatMap((f) => f.complications))],
      sourceUrl: g.ids.map((id) => urls.get(id)).find(Boolean) ?? null,
      updatedAt,
    };
  });
  if (values.length === 0) return;
  await db
    .insert(calibers)
    .values(values)
    .onConflictDoUpdate({
      target: [calibers.brandId, calibers.name],
      set: {
        type: sql`excluded.type`,
        frequencyVph: sql`excluded.frequency_vph`,
        powerReserveH: sql`excluded.power_reserve_h`,
        watchCount: sql`excluded.watch_count`,
        siliconCount: sql`excluded.silicon_count`,
        antimagneticCount: sql`excluded.antimagnetic_count`,
        chronometerCount: sql`excluded.chronometer_count`,
        complications: sql`excluded.complications`,
        sourceUrl: sql`excluded.source_url`,
        updatedAt: sql`excluded.updated_at`,
      },
    });
}
