import {
  brands,
  collections,
  exchangeRates,
  getDb,
  priceObservations,
  type ReviewRatings,
  reviews,
  scrapeRuns,
  stores,
  users,
  watches,
  watchScores,
  type WatchScoreRow,
} from "@aiguille/db";
import { and, asc, desc, eq, gte, inArray, isNull, lte, ne, type SQL, sql } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";

import {
  type CatalogFilter,
  type Movement,
  NO_COLLECTION_SLUG,
  PAGE_SIZE,
  type WatchCard,
} from "./types";

/**
 * Lectures du catalogue, mises en cache (Cache Components). Les données changent au plus une
 * fois par jour (relevé quotidien) : profil « hours », étiquette « catalog » pour une
 * invalidation ciblée après chaque relevé (lot 3).
 */
function cached() {
  cacheLife("hours");
  cacheTag("catalog");
}

const cardColumns = {
  slug: watches.slug,
  reference: watches.reference,
  name: watches.name,
  brandSlug: brands.slug,
  brandName: brands.name,
  collectionSlug: sql<string>`coalesce(${collections.slug}, ${NO_COLLECTION_SLUG})`,
  collectionName: collections.name,
  movement: watches.movement,
  diameterMm: watches.diameterMm,
  priceCents: watches.catalogPriceCents,
  imageUrl: sql<string | null>`${watches.imageUrls}->>0`,
  discontinued: sql<boolean>`${watches.status} = 'discontinued'`,
  score: sql<number | null>`(select score from watch_scores ws where ws.watch_id = ${watches.id})`,
};

function collectionCondition(slug: string): SQL | undefined {
  return slug === NO_COLLECTION_SLUG ? isNull(watches.collectionId) : eq(collections.slug, slug);
}

function filterConditions(f: CatalogFilter): SQL[] {
  const conditions: (SQL | undefined)[] = [
    f.brandSlug ? eq(brands.slug, f.brandSlug) : undefined,
    f.brands?.length ? inArray(brands.slug, f.brands) : undefined,
    f.collectionSlug ? collectionCondition(f.collectionSlug) : undefined,
    f.movements?.length ? inArray(watches.movement, f.movements) : undefined,
    f.priceMin ? gte(watches.catalogPriceCents, f.priceMin * 100) : undefined,
    f.priceMax ? lte(watches.catalogPriceCents, f.priceMax * 100) : undefined,
    f.diameterMin ? gte(watches.diameterMm, f.diameterMin) : undefined,
    f.diameterMax ? lte(watches.diameterMm, f.diameterMax) : undefined,
  ];
  return conditions.filter((c): c is SQL => c !== undefined);
}

function orderBy(sort: CatalogFilter["sort"]) {
  // Les montres plus produites passent après les actuelles, quel que soit le tri.
  const status = asc(watches.status);
  switch (sort) {
    case "prix-desc":
      return [status, sql`${watches.catalogPriceCents} desc nulls last`, asc(watches.slug)];
    case "note":
      return [
        status,
        sql`(select score from watch_scores ws where ws.watch_id = ${watches.id}) desc nulls last`,
        asc(watches.slug),
      ];
    case "avis":
      // Moyenne bayésienne : une montre à un seul avis 5/5 ne passe pas devant cent avis à 4,6.
      return [
        status,
        sql`(select community_score from watch_scores ws where ws.watch_id = ${watches.id}) desc nulls last`,
        sql`(select score from watch_scores ws where ws.watch_id = ${watches.id}) desc nulls last`,
        asc(watches.slug),
      ];
    case "nom":
      return [status, asc(watches.name), asc(watches.slug)];
    case "recents":
      return [status, desc(watches.firstSeenAt), asc(watches.slug)];
    default:
      return [status, sql`${watches.catalogPriceCents} asc nulls last`, asc(watches.slug)];
  }
}

export async function getWatchCards(
  filter: CatalogFilter,
): Promise<{ items: WatchCard[]; total: number; page: number; pageCount: number }> {
  "use cache";
  cached();
  const db = getDb();
  const where = and(...filterConditions(filter));
  const page = Math.max(1, filter.page ?? 1);

  const [items, [count]] = await Promise.all([
    db
      .select(cardColumns)
      .from(watches)
      .innerJoin(brands, eq(brands.id, watches.brandId))
      .leftJoin(collections, eq(collections.id, watches.collectionId))
      .where(where)
      .orderBy(...orderBy(filter.sort))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),
    db
      .select({ n: sql<number>`count(*)::int` })
      .from(watches)
      .innerJoin(brands, eq(brands.id, watches.brandId))
      .leftJoin(collections, eq(collections.id, watches.collectionId))
      .where(where),
  ]);

  const total = count?.n ?? 0;
  return { items, total, page, pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}

export interface BrandSummary {
  slug: string;
  name: string;
  watchCount: number;
  minPriceCents: number | null;
  maxPriceCents: number | null;
}

export async function getBrands(): Promise<BrandSummary[]> {
  "use cache";
  cached();
  return getDb()
    .select({
      slug: brands.slug,
      name: brands.name,
      watchCount: sql<number>`count(${watches.id})::int`,
      minPriceCents: sql<number | null>`min(${watches.catalogPriceCents})`,
      maxPriceCents: sql<number | null>`max(${watches.catalogPriceCents})`,
    })
    .from(brands)
    .leftJoin(watches, eq(watches.brandId, brands.id))
    .groupBy(brands.id)
    .orderBy(sql`count(${watches.id}) desc`, asc(brands.name));
}

export async function getBrand(slug: string): Promise<BrandSummary | null> {
  "use cache";
  cached();
  const all = await getBrands();
  return all.find((b) => b.slug === slug) ?? null;
}

export interface CollectionSummary {
  slug: string;
  name: string;
  brandSlug: string;
  brandName: string;
  watchCount: number;
  minPriceCents: number | null;
  maxPriceCents: number | null;
}

export async function getCollections(brandSlug?: string): Promise<CollectionSummary[]> {
  "use cache";
  cached();
  const rows = await getDb()
    .select({
      slug: sql<string>`coalesce(${collections.slug}, ${NO_COLLECTION_SLUG})`,
      name: sql<string>`coalesce(${collections.name}, 'Autres modèles')`,
      brandSlug: brands.slug,
      brandName: brands.name,
      watchCount: sql<number>`count(${watches.id})::int`,
      minPriceCents: sql<number | null>`min(${watches.catalogPriceCents})`,
      maxPriceCents: sql<number | null>`max(${watches.catalogPriceCents})`,
    })
    .from(watches)
    .innerJoin(brands, eq(brands.id, watches.brandId))
    .leftJoin(collections, eq(collections.id, watches.collectionId))
    .where(brandSlug ? eq(brands.slug, brandSlug) : undefined)
    .groupBy(brands.slug, brands.name, collections.slug, collections.name)
    .orderBy(sql`count(${watches.id}) desc`, asc(collections.name));
  return rows;
}

export async function getCollection(
  brandSlug: string,
  collectionSlug: string,
): Promise<CollectionSummary | null> {
  "use cache";
  cached();
  const all = await getCollections(brandSlug);
  return all.find((c) => c.slug === collectionSlug) ?? null;
}

export interface WatchDetail extends WatchCard {
  id: number;
  collectionId: number | null;
  caliber: string | null;
  thicknessMm: number | null;
  lugWidthMm: number | null;
  waterResistanceM: number | null;
  powerReserveH: number | null;
  caseMaterial: string | null;
  crystal: string | null;
  dialColor: string | null;
  strapMaterial: string | null;
  rawSpecs: Record<string, string>;
  imageUrls: string[];
  officialUrl: string | null;
  lastSeenAt: Date;
  firstSeenAt: Date;
}

export async function getWatch(
  brandSlug: string,
  collectionSlug: string,
  slug: string,
): Promise<WatchDetail | null> {
  "use cache";
  cached();
  const [row] = await getDb()
    .select({
      ...cardColumns,
      id: watches.id,
      collectionId: watches.collectionId,
      caliber: watches.caliber,
      thicknessMm: watches.thicknessMm,
      lugWidthMm: watches.lugWidthMm,
      waterResistanceM: watches.waterResistanceM,
      powerReserveH: watches.powerReserveH,
      caseMaterial: watches.caseMaterial,
      crystal: watches.crystal,
      dialColor: watches.dialColor,
      strapMaterial: watches.strapMaterial,
      rawSpecs: watches.rawSpecs,
      imageUrls: watches.imageUrls,
      officialUrl: watches.officialUrl,
      lastSeenAt: watches.lastSeenAt,
      firstSeenAt: watches.firstSeenAt,
    })
    .from(watches)
    .innerJoin(brands, eq(brands.id, watches.brandId))
    .leftJoin(collections, eq(collections.id, watches.collectionId))
    .where(
      and(eq(brands.slug, brandSlug), eq(watches.slug, slug), collectionCondition(collectionSlug)),
    )
    .limit(1);
  return row ?? null;
}

/** Montres proches : même collection, prix le plus voisin. */
export async function getSimilarWatches(
  watchId: number,
  brandSlug: string,
  collectionSlug: string,
  priceCents: number | null,
): Promise<WatchCard[]> {
  "use cache";
  cached();
  return getDb()
    .select(cardColumns)
    .from(watches)
    .innerJoin(brands, eq(brands.id, watches.brandId))
    .leftJoin(collections, eq(collections.id, watches.collectionId))
    .where(
      and(
        eq(brands.slug, brandSlug),
        collectionCondition(collectionSlug),
        ne(watches.id, watchId),
        eq(watches.status, "active"),
      ),
    )
    .orderBy(sql`abs(coalesce(${watches.catalogPriceCents}, 0) - ${priceCents ?? 0})`)
    .limit(4);
}

export interface Facets {
  brands: { slug: string; name: string; count: number }[];
  movements: { value: Movement; count: number }[];
  priceMinCents: number | null;
  priceMaxCents: number | null;
}

export async function getFacets(): Promise<Facets> {
  "use cache";
  cached();
  const db = getDb();
  const [brandRows, movementRows, [range]] = await Promise.all([
    getBrands(),
    db
      .select({ value: watches.movement, count: sql<number>`count(*)::int` })
      .from(watches)
      .groupBy(watches.movement)
      .orderBy(sql`count(*) desc`),
    db
      .select({
        min: sql<number | null>`min(${watches.catalogPriceCents})`,
        max: sql<number | null>`max(${watches.catalogPriceCents})`,
      })
      .from(watches),
  ]);
  return {
    brands: brandRows
      .filter((b) => b.watchCount > 0)
      .map((b) => ({ slug: b.slug, name: b.name, count: b.watchCount })),
    movements: movementRows.filter((m): m is { value: Movement; count: number } => !!m.value),
    priceMinCents: range?.min ?? null,
    priceMaxCents: range?.max ?? null,
  };
}

/** Toutes les fiches (sitemap, generateStaticParams). */
export async function getAllWatchPaths(): Promise<
  { brandSlug: string; collectionSlug: string; slug: string; updatedAt: Date; indexable: boolean }[]
> {
  "use cache";
  cached();
  return getDb()
    .select({
      brandSlug: brands.slug,
      collectionSlug: sql<string>`coalesce(${collections.slug}, ${NO_COLLECTION_SLUG})`,
      slug: watches.slug,
      updatedAt: watches.updatedAt,
      indexable: sql<boolean>`${watches.catalogPriceCents} is not null and ${watches.movement} is not null and ${watches.diameterMm} is not null`,
    })
    .from(watches)
    .innerJoin(brands, eq(brands.id, watches.brandId))
    .leftJoin(collections, eq(collections.id, watches.collectionId))
    .orderBy(asc(brands.slug), asc(watches.slug));
}

/** Dernier relevé réussi par source officielle (page Méthodologie). */
export async function getLastRuns(): Promise<{ brandSlug: string; finishedAt: Date }[]> {
  "use cache";
  cached();
  const rows = await getDb()
    .select({
      source: scrapeRuns.source,
      finishedAt: sql<Date>`max(${scrapeRuns.finishedAt})`,
    })
    .from(scrapeRuns)
    .where(eq(scrapeRuns.status, "success"))
    .groupBy(scrapeRuns.source);
  // Identifiants de source : « <marque>-officiel ».
  return rows
    .filter((r) => r.source.endsWith("-officiel") && r.finishedAt)
    .map((r) => ({
      brandSlug: r.source.replace(/-officiel$/, ""),
      finishedAt: new Date(r.finishedAt),
    }));
}

/**
 * Relevés de prix et de stock d'une montre en France, toutes sources (historique et offres de la
 * fiche). Les prix des autres pays, en devises locales, sont lus par getCountryPrices.
 */
export async function getPriceObservations(watchId: number) {
  "use cache";
  cached();
  return getDb()
    .select({
      source: priceObservations.source,
      priceCents: priceObservations.priceCents,
      availability: priceObservations.availability,
      observedAt: priceObservations.observedAt,
      url: priceObservations.url,
    })
    .from(priceObservations)
    .where(and(eq(priceObservations.watchId, watchId), eq(priceObservations.country, "FR")))
    .orderBy(asc(priceObservations.observedAt));
}

/**
 * Nouveautés : références apparues plus de 2 jours après la première montre de leur marque.
 * L'import initial d'une marque (quelques heures) n'en fait donc pas partie, même découpé en
 * plusieurs exécutions.
 */
export async function getNewWatches(
  limit = 48,
): Promise<{ items: (WatchCard & { firstSeenAt: Date })[]; trackedSince: Date | null }> {
  "use cache";
  cached();
  const db = getDb();
  const firstSeenByBrand = sql`(select min(w2.first_seen_at) from ${watches} w2 where w2.brand_id = ${watches.brandId})`;
  const [items, [range]] = await Promise.all([
    db
      .select({ ...cardColumns, firstSeenAt: watches.firstSeenAt })
      .from(watches)
      .innerJoin(brands, eq(brands.id, watches.brandId))
      .leftJoin(collections, eq(collections.id, watches.collectionId))
      .where(sql`${watches.firstSeenAt} > ${firstSeenByBrand} + interval '2 days'`)
      .orderBy(desc(watches.firstSeenAt), asc(watches.slug))
      .limit(limit),
    db.select({ since: sql<Date | null>`min(${watches.firstSeenAt})` }).from(watches),
  ]);
  return { items, trackedSince: range?.since ? new Date(range.since) : null };
}

/** Dernier prix officiel de la montre dans chaque pays couvert (lot 4), en devise locale. */
export async function getCountryPrices(watchId: number, officialSource: string) {
  "use cache";
  cached();
  return getDb()
    .selectDistinctOn([priceObservations.country], {
      country: priceObservations.country,
      priceCents: priceObservations.priceCents,
      currency: priceObservations.currency,
      availability: priceObservations.availability,
      observedAt: priceObservations.observedAt,
      url: priceObservations.url,
    })
    .from(priceObservations)
    .where(
      and(eq(priceObservations.watchId, watchId), eq(priceObservations.source, officialSource)),
    )
    .orderBy(priceObservations.country, desc(priceObservations.observedAt));
}

/** Derniers taux BCE connus (unités de devise pour 1 €) et date de la plus récente publication. */
export async function getLatestRates(): Promise<{
  date: string | null;
  unitsPerEur: Record<string, number>;
}> {
  "use cache";
  cached();
  const rows = await getDb()
    .selectDistinctOn([exchangeRates.currency], {
      currency: exchangeRates.currency,
      unitsPerEur: exchangeRates.unitsPerEur,
      date: exchangeRates.date,
    })
    .from(exchangeRates)
    .orderBy(exchangeRates.currency, desc(exchangeRates.date));
  return {
    date:
      rows
        .map((r) => r.date)
        .sort()
        .at(-1) ?? null,
    unitsPerEur: Object.fromEntries(rows.map((r) => [r.currency, r.unitsPerEur])),
  };
}

export interface StorePoint {
  name: string;
  street: string | null;
  postalCode: string | null;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  brandSlug: string;
  brandName: string;
}

/** Boutiques agréées actives (lot 4), d'une marque ou de toutes. */
export async function getStores(brandSlug?: string): Promise<StorePoint[]> {
  "use cache";
  cached();
  const rows = await getDb()
    .select({
      name: stores.name,
      street: stores.street,
      postalCode: stores.postalCode,
      city: stores.city,
      country: stores.country,
      latitude: stores.latitude,
      longitude: stores.longitude,
      brandSlug: brands.slug,
      brandName: brands.name,
    })
    .from(stores)
    .innerJoin(brands, eq(brands.id, stores.brandId))
    .where(and(eq(stores.status, "active"), brandSlug ? eq(brands.slug, brandSlug) : undefined))
    .orderBy(asc(stores.country), asc(stores.city), asc(stores.name));
  // Une même boutique peut figurer dans plusieurs sitemaps nationaux (URL différentes) :
  // dédoublonnage par marque, nom, adresse et ville.
  const seen = new Set<string>();
  return rows.filter((r): r is StorePoint => {
    if (r.name === null || r.city === null || r.country === null) return false;
    if (r.latitude === null || r.longitude === null) return false;
    const key = [r.brandSlug, r.name, r.street ?? "", r.city].join("|").toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/** Nombre de boutiques agréées actives par marque (liens et sitemap). */
export async function getStoreCounts(): Promise<
  { brandSlug: string; brandName: string; count: number }[]
> {
  "use cache";
  cached();
  return getDb()
    .select({ brandSlug: brands.slug, brandName: brands.name, count: sql<number>`count(*)::int` })
    .from(stores)
    .innerJoin(brands, eq(brands.id, stores.brandId))
    .where(eq(stores.status, "active"))
    .groupBy(brands.slug, brands.name)
    .orderBy(sql`count(*) desc`);
}

/** Dernier prix officiel de chaque montre dans chaque pays (indice des prix européens). */
export async function getOfficialCountryPrices() {
  "use cache";
  cached();
  return getDb()
    .selectDistinctOn([priceObservations.watchId, priceObservations.country], {
      brandSlug: brands.slug,
      brandName: brands.name,
      watchId: priceObservations.watchId,
      country: priceObservations.country,
      priceCents: priceObservations.priceCents,
      currency: priceObservations.currency,
      availability: priceObservations.availability,
    })
    .from(priceObservations)
    .innerJoin(watches, eq(watches.id, priceObservations.watchId))
    .innerJoin(brands, eq(brands.id, watches.brandId))
    .where(
      and(
        sql`${priceObservations.source} = ${brands.slug} || '-officiel'`,
        eq(watches.status, "active"),
      ),
    )
    .orderBy(
      priceObservations.watchId,
      priceObservations.country,
      desc(priceObservations.observedAt),
    );
}

export interface PublicReview {
  id: number;
  authorName: string;
  authorImage: string | null;
  ratings: ReviewRatings;
  ownership: "owner" | "tried";
  comment: string | null;
  updatedAt: Date;
}

export interface WatchRating {
  score: WatchScoreRow | null;
  reviews: PublicReview[];
}

/** Note sur 100 d'une montre et ses avis publiés, du plus récent au plus ancien (lot 5). */
export async function getWatchRating(watchId: number): Promise<WatchRating> {
  "use cache";
  cached();
  const db = getDb();
  const [[score], rows] = await Promise.all([
    db.select().from(watchScores).where(eq(watchScores.watchId, watchId)),
    db
      .select({
        id: reviews.id,
        authorName: users.name,
        authorImage: users.image,
        finishing: reviews.finishing,
        design: reviews.design,
        comfort: reviews.comfort,
        legibility: reviews.legibility,
        accuracy: reviews.accuracy,
        value: reviews.value,
        ownership: reviews.ownership,
        comment: reviews.comment,
        updatedAt: reviews.updatedAt,
      })
      .from(reviews)
      .innerJoin(users, eq(users.id, reviews.userId))
      .where(and(eq(reviews.watchId, watchId), eq(reviews.status, "published")))
      .orderBy(desc(reviews.updatedAt))
      .limit(100),
  ]);
  return {
    score: score ?? null,
    reviews: rows.map(({ finishing, design, comfort, legibility, accuracy, value, ...r }) => ({
      ...r,
      ratings: { finishing, design, comfort, legibility, accuracy, value },
    })),
  };
}

export interface WatchAlternative {
  watch: WatchCard;
  savingCents: number;
  advantages: string[];
}

/**
 * Montres au moins aussi bien équipées et moins chères (comparaison technique, sans note),
 * calculées chaque nuit par refreshScores (packages/db/src/compare.ts).
 */
export async function getWatchAlternatives(watchId: number): Promise<WatchAlternative[]> {
  "use cache";
  cached();
  const db = getDb();
  const [row] = await db
    .select({ alternatives: watchScores.alternatives })
    .from(watchScores)
    .where(eq(watchScores.watchId, watchId));
  const list = row?.alternatives ?? [];
  if (list.length === 0) return [];
  const cards = await db
    .select({ id: watches.id, ...cardColumns })
    .from(watches)
    .innerJoin(brands, eq(brands.id, watches.brandId))
    .leftJoin(collections, eq(collections.id, watches.collectionId))
    .where(
      inArray(
        watches.id,
        list.map((a) => a.watchId),
      ),
    );
  const byId = new Map(cards.map(({ id, ...card }) => [id, card]));
  return list
    .filter((a) => byId.has(a.watchId))
    .map((a) => ({
      watch: byId.get(a.watchId)!,
      savingCents: a.savingCents,
      advantages: a.advantages,
    }));
}
