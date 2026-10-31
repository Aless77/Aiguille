import { type Database, translationSchema } from "@aiguille/db";

import { DOMAIN_DELAY_SECS } from "../config.ts";
import { type OfficialAdapter } from "../sources/types.ts";
import { createPoliteCrawler, isRequestedPage } from "./http.ts";
import { Persister } from "./persist.ts";
import { fetchRobots } from "./robots.ts";

/** Langue et marché sont indépendants : l'anglais européen Citizen n'est pas un prix britannique. */
export async function runTranslations(
  db: Database,
  adapter: OfficialAdapter,
  language: string,
  options: { limit?: number } = {},
) {
  const locale =
    adapter.translationLocales?.[
      language as keyof NonNullable<OfficialAdapter["translationLocales"]>
    ];
  if (!locale || !adapter.translate)
    throw new Error(`${adapter.id} : traduction non prise en charge (${language})`);
  const persister = new Persister(db, adapter.id, `${adapter.id}@langue-${language}`);
  const runId = await persister.startRun();
  const stats = { pagesFetched: 0, watchesFound: 0, priceChanges: 0, notAvailable: 0, errors: 0 };
  try {
    let pages = (await persister.officialPages(adapter.brandSlug)).map((p) => ({
      watchId: p.id,
      url: adapter.localizeUrl(p.url, locale),
    }));
    if (!pages.length) throw new Error("Aucune montre active à traduire.");
    const robots = await fetchRobots(pages[0]!.url);
    pages = pages.filter((p) => robots.isAllowed(p.url));
    if (options.limit) pages = pages.slice(0, options.limit);
    const crawler = createPoliteCrawler({
      delaySecs: Math.max(DOMAIN_DELAY_SECS, robots.crawlDelaySecs ?? 0, adapter.minDelaySecs ?? 0),
      ignoreHttpErrorStatusCodes: [404, 410],
      async requestHandler({ $, request, response }) {
        stats.pagesFetched++;
        if (response.statusCode === 404 || response.statusCode === 410) {
          stats.notAvailable++;
          return;
        }
        const loaded = request.loadedUrl ?? request.url;
        if (!isRequestedPage(request.url, loaded)) {
          stats.errors++;
          return;
        }
        const raw = adapter.translate!($, loaded);
        if (!raw) {
          stats.notAvailable++;
          return;
        }
        const data = translationSchema.safeParse(raw);
        if (!data.success) {
          stats.errors++;
          return;
        }
        await persister.saveTranslation(
          request.userData.watchId as number,
          language,
          data.data,
          loaded,
        );
        stats.watchesFound++;
      },
      failedRequestHandler() {
        stats.errors++;
      },
    });
    await crawler.run(pages.map((p) => ({ url: p.url, userData: { watchId: p.watchId } })));
    if (!stats.watchesFound) throw new Error("Aucune traduction officielle valide trouvée.");
    await persister.finishRun(runId, {
      ...stats,
      status: "success",
      message: `${stats.notAvailable} fiches sans traduction publiée dans cette langue`,
    });
    return stats;
  } catch (error) {
    await persister.finishRun(runId, {
      ...stats,
      status: "failed",
      message: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}
