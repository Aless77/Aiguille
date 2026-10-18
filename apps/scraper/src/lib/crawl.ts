import { type Database } from "@aiguille/db";
import { CheerioCrawler, Configuration } from "@crawlee/cheerio";

import { DOMAIN_DELAY_SECS, USER_AGENT } from "../config.ts";
import { type SourceAdapter } from "../sources/types.ts";
import { listingSchema } from "./listing.ts";
import { Persister } from "./persist.ts";
import { fetchRobots } from "./robots.ts";
import { createThrottle } from "./throttle.ts";

export interface RunOptions {
  /** Nombre maximal de fiches visitées (essais en local). Désactive le marquage « plus produite ». */
  limit?: number;
}

export interface RunStats {
  source: string;
  pagesFetched: number;
  watchesFound: number;
  watchesCreated: number;
  priceChanges: number;
  errors: number;
  discontinued: number;
}

/** Part minimale des montres actives à revoir pour considérer une exécution comme complète. */
const COMPLETE_RUN_RATIO = 0.8;

export async function runSource(
  db: Database,
  adapter: SourceAdapter,
  options: RunOptions = {},
): Promise<RunStats> {
  const persister = new Persister(db, adapter.id);
  const runId = await persister.startRun();
  const startedAt = new Date();
  const stats: RunStats = {
    source: adapter.id,
    pagesFetched: 0,
    watchesFound: 0,
    watchesCreated: 0,
    priceChanges: 0,
    errors: 0,
    discontinued: 0,
  };

  try {
    const discovered = await adapter.discover();
    if (discovered.length === 0) throw new Error("Aucune fiche découverte dans le sitemap.");

    const robots = await fetchRobots(discovered[0]!);
    let urls = discovered.filter((url) => robots.isAllowed(url));
    console.log(
      `[${adapter.id}] ${discovered.length} fiches découvertes, ${discovered.length - urls.length} exclues par robots.txt`,
    );
    if (options.limit) urls = urls.slice(0, options.limit);
    const delaySecs = Math.max(DOMAIN_DELAY_SECS, robots.crawlDelaySecs ?? 0);
    const throttle = createThrottle(delaySecs * 1000);

    const crawler = new CheerioCrawler(
      {
        // Une exécution = un seul domaine, une requête à la fois. Le délai minimal entre deux
        // requêtes est garanti par throttle() : maxRequestsPerMinute seul autorise des rafales, et
        // sameDomainDelaySecs remet les requêtes en fin de file (~1 requête/minute).
        maxConcurrency: 1,
        maxRequestRetries: 2,
        requestHandlerTimeoutSecs: 60,
        // robots.txt est vérifié par fetchRobots (avec notre User-Agent), pas par Crawlee.
        // Pas de session ni d'en-têtes imitant un navigateur : on se présente tel quel.
        useSessionPool: false,
        preNavigationHooks: [
          async (_ctx, gotOptions) => {
            await throttle();
            gotOptions.useHeaderGenerator = false;
            gotOptions.headers = { ...gotOptions.headers, "user-agent": USER_AGENT };
          },
        ],
        async requestHandler({ $, request }) {
          stats.pagesFetched++;
          const raw = adapter.parse($, request.loadedUrl ?? request.url);
          if (!raw) return;
          const parsed = listingSchema.safeParse(raw);
          if (!parsed.success) {
            stats.errors++;
            console.warn(`[${adapter.id}] fiche invalide ${request.url}`, parsed.error.issues);
            return;
          }
          stats.watchesFound++;
          const result = await persister.save(parsed.data, startedAt);
          if (result.created) stats.watchesCreated++;
          if (result.priceChanged) stats.priceChanges++;
        },
        failedRequestHandler({ request }, error) {
          stats.errors++;
          console.warn(`[${adapter.id}] échec ${request.url} : ${error.message}`);
        },
      },
      new Configuration({ persistStorage: false }),
    );

    await crawler.run(urls);

    if (stats.watchesFound === 0) {
      throw new Error("Zéro montre extraite : structure de la source changée ou accès bloqué.");
    }

    if (!options.limit) {
      const active = await persister.activeCount(adapter.brandSlug);
      // Garde-fou : une exécution partielle (blocage, panne) ne doit pas tout marquer « plus produite ».
      if (stats.watchesFound >= active * COMPLETE_RUN_RATIO) {
        stats.discontinued = await persister.markUnseenAsDiscontinued(adapter.brandSlug, startedAt);
      }
    }

    await persister.finishRun(runId, { ...withoutExtra(stats), status: "success" });
    return stats;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await persister.finishRun(runId, { ...withoutExtra(stats), status: "failed", message });
    throw error;
  }
}

function withoutExtra({
  pagesFetched,
  watchesFound,
  watchesCreated,
  priceChanges,
  errors,
}: RunStats) {
  return { pagesFetched, watchesFound, watchesCreated, priceChanges, errors };
}
