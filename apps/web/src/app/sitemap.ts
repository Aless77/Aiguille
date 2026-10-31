import type { MetadataRoute } from "next";

/** Site privé : aucune URL du catalogue ne doit être publiée. */
export default function sitemap(): MetadataRoute.Sitemap {
  return [];
}
