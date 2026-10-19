import { parseArgs } from "node:util";

import { closeDb, getDb } from "@aiguille/db";

import { USER_AGENT } from "./config.ts";
import { runSource } from "./lib/crawl.ts";
import { revalidateSite } from "./lib/revalidate.ts";
import { sources } from "./sources/index.ts";

/**
 * Point d'entrée du scraper.
 *
 *   npm run scraper                       toutes les sources
 *   npm run scraper -- tissot             une source
 *   npm run scraper -- hamilton --limit 5 essai sur 5 fiches
 */
const { values, positionals } = parseArgs({
  options: { limit: { type: "string" } },
  allowPositionals: true,
});
const limit = values.limit ? Number(values.limit) : undefined;
const selected = positionals.length ? positionals : Object.keys(sources);

const unknown = selected.filter((name) => !sources[name]);
if (unknown.length) {
  console.error(
    `Sources inconnues : ${unknown.join(", ")}. Disponibles : ${Object.keys(sources).join(", ")}`,
  );
  process.exit(1);
}

console.log(`User-Agent : ${USER_AGENT}`);
const db = getDb();
let failed = false;
let succeeded = false;

for (const name of selected) {
  try {
    const stats = await runSource(db, sources[name]!, { limit });
    console.log(`[${stats.source}] terminé`, stats);
    succeeded = true;
  } catch (error) {
    failed = true;
    console.error(`[${name}] échec :`, error instanceof Error ? error.message : error);
  }
}

await closeDb();
if (succeeded) await revalidateSite();
// Code de sortie non nul : le workflow GitHub Actions signale la source cassée.
process.exit(failed ? 1 : 0);
