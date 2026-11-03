import { type WatchTranslationData } from "@aiguille/db/translations";
import { type CheerioAPI } from "cheerio";

import { USER_AGENT } from "../config.ts";
import { fetchFromSource } from "../lib/availability.ts";
import { byImageRank, imagesInHtml, uniqueImages } from "../lib/images.ts";
import { findProduct, parseAvailability } from "../lib/jsonld.ts";
import { parseMovement, parseWaterResistance } from "../lib/specs.ts";
import { cleanText, parseNumber, toCents } from "../lib/text.ts";
import { type OfficialAdapter } from "./types.ts";

const BASE = "https://www.omegawatches.com/fr-fr";

/** Rythme plus lent que la règle générale : voir docs/decisions.md du 1er novembre 2026. */
const DELAY_SECS = 8;

const PRODUCT_URL = /^https:\/\/www\.omegawatches\.com\/[a-z]{2}-[a-z]{2}\/watch-omega-[a-z0-9-]+$/;

/** Code de ligne de la fiche → libellé gardé dans rawSpecs, lu par la fiche technique. */
const LABELS: Record<string, string> = {
  watch_between_lugs_size: "Entrecorne",
  watch_lug_to_lug: "Corne à corne",
  watch_thickness: "Boîtier · Épaisseur",
  watch_casediameter: "Diamètre",
  watch_watchcase: "Matériau du boitier",
  watch_dial: "Couleur du cadran",
  watch_crystal: "Composition du verre",
  watch_waterresistance: "Étanchéité",
  watch_case_weight: "Poids",
  caliber_product_caliber_option_id: "Numéro du calibre",
  caliber_movement_label: "Mouvement",
  caliber_power_reserve: "Réserve de marche",
  strap_materials: "Matière du bracelet",
  strap_clasp_type: "Fermoir",
  frequency: "Fréquence",
  features: "Fonctions du mouvement",
};

type Entries = Record<string, { label: string; value: string }>;

/** Lignes du tableau « Données techniques », par code ; la référence et les textes n'y sont pas. */
function readEntries($: CheerioAPI): Entries {
  const entries: Entries = {};
  $("dd.technical-data-value[data-code]").each((_, dd) => {
    const code = $(dd).attr("data-code")!;
    if (!LABELS[code]) return;
    const dt = $(dd).prev("dt").clone();
    dt.find(".product-info").remove();
    const value = cleanText($(dd).text());
    if (value) entries[code] ??= { label: cleanText(dt.text()), value };
  });
  // Hors du tableau : fréquence du calibre et étiquettes des fonctions.
  const frequency = /\d+(?:[.,]\d+)?\s*Hz/i.exec(
    cleanText($('[class*="ow-mod_37__picto--fre"]').first().text()),
  )?.[0];
  if (frequency) entries.frequency = { label: LABELS.frequency!, value: frequency };
  const tags = $("button.ow-tags")
    .map((_, tag) => cleanText($(tag).text()))
    .get()
    .filter(Boolean);
  if (tags.length > 0) {
    entries.features = { label: LABELS.features!, value: [...new Set(tags)].join(", ") };
  }
  return entries;
}

function readPage($: CheerioAPI, url: string) {
  if (!PRODUCT_URL.test(url)) return null;
  const product = findProduct($);
  const reference = cleanText($('dd[data-code="sku"]').first().text());
  const entries = readEntries($);
  // Une montre a toujours un calibre : écarte les accessoires vendus sous la même adresse.
  if (!product?.name || !reference || !entries.caliber_product_caliber_option_id) return null;
  return {
    product,
    reference,
    // « Seamaster Planet Ocean 600M 42 mm, acier sur acier - 217.30.42.21.01.002 »
    // ou « Seamaster Édition 007 - Achetez en ligne » : le nom seul.
    name: cleanText(product.name.replace(/\s+-\s+.*$/, "")),
    collection:
      cleanText($(".product.attribute.subcollection").first().text()) ||
      cleanText($(".product.attribute.collection").first().text()),
    entries,
  };
}

/**
 * Photos de cette référence en taille d'origine, sans le paramètre de vignette du JSON-LD : vue
 * principale, puis vues numérotées, puis porté au poignet. Les voisines ont une autre référence.
 */
export function readImages($: CheerioAPI, url: string, main: string[]): string[] {
  const sku = /(\d{14})$/.exec(url)?.[1];
  const gallery = sku
    ? imagesInHtml(
        $.html(),
        /https:\/\/www\.omegawatches\.com\/media\/catalog\/product\/[^"'\\?\s]+\.(?:png|jpg)/g,
      )
        .filter((image) => image.includes(sku))
        .sort(byImageRank((image) => /-portrait-(\d+)-/.exec(image)?.[1]))
    : [];
  return uniqueImages([...main.map((image) => image.replace(/\?.*$/, "")), ...gallery]);
}

export function translateOmega($: CheerioAPI, url: string): WatchTranslationData | null {
  const page = readPage($, url);
  if (!page) return null;
  const { entries } = page;
  const french = url.includes("/fr-fr/");
  const specs = Object.fromEntries(
    Object.entries(entries).map(([code, entry]) => [
      code,
      { ...entry, label: french ? LABELS[code]! : entry.label },
    ]),
  );
  return {
    name: page.name,
    specs,
    fields: {
      dialColor: entries.watch_dial?.value,
      caseMaterial: entries.watch_watchcase?.value,
      strapMaterial: entries.strap_materials?.value,
      crystal: entries.watch_crystal?.value,
    },
  };
}

export function parseOmega($: CheerioAPI, url: string) {
  const page = readPage($, url);
  if (!page) return null;
  const { product, entries } = page;
  const value = (code: string) => entries[code]?.value;
  return {
    brandSlug: "omega",
    url,
    reference: page.reference,
    name: page.name,
    collectionName: page.collection || undefined,
    imageUrls: readImages($, url, product.images),
    priceCents: product.priceCurrency === "EUR" ? toCents(product.price) : undefined,
    currency: "EUR" as const,
    availability: parseAvailability(product.availability),
    specs: {
      movement: parseMovement(value("caliber_movement_label")),
      caliber: value("caliber_product_caliber_option_id"),
      diameterMm: parseNumber(value("watch_casediameter")),
      thicknessMm: parseNumber(value("watch_thickness")),
      lugWidthMm: parseNumber(value("watch_between_lugs_size")),
      waterResistanceM: parseWaterResistance(value("watch_waterresistance")),
      powerReserveH: parseNumber(value("caliber_power_reserve")),
      caseMaterial: value("watch_watchcase"),
      crystal: value("watch_crystal"),
      dialColor: value("watch_dial"),
      strapMaterial: value("strap_materials"),
    },
    rawSpecs: Object.fromEntries(
      Object.entries(entries).map(([code, entry]) => [LABELS[code]!, entry.value]),
    ),
  };
}

/** Pages catalogue du menu : « watches/seamaster/planet-ocean/catalog ». */
export function parseCatalogLinks(html: string): string[] {
  const links = html.matchAll(
    /"(https:\/\/www\.omegawatches\.com\/fr-fr\/watches\/[a-z0-9/-]+\/catalog)"/g,
  );
  return [...new Set([...links].map((link) => link[1]!))];
}

/** Fiches d'une page catalogue et nombre de pages, publiés dans les données de la page. */
export function parseCatalogPage(html: string): { urls: string[]; totalPages: number } {
  const keys = html.matchAll(/"url_key":"(watch-omega-[a-z0-9-]+)"/g);
  return {
    urls: [...new Set([...keys].map((key) => `${BASE}/${key[1]}`))],
    totalPages: Number(/"total_pages":(\d+)/.exec(html)?.[1] ?? 1),
  };
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchHtml(url: string): Promise<string> {
  const response = await fetchFromSource(url, `Catalogue ${url}`, {
    headers: { "user-agent": USER_AGENT },
  });
  if (!response.ok) throw new Error(`Catalogue ${url} : HTTP ${response.status}`);
  return response.text();
}

export const omega: OfficialAdapter = {
  kind: "official",
  id: "omega-officiel",
  brandSlug: "omega",
  // Aucun sitemap de fiches : le catalogue se lit dans les pages du menu.
  async discover() {
    const urls = new Set<string>();
    const categories = parseCatalogLinks(await fetchHtml(`${BASE}/`));
    for (const category of categories) {
      let totalPages = 1;
      for (let page = 1; page <= totalPages; page++) {
        await sleep(DELAY_SECS * 1000);
        const listing = parseCatalogPage(
          await fetchHtml(page === 1 ? category : `${category}?p=${page}`),
        );
        totalPages = listing.totalPages;
        for (const url of listing.urls) urls.add(url);
      }
    }
    return [...urls];
  },
  parse: parseOmega,
  translate: translateOmega,
  minDelaySecs: DELAY_SECS,
  locales: {
    FR: "fr-fr",
    DE: "de-de",
    IT: "it-it",
    ES: "es-es",
    NL: "nl-nl",
    AT: "de-at",
    GB: "en-gb",
  },
  localizeUrl: (url, locale) => url.replace("/fr-fr/", `/${locale}/`),
};
