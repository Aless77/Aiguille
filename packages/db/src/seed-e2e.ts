import { eq } from "drizzle-orm";

import { closeDb, getDb } from "./client.ts";
import { refreshScores } from "./scores.ts";
import {
  brands,
  collections,
  exchangeRates,
  priceObservations,
  reviews,
  stores,
  users,
  watches,
} from "./schema.ts";

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
  // Lot 4 : prix suisse et allemand de TEST-0001 (moins chère en Suisse après conversion).
  if (watch && f.reference === "TEST-0001") {
    await db.insert(priceObservations).values([
      {
        watchId: watch.id,
        source: "tissot-officiel",
        country: "CH",
        priceCents: 70000,
        currency: "CHF",
        availability: "in_stock" as const,
        observedAt: daysAgo(3),
      },
      {
        watchId: watch.id,
        source: "tissot-officiel",
        country: "DE",
        priceCents: 77500,
        currency: "EUR",
        availability: "in_stock" as const,
        observedAt: daysAgo(3),
      },
    ]);
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

// Les tests de garantie et d'entretien parcourent une fiche de chaque marque prise en charge.
// Conserver les scénarios de prix et d'avis Tissot ci-dessus avec leurs références stables.
for (const slug of ["hamilton", "longines"]) {
  const [fixtureBrand] = await db.select().from(brands).where(eq(brands.slug, slug));
  if (!fixtureBrand) throw new Error(`Marque ${slug} absente : lancez d'abord npm run db:seed`);
  const [fixtureCollection] = await db
    .insert(collections)
    .values({ brandId: fixtureBrand.id, slug: "collection-test", name: "Collection Test" })
    .onConflictDoUpdate({
      target: [collections.brandId, collections.slug],
      set: { name: "Collection Test" },
    })
    .returning();
  await db
    .insert(watches)
    .values({
      brandId: fixtureBrand.id,
      collectionId: fixtureCollection!.id,
      referenceKey: `TEST${slug.toUpperCase()}0001`,
      reference: `TEST-${slug.toUpperCase()}-0001`,
      slug: `test-${slug}-0001`,
      name: `${fixtureBrand.name} Montre de test 40 mm`,
      movement: "automatique",
      diameterMm: 40,
      waterResistanceM: 100,
      catalogPriceCents: slug === "hamilton" ? 120000 : 200000,
      firstSeenAt: daysAgo(30),
    })
    .onConflictDoNothing();
}

// Taux BCE fictif (1 € = 0,9261 CHF) et trois boutiques de test, pour les pages du lot 4.
await db
  .insert(exchangeRates)
  .values({ date: daysAgo(1).toISOString().slice(0, 10), currency: "CHF", unitsPerEur: 0.9261 })
  .onConflictDoNothing();
await db
  .insert(stores)
  .values(
    [
      {
        name: "Boutique de test Opéra",
        street: "1 rue de Test",
        postalCode: "75009",
        city: "Paris",
        latitude: 48.8708,
        longitude: 2.3319,
      },
      {
        name: "Boutique de test Marais",
        street: "2 rue de Test",
        postalCode: "75004",
        city: "Paris",
        latitude: 48.8566,
        longitude: 2.3622,
      },
      {
        name: "Boutique de test Bellecour",
        street: "3 rue de Test",
        postalCode: "69002",
        city: "Lyon",
        latitude: 45.7578,
        longitude: 4.832,
      },
    ].map((s, i) => ({
      ...s,
      brandId: brand.id,
      source: "e2e-boutiques",
      url: `https://boutiques.example/${i}`,
      status: "active" as const,
      country: "FR",
    })),
  )
  .onConflictDoNothing();

// Lot 5 : trois avis fictifs sur TEST-0001 (confiance « moyenne »), puis calcul des notes.
const [reviewed] = await db
  .select({ id: watches.id })
  .from(watches)
  .where(eq(watches.referenceKey, "TEST0001"));
if (!reviewed) throw new Error("TEST-0001 absente après le seed");
const reviewers = [
  { n: 1, stars: 5, comment: "Très belle finition, confortable au quotidien." },
  { n: 2, stars: 4, comment: "Bonne montre, la lisibilité de nuit pourrait être meilleure." },
  { n: 3, stars: 4, comment: null },
];
await db
  .insert(users)
  .values(
    reviewers.map(({ n }) => ({
      id: `e2e-user-${n}`,
      name: `Testeur ${n}`,
      email: `e2e-${n}@example.test`,
      emailVerified: true,
    })),
  )
  .onConflictDoNothing();
await db
  .insert(reviews)
  .values(
    reviewers.map(({ n, stars, comment }) => ({
      watchId: reviewed.id,
      userId: `e2e-user-${n}`,
      finishing: stars,
      design: n === 3 ? null : stars,
      comfort: stars,
      legibility: n === 2 ? 3 : stars,
      accuracy: stars,
      value: stars,
      ownership: n === 3 ? ("tried" as const) : ("owner" as const),
      comment,
    })),
  )
  .onConflictDoNothing();
const scored = await refreshScores(db);

process.stdout.write(
  `Seed e2e : ${fixtures.length + 2} montres de test, 3 boutiques, 3 avis, ${scored} notes.`,
);
await closeDb();
