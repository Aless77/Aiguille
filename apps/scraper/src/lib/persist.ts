import {
  brands,
  collections,
  type Database,
  priceObservations,
  scrapeRuns,
  specs,
  watches,
  watchTranslations,
  translationSchema,
  type WatchTranslationData,
} from "@aiguille/db";
import { and, desc, eq, inArray, lt, sql } from "drizzle-orm";

import { type Listing } from "./listing.ts";
import { type Offer } from "./offer.ts";
import { referenceKey, slugify } from "./text.ts";

type Observation = Pick<Listing, "priceCents" | "availability">;

/** Un relevé n'est enregistré que si le prix ou la disponibilité change (cahier des charges). */
export function hasChanged(
  last: { priceCents: number | null; availability: string } | undefined,
  next: Observation,
): boolean {
  if (!last) return true;
  return last.priceCents !== (next.priceCents ?? null) || last.availability !== next.availability;
}

/** Écarte ce dont la page a échoué pendant l'exécution : son absence ne prouve pas un retrait. */
export function withoutFailedPages<T extends { url: string | null }>(
  rows: T[],
  failedUrls: ReadonlySet<string>,
): T[] {
  return rows.filter((r) => r.url === null || !failedUrls.has(r.url));
}

export interface SaveResult {
  watchId: number;
  created: boolean;
  priceChanged: boolean;
}

export class Persister {
  private brandIds = new Map<string, number>();
  private collectionIds = new Map<string, number>();

  constructor(
    private readonly db: Database,
    private readonly source: string,
    /** Nom de l'exécution dans le journal (« tissot-officiel@DE » pour un relevé par pays). */
    private readonly runLabel: string = source,
  ) {}

  private async brandId(slug: string): Promise<number> {
    const cached = this.brandIds.get(slug);
    if (cached) return cached;
    const [row] = await this.db.select({ id: brands.id }).from(brands).where(eq(brands.slug, slug));
    if (!row) throw new Error(`Marque inconnue : ${slug} (lancez npm run db:seed)`);
    this.brandIds.set(slug, row.id);
    return row.id;
  }

  private async collectionId(brandId: number, name: string): Promise<number> {
    const slug = slugify(name);
    const key = `${brandId}:${slug}`;
    const cached = this.collectionIds.get(key);
    if (cached) return cached;
    const [row] = await this.db
      .insert(collections)
      .values({ brandId, slug, name })
      .onConflictDoUpdate({
        target: [collections.brandId, collections.slug],
        set: { name: sql`excluded.name` },
      })
      .returning({ id: collections.id });
    if (!row) throw new Error(`Collection non enregistrée : ${name}`);
    this.collectionIds.set(key, row.id);
    return row.id;
  }

  /** Crée ou met à jour la montre, puis ajoute un relevé de prix si nécessaire. */
  async save(listing: Listing, seenAt: Date): Promise<SaveResult> {
    const brandId = await this.brandId(listing.brandSlug);
    const collectionId = listing.collectionName
      ? await this.collectionId(brandId, listing.collectionName)
      : null;

    const details = {
      name: listing.name,
      description: listing.description ?? null,
      movement: listing.specs.movement ?? null,
      caliber: listing.specs.caliber ?? null,
      diameterMm: listing.specs.diameterMm ?? null,
      thicknessMm: listing.specs.thicknessMm ?? null,
      lugWidthMm: listing.specs.lugWidthMm ?? null,
      waterResistanceM: listing.specs.waterResistanceM ?? null,
      powerReserveH: listing.specs.powerReserveH ?? null,
      caseMaterial: listing.specs.caseMaterial ?? null,
      crystal: listing.specs.crystal ?? null,
      dialColor: listing.specs.dialColor ?? null,
      strapMaterial: listing.specs.strapMaterial ?? null,
      // Accents normalisés (NFC) : Tissot publie certains libellés en accents décomposés.
      rawSpecs: specs(listing),
      imageUrls: listing.imageUrls,
      catalogPriceCents: listing.priceCents ?? null,
      officialUrl: listing.url,
      status: "active" as const,
      lastSeenAt: seenAt,
      updatedAt: seenAt,
    };

    const [row] = await this.db
      .insert(watches)
      .values({
        brandId,
        collectionId,
        referenceKey: referenceKey(listing.reference),
        reference: listing.reference,
        // Slug immuable : fixé à la création, jamais modifié ensuite.
        slug: slugify(listing.reference),
        firstSeenAt: seenAt,
        ...details,
      })
      .onConflictDoUpdate({
        target: [watches.brandId, watches.referenceKey],
        set: {
          ...details,
          // Une collection déjà attribuée n'est pas changée (elle figure dans l'URL publique).
          collectionId: sql`coalesce(${watches.collectionId}, excluded.collection_id)`,
        },
      })
      .returning({ id: watches.id, created: sql<boolean>`(xmax = 0)` });
    if (!row) throw new Error(`Montre non enregistrée : ${listing.reference}`);

    const priceChanged = await this.recordObservation(row.id, listing, seenAt);
    return { watchId: row.id, created: row.created, priceChanged };
  }

  /** Ajoute un relevé pour (montre, source, pays) si le prix ou la disponibilité a changé. */
  private async recordObservation(
    watchId: number,
    observation: Observation & { url: string; currency: string },
    seenAt: Date,
    country = "FR",
  ): Promise<boolean> {
    const [last] = await this.db
      .select({
        priceCents: priceObservations.priceCents,
        availability: priceObservations.availability,
      })
      .from(priceObservations)
      .where(
        and(
          eq(priceObservations.watchId, watchId),
          eq(priceObservations.source, this.source),
          eq(priceObservations.country, country),
        ),
      )
      .orderBy(desc(priceObservations.observedAt))
      .limit(1);

    if (!hasChanged(last, observation)) return false;
    await this.db.insert(priceObservations).values({
      watchId,
      source: this.source,
      country,
      priceCents: observation.priceCents ?? null,
      currency: observation.currency,
      availability: observation.availability,
      url: observation.url,
      observedAt: seenAt,
    });
    return true;
  }

  /**
   * Fiche dans une langue (translations.ts) : remplacée à chaque relevé, écrite seulement si elle
   * change. Une fiche invalide est ignorée sans interrompre la collecte.
   */
  async saveTranslation(
    watchId: number,
    locale: string,
    data: WatchTranslationData,
    sourceUrl: string,
  ): Promise<boolean> {
    const parsed = translationSchema.safeParse(data);
    if (!parsed.success) return false;
    const result = await this.db
      .insert(watchTranslations)
      .values({ watchId, locale, data: parsed.data, sourceUrl })
      .onConflictDoUpdate({
        target: [watchTranslations.watchId, watchTranslations.locale],
        set: { data: parsed.data, sourceUrl, updatedAt: sql`now()` },
        setWhere: sql`${watchTranslations.data} is distinct from excluded.data`,
      })
      .returning({ watchId: watchTranslations.watchId });
    return result.length > 0;
  }

  /** Prix national d'une montre du catalogue (lot 4), dans la devise du pays. */
  saveCountryPrice(
    watchId: number,
    country: string,
    observation: Observation & { url: string; currency: string },
    seenAt: Date,
  ): Promise<boolean> {
    return this.recordObservation(watchId, observation, seenAt, country);
  }

  /** Montres actives d'une marque ayant une fiche officielle (base des relevés par pays). */
  async officialPages(brandSlug: string): Promise<{ id: number; url: string }[]> {
    const brandId = await this.brandId(brandSlug);
    const rows = await this.db
      .select({ id: watches.id, url: watches.officialUrl })
      .from(watches)
      .where(and(eq(watches.brandId, brandId), eq(watches.status, "active")))
      .orderBy(watches.id);
    return rows.filter((r): r is { id: number; url: string } => r.url !== null);
  }

  /**
   * Rattache l'offre d'un revendeur à la montre de même marque et même référence. Aucune montre
   * n'est créée : sans correspondance, l'offre est ignorée (`watchId` nul).
   */
  async saveOffer(
    offer: Offer,
    seenAt: Date,
  ): Promise<{ watchId: number | null; priceChanged: boolean }> {
    const brandId = await this.brandId(offer.brandSlug);
    const [watch] = await this.db
      .select({ id: watches.id })
      .from(watches)
      .where(
        and(eq(watches.brandId, brandId), eq(watches.referenceKey, referenceKey(offer.reference))),
      )
      .limit(1);
    if (!watch) return { watchId: null, priceChanged: false };
    return {
      watchId: watch.id,
      priceChanged: await this.recordObservation(watch.id, offer, seenAt),
    };
  }

  /** Montres pour lesquelles la source a une offre en cours (dernier relevé avec un prix). */
  async currentOfferWatchIds(): Promise<number[]> {
    return (await this.currentOffers()).map((o) => o.watchId);
  }

  private async currentOffers(): Promise<{ watchId: number; url: string | null }[]> {
    const latest = await this.db
      .selectDistinctOn([priceObservations.watchId], {
        watchId: priceObservations.watchId,
        priceCents: priceObservations.priceCents,
        url: priceObservations.url,
      })
      .from(priceObservations)
      .where(eq(priceObservations.source, this.source))
      .orderBy(priceObservations.watchId, desc(priceObservations.observedAt));
    return latest.filter((o) => o.priceCents !== null);
  }

  /**
   * Après une exécution complète : une offre en cours qui n'a pas été revue a été retirée par le
   * revendeur. On l'enregistre (prix nul, rupture) pour ne plus l'afficher comme disponible.
   */
  async withdrawUnseenOffers(
    seenWatchIds: Set<number>,
    seenAt: Date,
    failedUrls: ReadonlySet<string> = new Set(),
  ): Promise<number> {
    const missing = withoutFailedPages(await this.currentOffers(), failedUrls).filter(
      (o) => !seenWatchIds.has(o.watchId),
    );
    for (const { watchId } of missing) {
      await this.db.insert(priceObservations).values({
        watchId,
        source: this.source,
        priceCents: null,
        availability: "out_of_stock",
        observedAt: seenAt,
      });
    }
    return missing.length;
  }

  /**
   * Après une exécution complète, les montres de la marque non revues sont marquées
   * « plus produites ». Leur page reste en ligne (voir docs/seo/strategie.md).
   */
  async markUnseenAsDiscontinued(
    brandSlug: string,
    runStartedAt: Date,
    failedUrls: ReadonlySet<string> = new Set(),
  ): Promise<number> {
    const brandId = await this.brandId(brandSlug);
    const unseen = await this.db
      .select({ id: watches.id, url: watches.officialUrl })
      .from(watches)
      .where(
        and(
          eq(watches.brandId, brandId),
          eq(watches.status, "active"),
          lt(watches.lastSeenAt, runStartedAt),
        ),
      );
    const gone = withoutFailedPages(unseen, failedUrls);
    if (gone.length === 0) return 0;
    await this.db
      .update(watches)
      .set({ status: "discontinued", updatedAt: new Date() })
      .where(
        inArray(
          watches.id,
          gone.map((w) => w.id),
        ),
      );
    return gone.length;
  }

  async activeCount(brandSlug: string): Promise<number> {
    const brandId = await this.brandId(brandSlug);
    const [row] = await this.db
      .select({ n: sql<number>`count(*)::int` })
      .from(watches)
      .where(and(eq(watches.brandId, brandId), eq(watches.status, "active")));
    return row?.n ?? 0;
  }

  async startRun(): Promise<number> {
    // Une exécution précédente encore « running » a été tuée (arrêt de Docker, du runner…) sans
    // pouvoir se clore : on la marque échouée pour garder un journal fidèle.
    await this.db
      .update(scrapeRuns)
      .set({ status: "failed", message: "Interrompue avant la fin", finishedAt: new Date() })
      .where(and(eq(scrapeRuns.source, this.runLabel), eq(scrapeRuns.status, "running")));

    const [row] = await this.db
      .insert(scrapeRuns)
      .values({ source: this.runLabel })
      .returning({ id: scrapeRuns.id });
    if (!row) throw new Error("Exécution non enregistrée");
    return row.id;
  }

  async finishRun(
    id: number,
    stats: Omit<typeof scrapeRuns.$inferInsert, "id" | "source" | "startedAt">,
  ): Promise<void> {
    await this.db
      .update(scrapeRuns)
      .set({ ...stats, finishedAt: new Date() })
      .where(eq(scrapeRuns.id, id));
  }
}
