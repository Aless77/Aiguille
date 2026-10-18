import { brands, closeDb, getDb } from "@aiguille/db";

/**
 * Point d'entrée du scraper.
 *
 * Lot 1 : vérifie seulement que le conteneur atteint la base.
 * Lot 3 : chaque source aura son adaptateur (Crawlee), voir docs/architecture.md.
 */
const userAgent =
  process.env.SCRAPER_USER_AGENT ?? "AiguilleBot/0.1 (+https://github.com/Aless77/Aiguille)";

const db = getDb();
const rows = await db.select({ slug: brands.slug }).from(brands);

console.log(`Scraper prêt. User-Agent : ${userAgent}`);
console.log(`Base joignable, ${rows.length} marques : ${rows.map((r) => r.slug).join(", ")}`);
console.log("Aucune source configurée pour l'instant (prévu au lot 3).");

await closeDb();
