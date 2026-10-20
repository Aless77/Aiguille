import { parseArgs } from "node:util";

import { closeDb, getDb } from "@aiguille/db";

import { USER_AGENT } from "./config.ts";
import { type Country, countriesForDay, isCountry } from "./lib/countries.ts";
import { runCountryPrices } from "./lib/country-prices.ts";
import { runSource } from "./lib/crawl.ts";
import { saveRates } from "./lib/rates.ts";
import { runStores } from "./lib/stores.ts";
import { revalidateSite } from "./lib/revalidate.ts";
import { sources } from "./sources/index.ts";
import { type OfficialAdapter } from "./sources/types.ts";

/**
 * Point d'entrée du scraper.
 *
 *   npm run scraper                            toutes les sources (catalogue et offres France)
 *   npm run scraper -- tissot                  une source
 *   npm run scraper -- hamilton --limit 5      essai sur 5 fiches
 *   npm run scraper -- tissot --pays DE,CH     prix nationaux (lot 4) au lieu de la France
 *   npm run scraper -- tissot --pays auto      pays du jour (rotation : chacun revu chaque semaine)
 *   npm run scraper -- taux                    taux de change BCE du jour
 *   npm run scraper -- longines --boutiques    boutiques agréées (par lots de 400, lot 4)
 */
const { values, positionals } = parseArgs({
  options: {
    limit: { type: "string" },
    pays: { type: "string" },
    boutiques: { type: "boolean" },
  },
  allowPositionals: true,
});
const limit = values.limit ? Number(values.limit) : undefined;
const wantsRates = positionals.includes("taux");
const names = positionals.filter((p) => p !== "taux");
const selected = names.length || wantsRates ? names : Object.keys(sources);

const unknown = selected.filter((name) => !sources[name]);
if (unknown.length) {
  console.error(
    `Sources inconnues : ${unknown.join(", ")}. Disponibles : ${Object.keys(sources).join(", ")}, taux`,
  );
  process.exit(1);
}

/** Pays demandés pour une marque : liste explicite, ou rotation du jour avec « auto ». */
function countriesFor(adapter: OfficialAdapter, option: string): Country[] {
  const available = Object.keys(adapter.locales) as Country[];
  if (option === "auto") return countriesForDay(available, new Date());
  const requested = option.split(",").map((c) => c.trim().toUpperCase());
  const invalid = requested.filter((c) => !isCountry(c) || !available.includes(c));
  if (invalid.length) throw new Error(`${adapter.id} : pays non couverts ${invalid.join(", ")}`);
  return requested as Country[];
}

console.log(`User-Agent : ${USER_AGENT}`);
const db = getDb();
let failed = false;
let succeeded = false;

const attempt = async (label: string, job: () => Promise<unknown>) => {
  try {
    console.log(`[${label}] terminé`, await job());
    succeeded = true;
  } catch (error) {
    failed = true;
    console.error(`[${label}] échec :`, error instanceof Error ? error.message : error);
  }
};

if (wantsRates) await attempt("taux", () => saveRates(db));

for (const name of selected) {
  const adapter = sources[name]!;
  if (values.boutiques) {
    if (adapter.kind === "official" && adapter.stores) {
      await attempt(adapter.stores.id, () => runStores(db, adapter, { limit }));
    } else {
      console.log(`[${adapter.id}] pas de boutiques publiées exploitables : ignoré`);
    }
  } else if (values.pays && adapter.kind === "official") {
    let countries: Country[] = [];
    try {
      countries = countriesFor(adapter, values.pays);
    } catch (error) {
      failed = true;
      console.error(error instanceof Error ? error.message : error);
    }
    for (const country of countries) {
      await attempt(`${adapter.id}@${country}`, () =>
        runCountryPrices(db, adapter, country, { limit }),
      );
    }
  } else {
    await attempt(adapter.id, () => runSource(db, adapter, { limit }));
  }
}

await closeDb();
if (succeeded) await revalidateSite();
// Code de sortie non nul : le workflow GitHub Actions signale la source cassée.
process.exit(failed ? 1 : 0);
