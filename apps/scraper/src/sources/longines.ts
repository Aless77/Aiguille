import { type WatchTranslationData } from "@aiguille/db/translations";
import { type CheerioAPI } from "cheerio";

import { findProduct, parseAvailability } from "../lib/jsonld.ts";
import { fetchSitemapPages } from "../lib/sitemap.ts";
import { parseMovement, parseWaterResistance } from "../lib/specs.ts";
import { cleanText, parseNumber, titleCase, toCents } from "../lib/text.ts";
import { type OfficialAdapter } from "./types.ts";

/** Fiches montres françaises ; les bracelets et accessoires ont un autre préfixe que « watch- ». */
const PRODUCT_URL = /^https:\/\/www\.longines\.com\/fr\/p\/watch-[a-z0-9-]+$/;

interface AttributeMeta {
  attribute_code: string;
  attribute_label: string;
  attribute_options?: { label: string; value: string }[] | null;
}

type ProductItem = Record<string, unknown> & {
  name?: string;
  preferred_category?: { name?: string } | null;
};

/** Fiche montre dans n'importe quelle langue du site (/fr/p/…, /de/p/…, /en-gb/p/…). */
const ANY_PRODUCT_URL =
  /^https:\/\/www\.longines\.com\/([a-z]{2})(?:-[a-z]{2})?\/p\/watch-[a-z0-9-]+$/;

const GROUP_PREFIXES = ["case_", "dial_", "mvt_fct_", "bracelet_", "general_"] as const;

/**
 * Groupe affiché devant le libellé (« Boîtier · Matière » ≠ « Bracelet · Matière »), par langue.
 * Le français produit exactement les libellés de rawSpecs.
 */
const GROUP_LABELS: Record<string, string[]> = {
  fr: ["Boîtier", "Cadran", "Mouvement", "Bracelet", "Général"],
  en: ["Case", "Dial", "Movement", "Strap", "General"],
  de: ["Gehäuse", "Zifferblatt", "Uhrwerk", "Armband", "Allgemein"],
  it: ["Cassa", "Quadrante", "Movimento", "Cinturino", "Generale"],
  es: ["Caja", "Esfera", "Movimiento", "Correa", "General"],
};

/** Attributs techniques ou d'affichage sans intérêt pour la fiche. */
const IGNORED = new Set(["bracelet_label", "watch_collection", "live_appointment", "name"]);

/**
 * Le site Longines (Next.js + Magento) publie dans __NEXT_DATA__ les données produit et la table
 * qui traduit les codes d'attributs (« mvt_fct_type = 110 ») en libellés (« Quartz »).
 */
function readNextData($: CheerioAPI) {
  try {
    const data = JSON.parse($("#__NEXT_DATA__").text());
    const fallback: Record<string, unknown> = data?.props?.pageProps?.fallback ?? {};
    // Clés « @"Type","fr",… » : la langue est celle de la page, quelle qu'elle soit.
    const entry = (type: string) =>
      Object.entries(fallback).find(([key]) => key.startsWith(`@"${type}",`))?.[1] as
        Record<string, unknown> | undefined;
    const firstItem = (type: string) =>
      ((entry(type)?.products as { items?: ProductItem[] } | undefined)?.items?.[0] ??
        {}) as ProductItem;

    const attributes = (
      (entry("ProductAttributes")?.attributeMetadata as { items?: AttributeMeta[] } | undefined)
        ?.items ?? []
    ).filter((a) => a?.attribute_code);

    return {
      item: { ...firstItem("ProductPageDocument"), ...firstItem("ProductPageAdditionalDocument") },
      attributes: new Map(attributes.map((a) => [a.attribute_code, a])),
    };
  } catch {
    return null;
  }
}

/** Valeur lisible d'un attribut : options résolues (listes séparées par des virgules), sinon texte. */
function resolve(meta: AttributeMeta, raw: unknown): string | undefined {
  if (raw === null || raw === undefined || raw === "") return undefined;
  const options = meta.attribute_options ?? [];
  const value = options.length
    ? String(raw)
        .split(",")
        .map((code) => options.find((o) => o.value === code.trim())?.label ?? "")
        .filter(Boolean)
        .join(", ")
    : String(raw);
  const text = cleanText(value);
  return text && text !== "0" ? text : undefined;
}

/** Attributs lisibles de la fiche : valeurs par code, et libellés groupés dans la langue. */
function readAttributes(next: NonNullable<ReturnType<typeof readNextData>>, language: string) {
  const groups = GROUP_LABELS[language] ?? GROUP_LABELS.en!;
  const values: Record<string, string> = {};
  const entries: { code: string; label: string; value: string }[] = [];
  for (const [code, raw] of Object.entries(next.item)) {
    const meta = next.attributes.get(code);
    if (!meta || IGNORED.has(code)) continue;
    const value = resolve(meta, raw);
    if (!value) continue;
    values[code] = value;
    const group = groups[GROUP_PREFIXES.findIndex((prefix) => code.startsWith(prefix))];
    const label = cleanText(meta.attribute_label);
    entries.push({ code, label: group ? `${group} · ${label}` : label, value });
  }
  return { values, entries };
}

/** Nom affiché : toutes les montres d'une collection portent le même nom, on ajoute le diamètre. */
function watchName(base: string, diameterMm: number | undefined): string {
  const name = titleCase(base);
  return diameterMm ? `${name} ${diameterMm} mm` : name;
}

/**
 * Même fiche dans une autre langue (versions nationales relevées pour les prix, et la française
 * qui sert de pivot) : valeurs rangées par code d'attribut, identique dans toutes les langues.
 */
export function translateLongines($: CheerioAPI, url: string): WatchTranslationData | null {
  const language = ANY_PRODUCT_URL.exec(url)?.[1];
  const next = readNextData($);
  if (!language || !next) return null;
  const { values, entries } = readAttributes(next, language);
  if (!values.mvt_fct_type) return null;
  return {
    name: next.item.name ? watchName(next.item.name, parseNumber(values.case_dimension)) : null,
    specs: Object.fromEntries(entries.map((e) => [e.code, { label: e.label, value: e.value }])),
    fields: {
      dialColor: values.dial_color,
      caseMaterial: values.case_material,
      strapMaterial: values.bracelet_material,
      crystal: values.case_glass,
    },
  };
}

export function parseLongines($: CheerioAPI, url: string) {
  if (!PRODUCT_URL.test(url)) return null;
  const product = findProduct($);
  const next = readNextData($);
  if (!product?.sku || !next) return null;

  const { item } = next;
  const { values, entries } = readAttributes(next, "fr");
  const rawSpecs: Record<string, string> = Object.fromEntries(
    entries.map((e) => [e.label, e.value]),
  );

  // Garantie affichée sous la disponibilité (« Garantie LONGINES de 5 ans ») : propre à la montre
  // (24 mois en général, 5 ans pour les automatiques selon les conditions de la marque).
  const warranty = /Garantie LONGINES de (\d+) ans/i.exec($("body").text());
  if (warranty) rawSpecs["Garantie"] = `Garantie Longines de ${warranty[1]} ans`;

  // Une montre a toujours un type de mouvement (filtre bracelets et accessoires).
  if (!values.mvt_fct_type) return null;

  const diameterMm = parseNumber(values.case_dimension);
  const collectionName = item.preferred_category?.name
    ? titleCase(item.preferred_category.name)
    : undefined;
  const powerReserve = values.mvt_fct_calibre?.match(/(\d+)\s*heures/i)?.[1];

  return {
    brandSlug: "longines",
    url,
    reference: product.sku.toUpperCase(),
    name: watchName(item.name ?? product.name ?? product.sku, diameterMm),
    collectionName,
    description: product.description,
    imageUrls: product.images,
    priceCents: toCents(product.price),
    currency: "EUR" as const,
    availability: parseAvailability(product.availability),
    specs: {
      movement: parseMovement(values.mvt_fct_type),
      caliber: values.mvt_fct_calibre_name,
      diameterMm,
      thicknessMm: parseNumber(values.case_thickness),
      lugWidthMm: parseNumber(values.case_lug_distance),
      waterResistanceM: parseWaterResistance(values.case_water_resistance),
      powerReserveH: powerReserve ? Number(powerReserve) : undefined,
      caseMaterial: values.case_material,
      crystal: values.case_glass,
      dialColor: values.dial_color,
      strapMaterial: values.bracelet_material,
    },
    rawSpecs,
  };
}

export const longines: OfficialAdapter = {
  kind: "official",
  id: "longines-officiel",
  brandSlug: "longines",
  async discover() {
    const pages = await fetchSitemapPages("https://www.longines.com/fr/sitemap/products.xml");
    return pages.filter((url) => PRODUCT_URL.test(url));
  },
  parse: parseLongines,
  translate: translateLongines,
  // Pas de version irlandaise (renvoi vers le site britannique en livres) : pays non relevé.
  locales: {
    FR: "fr",
    DE: "de",
    IT: "it",
    ES: "es",
    NL: "nl",
    BE: "fr-be",
    AT: "de-at",
    PT: "pt",
    CH: "fr-ch",
    GB: "en-gb",
    SE: "en-se",
    DK: "en-dk",
    PL: "pl",
  },
  localizeUrl: (url, locale) => url.replace("/fr/p/", `/${locale}/p/`),
  // Sitemap mondial (~4 000 boutiques) : les pays non couverts sont écartés à la lecture.
  stores: {
    id: "longines-boutiques",
    async discover() {
      const pages = await fetchSitemapPages("https://www.longines.com/fr/sitemap/stores.xml");
      return pages.filter((url) => /\/fr\/store\/id\/[a-z0-9-]+$/.test(url));
    },
  },
};
