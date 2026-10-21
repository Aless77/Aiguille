import { type AddressInfo } from "node:net";
import { createServer, type Server } from "node:http";

import { log } from "@crawlee/cheerio";
import { afterEach, beforeAll, describe, expect, it } from "vitest";

import { CIRCUIT_BREAKER_THRESHOLD, SourceUnavailableError } from "./availability.ts";
import { createPoliteCrawler } from "./http.ts";

let server: Server | undefined;

// Les avertissements de Crawlee (nouvel essai…) sont attendus ici : pas de bruit dans la sortie.
beforeAll(() => log.setLevel(log.LEVELS.OFF));

/** Site local qui répond `status` à toute requête ; renvoie son URL et le compteur de requêtes. */
async function siteAnswering(status: (n: number) => number) {
  const hits = { count: 0 };
  server = createServer((_req, res) => {
    hits.count++;
    res.writeHead(status(hits.count), { "content-type": "text/html" });
    res.end("<html><body>ok</body></html>");
  });
  await new Promise<void>((resolve) => server!.listen(0, "127.0.0.1", resolve));
  const { port } = server.address() as AddressInfo;
  return { base: `http://127.0.0.1:${port}`, hits };
}

afterEach(async () => {
  await new Promise((resolve) => server?.close(resolve));
  server = undefined;
});

const urls = (base: string, n: number) => Array.from({ length: n }, (_, i) => `${base}/p${i}`);

describe("createPoliteCrawler (disjoncteur)", () => {
  it("cesse de solliciter un site en maintenance", async () => {
    const { base, hits } = await siteAnswering(() => 503);
    const failed: string[] = [];
    const crawler = createPoliteCrawler({
      delaySecs: 0,
      requestHandler: async () => {},
      failedRequestHandler: ({ request }) => failed.push(request.url),
    });

    await expect(crawler.run(urls(base, 30))).rejects.toBeInstanceOf(SourceUnavailableError);
    // 30 pages × 3 tentatives = 90 requêtes sans disjoncteur.
    expect(hits.count).toBe(CIRCUIT_BREAKER_THRESHOLD);
    expect(failed.length).toBeLessThan(CIRCUIT_BREAKER_THRESHOLD);
  }, 30_000);

  it("ne se déclenche pas sur des pannes passagères", async () => {
    // Une requête sur trois échoue : jamais 10 d'affilée.
    const { base } = await siteAnswering((n) => (n % 3 === 0 ? 503 : 200));
    let ok = 0;
    const crawler = createPoliteCrawler({
      delaySecs: 0,
      requestHandler: async () => {
        ok++;
      },
      failedRequestHandler: () => {},
    });

    await expect(crawler.run(urls(base, 15))).resolves.toBeUndefined();
    expect(ok).toBe(15);
  }, 30_000);
});
