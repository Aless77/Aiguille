import { type WatchTranslationData } from "@aiguille/db/translations";
import { type CheerioAPI } from "cheerio";

import { fetchRobots } from "../lib/robots.ts";
import { fetchSitemapPages } from "../lib/sitemap.ts";
import { parseMovement, parseWaterResistance } from "../lib/specs.ts";
import { cleanText, parseNumber } from "../lib/text.ts";
import { type OfficialAdapter } from "./types.ts";

const PRODUCT_URL =
  /^https:\/\/www\.seikowatches\.com\/([a-z]{2}-[a-z]{2})\/products\/([a-z0-9-]+)\/([a-z]{2,5}\d{2,4}[a-z]?\d?)$/i;

/** Libellés relevés sur les cinq fiches nationales SPB453J1 ; aucun rapprochement par position. */
const LABELS: Record<string, string[]> = {
  caliber: [
    "Numéro du calibre",
    "Numero de calibre",
    "Calibre Number",
    "Kalibernummer",
    "Calibro",
    "Número de calibre",
  ],
  movement: [
    "Type de mouvement",
    "Movement Type",
    "Antriebsart",
    "Tipo di movimento",
    "Tipo de movimiento",
  ],
  precision: ["Précision", "Precision", "Ganggenauigkeit", "Precisione", "Precisión"],
  reserve: [
    "Autonomie",
    "Durée",
    "Power reserve",
    "Duration",
    "Gangreserve",
    "Riserva di carica",
    "Duración",
  ],
  jewels: ["Nombre de rubis", "Jewels", "Lagersteine", "Numero di rubini", "Número de rubís"],
  functions: ["Fonctions", "Functions", "Funktionen", "Funzioni", "Funciones"],
  caseMaterial: [
    "Composition du boîtier",
    "Case Material",
    "Material des Gehäuses",
    "Materiale della cassa",
    "Material de la caja",
  ],
  dimensions: [
    "Dimensions du boîtier",
    "Dimension du boîtier",
    "Case Size",
    "Größe des Gehäuses",
    "Dimensione della cassa",
    "Tamaño de la caja",
  ],
  crystal: ["Composition du verre", "Crystal", "Glas", "Vetro", "Cristal"],
  coating: [
    "Revêtement du verre",
    "Crystal Coating",
    "Glasbeschichtung",
    "Rivestimento in vetro",
    "Revestimiento del cristal",
  ],
  lume: ["LumiBrite"],
  clasp: ["Fermoir", "Clasp", "Schließe", "Chiusura", "Cierre"],
  lugWidth: [
    "Entrecorne",
    "Distance between lugs",
    "Bandanstossbreite (zwischen den Bandanstössen)",
    "Distanza tra le anse",
    "Anchura entre asas",
  ],
  water: [
    "Étanchéité",
    "Water Resistance",
    "Wasserdichtigkeit",
    "Resistenza all’acqua",
    "Resistencia al agua",
  ],
  weight: ["Poids", "Weight", "Gewicht", "Peso"],
  features: [
    "Autres caractéristiques",
    "Caractéristiques",
    "Features",
    "Andere Merkmale",
    "Caratteristiche",
    "Características",
  ],
  dialColor: ["Couleur du cadran", "Dial Color", "Colore del quadrante", "Color de la esfera"],
  strapMaterial: [
    "Composition du bracelet",
    "Band Material",
    "Materiale del cinturino",
    "Material de la correa",
  ],
};

function readPage($: CheerioAPI, url: string) {
  const match = PRODUCT_URL.exec(url);
  if (!match || !$(".productInformation-detail h1").length || !$(".productSpec-item dt").length)
    return null;
  const reference = match[3]!.toUpperCase();
  const declared = $("[data-datalayer-name]").first().attr("data-datalayer-name");
  if (declared && declared.toUpperCase() !== reference) return null;
  const entries: WatchTranslationData["specs"] = {};
  $(".productSpec-item dt").each((_, e) => {
    const label = cleanText($(e).text());
    const value = cleanText($(e).next("dd").text());
    const key = Object.entries(LABELS).find(([, labels]) => labels.includes(label))?.[0];
    // Les lignes inconnues sont conservées ; elles ne sont jamais alignées arbitrairement.
    if (label && value) entries[key ?? `source:${label}`] = { label, value };
  });
  if (!entries.caliber || !entries.movement) return null;
  const collection = cleanText($(".productInformation-detail ._subTitle span").first().text());
  const name = `${collection || "Seiko"} ${reference}`;
  return { entries, reference, collection, name };
}

export function translateSeiko($: CheerioAPI, url: string): WatchTranslationData | null {
  const page = readPage($, url);
  if (!page) return null;
  return {
    name: page.name,
    specs: page.entries,
    fields: {
      dialColor: page.entries.dialColor?.value,
      caseMaterial: page.entries.caseMaterial?.value,
      strapMaterial: page.entries.strapMaterial?.value,
      crystal: page.entries.crystal?.value,
    },
  };
}

/** Prix affiché, lu sans API et sans assimiler l'absence de stock à une rupture. */
export function seikoCountryPrice($: CheerioAPI, url: string) {
  if (!readPage($, url)) return null;
  const text = cleanText($(".productInformation-detail ._price").text());
  const currency =
    /\b(EUR|GBP|CHF|SEK|DKK|PLN)\b/i.exec(text)?.[1]?.toUpperCase() ??
    (/\bEuro\b|€/.test(text) ? "EUR" : "");
  const amount = /\d[\d\s.,]*\d|\d/.exec(text)?.[0]?.replace(/\s/g, "");
  let numeric = amount;
  if (numeric && /[.,]\d{2}$/.test(numeric)) {
    numeric = numeric.slice(0, -3).replace(/[.,]/g, "") + "." + numeric.slice(-2);
  } else numeric = numeric?.replace(/[.,]/g, "");
  const priceCents = numeric ? Math.round(Number(numeric) * 100) : undefined;
  return { priceCents, currency, availability: "unknown" as const };
}

export function parseSeiko($: CheerioAPI, url: string) {
  const page = readPage($, url);
  const price = seikoCountryPrice($, url);
  if (!page || (price?.currency && price.currency !== "EUR")) return null;
  const value = (key: string) => page.entries[key]?.value;
  const movement = parseMovement(value("movement"));
  const dimensions = value("dimensions") ?? "";
  const dimension = (pattern: RegExp) => parseNumber(pattern.exec(dimensions)?.[1]);
  const rawSpecs = Object.fromEntries(
    Object.values(page.entries).map(({ label, value }) => [label, value]),
  );
  const lugToLug = dimension(/Corne à corne\s*:\s*(\d+(?:[.,]\d+)?)/i);
  if (lugToLug) rawSpecs["Corne à corne"] = `${lugToLug} mm`;
  const imageUrls = $(".productInformation-visual img[src]")
    .map((_, e) => new URL($(e).attr("src")!, url).href)
    .get();
  return {
    brandSlug: "seiko",
    url,
    reference: page.reference,
    name: page.name,
    collectionName: page.collection || undefined,
    imageUrls: [...new Set(imageUrls)],
    priceCents: price?.currency === "EUR" ? price.priceCents : undefined,
    currency: "EUR" as const,
    availability: "unknown" as const,
    specs: {
      movement,
      caliber: value("caliber"),
      diameterMm: dimension(/Diam[eè]tre\s*:\s*(\d+(?:[.,]\d+)?)/i),
      thicknessMm: dimension(/[ÉE]paisseur\s*:\s*(\d+(?:[.,]\d+)?)/i),
      lugWidthMm: parseNumber(value("lugWidth")),
      waterResistanceM: parseWaterResistance(value("water")),
      powerReserveH:
        movement !== "solaire" && /heures?|hours?|\bh\b/i.test(value("reserve") ?? "")
          ? parseNumber(value("reserve"))
          : undefined,
      caseMaterial: value("caseMaterial"),
      crystal: value("crystal"),
      dialColor: value("dialColor"),
      strapMaterial: value("strapMaterial"),
    },
    rawSpecs,
  };
}

export const seiko: OfficialAdapter = {
  kind: "official",
  id: "seiko-officiel",
  brandSlug: "seiko",
  async discover() {
    const sitemap = "https://www.seikowatches.com/vendor/sitemap?xml=fr-frSeikoSitemap1.xml";
    const robots = await fetchRobots(sitemap);
    if (!robots.isAllowed(sitemap)) throw new Error("Sitemap Seiko interdit par robots.txt");
    const pages = await fetchSitemapPages(sitemap);
    return pages.filter((url) => url.includes("/fr-fr/products/") && PRODUCT_URL.test(url));
  },
  parse: parseSeiko,
  translate: translateSeiko,
  countryPrice: seikoCountryPrice,
  locales: { FR: "fr-fr", DE: "de-de", IT: "it-it", ES: "es-es", GB: "uk-en" },
  translationLocales: { en: "uk-en", de: "de-de", it: "it-it", es: "es-es" },
  localizeUrl: (url, locale) => url.replace(/\/fr-fr\//, `/${locale}/`),
};
