import { parseArgs } from "node:util";

import { closeDb, getDb, refreshScores } from "@aiguille/db";

import { USER_AGENT } from "./config.ts";
import { SourceUnavailableError } from "./lib/availability.ts";
import { type Country, countriesForDay, isCountry } from "./lib/countries.ts";
import { runCountryPrices } from "./lib/country-prices.ts";
import { runSource } from "./lib/crawl.ts";
import { runTranslations } from "./lib/translations.ts";
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
 *   npm run scraper -- seiko --traductions en,de,it,es   traductions officielles, sans prix
 *   npm run scraper -- citizen --traductions auto        une langue par jour
 */
const { values, positionals } = parseArgs({
  options: {
    limit: { type: "string" },
    pays: { type: "string" },
    boutiques: { type: "boolean" },
    traductions: { type: "string" },
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

/** Sources indisponibles pendant cette exécution : on ne les sollicite plus (autres pays…). */
const unavailable = new Set<string>();

const attempt = async (label: string, job: () => Promise<unknown>, sourceId = label) => {
  if (unavailable.has(sourceId)) {
    console.log(`[${label}] ignoré : source indisponible plus tôt dans cette exécution`);
    return;
  }
  try {
    console.log(`[${label}] terminé`, await job());
    succeeded = true;
  } catch (error) {
    if (error instanceof SourceUnavailableError) {
      // Panne ou maintenance du site : journalisée (scrape_runs + avertissement GitHub), sans
      // faire échouer la collecte ni envoyer d'alerte ; nouvel essai à la prochaine exécution.
      unavailable.add(sourceId);
      console.warn(`[${label}] ${error.message}`);
      if (process.env.GITHUB_ACTIONS) {
        console.log(`::warning title=${label} indisponible::${error.message}`);
      }
      return;
    }
    failed = true;
    console.error(`[${label}] échec :`, error instanceof Error ? error.message : error);
  }
};

if (wantsRates) await attempt("taux", () => saveRates(db));

for (const name of selected) {
  const adapter = sources[name]!;
  if (values.traductions) {
    if (adapter.kind !== "official" || !adapter.translationLocales) {
      console.log(`[${adapter.id}] pas de collecte de traductions indépendante : ignoré`);
      continue;
    }
    const available = Object.keys(adapter.translationLocales);
    const requested =
      values.traductions === "auto"
        ? [available[Math.floor(Date.now() / 86_400_000) % available.length]!]
        : values.traductions.split(",");
    for (const language of requested) {
      await attempt(
        `${adapter.id}@langue-${language}`,
        () => runTranslations(db, adapter, language, { limit }),
        adapter.id,
      );
    }
  } else if (values.boutiques) {
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
      await attempt(
        `${adapter.id}@${country}`,
        () => runCountryPrices(db, adapter, country, { limit }),
        adapter.id,
      );
    }
  } else {
    await attempt(adapter.id, () => runSource(db, adapter, { limit }));
  }
}

// Prix et stock ont pu changer : note sur 100 recalculée (lot 5) avant d'invalider le cache.
if (succeeded) {
  await attempt("notes", async () => `${await refreshScores(db)} notes recalculées`);
}
await closeDb();
if (succeeded) await revalidateSite();
// Code de sortie non nul : le workflow GitHub Actions signale la source cassée.
process.exit(failed ? 1 : 0);
