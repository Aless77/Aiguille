import type { MetadataRoute } from "next";

import { absoluteUrl, isIndexable } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  // Previews et local : tout est bloqué pour éviter le contenu dupliqué dans les index.
  if (!isIndexable()) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/compte/"],
    },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
