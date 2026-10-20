import { CheerioCrawler, type CheerioCrawlingContext, Configuration } from "@crawlee/cheerio";

import { USER_AGENT } from "../config.ts";
import { createThrottle } from "./throttle.ts";

interface PoliteCrawlerOptions {
  /** Délai minimal entre deux requêtes (4 s, ou le Crawl-delay du site s'il est plus long). */
  delaySecs: number;
  requestHandler: (context: CheerioCrawlingContext) => Promise<void>;
  failedRequestHandler: (context: CheerioCrawlingContext, error: Error) => void;
  /** Statuts traités par requestHandler au lieu d'être réessayés (404 : page absente). */
  ignoreHttpErrorStatusCodes?: number[];
}

/**
 * Crawler conforme aux règles de collecte (docs/sources.md) : une requête à la fois, délai
 * minimal garanti par throttle(), User-Agent identifiable, aucun en-tête imitant un navigateur.
 * robots.txt est vérifié en amont par fetchRobots (Crawlee le lirait avec un User-Agent de
 * navigateur).
 */
export function createPoliteCrawler(options: PoliteCrawlerOptions): CheerioCrawler {
  const throttle = createThrottle(options.delaySecs * 1000);
  return new CheerioCrawler(
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
      requestHandler: options.requestHandler,
      failedRequestHandler: options.failedRequestHandler,
    },
    new Configuration({ persistStorage: false }),
  );
}
