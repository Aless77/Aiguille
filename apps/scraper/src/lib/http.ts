import { CheerioCrawler, type CheerioCrawlingContext, Configuration } from "@crawlee/cheerio";

import { USER_AGENT } from "../config.ts";
import { SourceUnavailableError, createCircuitBreaker } from "./availability.ts";
import { createThrottle } from "./throttle.ts";

interface PoliteCrawlerOptions {
  /** Délai minimal entre deux requêtes (4 s, ou le Crawl-delay du site s'il est plus long). */
  delaySecs: number;
  requestHandler: (context: CheerioCrawlingContext) => Promise<void>;
  failedRequestHandler: (context: CheerioCrawlingContext, error: Error) => void;
  /** Statuts traités par requestHandler au lieu d'être réessayés (404 : page absente). */
  ignoreHttpErrorStatusCodes?: number[];
}

type CrawlRequests = Parameters<CheerioCrawler["run"]>[0];

export interface PoliteCrawler {
  /**
   * Visite les pages. Lève SourceUnavailableError si le disjoncteur s'est déclenché : le site ne
   * répondait plus (5xx, 429, réseau) et le reste de la file a été abandonné.
   */
  run(requests: CrawlRequests): Promise<void>;
}

/**
 * Crawler conforme aux règles de collecte (docs/sources.md) : une requête à la fois, délai
 * minimal garanti par throttle(), User-Agent identifiable, aucun en-tête imitant un navigateur.
 * robots.txt est vérifié en amont par fetchRobots (Crawlee le lirait avec un User-Agent de
 * navigateur). Disjoncteur : après CIRCUIT_BREAKER_THRESHOLD erreurs serveur d'affilée, on cesse
 * de solliciter un site en panne ou en maintenance.
 */
export function createPoliteCrawler(options: PoliteCrawlerOptions): PoliteCrawler {
  const throttle = createThrottle(options.delaySecs * 1000);
  const breaker = createCircuitBreaker();
  /** Compte l'échec ; au seuil, arrête le crawler (plus aucune requête vers ce site). */
  const recordFailure = (context: CheerioCrawlingContext, error: Error): boolean => {
    const tripped = breaker.failure({
      status: context.response?.statusCode,
      message: error.message,
    });
    if (tripped) crawler.stop(`disjoncteur : ${breaker.reason}`);
    return tripped;
  };

  const crawler: CheerioCrawler = new CheerioCrawler(
    {
      // maxRequestsPerMinute seul autorise des rafales, et sameDomainDelaySecs remet les
      // requêtes en fin de file (~1 requête/minute) : le délai est donc géré par throttle().
      maxConcurrency: 1,
      maxRequestRetries: 2,
      requestHandlerTimeoutSecs: 60,
      useSessionPool: false,
      ignoreHttpErrorStatusCodes: options.ignoreHttpErrorStatusCodes,
      preNavigationHooks: [
        async (_ctx, gotOptions) => {
          await throttle();
          gotOptions.useHeaderGenerator = false;
          gotOptions.headers = { ...gotOptions.headers, "user-agent": USER_AGENT };
        },
      ],
      async requestHandler(context) {
        breaker.success();
        await options.requestHandler(context);
      },
      // Tentative échouée suivie d'un nouvel essai (la dernière passe par failedRequestHandler).
      errorHandler(context, error) {
        if (recordFailure(context, error)) context.request.noRetry = true;
      },
      failedRequestHandler(context, error) {
        // Une fois le disjoncteur déclenché, le reste de la file n'est plus compté en erreurs.
        if (breaker.tripped) return;
        recordFailure(context, error);
        options.failedRequestHandler(context, error);
      },
    },
    new Configuration({ persistStorage: false }),
  );

  return {
    async run(requests) {
      await crawler.run(requests);
      if (breaker.tripped) throw new SourceUnavailableError(breaker.reason);
    },
  };
}
