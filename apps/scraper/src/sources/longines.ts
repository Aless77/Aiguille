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

/** Groupe affiché devant le libellé dans rawSpecs (« Boîtier · Matière » ≠ « Bracelet · Matière »). */
const GROUPS: [prefix: string, label: string][] = [
  ["case_", "Boîtier"],
  ["dial_", "Cadran"],
  ["mvt_fct_", "Mouvement"],
  ["bracelet_", "Bracelet"],
  ["general_", "Général"],
];

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
    const entry = (type: string) =>
      Object.entries(fallback).find(([key]) => key.startsWith(`@"${type}","fr"`))?.[1] as
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

export function parseLongines($: CheerioAPI, url: string) {
  if (!PRODUCT_URL.test(url)) return null;
  const product = findProduct($);
  const next = readNextData($);
  if (!product?.sku || !next) return null;

  const { item, attributes } = next;
  const values: Record<string, string> = {};
  const rawSpecs: Record<string, string> = {};
  for (const [code, raw] of Object.entries(item)) {
    const meta = attributes.get(code);
    if (!meta || IGNORED.has(code)) continue;
    const value = resolve(meta, raw);
    if (!value) continue;
    values[code] = value;
    const group = GROUPS.find(([prefix]) => code.startsWith(prefix))?.[1];
    rawSpecs[
      group ? `${group} · ${cleanText(meta.attribute_label)}` : cleanText(meta.attribute_label)
    ] = value;
  }

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
  // Toutes les montres d'une collection portent le même nom : on ajoute le diamètre.
  const baseName = titleCase(item.name ?? product.name ?? product.sku);
  const powerReserve = values.mvt_fct_calibre?.match(/(\d+)\s*heures/i)?.[1];

  return {
    brandSlug: "longines",
    url,
    reference: product.sku.toUpperCase(),
    name: diameterMm ? `${baseName} ${diameterMm} mm` : baseName,
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
