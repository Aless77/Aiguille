import {
  brands,
  collections,
  type Database,
  priceObservations,
  scrapeRuns,
  watches,
} from "@aiguille/db";
import { and, desc, eq, lt, sql } from "drizzle-orm";

import { type Listing } from "./listing.ts";
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

export interface SaveResult {
  created: boolean;
  priceChanged: boolean;
}

export class Persister {
  private brandIds = new Map<string, number>();
  private collectionIds = new Map<string, number>();

  constructor(
    private readonly db: Database,
    private readonly source: string,
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
      rawSpecs: listing.rawSpecs,
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

    const [last] = await this.db
      .select({
        priceCents: priceObservations.priceCents,
        availability: priceObservations.availability,
      })
      .from(priceObservations)
      .where(and(eq(priceObservations.watchId, row.id), eq(priceObservations.source, this.source)))
      .orderBy(desc(priceObservations.observedAt))
      .limit(1);

    const priceChanged = hasChanged(last, listing);
    if (priceChanged) {
      await this.db.insert(priceObservations).values({
        watchId: row.id,
        source: this.source,
        priceCents: listing.priceCents ?? null,
        currency: listing.currency,
        availability: listing.availability,
        url: listing.url,
        observedAt: seenAt,
      });
    }

    return { created: row.created, priceChanged };
  }

  /**
   * Après une exécution complète, les montres de la marque non revues sont marquées
   * « plus produites ». Leur page reste en ligne (voir docs/seo/strategie.md).
   */
  async markUnseenAsDiscontinued(brandSlug: string, runStartedAt: Date): Promise<number> {
    const brandId = await this.brandId(brandSlug);
    const rows = await this.db
      .update(watches)
      .set({ status: "discontinued", updatedAt: new Date() })
      .where(
        and(
          eq(watches.brandId, brandId),
          eq(watches.status, "active"),
          lt(watches.lastSeenAt, runStartedAt),
        ),
      )
      .returning({ id: watches.id });
    return rows.length;
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
    const [row] = await this.db
      .insert(scrapeRuns)
      .values({ source: this.source })
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
