import type { MetadataRoute } from "next";

import {
  getAllWatchPaths,
  getBrands,
  getCollections,
  getNewWatches,
  getStoreCounts,
} from "@/lib/catalog/queries";
import { enabledLocales, INDEXABLE_LOCALES } from "@/lib/i18n/config";
import { localizedEntries } from "@/lib/seo/sitemap-entries";

/**
 * Seules les pages indexables y figurent (garde-fou contenu mince). Google ignore `priority` et
 * `changeFrequency` ; `lastModified` reflète la dernière mise à jour réelle des données.
 * Au-delà de quelques milliers d'URL : generateSitemaps (docs/seo/strategie.md). Chaque page figure
 * dans chaque langue publiée et indexable (INDEXABLE_LOCALES), avec ses liens hreflang.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [brands, collections, watches, news, storeCounts] = await Promise.all([
    getBrands(),
    getCollections(),
    getAllWatchPaths(),
    getNewWatches(1),
    getStoreCounts(),
  ]);

  const locales = enabledLocales().filter((l) => INDEXABLE_LOCALES.includes(l));
  const page = (path: string, extra = {}) => localizedEntries(path, locales, extra);

  return [
    ...page("/"),
    ...page("/montres"),
    ...page("/methodologie"),
    ...page("/a-propos"),
    ...page("/confidentialite"),
    ...page("/prix-en-europe"),
    ...(storeCounts.length > 0
      ? [...page("/boutiques"), ...storeCounts.flatMap((c) => page(`/boutiques/${c.brandSlug}`))]
      : []),
    // Indexable seulement quand des nouveautés existent (sinon page vide, noindex).
    ...(news.items.length > 0
      ? page("/nouveautes", { lastModified: news.items[0]!.firstSeenAt })
      : []),
    ...brands.filter((b) => b.watchCount > 0).flatMap((b) => page(`/montres/${b.slug}`)),
    ...collections.flatMap((c) => page(`/montres/${c.brandSlug}/${c.slug}`)),
    ...watches
      .filter((w) => w.indexable)
      .flatMap((w) =>
        page(`/montres/${w.brandSlug}/${w.collectionSlug}/${w.slug}`, {
          lastModified: w.updatedAt,
        }),
      ),
  ];
}
