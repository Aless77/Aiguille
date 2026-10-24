import { eq } from "drizzle-orm";

import { closeDb, getDb } from "./client.ts";
import { coverage, missingBrandInfo, sheetCoverage } from "./coverage.ts";
import { brands, collections, watches } from "./schema.ts";

/**
 * Rapport de couverture des données (npm run db:couverture) : à lancer après l'intégration
 * d'une marque (docs/integrer-une-marque.md) pour voir les informations manquantes.
 */
const rows = await getDb()
  .select({
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
    thicknessMm: watches.thicknessMm,
    lugWidthMm: watches.lugWidthMm,
    dialColor: watches.dialColor,
    strapMaterial: watches.strapMaterial,
    imageUrls: watches.imageUrls,
  })
  .from(watches)
  .innerJoin(brands, eq(brands.id, watches.brandId))
  .leftJoin(collections, eq(collections.id, watches.collectionId))
  .where(eq(watches.status, "active"));

const table = coverage(rows.map((r) => ({ ...r, imageCount: r.imageUrls.length })));
const brandSlugs = Object.keys(table[0]?.byBrand ?? {});
const pct = (k: number, n: number) => (n === 0 ? "—" : `${Math.round((k / n) * 100)} %`);

console.log(["Information".padEnd(40), ...brandSlugs.map((b) => b.padStart(10))].join(""));
for (const row of table) {
  console.log(
    [
      row.label.padEnd(40),
      ...brandSlugs.map((b) => pct(row.byBrand[b]!.known, row.byBrand[b]!.applicable).padStart(10)),
    ].join(""),
  );
}
// Fiche technique commune : part des montres dont chaque ligne est renseignée.
console.log(`
${"Fiche technique".padEnd(48)}${brandSlugs.map((b) => b.padStart(10)).join("")}`);
for (const row of sheetCoverage(rows.map((r) => ({ ...r, storeCount: 1 })))) {
  console.log(
    [
      row.label.padEnd(48),
      ...brandSlugs.map((b) =>
        pct(row.byBrand[b]?.known ?? 0, row.byBrand[b]?.applicable ?? 0).padStart(10),
      ),
    ].join(""),
  );
}

const missing = missingBrandInfo(brandSlugs);
if (missing.length) {
  console.log("\nÀ sourcer dans packages/db/src/brand-info.ts :");
  for (const m of missing) console.log(`- ${m}`);
}
await closeDb();
