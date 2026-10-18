import { closeDb, getDb } from "./client.ts";
import { brands, type NewBrand } from "./schema.ts";

/** Les six marques du périmètre initial (cahier des charges, section Périmètre). */
const referenceBrands: NewBrand[] = [
  { slug: "tissot", name: "Tissot", segment: "coeur" },
  { slug: "hamilton", name: "Hamilton", segment: "coeur" },
  { slug: "longines", name: "Longines", segment: "milieu_haut" },
  { slug: "oris", name: "Oris", segment: "milieu_haut" },
  { slug: "seiko", name: "Seiko", segment: "coeur" },
  { slug: "citizen", name: "Citizen", segment: "coeur" },
];

const db = getDb();
await db.insert(brands).values(referenceBrands).onConflictDoNothing({ target: brands.slug });
console.log(`Seed : ${referenceBrands.length} marques de référence présentes.`);
await closeDb();
