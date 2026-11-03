import { type WatchTranslationData } from "@aiguille/db/translations";
import { type CheerioAPI } from "cheerio";

import { imagesInHtml, uniqueImages } from "../lib/images.ts";
import { fetchRobots } from "../lib/robots.ts";
import { fetchSitemapPages } from "../lib/sitemap.ts";
import { parseMovement, parseWaterResistance } from "../lib/specs.ts";
import { cleanText, parseNumber } from "../lib/text.ts";
import { readDisplayedPrice } from "./seiko.ts";
import { type OfficialAdapter } from "./types.ts";

/** Fiches montres : « /fr-fr/collections/sbga211g » ; les autres pages ont un nom, pas de code. */
const PRODUCT_URL =
  /^https:\/\/www\.grand-seiko\.com\/([a-z]{2}-[a-z]{2})\/collections\/([a-z]{4}\d{3}[a-z0-9]?)$/;

/**
 * Libellés relevés sur les cinq fiches nationales SBGA211, par clé stable ; `label` est le libellé
 * gardé dans rawSpecs, lu par la fiche technique.
 */
const LABELS: Record<string, { labels: string[]; label: string }> = {
  caseMaterial: {
    labels: ["Habillage", "Exterior", "Äußeres", "Esterno"],
    label: "Composition du boîtier",
  },
  caseBack: {
    labels: [
      "Fond de boîtier",
      "Case back",
      "Gehäuseboden",
      "Fondello",
      "Parte Posterior de la Caja",
    ],
    label: "Boîtier · Fond",
  },
  crystal: {
    labels: [
      "Composition du verre",
      "Glass Material",
      "Material des Glases",
      "Materiale del vetro",
      "Material del cristal",
    ],
    label: "Composition du verre",
  },
  coating: {
    labels: [
      "Revêtement du verre",
      "Glass Coating",
      "Glasbeschichtung",
      "Rivestimento vetro",
      "Revestimiento del cristal",
    ],
    label: "Revêtement du verre",
  },
  dimensions: {
    labels: [
      "Dimension du boîtier",
      "Case size",
      "Gehäusegröße",
      "Dimensione della cassa",
      "Tamaño de la caja",
    ],
    label: "Dimension du boîtier",
  },
  lugWidth: {
    labels: [
      "Largeur du bracelet",
      "Band width",
      "Bandbreite",
      "Larghezza cinturino",
      "Ancho de la pulsera",
    ],
    label: "Largeur corne",
  },
  strapMaterial: {
    labels: ["Composition du Bracelet", "Band Material"],
    label: "Matière du bracelet",
  },
  clasp: {
    labels: ["Type de boucle", "Clasp type", "Verschluss", "Tipo di chiusura", "Tipo de cierre"],
    label: "Fermoir",
  },
  bandLength: {
    labels: [
      "Diamètre du bracelet",
      "The perimeter of Band",
      "Der Umfang des Armbandes",
      "Lunghezza bracciale",
      "Perímetro de la pulsera",
    ],
    label: "Longueur du bracelet",
  },
  caliber: {
    labels: ["Calibre", "Caliber no.", "Kalibernummer", "Codice calibro", "Número de calibre"],
    label: "Numéro du calibre",
  },
  movement: {
    labels: [
      "Type de mouvement",
      "Movement Type",
      "Antriebssystem",
      "Tipo di movimento",
      "Tipo de movimiento",
    ],
    label: "Type de calibre",
  },
  reserve: {
    labels: [
      "Réserve de marche",
      "Power reserve",
      "Gangreserve",
      "Riserva di carica",
      "Reserva de marcha",
    ],
    label: "Réserve de marche",
  },
  accuracy: {
    labels: ["Précision", "Accuracy", "Genauigkeit", "Precisione", "Precisión"],
    label: "Précision",
  },
  water: {
    labels: [
      "Étanchéité",
      "Water resistance",
      "Wasserdichtigkeit",
      "Resistenza all’acqua",
      "Resistencia al agua",
    ],
    label: "Étanchéité",
  },
  magnetic: {
    labels: [
      "Résistance magnétique",
      "Magnetic resistance",
      "Magnetischer Widerstand",
      "Resistenza magnetica",
      "Resistencia magnética",
    ],
    label: "Résistance magnétique",
  },
  weight: { labels: ["Poids", "Weight", "Gewicht", "Peso"], label: "Poids" },
  features: {
    labels: ["Autres détails / Caractéristiques", "Other details / Features", "Hinweise"],
    label: "Autres caractéristiques",
  },
};

const keyOf = (label: string) =>
  Object.entries(LABELS).find(([, entry]) => entry.labels.includes(label))?.[0];

function readPage($: CheerioAPI, url: string) {
  const match = PRODUCT_URL.exec(url);
  const reference = cleanText($(".productMain-data h1").first().text());
  if (!match || !reference || !$(".productSpec-data th").length) return null;
  const entries: WatchTranslationData["specs"] = {};
  $(".productSpec-data tr").each((_, row) => {
    const label = cleanText($(row).find("th").first().text()).replace(/\s*:$/, "");
    const cell = $(row).find("td").first();
    // Le calibre est suivi d'un lien vers les manuels : le premier lien seul.
    const value = cleanText(cell.find("a").first().text() || cell.text());
    if (!label || !value) return;
    const key = keyOf(label);
    entries[key ?? `source:${label}`] ??= { label, value };
  });
  if (!entries.caliber || !entries.movement) return null;
  // « Heritage Collection », « Collezione Heritage » : le nom seul.
  const collection = cleanText(
    $(".productMain-data ._collection")
      .first()
      .text()
      .replace(/\b(?:Collection|Collezione|Kollektion|Colección)\b/gi, ""),
  );
  return { entries, reference, collection, name: `${collection} ${reference}`.trim() };
}

export function translateGrandSeiko($: CheerioAPI, url: string): WatchTranslationData | null {
  const page = readPage($, url);
  if (!page) return null;
  const french = url.includes("/fr-fr/");
  const specs = Object.fromEntries(
    Object.entries(page.entries).map(([key, entry]) => [
      key,
      { ...entry, label: (french && LABELS[key]?.label) || entry.label },
    ]),
  );
  return {
    name: page.name,
    specs,
    fields: {
      caseMaterial: page.entries.caseMaterial?.value,
      strapMaterial: page.entries.strapMaterial?.value,
      crystal: page.entries.crystal?.value,
    },
  };
}

export function grandSeikoCountryPrice($: CheerioAPI, url: string) {
  if (!readPage($, url)) return null;
  const price = readDisplayedPrice(cleanText($(".productMain-data ._price").text()));
  return { ...price, availability: "unknown" as const };
}

/**
 * Photo du produit, puis vues détaillées (cadran, profil, calibre) ; les versions mobiles
 * « _sp » répètent les mêmes vues. Les montres voisines sont dans un autre dossier.
 */
export function readImages($: CheerioAPI, url: string, reference: string): string[] {
  const main = $(".productMain-image img[src]")
    .map((_, img) => $(img).attr("src")!)
    .get();
  const views = imagesInHtml(
    $.html(),
    new RegExp(
      `/[a-z]{2}-[a-z]{2}/-/media/Images/GlobalEn/GrandSeiko/Home/collections/Products/${reference}/[^"'?&\\s]+\\.(?:jpg|png)`,
      "g",
    ),
  ).filter((image) => !/_sp\.\w+$/.test(image));
  return uniqueImages([...main, ...views].map((src) => new URL(src, url).href));
}

export function parseGrandSeiko($: CheerioAPI, url: string) {
  const page = readPage($, url);
  const price = grandSeikoCountryPrice($, url);
  if (!page || (price?.currency && price.currency !== "EUR")) return null;
  const value = (key: string) => page.entries[key]?.value;
  const dimensions = value("dimensions") ?? "";
  const dimension = (pattern: RegExp) => parseNumber(pattern.exec(dimensions)?.[1]);
  return {
    brandSlug: "grand-seiko",
    url,
    reference: page.reference,
    name: page.name,
    collectionName: page.collection || undefined,
    imageUrls: readImages($, url, page.reference),
    priceCents: price?.currency === "EUR" ? price.priceCents : undefined,
    currency: "EUR" as const,
    availability: "unknown" as const,
    specs: {
      movement: parseMovement(value("movement")),
      caliber: value("caliber"),
      diameterMm: dimension(/Diam[eè]tre\s*(\d+(?:[.,]\d+)?)/i),
      thicknessMm: dimension(/[ÉE]paisseur\s*(\d+(?:[.,]\d+)?)/i),
      lugWidthMm: parseNumber(value("lugWidth")),
      waterResistanceM: parseWaterResistance(value("water")),
      powerReserveH: parseNumber(/(\d+)\s*heures/i.exec(value("reserve") ?? "")?.[1]),
      caseMaterial: value("caseMaterial"),
      crystal: value("crystal"),
      strapMaterial: value("strapMaterial"),
    },
    rawSpecs: Object.fromEntries(
      Object.entries(page.entries).map(([key, entry]) => [
        LABELS[key]?.label ?? entry.label,
        entry.value,
      ]),
    ),
  };
}

export const grandSeiko: OfficialAdapter = {
  kind: "official",
  id: "grand-seiko-officiel",
  brandSlug: "grand-seiko",
  async discover() {
    const sitemap = "https://www.grand-seiko.com/vendor/sitemap?xml=fr-frGrandSeikoSitemap1.xml";
    const robots = await fetchRobots(sitemap);
    if (!robots.isAllowed(sitemap)) throw new Error("Sitemap Grand Seiko interdit par robots.txt");
    const pages = await fetchSitemapPages(sitemap);
    return pages.filter((url) => url.includes("/fr-fr/") && PRODUCT_URL.test(url));
  },
  parse: parseGrandSeiko,
  translate: translateGrandSeiko,
  countryPrice: grandSeikoCountryPrice,
  locales: { FR: "fr-fr", DE: "de-de", IT: "it-it", ES: "es-es", GB: "uk-en" },
  translationLocales: { en: "uk-en", de: "de-de", it: "it-it", es: "es-es" },
  localizeUrl: (url, locale) => url.replace("/fr-fr/", `/${locale}/`),
};
