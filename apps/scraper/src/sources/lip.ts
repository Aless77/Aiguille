import { type WatchTranslationData } from "@aiguille/db/translations";
import { type CheerioAPI } from "cheerio";

import { findProduct, parseAvailability } from "../lib/jsonld.ts";
import { fetchSitemapPages } from "../lib/sitemap.ts";
import { parseMovement, parseWaterResistance } from "../lib/specs.ts";
import { cleanText, parseNumber, toCents } from "../lib/text.ts";
import { type OfficialAdapter } from "./types.ts";

const SITEMAP = "https://lip.fr/1_index_sitemap.xml";

/** Fiches produit françaises : une catégorie, puis « 198-lip-churchill-t18-671933 ». */
const PRODUCT_URL = /^https:\/\/lip\.fr\/[a-z]{2}\/([a-z0-9-]+)\/\d+-[a-z0-9-]+$/;

/** Catégories sans montre-bracelet. */
const NOT_WATCHES = new Set(["bracelets", "accessoires", "bagagerie", "horloges", "content"]);

/**
 * Libellés de la fiche en français, anglais et italien, par clé stable ; `label` est le libellé
 * gardé dans rawSpecs, lu par la fiche technique. « Type de pile » n'est pas traduit par la marque.
 */
const LABELS: Record<string, { labels: string[]; label: string }> = {
  case: { labels: ["Boîtier", "Case", "Cassa"], label: "Boîtier" },
  dimensions: { labels: ["Dimensions", "Size", "Dimensioni"], label: "Dimension du boîtier" },
  lugWidth: { labels: ["Entrecorne", "Width between lug", "Interanse"], label: "Entrecorne" },
  functions: { labels: ["Fonctions", "Functions", "Funzioni"], label: "Fonctions du mouvement" },
  water: { labels: ["Étanchéité", "Water Resistance", "Impermeabilità"], label: "Étanchéité" },
  weight: { labels: ["Poids", "Weight", "Peso"], label: "Poids" },
  dial: { labels: ["Cadran", "Dial", "Quadrante"], label: "Cadran" },
  crystal: { labels: ["Verre", "Crystal", "Vetro"], label: "Verre" },
  hands: { labels: ["Aiguilles", "Hands", "Lancette"], label: "Cadran · Aiguilles" },
  indexes: { labels: ["Index", "Indexes", "Indici"], label: "Type d'index" },
  movement: { labels: ["Mouvement", "Movement", "Movimento"], label: "Mouvement" },
  caliber: {
    labels: ["Référence mouvement", "Reference movement", "Riferimento movimento"],
    label: "Calibre",
  },
  frequency: { labels: ["Fréquence", "Frequency", "Frequenza"], label: "Fréquence" },
  jewels: { labels: ["Rubis", "Jewels", "Rubini"], label: "Rubis" },
  accuracy: { labels: ["Précision", "Accuracy", "Precisione"], label: "Précision" },
  powerReserve: {
    labels: [
      "Réserve de marche",
      "Réserve de marche en pleine charge",
      "Power reserve (Mainspring after fully wound up)",
      "Riserva di carica a piena carica",
    ],
    label: "Réserve de marche",
  },
  finishing: {
    labels: ["Finitions", "Finitions soignées", "Finishing", "Meticulous finishing", "Finiture"],
    label: "Autres caractéristiques",
  },
  battery: { labels: ["Type de pile", "Tipo di batteria"], label: "Mouvement · Pile" },
  caseBack: { labels: ["Fond de boîte", "Back case", "Fondello"], label: "Boîtier · Fond" },
  strap: { labels: ["Bracelet", "Strap", "Cinturino"], label: "Bracelet" },
  clasp: { labels: ["Fermoir", "Clasp", "Chiusura"], label: "Fermoir" },
  crown: { labels: ["Couronne", "Crown", "Corona"], label: "Couronne" },
};

/** Une fiche commence par la forme du boîtier, et finit par sa finition. */
const CASE_SHAPE =
  /^(rond|ronde|round|tondo|rectangle|rectangulaire|rectangular|rettangolare|carré|carrée|square|quadrato|tonneau|ovale|oval|coussin|cushion|asymétrique|asymmetric|asimmetrica|asimmetrico)\s+/i;
const CASE_FINISH = /\s+(?:poli|brossé|microbillé|polish|brush|lucido|satinato|spazzolato).*$/i;

/** Lu par la fiche technique ; la marque l'écrit dans la ligne du boîtier, sans libellé propre. */
const SHAPE_LABEL = "Forme du boitier";

type Entries = Record<string, { label: string; value: string }>;

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

function keyOf(label: string): string | undefined {
  const wanted = label.toLowerCase();
  return Object.entries(LABELS).find(([, l]) =>
    l.labels.some((candidate) => candidate.toLowerCase() === wanted),
  )?.[0];
}

function addEntry(entries: Entries, rawLabel: string, value: string) {
  const key = keyOf(rawLabel);
  entries[key ?? `source:${rawLabel}`] ??= { label: rawLabel, value };
}

/** « Rubis : 2. Précision : -10/+20 secondes/mois » : plusieurs valeurs connues sur une ligne. */
function splitLine(text: string): string[] {
  const parts: string[] = [];
  for (const part of text.split(/\.\s+(?=[^.:]{2,50}:)/)) {
    const label = /^[^:]+/.exec(part)?.[0].trim() ?? "";
    if (parts.length === 0 || keyOf(label)) parts.push(part);
    else parts[parts.length - 1] += `. ${part}`;
  }
  return parts;
}

function readEntries($: CheerioAPI): Entries {
  const entries: Entries = {};
  // Blocs de la fiche : boîtier, cadran, mouvement, bracelet ; l'onglet Livraison n'en est pas.
  const blocks = $(".bloc").not("#livraison .bloc");
  blocks.find("br").replaceWith(" ");
  blocks.find(".line:not(:has(.line))").each((_, line) => {
    for (const part of splitLine(cleanText($(line).text()))) {
      const match = /^([^:]{2,40}?)\s*:\s*(.+)$/.exec(part);
      if (match) addEntry(entries, match[1]!, match[2]!);
    }
  });
  // La page accole parfois la fin des fonctions à la précision : « +/-20 secondes/mois stop… ».
  const accuracy = /^[-+/\d\s]+sec\p{L}*\s*\/\s*\p{L}+/iu.exec(entries.accuracy?.value ?? "");
  if (entries.accuracy && accuracy) entries.accuracy.value = accuracy[0];
  const shape = CASE_SHAPE.exec(entries.case?.value ?? "")?.[1];
  if (shape) entries.shape = { label: SHAPE_LABEL, value: capitalize(shape) };
  return entries;
}

function caseMaterial(entries: Entries): string | undefined {
  const text = entries.case?.value.replace(CASE_SHAPE, "").replace(CASE_FINISH, "");
  return text ? capitalize(text) : undefined;
}

/** Page de fiche montre : un mouvement publié écarte coffrets vides et services (« Lip SAV »). */
function readPage($: CheerioAPI, url: string) {
  const category = PRODUCT_URL.exec(url)?.[1];
  if (!category || NOT_WATCHES.has(category)) return null;
  const name = cleanText($("h1").first().text());
  const entries = readEntries($);
  if (!name || !entries.movement) return null;
  return { name, entries };
}

export function translateLip($: CheerioAPI, url: string): WatchTranslationData | null {
  const page = readPage($, url);
  if (!page) return null;
  const { entries } = page;
  // Version française : pivot, avec les mêmes libellés que rawSpecs.
  const french = url.startsWith("https://lip.fr/fr/");
  const specs = Object.fromEntries(
    Object.entries(entries).map(([key, entry]) => [
      key,
      { ...entry, label: (french && LABELS[key]?.label) || entry.label },
    ]),
  );
  return {
    name: page.name,
    specs,
    fields: {
      dialColor: entries.dial && capitalize(entries.dial.value),
      caseMaterial: caseMaterial(entries),
      strapMaterial: entries.strap && capitalize(entries.strap.value),
      crystal: entries.crystal && capitalize(entries.crystal.value),
    },
  };
}

export function parseLip($: CheerioAPI, url: string) {
  const page = readPage($, url);
  const product = findProduct($);
  if (!page || !product?.sku) return null;
  const { entries } = page;
  const value = (key: string) => entries[key]?.value;
  const rawSpecs = Object.fromEntries(
    Object.entries(entries).map(([key, entry]) => [LABELS[key]?.label ?? entry.label, entry.value]),
  );
  // Fil d'Ariane : Accueil, rayon, collection, montre.
  const collection = cleanText($(".breadcrumb li").slice(-2, -1).text());
  const images = $('img[src*="-large_default/"]')
    .map((_, img) => $(img).attr("src"))
    .get()
    .filter((src) => src.endsWith(`-${product.sku}.jpg`));

  return {
    brandSlug: "lip",
    url,
    reference: product.sku,
    name: page.name,
    collectionName: collection || undefined,
    imageUrls: images.length > 0 ? [...new Set(images)] : product.images,
    priceCents: product.priceCurrency === "EUR" ? toCents(product.price) : undefined,
    currency: "EUR" as const,
    availability: parseAvailability(product.availability),
    specs: {
      movement: parseMovement(value("movement")),
      caliber: value("caliber"),
      // Boîtier rond seulement : « 21.2mm x 38.5mm » n'est pas un diamètre.
      diameterMm: parseNumber(/^(\d+(?:[.,]\d+)?)\s*mm$/i.exec(value("dimensions") ?? "")?.[1]),
      lugWidthMm: parseNumber(value("lugWidth")),
      waterResistanceM: parseWaterResistance(value("water")),
      powerReserveH: parseNumber(/(\d+)\s*h/i.exec(value("powerReserve") ?? "")?.[1]),
      caseMaterial: caseMaterial(entries),
      crystal: value("crystal") && capitalize(value("crystal")!),
      dialColor: value("dial") && capitalize(value("dial")!),
      strapMaterial: value("strap") && capitalize(value("strap")!),
    },
    rawSpecs,
  };
}

export const lip: OfficialAdapter = {
  kind: "official",
  id: "lip-officiel",
  brandSlug: "lip",
  async discover() {
    const pages = await fetchSitemapPages(SITEMAP, (url) => url.endsWith("/1_fr_0_sitemap.xml"));
    return pages.filter((url) => {
      const category = PRODUCT_URL.exec(url)?.[1];
      return url.startsWith("https://lip.fr/fr/") && category && !NOT_WATCHES.has(category);
    });
  },
  parse: parseLip,
  translate: translateLip,
  // Boutique française, en euros : les versions anglaise et italienne ne sont pas des marchés.
  locales: {},
  translationLocales: { en: "lip.fr/en", it: "lip.fr/it" },
  localizeUrl: (url, locale) => url.replace(/^https:\/\/[^/]+\/[^/]+/, `https://${locale}`),
};
