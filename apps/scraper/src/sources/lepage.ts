import { type CheerioAPI } from "cheerio";

import { findProduct, parseAvailability } from "../lib/jsonld.ts";
import { brandSlugFromName, type Offer } from "../lib/offer.ts";
import { fetchSitemapPages } from "../lib/sitemap.ts";
import { referenceKey, toCents } from "../lib/text.ts";
import { type RetailerAdapter } from "./types.ts";

/**
 * Fiches montres des marques suivies : /fr/<id>-montre-<marque>-<description>-<référence>.html
 * (voir l'étude des revendeurs dans docs/sources.md).
 */
const PRODUCT_URL =
  /^https:\/\/www\.lepage\.fr\/fr\/\d+-montre-(tissot|hamilton|longines)-[a-z0-9-]+\.html$/;

/** Première lettre des références de chaque marque : écarte une référence mal saisie. */
const REFERENCE_PREFIX: Record<string, string> = { tissot: "T", hamilton: "H", longines: "L" };

export function parseLepage($: CheerioAPI, url: string): Offer | null {
  const match = url.match(PRODUCT_URL);
  if (!match) return null;
  const product = findProduct($);
  // sku et mpn portent la référence de la marque (« H24211732 »).
  const reference = product?.mpn ?? product?.sku;
  if (!product || !reference) return null;

  const brandSlug = brandSlugFromName(product.brand) ?? match[1]!;
  if (!referenceKey(reference).startsWith(REFERENCE_PREFIX[brandSlug] ?? "")) return null;

  return {
    brandSlug,
    reference,
    gtin: product.gtin13,
    url,
    priceCents: toCents(product.price),
    currency: "EUR",
    availability: parseAvailability(product.availability),
  };
}

export const lepage: RetailerAdapter = {
  kind: "retailer",
  id: "lepage",
  async discover() {
    const pages = await fetchSitemapPages("https://www.lepage.fr/1_index_sitemap.xml", (url) =>
      /\/1_fr_\d+_sitemap\.xml$/.test(url),
    );
    return pages.filter((url) => PRODUCT_URL.test(url));
  },
  parse: parseLepage,
};
