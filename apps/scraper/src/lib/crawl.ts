import { type Database } from "@aiguille/db";
import { CheerioCrawler, Configuration } from "@crawlee/cheerio";

import { DOMAIN_DELAY_SECS, USER_AGENT } from "../config.ts";
import { type SourceAdapter } from "../sources/types.ts";
import { listingSchema } from "./listing.ts";
import { offerSchema } from "./offer.ts";
import { Persister } from "./persist.ts";
import { fetchRobots } from "./robots.ts";
import { createThrottle } from "./throttle.ts";

export interface RunOptions {
  /**
   * Nombre maximal de fiches visitées (essais en local). Désactive le marquage « plus produite »
   * (sources officielles) et le retrait des offres non revues (revendeurs).
   */
  limit?: number;
}

export interface RunStats {
  source: string;
  pagesFetched: number;
  watchesFound: number;
  watchesCreated: number;
  priceChanges: number;
  errors: number;
  /** Officiel : montres marquées « plus produite ». */
  discontinued: number;
  /** Revendeur : fiches sans montre correspondante dans le catalogue. */
  unmatched: number;
  /** Revendeur : offres retirées depuis la dernière collecte. */
  withdrawn: number;
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
    unmatched: 0,
    withdrawn: 0,
  };
  // Revendeur : montres dont l'offre a été vue pendant cette exécution.
  const seenWatchIds = new Set<number>();

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
          const url = request.loadedUrl ?? request.url;
          const invalid = (issues: unknown) => {
            stats.errors++;
            console.warn(`[${adapter.id}] fiche invalide ${request.url}`, issues);
          };

          if (adapter.kind === "official") {
            const raw = adapter.parse($, url);
            if (!raw) return;
            const parsed = listingSchema.safeParse(raw);
            if (!parsed.success) return invalid(parsed.error.issues);
            stats.watchesFound++;
            const result = await persister.save(parsed.data, startedAt);
            if (result.created) stats.watchesCreated++;
            if (result.priceChanged) stats.priceChanges++;
            return;
          }

          const raw = adapter.parse($, url);
          if (!raw) return;
          const parsed = offerSchema.safeParse(raw);
          if (!parsed.success) return invalid(parsed.error.issues);
          const result = await persister.saveOffer(parsed.data, startedAt);
          if (result.watchId === null) {
            stats.unmatched++;
            return;
          }
          stats.watchesFound++;
          seenWatchIds.add(result.watchId);
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

    // Garde-fou : une exécution partielle (blocage, panne) ne doit rien marquer comme disparu.
    if (!options.limit && adapter.kind === "official") {
      const active = await persister.activeCount(adapter.brandSlug);
      if (stats.watchesFound >= active * COMPLETE_RUN_RATIO) {
        stats.discontinued = await persister.markUnseenAsDiscontinued(adapter.brandSlug, startedAt);
      }
    }
    if (!options.limit && adapter.kind === "retailer") {
      const current = (await persister.currentOfferWatchIds()).length;
      if (seenWatchIds.size >= current * COMPLETE_RUN_RATIO) {
        stats.withdrawn = await persister.withdrawUnseenOffers(seenWatchIds, startedAt);
      }
    }

    await persister.finishRun(runId, {
      ...withoutExtra(stats),
      status: "success",
      message:
        adapter.kind === "retailer"
          ? `${stats.unmatched} fiches sans montre correspondante, ${stats.withdrawn} offres retirées`
          : null,
    });
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
