import { brands, collections, getDb, watches } from "@aiguille/db";
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
