import { brands, type Database, stores } from "@aiguille/db";
import { and, asc, eq, inArray, lt, notInArray, or, sql } from "drizzle-orm";

import { DOMAIN_DELAY_SECS } from "../config.ts";
import { type OfficialAdapter } from "../sources/types.ts";
import { isCountry } from "./countries.ts";
import { createPoliteCrawler } from "./http.ts";
import { Persister } from "./persist.ts";
import { fetchRobots } from "./robots.ts";
import { parseStoreListing } from "./store-listing.ts";

/** Boutiques visitées par exécution : la liste complète est revue en quelques jours. */
export const STORE_BATCH = 400;
/** Boutiques hors des pays couverts : revisitées rarement, au cas où l'adresse changerait. */
const IGNORED_REVISIT_DAYS = 90;

export interface StoreRunStats {
  source: string;
  discovered: number;
  visited: number;
  active: number;
  ignored: number;
  closed: number;
  errors: number;
}

/**
 * Collecte par lots des boutiques agréées d'une marque (lot 4) : les URL du sitemap sont
 * enregistrées, puis on visite d'abord les nouvelles, ensuite les plus anciennement vues.
 */
export async function runStores(
  db: Database,
  adapter: OfficialAdapter,
  options: { limit?: number } = {},
): Promise<StoreRunStats> {
  const source = adapter.stores;
  if (!source) throw new Error(`${adapter.id} : pas de boutiques publiées exploitables`);
  const persister = new Persister(db, source.id);
  const runId = await persister.startRun();
  const stats: StoreRunStats = {
    source: source.id,
    discovered: 0,
    visited: 0,
    active: 0,
    ignored: 0,
    closed: 0,
    errors: 0,
  };

  try {
    const [brand] = await db
      .select({ id: brands.id })
      .from(brands)
      .where(eq(brands.slug, adapter.brandSlug));
    if (!brand) throw new Error(`Marque inconnue : ${adapter.brandSlug}`);

    const discovered = await source.discover();
    stats.discovered = discovered.length;
    if (discovered.length === 0) throw new Error("Aucune boutique dans le sitemap.");
    const robots = await fetchRobots(discovered[0]!);
    const allowed = discovered.filter((url) => robots.isAllowed(url));

    // Nouvelles URL : en attente de visite. Disparues du sitemap : boutique fermée.
    for (let i = 0; i < allowed.length; i += 500) {
      await db
        .insert(stores)
        .values(
          allowed.slice(i, i + 500).map((url) => ({ brandId: brand.id, source: source.id, url })),
        )
        .onConflictDoNothing();
    }
    const closed = await db
      .update(stores)
      .set({ status: "closed" })
      .where(
        and(
          eq(stores.source, source.id),
          notInArray(stores.url, allowed),
          inArray(stores.status, ["active", "pending"]),
        ),
      )
      .returning({ id: stores.id });
    stats.closed = closed.length;

    const ignoredBefore = new Date(Date.now() - IGNORED_REVISIT_DAYS * 86_400_000);
    const batch = await db
      .select({ id: stores.id, url: stores.url })
      .from(stores)
      .where(
        and(
          eq(stores.source, source.id),
          or(
            inArray(stores.status, ["pending", "active"]),
            and(eq(stores.status, "ignored"), lt(stores.visitedAt, ignoredBefore)),
          ),
        ),
      )
      // Jamais visitées d'abord, puis les plus anciennes.
      .orderBy(sql`${stores.visitedAt} asc nulls first`, asc(stores.id))
      .limit(options.limit ?? STORE_BATCH);
    console.log(`[${source.id}] ${allowed.length} boutiques connues, ${batch.length} à visiter`);

    const crawler = createPoliteCrawler({
      delaySecs: Math.max(DOMAIN_DELAY_SECS, robots.crawlDelaySecs ?? 0),
      ignoreHttpErrorStatusCodes: [404, 410],
      async requestHandler({ $, request, response }) {
        stats.visited++;
        const id = request.userData.id as number;
        const visitedAt = new Date();
        if (response.statusCode === 404 || response.statusCode === 410) {
          stats.closed++;
          await db.update(stores).set({ status: "closed", visitedAt }).where(eq(stores.id, id));
          return;
        }
        const listing = parseStoreListing($);
        if (!listing) {
          stats.errors++;
          await db.update(stores).set({ visitedAt }).where(eq(stores.id, id));
          return;
        }
        const covered = isCountry(listing.country);
        if (covered) stats.active++;
        else stats.ignored++;
        await db
          .update(stores)
          .set({ ...listing, status: covered ? "active" : "ignored", visitedAt })
          .where(eq(stores.id, id));
      },
      failedRequestHandler({ request }, error) {
        stats.errors++;
        console.warn(`[${source.id}] échec ${request.url} : ${error.message}`);
      },
    });
    await crawler.run(batch.map((b) => ({ url: b.url, userData: { id: b.id } })));

    if (batch.length > 0 && stats.active + stats.ignored === 0) {
      throw new Error("Aucune boutique lue : structure des pages changée ou accès bloqué.");
    }
    await persister.finishRun(runId, {
      status: "success",
      pagesFetched: stats.visited,
      watchesFound: stats.active,
      errors: stats.errors,
      message: `${stats.active} boutiques couvertes, ${stats.ignored} hors pays couverts, ${stats.closed} fermées`,
    });
    return stats;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await persister.finishRun(runId, {
      status: "failed",
      pagesFetched: stats.visited,
      errors: stats.errors,
      message,
    });
    throw error;
  }
}
