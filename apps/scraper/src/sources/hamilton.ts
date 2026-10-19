import { type CheerioAPI } from "cheerio";

import { findProduct, parseAvailability } from "../lib/jsonld.ts";
import { fetchSitemapPages } from "../lib/sitemap.ts";
import { parseMovement, parseWaterResistance, pick } from "../lib/specs.ts";
import { cleanText, parseNumber, toCents } from "../lib/text.ts";
import { type OfficialAdapter } from "./types.ts";

const PRODUCT_URL = /^https:\/\/www\.hamiltonwatch\.com\/fr-fr\/(h\d{8})-[a-z0-9-]+\.html$/i;

/** Caractéristiques : `span.attribute-label` suivi de `span.attribute-value`. */
function readSpecs($: CheerioAPI): Record<string, string> {
  const specs: Record<string, string> = {};
  $(".attribute-label").each((_, el) => {
    const label = cleanText($(el).text());
    const value = cleanText($(el).nextAll(".attribute-value").first().text());
    if (label && value && !(label in specs)) specs[label] = value;
  });
  return specs;
}

export function parseHamilton($: CheerioAPI, url: string) {
  if (!PRODUCT_URL.test(url)) return null;
  const product = findProduct($);
  const specs = readSpecs($);
  const sku = product?.sku ?? pick(specs, "Référence");
  // Bracelets et accessoires partagent le format d'URL : une montre a toujours un mouvement.
  const movementLabel = pick(specs, "Mouvement");
  if (!product || !sku || !movementLabel) return null;

  return {
    brandSlug: "hamilton",
    url,
    reference: sku.toUpperCase(),
    name: product.name ?? sku,
    collectionName: pick(specs, "Collection"),
    description: product.description,
    imageUrls: product.images,
    priceCents: toCents(product.price),
    currency: "EUR" as const,
    availability: parseAvailability(product.availability),
    specs: {
      movement: parseMovement(movementLabel),
      caliber: pick(specs, "Calibre"),
      diameterMm: parseNumber(pick(specs, "Dimension du boîtier")),
      thicknessMm: parseNumber(pick(specs, "Épaisseur (mm)")),
      lugWidthMm: parseNumber(pick(specs, "Largeur corne")),
      waterResistanceM: parseWaterResistance(pick(specs, "Étanchéité")),
      powerReserveH: parseNumber(pick(specs, "Réserve de marche")),
      caseMaterial: pick(specs, "Matériau du boîtier"),
      crystal: pick(specs, "Verre"),
      dialColor: pick(specs, "Couleur du cadran"),
      strapMaterial: pick(specs, "Type de bracelet"),
    },
    rawSpecs: specs,
  };
}

export const hamilton: OfficialAdapter = {
  kind: "official",
  id: "hamilton-officiel",
  brandSlug: "hamilton",
  async discover() {
    const pages = await fetchSitemapPages(
      "https://www.hamiltonwatch.com/media/sitemap/sitemap_fr_fr.xml",
    );
    return pages.filter((url) => PRODUCT_URL.test(url));
  },
  parse: parseHamilton,
};
