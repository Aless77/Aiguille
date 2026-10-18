import type { MetadataRoute } from "next";

import { getAllWatchPaths, getBrands, getCollections } from "@/lib/catalog/queries";
import { absoluteUrl } from "@/lib/site";

/**
 * Seules les pages indexables y figurent (garde-fou contenu mince). Google ignore `priority` et
 * `changeFrequency` ; `lastModified` reflète la dernière mise à jour réelle des données.
 * Au-delà de quelques milliers d'URL : generateSitemaps (docs/seo/strategie.md).
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [brands, collections, watches] = await Promise.all([
    getBrands(),
    getCollections(),
    getAllWatchPaths(),
  ]);

  return [
    { url: absoluteUrl("/") },
    { url: absoluteUrl("/montres") },
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
