import { type WatchTranslationData } from "@aiguille/db/translations";
import { type CheerioAPI } from "cheerio";

import { findProduct, parseAvailability } from "../lib/jsonld.ts";
import { fetchRobots } from "../lib/robots.ts";
import { fetchSitemapPages } from "../lib/sitemap.ts";
import { parseMovement, parseWaterResistance } from "../lib/specs.ts";
import { cleanText, parseNumber, toCents } from "../lib/text.ts";
import { type OfficialAdapter } from "./types.ts";

const PRODUCT_URL =
  /^https:\/\/(?:[a-z]{2}\.)?citizenwatch\.eu\/(fr|en|de|nl)\/p\/([a-z]{2}\d{4}-\d{2}[a-z]{1,2})\/$/i;

/** Les suffixes des classes Citizen sont identiques dans les versions nationales. */
function attributes($: CheerioAPI) {
  const entries: Record<string, { label: string; value: string }> = {};
  $(".c-attribute-table__item").each((_, element) => {
    const sourceKey = /\bc-attribute-table__item--([\w-]+)/
      .exec($(element).attr("class") ?? "")?.[1]
      ?.replace(/_/g, "-");
    const aliases: Record<string, string> = {
      glas: "glass",
      "diameter-mm": "diameter",
      "height-in-mm": "height",
      "length-in-mm": "length",
      "width-in-mm": "width",
    };
    const key = sourceKey ? (aliases[sourceKey] ?? sourceKey) : undefined;
    const label = cleanText($(element).find(".c-attribute-table__attribute").text())
      .replace(/:$/, "")
      .trim();
    const value = cleanText($(element).find(".c-attribute-table__value").text());
    if (key && label && value && key !== "downloads") entries[key] = { label, value };
  });
  return entries;
}

export function translateCitizen($: CheerioAPI, url: string): WatchTranslationData | null {
  const match = PRODUCT_URL.exec(url);
  const product = findProduct($);
  const entries = attributes($);
  if (
    !match ||
    !product?.sku ||
    product.sku.toLowerCase() !== match[2]!.toLowerCase() ||
    (!entries.movement && !entries["caliber-type"])
  )
    return null;
  return {
    name: cleanText($("h1").first().text()) || product.name || null,
    specs: entries,
    fields: {
      dialColor: entries["dial-colour"]?.value,
      caseMaterial: entries["case-material"]?.value,
      strapMaterial: entries["bracelet-material"]?.value,
      crystal: entries.glass?.value,
    },
  };
}

export function parseCitizen($: CheerioAPI, url: string) {
  const translated = translateCitizen($, url);
  const product = findProduct($);
  if (!translated || !product?.sku || product.priceCurrency !== "EUR") return null;
  const entries = translated.specs;
  const value = (key: string) => entries[key]?.value;
  const name = translated.name ?? product.sku;
  const collectionName = /\b(TSUYOSA|Promaster|Series 8|Citizen L|The Citizen)\b/i.exec(name)?.[1];
  const movementText = value("movement") ?? value("caliber-type");
  // « Mécanique » seul ne prouve pas un remontage manuel chez Citizen.
  const movement = /eco-drive|solaire|solar/i.test(value("caliber-features") ?? "")
    ? "solaire"
    : !value("movement") && /^m[ée]canique$/i.test(movementText ?? "")
      ? "autre"
      : parseMovement(movementText);
  const positive = (key: string, maximum: number) => {
    const n = parseNumber(value(key));
    return n && n > 0 && n <= maximum ? n : undefined;
  };
  const reserve = value("power-reserve");
  const rawSpecs = Object.fromEntries(
    Object.values(entries).map(({ label, value }) => [label, value]),
  );
  // Les liens du sélecteur sont une preuve de déclinaison, contrairement à un préfixe supposé.
  const variants = $(".c-variation__items--model a[href]")
    .map((_, e) => {
      const target = new URL($(e).attr("href")!, url).href;
      return PRODUCT_URL.exec(target)?.[2]?.toUpperCase();
    })
    .get()
    .filter(Boolean);
  if (variants.length) rawSpecs["Références des déclinaisons"] = [...new Set(variants)].join(" | ");
  return {
    brandSlug: "citizen",
    url,
    reference: product.sku.toUpperCase(),
    name,
    collectionName,
    imageUrls: product.images,
    priceCents: toCents(product.price),
    currency: "EUR" as const,
    availability: parseAvailability(product.availability),
    specs: {
      movement,
      caliber: value("caliber"),
      diameterMm: positive("diameter", 70),
      thicknessMm: positive("height", 30),
      lugWidthMm: positive("strap-lug-width", 40),
      waterResistanceM: parseWaterResistance(value("water-resistant")),
      // Autonomie solaire conservée avec son unité dans rawSpecs ; jamais « 180 h » pour 180 jours.
      powerReserveH:
        movement !== "solaire" && reserve && /heures?|hours?|\bh\b/i.test(reserve)
          ? parseNumber(reserve)
          : undefined,
      caseMaterial: value("case-material"),
      crystal: value("glass"),
      dialColor: value("dial-colour"),
      strapMaterial: value("bracelet-material"),
    },
    rawSpecs,
  };
}

export const citizen: OfficialAdapter = {
  kind: "official",
  id: "citizen-officiel",
  brandSlug: "citizen",
  async discover() {
    const sitemap =
      "https://fr.citizenwatch.eu/media/sitemap/sitemap-products-fr.citizenwatch.eu.xml";
    const robots = await fetchRobots(sitemap);
    if (!robots.isAllowed(sitemap)) throw new Error("Sitemap Citizen interdit par robots.txt");
    const pages = await fetchSitemapPages(sitemap);
    return pages.filter(
      (url) => url.startsWith("https://fr.citizenwatch.eu/fr/p/") && PRODUCT_URL.test(url),
    );
  },
  parse: parseCitizen,
  translate: translateCitizen,
  locales: { FR: "fr.citizenwatch.eu/fr", DE: "de.citizenwatch.eu/de" },
  translationLocales: { en: "citizenwatch.eu/en", de: "fr.citizenwatch.eu/de" },
  localizeUrl: (url, locale) => url.replace(/^https:\/\/[^/]+\/[^/]+/, `https://${locale}`),
};
