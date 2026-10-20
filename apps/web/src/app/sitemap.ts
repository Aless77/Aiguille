import type { MetadataRoute } from "next";

import {
  getAllWatchPaths,
  getBrands,
  getCollections,
  getNewWatches,
  getStoreCounts,
} from "@/lib/catalog/queries";
import { absoluteUrl } from "@/lib/site";

/**
 * Seules les pages indexables y figurent (garde-fou contenu mince). Google ignore `priority` et
 * `changeFrequency` ; `lastModified` reflète la dernière mise à jour réelle des données.
 * Au-delà de quelques milliers d'URL : generateSitemaps (docs/seo/strategie.md).
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [brands, collections, watches, news, storeCounts] = await Promise.all([
    getBrands(),
    getCollections(),
    getAllWatchPaths(),
    getNewWatches(1),
    getStoreCounts(),
  ]);

  return [
    { url: absoluteUrl("/") },
    { url: absoluteUrl("/montres") },
    { url: absoluteUrl("/methodologie") },
    { url: absoluteUrl("/a-propos") },
    { url: absoluteUrl("/prix-en-europe") },
    ...(storeCounts.length > 0
      ? [
          { url: absoluteUrl("/boutiques") },
          ...storeCounts.map((c) => ({ url: absoluteUrl(`/boutiques/${c.brandSlug}`) })),
        ]
      : []),
    // Indexable seulement quand des nouveautés existent (sinon page vide, noindex).
    ...(news.items.length > 0
      ? [{ url: absoluteUrl("/nouveautes"), lastModified: news.items[0]!.firstSeenAt }]
      : []),
    ...brands
      .filter((b) => b.watchCount > 0)
      .map((b) => ({ url: absoluteUrl(`/montres/${b.slug}`) })),
    ...collections.map((c) => ({ url: absoluteUrl(`/montres/${c.brandSlug}/${c.slug}`) })),
    ...watches
      .filter((w) => w.indexable)
      .map((w) => ({
        url: absoluteUrl(`/montres/${w.brandSlug}/${w.collectionSlug}/${w.slug}`),
        lastModified: w.updatedAt,
      })),
  ];
}
