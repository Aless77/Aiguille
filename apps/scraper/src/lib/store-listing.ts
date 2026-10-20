import { type CheerioAPI } from "cheerio";
import { z } from "zod";

import { jsonLdNodes } from "./jsonld.ts";
import { cleanText } from "./text.ts";

/** Boutique agréée telle que publiée par une marque (JSON-LD Store, JewelryStore…). */
export const storeListingSchema = z.object({
  name: z.string().min(1),
  street: z.string().optional(),
  postalCode: z.string().optional(),
  city: z.string().min(1),
  country: z.string().regex(/^[A-Z]{2}$/),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

export type StoreListing = z.infer<typeof storeListingSchema>;

const str = (v: unknown) => (typeof v === "string" && v.trim() ? cleanText(v) : undefined);
const num = (v: unknown) => {
  const n = typeof v === "number" ? v : typeof v === "string" ? Number(v) : NaN;
  return Number.isFinite(n) ? n : undefined;
};

/** « ZARAGOZA » → « Zaragoza » ; une ville déjà en casse mixte est laissée telle quelle. */
function cityCase(city: string): string {
  if (city !== city.toUpperCase()) return city;
  return city.toLowerCase().replace(/(^|[\s'-])\p{L}/gu, (m) => m.toUpperCase());
}

/**
 * Premier nœud JSON-LD décrivant un lieu avec adresse et coordonnées (Store, JewelryStore,
 * LocalBusiness…). Les données personnelles éventuelles (e-mail, téléphone) ne sont pas reprises.
 */
export function parseStoreListing($: CheerioAPI): StoreListing | null {
  const node = jsonLdNodes($).find(
    (n) => typeof n.address === "object" && n.address !== null && typeof n.geo === "object",
  );
  if (!node) return null;
  const address = node.address as Record<string, unknown>;
  const geo = node.geo as Record<string, unknown>;
  const city = str(address.addressLocality);
  const parsed = storeListingSchema.safeParse({
    name: str(node.name),
    street: str(address.streetAddress),
    postalCode: str(address.postalCode),
    city: city ? cityCase(city) : undefined,
    country: str(address.addressCountry)?.toUpperCase(),
    latitude: num(geo.latitude),
    longitude: num(geo.longitude),
  });
  return parsed.success ? parsed.data : null;
}
