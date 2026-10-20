import { type Database } from "@aiguille/db";
import { type CheerioAPI } from "cheerio";
import { z } from "zod";

import { DOMAIN_DELAY_SECS } from "../config.ts";
import { type OfficialAdapter } from "../sources/types.ts";
import { COUNTRIES, type Country } from "./countries.ts";
import { createPoliteCrawler } from "./http.ts";
import { findProduct, parseAvailability } from "./jsonld.ts";
import { Persister } from "./persist.ts";
import { fetchRobots } from "./robots.ts";
import { toCents } from "./text.ts";

const countryPriceSchema = z.object({
  priceCents: z.number().int().positive(),
  currency: z.string().length(3),
  availability: z.enum(["in_stock", "out_of_stock", "preorder", "unknown"]),
});

export type CountryPrice = z.infer<typeof countryPriceSchema>;

/**
 * Prix national lu dans le JSON-LD de la fiche. `null` si la page n'est pas une fiche, ou si la
 * devise n'est pas celle du pays : redirection vers un autre marché, à ne pas confondre.
 */
export function parseCountryPrice($: CheerioAPI, country: Country): CountryPrice | null {
  const product = findProduct($);
  if (!product?.priceCurrency) return null;
  if (product.priceCurrency.toUpperCase() !== COUNTRIES[country]) return null;
  const parsed = countryPriceSchema.safeParse({
    priceCents: toCents(product.price),
    currency: product.priceCurrency.toUpperCase(),
    availability: parseAvailability(product.availability),
  });
  return parsed.success ? parsed.data : null;
}

export interface CountryRunStats {
  source: string;
  pagesFetched: number;
  pricesFound: number;
  priceChanges: number;
  /** Fiche absente (404) ou sans prix dans ce pays : montre non vendue sur ce marché. */
  notSold: number;
  /** Devise inattendue ou page invalide. */
  errors: number;
}

/**
 * Relève le prix de toutes les montres actives d'une marque dans un pays (lot 4). Les montres
 * viennent du catalogue (fiche française), l'URL nationale est déduite par l'adaptateur.
 */
export async function runCountryPrices(
  db: Database,
  adapter: OfficialAdapter,
  country: Country,
  options: { limit?: number } = {},
): Promise<CountryRunStats> {
  const locale = adapter.locales[country];
  if (!locale) throw new Error(`${adapter.id} : pas de version nationale pour ${country}`);

  const runLabel = `${adapter.id}@${country}`;
  const persister = new Persister(db, adapter.id, runLabel);
  const runId = await persister.startRun();
  const startedAt = new Date();
  const stats: CountryRunStats = {
    source: runLabel,
    pagesFetched: 0,
    pricesFound: 0,
    priceChanges: 0,
    notSold: 0,
    errors: 0,
  };

  try {
    let pages = (await persister.officialPages(adapter.brandSlug)).map((p) => ({
      watchId: p.id,
      url: adapter.localizeUrl(p.url, locale),
    }));
    if (pages.length === 0) throw new Error("Aucune montre active dans le catalogue.");

    const robots = await fetchRobots(pages[0]!.url);
    pages = pages.filter((p) => robots.isAllowed(p.url));
    if (options.limit) pages = pages.slice(0, options.limit);
    console.log(`[${runLabel}] ${pages.length} fiches à relever`);

    const crawler = createPoliteCrawler({
      delaySecs: Math.max(DOMAIN_DELAY_SECS, robots.crawlDelaySecs ?? 0),
      // Une montre absente d'un marché répond 404 : c'est une information, pas une erreur.
      ignoreHttpErrorStatusCodes: [404, 410],
      async requestHandler({ $, request, response }) {
        stats.pagesFetched++;
        const watchId = request.userData.watchId as number;
        if (response.statusCode === 404 || response.statusCode === 410) {
          stats.notSold++;
          return;
        }
        const price = parseCountryPrice($, country);
        if (!price) {
          // Sans Product : fiche retirée de ce marché. Avec une autre devise : redirection.
          if (findProduct($)) stats.errors++;
          else stats.notSold++;
          return;
        }
        stats.pricesFound++;
        const changed = await persister.saveCountryPrice(
          watchId,
          country,
          { ...price, url: request.url },
          startedAt,
        );
        if (changed) stats.priceChanges++;
      },
      failedRequestHandler({ request }, error) {
        stats.errors++;
        console.warn(`[${runLabel}] échec ${request.url} : ${error.message}`);
      },
    });

    await crawler.run(pages.map((p) => ({ url: p.url, userData: { watchId: p.watchId } })));

    if (stats.pricesFound === 0) {
      throw new Error("Zéro prix relevé : structure changée, accès bloqué ou mauvaise devise.");
    }
    await persister.finishRun(runId, {
      status: "success",
      pagesFetched: stats.pagesFetched,
      watchesFound: stats.pricesFound,
      priceChanges: stats.priceChanges,
      errors: stats.errors,
      message: `${stats.notSold} montres non vendues dans ce pays`,
    });
    return stats;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await persister.finishRun(runId, {
      status: "failed",
      pagesFetched: stats.pagesFetched,
      watchesFound: stats.pricesFound,
      priceChanges: stats.priceChanges,
      errors: stats.errors,
      message,
    });
    throw error;
  }
}
