import { type CheerioAPI } from "cheerio";
import { z } from "zod";

import { findProduct, parseAvailability } from "../lib/jsonld.ts";
import { fetchSitemapPages } from "../lib/sitemap.ts";
import { parseMovement, parseWaterResistance } from "../lib/specs.ts";
import { cleanText, parseNumber, titleCase, toCents } from "../lib/text.ts";
import { type OfficialAdapter } from "./types.ts";

const SITEMAP = "https://www.venezianico.com/sitemap.xml";

/** Fiches montres : bracelets, écrins et accessoires n'ont pas ces préfixes. */
const PRODUCT_URL =
  /^https:\/\/www\.venezianico\.com\/products\/(?:nereide|redentore|bucintoro|arsenale)-[a-z0-9-]+$/;

/** Collections du menu de la marque, de la plus précise à la plus générale. */
const COLLECTIONS = [
  "Nereide GMT",
  "Nereide Ultraleggero",
  "Nereide",
  "Redentore",
  "Bucintoro",
  "Arsenale",
];

/**
 * Libellés de l'accordéon « Specifications » et du tableau « Technical details », par clé stable ;
 * `label` est le libellé gardé dans rawSpecs, lu par la fiche technique.
 */
const LABELS: Record<string, { labels: string[]; label: string }> = {
  caseMaterial: { labels: ["CASE MATERIAL", "MATERIAL"], label: "Case Material" },
  dimensions: { labels: ["CASE", "DIMENSIONS"], label: "Dimensions" },
  movement: { labels: ["MOVEMENT"], label: "Movement" },
  crystal: { labels: ["CRYSTAL"], label: "Crystal" },
  lume: { labels: ["LUMINOUS MATERIAL"], label: "Luminous Material" },
  insert: { labels: ["INSERT"], label: "Bezel Insert" },
  bezel: { labels: ["BEZEL"], label: "Bezel" },
  dial: { labels: ["DIAL"], label: "Dial" },
  water: { labels: ["WATER RESISTANCE", "WR"], label: "Water Resistance" },
  bracelet: { labels: ["BRACELET", "STRAP"], label: "Bracelet" },
  crown: { labels: ["CROWN"], label: "Crown" },
  thickness: { labels: ["THICKNESS"], label: "Thickness" },
};

/** Données produit publiées par la boutique dans la page (catégorie, tags Shopify). */
const productData = z.object({
  category: z.string().nullish(),
  tags: z.array(z.string()).default([]),
});

/** Tags de la boutique qui désignent la couleur du cadran. */
const DIAL_TAG =
  /^(black|blue|green|grey|gray|white|silver|red|brown|purple|burgundy|ivory|beige|pink|orange|yellow|champagne)$/i;

type Entries = Record<string, { label: string; value: string }>;

function addEntry(entries: Entries, rawLabel: string, value: string) {
  const source = cleanText(rawLabel).replace(/\s*:$/, "");
  const text = cleanText(value).replace(/^:\s*/, "");
  if (!source || !text) return;
  const key = Object.entries(LABELS).find(([, l]) => l.labels.includes(source.toUpperCase()))?.[0];
  // Le tableau détaillé est lu en premier : l'accordéon ne complète que ce qui manque.
  entries[key ?? `source:${source}`] ??= {
    label: key ? LABELS[key]!.label : titleCase(source),
    value: text,
  };
}

function readEntries($: CheerioAPI): Entries {
  const entries: Entries = {};
  $(".feature-chart__table-row").each((_, row) => {
    addEntry(
      entries,
      $(row).find(".feature-chart__heading").text(),
      $(row).find(".feature-chart__value").text(),
    );
  });
  $("details.product-info__accordion").each((_, details) => {
    if (cleanText($(details).find("summary").text()) !== "Specifications") return;
    $(details)
      .find(".prose strong")
      .each((__, strong) => {
        const value = strong.nextSibling;
        if (value?.type === "text") addEntry(entries, $(strong).text(), value.data);
      });
  });
  return entries;
}

function readProductData($: CheerioAPI) {
  try {
    const data = productData.safeParse(JSON.parse($("#stape-product-data").text()));
    return data.success ? data.data : null;
  } catch {
    return null;
  }
}

function readPage($: CheerioAPI, url: string) {
  const data = readProductData($);
  if (!PRODUCT_URL.test(url) || data?.category !== "Watches") return null;
  const title = cleanText($("h1.product-info__title").first().text());
  if (!title) return null;
  // « Nereide 42 - 3321502C » : référence après le tiret ; « Redentore - Marco Polo » : nom complet.
  const name = titleCase(title.replace(/ - \d+[A-Z]*$/i, "").replaceAll(" - ", " ")).replace(
    /\bGmt\b/,
    "GMT",
  );
  const collection = COLLECTIONS.find((c) => name.toLowerCase().startsWith(c.toLowerCase()));
  const entries = readEntries($);
  // Une montre a toujours un mouvement : écarte coffrets et éditions sans fiche technique.
  if (!collection || !entries.movement) return null;
  return { name, collection, entries, tags: data.tags };
}

/**
 * « Seiko NH35A, automatic, 3-hands », « Automatic Cal. Seiko NH35A » et « Swiss Made Sellita
 * SW200-1 Automatic, 3 Hands » → le calibre seul.
 */
function parseCaliber(movement: string | undefined): string | undefined {
  if (!movement) return undefined;
  const text = cleanText(
    (/\bCal(?:\.|iber|ibre)?\s+([^,]+)/i.exec(movement)?.[1] ?? movement.split(",")[0]!)
      .replace(/\b(?:Swiss Made|Japanese)\b/i, "")
      .replace(/\b(?:automatic|manual|hand-wound)\b/i, ""),
  );
  return /\d/.test(text) ? text : undefined;
}

/** Tag de couleur, sinon description : « Buy now the blue dial and blue bezel… » → « Blue ». */
function parseDialColor($: CheerioAPI, tags: string[]): string | undefined {
  const description = $('meta[name="description"]').attr("content") ?? "";
  const color =
    tags.find((tag) => DIAL_TAG.test(tag)) ??
    /\bthe ([a-z][a-z -]{1,30}?) dial\b/i.exec(description)?.[1];
  return color ? titleCase(color) : undefined;
}

export function parseVenezianico($: CheerioAPI, url: string) {
  const page = readPage($, url);
  const product = findProduct($);
  if (!page || !product) return null;
  const value = (key: string) => page.entries[key]?.value;
  const dimensions = value("dimensions") ?? "";
  const dimension = (pattern: RegExp) => parseNumber(pattern.exec(dimensions)?.[1]);
  const movement = value("movement");
  const rawSpecs = Object.fromEntries(
    Object.values(page.entries).map((entry) => [entry.label, entry.value]),
  );
  const lugToLug = dimension(/lug[- ]to[- ]lug\s*(\d+(?:[.,]\d+)?)/i);
  if (lugToLug) rawSpecs["Lug to lug"] = `${lugToLug} mm`;

  return {
    brandSlug: "venezianico",
    url,
    // Éditions limitées sans SKU : le dernier segment de l'URL tient lieu de référence.
    reference: (product.sku ?? url.split("/").at(-1)!).toUpperCase(),
    name: page.name,
    collectionName: page.collection,
    imageUrls: product.images,
    // Prix TTC du marché européen uniquement : un autre marché affiche une autre devise.
    priceCents: product.priceCurrency === "EUR" ? toCents(product.price) : undefined,
    currency: "EUR" as const,
    availability: parseAvailability(product.availability),
    specs: {
      movement: parseMovement(movement),
      caliber: parseCaliber(movement),
      diameterMm: dimension(/Ø\s*(\d+(?:[.,]\d+)?)/),
      thicknessMm: dimension(/thickness\s*(\d+(?:[.,]\d+)?)/i) ?? parseNumber(value("thickness")),
      waterResistanceM: parseWaterResistance(value("water")),
      caseMaterial: value("caseMaterial"),
      crystal: value("crystal"),
      dialColor: parseDialColor($, page.tags),
      strapMaterial: value("bracelet"),
    },
    rawSpecs,
  };
}

export const venezianico: OfficialAdapter = {
  kind: "official",
  id: "venezianico-officiel",
  brandSlug: "venezianico",
  async discover() {
    // L'index liste chaque marché : seul le sitemap produits principal est lu.
    const pages = await fetchSitemapPages(SITEMAP, (url) =>
      /\.com\/sitemap_products_\d+\.xml/.test(url),
    );
    return pages.filter((url) => PRODUCT_URL.test(url));
  },
  parse: parseVenezianico,
  // La boutique répond 429 à un robot trop régulier : rythme plus lent que la règle générale.
  minDelaySecs: 20,
  // Fiches en anglais, prix européens : ni version française, ni marché national distinct relevé.
  // it.venezianico.com redirige vers ce site selon le pays du visiteur : pas de traduction fiable.
  locales: {},
  localizeUrl: (url) => url,
};
