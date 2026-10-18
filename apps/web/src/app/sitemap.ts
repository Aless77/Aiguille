import type { MetadataRoute } from "next";

import { absoluteUrl } from "@/lib/site";

/**
 * Lot 1 : pages statiques seulement.
 * Lot 2 : ajouter marques et fiches montres depuis la base (voir docs/seo/strategie.md).
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: absoluteUrl("/"), changeFrequency: "daily", priority: 1 }];
}
