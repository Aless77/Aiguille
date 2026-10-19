import { eq } from "drizzle-orm";

import { closeDb, getDb } from "./client.ts";
import { brands, collections, priceObservations, watches } from "./schema.ts";

/**
 * Données fictives pour les tests de bout en bout en CI, où la base est vide. Références
 * « TEST-… » volontairement non réalistes : ce script ne doit jamais toucher une base réelle.
 */
const url = process.env.DATABASE_URL ?? "";
if (!/@(localhost|127\.0\.0\.1|db):/.test(url)) {
  console.error("seed-e2e refusé : DATABASE_URL doit pointer vers une base locale ou de CI.");
  process.exit(1);
}

const db = getDb();
const [brand] = await db.select().from(brands).where(eq(brands.slug, "tissot"));
if (!brand) throw new Error("Marque tissot absente : lancez d'abord npm run db:seed");

const [collection] = await db
  .insert(collections)
  .values({ brandId: brand.id, slug: "collection-test", name: "Collection Test" })
  .onConflictDoUpdate({
    target: [collections.brandId, collections.slug],
    set: { name: "Collection Test" },
  })
  .returning();

const DAY = 86_400_000;
const daysAgo = (n: number) => new Date(Date.now() - n * DAY);

/**
 * TEST-0001 : suivie depuis 30 jours avec une baisse de prix (courbe affichée), et deux offres
 *             revendeurs dont une moins chère que la marque.
 * TEST-0002 : prix stable.
 * TEST-0003 : apparue aujourd'hui, bien après les autres (page Nouveautés).
 */
const fixtures = [
  {
    reference: "TEST-0001",
    movement: "automatique" as const,
    diameterMm: 40,
    firstSeen: daysAgo(30),
    prices: [
      { at: daysAgo(30), cents: 79500 },
      { at: daysAgo(10), cents: 77500 },
    ],
    retailers: [
      { source: "lepage", cents: 76000, availability: "in_stock" as const },
      { source: "ocarat", cents: 77500, availability: "preorder" as const },
    ],
  },
  {
    reference: "TEST-0002",
    movement: "quartz" as const,
    diameterMm: 39,
    firstSeen: daysAgo(30),
    prices: [{ at: daysAgo(30), cents: 42500 }],
  },
  {
    reference: "TEST-0003",
    movement: "automatique" as const,
    diameterMm: 35,
    firstSeen: daysAgo(0),
    prices: [{ at: daysAgo(0), cents: 99000 }],
  },
];

for (const f of fixtures) {
  const [watch] = await db
    .insert(watches)
    .values({
      brandId: brand.id,
      collectionId: collection!.id,
      referenceKey: f.reference.replace(/[^A-Z0-9]/g, ""),
      reference: f.reference,
      slug: f.reference.toLowerCase(),
      name: `Tissot Montre de test ${f.diameterMm} mm`,
      movement: f.movement,
      diameterMm: f.diameterMm,
      waterResistanceM: 100,
      catalogPriceCents: f.prices.at(-1)!.cents,
      firstSeenAt: f.firstSeen,
    })
    .onConflictDoNothing()
    .returning();
  if (watch && "retailers" in f && f.retailers) {
    await db.insert(priceObservations).values(
      f.retailers.map((r) => ({
        watchId: watch.id,
        source: r.source,
        priceCents: r.cents,
        availability: r.availability,
        url: `https://${r.source}.example/${f.reference.toLowerCase()}`,
        observedAt: daysAgo(2),
      })),
    );
  }
  if (watch) {
    await db.insert(priceObservations).values(
      f.prices.map((p) => ({
        watchId: watch.id,
        source: "tissot-officiel",
        priceCents: p.cents,
        availability: "in_stock" as const,
        observedAt: p.at,
      })),
    );
  }
}

console.log(`Seed e2e : ${fixtures.length} montres de test.`);
await closeDb();
