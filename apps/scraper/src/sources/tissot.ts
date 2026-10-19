import { type CheerioAPI } from "cheerio";

import { findProduct, parseAvailability } from "../lib/jsonld.ts";
import { fetchSitemapPages } from "../lib/sitemap.ts";
import { parseMovement, parseWaterResistance, pick } from "../lib/specs.ts";
import { cleanText, parseNumber, toCents } from "../lib/text.ts";
import { type OfficialAdapter } from "./types.ts";

const PRODUCT_URL = /^https:\/\/www\.tissotwatches\.com\/fr-fr\/(T[0-9A-Z]{6,})\.html$/;

/**
 * Remet les séparateurs d'une référence Tissot :
 * 14 caractères « T1374071104100 » → « T137.407.11.041.00 », 8 caractères « T41118316 » → « T41.1.183.16 ».
 * Format inconnu : référence laissée telle quelle.
 */
export function formatTissotReference(sku: string): string {
  const s = sku.toUpperCase();
  let m = s.match(/^T(\d{3})(\d{3})(\d{2})(\d{3})(\d{2})$/);
  if (m) return `T${m[1]}.${m[2]}.${m[3]}.${m[4]}.${m[5]}`;
  m = s.match(/^T(\d{2})(\d)(\d{3})(\d{2})$/);
  if (m) return `T${m[1]}.${m[2]}.${m[3]}.${m[4]}`;
  return s;
}

/** Caractéristiques : lignes `.ti-pdp-details-content` composées de deux `.ti-pdp-attribute`. */
function readSpecs($: CheerioAPI): Record<string, string> {
  const specs: Record<string, string> = {};
  $(".ti-pdp-details-content").each((_, row) => {
    const cells = $(row).find(".ti-pdp-attribute");
    if (cells.length < 2) return;
    const label = cleanText(cells.eq(0).text());
    const value = cleanText(cells.eq(1).text());
    if (label && value && !(label in specs)) specs[label] = value;
  });
  return specs;
}

export function parseTissot($: CheerioAPI, url: string) {
  if (!PRODUCT_URL.test(url)) return null;
  const product = findProduct($);
  if (!product?.sku) return null;

  const specs = readSpecs($);
  // Bracelets et accessoires partagent le format d'URL : une montre a toujours un mouvement.
  const movementLabel = pick(specs, "Type de mouvement") ?? pick(specs, "Mouvement");
  if (!movementLabel) return null;
  // Le H1 porte la ligne de produits (« Tissot PRX ») ; le champ « Collection » de la fiche est
  // une catégorie de style (« Classique Contemporain »), conservée dans rawSpecs.
  const h1 = cleanText($("h1").first().text());
  const collectionName = h1.replace(/^tissot\s+/i, "").trim() || undefined;
  const ogImage = $('meta[property="og:image"]').attr("content");

  return {
    brandSlug: "tissot",
    url,
    reference: formatTissotReference(product.sku),
    name: product.name ?? h1,
    collectionName,
    description: product.description,
    imageUrls: product.images.length ? product.images : ogImage ? [ogImage] : [],
    priceCents: toCents(product.price),
    currency: "EUR" as const,
    availability: parseAvailability(product.availability),
    specs: {
      movement: parseMovement(movementLabel),
      caliber: pick(specs, "Calibre"),
      diameterMm: parseNumber(pick(specs, "Largeur de la boîte (mm)", "Diamètre (mm)")),
      thicknessMm: parseNumber(pick(specs, "Epaisseur de la boîte (mm)")),
      lugWidthMm: parseNumber(pick(specs, "Entre-cornes (mm)")),
      waterResistanceM: parseWaterResistance(pick(specs, "Etanchéité de la boîte")),
      powerReserveH: parseNumber(pick(specs, "Réserve de marche (heures)")),
      caseMaterial: pick(specs, "Matière de la boîte"),
      crystal: pick(specs, "Type de glace"),
      dialColor: pick(specs, "Couleur du cadran"),
      strapMaterial: pick(specs, "Matière du bracelet"),
    },
    rawSpecs: specs,
  };
}

export const tissot: OfficialAdapter = {
  kind: "official",
  id: "tissot-officiel",
  brandSlug: "tissot",
  async discover() {
    // L'index fr-fr renvoie vers des sitemaps multilingues : on ne garde que les fiches fr-fr.
    const pages = await fetchSitemapPages(
      "https://www.tissotwatches.com/fr-fr/sitemap_index.xml",
      (url) => /\/sitemap_\d+\.xml$/.test(url),
    );
    return pages.filter((url) => PRODUCT_URL.test(url));
  },
  parse: parseTissot,
};
