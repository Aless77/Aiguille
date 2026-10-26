import { type CheerioAPI } from "cheerio";

import { findProduct, parseAvailability } from "../lib/jsonld.ts";
import { brandSlugFromName, validBrandReference, type Offer } from "../lib/offer.ts";
import { fetchSitemapPages } from "../lib/sitemap.ts";
import { toCents } from "../lib/text.ts";
import { type RetailerAdapter } from "./types.ts";

/**
 * Fiches : /<modèle>-<référence>-<marque>-<id>.html (« tradition-t0636101603800-tissot-37139 »).
 * Le `sku` du JSON-LD est un identifiant interne : la référence est lue dans l'URL.
 */
const PRODUCT_URL =
  /^https:\/\/ocarat\.com\/[a-z0-9-]+-([a-z]{1,5}\d[a-z0-9-]{3,})-(tissot|hamilton|longines|citizen|seiko)-\d+\.html$/;

export function parseOcarat($: CheerioAPI, url: string): Offer | null {
  const match = url.match(PRODUCT_URL);
  if (!match) return null;
  const product = findProduct($);
  if (!product) return null;

  // La marque du JSON-LD doit confirmer celle de l'URL.
  const brandSlug = brandSlugFromName(product.brand);
  if (!brandSlug || brandSlug !== match[2] || !validBrandReference(brandSlug, match[1]!))
    return null;

  return {
    brandSlug,
    reference: match[1]!.toUpperCase(),
    gtin: product.gtin13,
    url,
    priceCents: toCents(product.price),
    currency: "EUR",
    availability: parseAvailability(product.availability),
  };
}

export const ocarat: RetailerAdapter = {
  kind: "retailer",
  id: "ocarat",
  async discover() {
    const pages = await fetchSitemapPages("https://ocarat.com/sitemap_fr.xml", (url) =>
      /name=product_\d+_fr_\d+$/.test(url),
    );
    return pages.filter((url) => PRODUCT_URL.test(url));
  },
  parse: parseOcarat,
};
