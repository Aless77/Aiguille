import { z } from "zod";

/** Marques suivies, telles que nommées par les revendeurs (« HAMILTON », « Tissot »…). */
const BRAND_SLUGS: Record<string, string> = {
  tissot: "tissot",
  hamilton: "hamilton",
  "hamilton watch": "hamilton",
  longines: "longines",
};

/** Nom de marque d'un revendeur → slug de notre catalogue, ou `undefined` si non suivie. */
export function brandSlugFromName(name: string | undefined): string | undefined {
  return name ? BRAND_SLUGS[name.trim().toLowerCase()] : undefined;
}

/** Offre d'un revendeur pour une référence, validée avant rapprochement avec le catalogue. */
export const offerSchema = z.object({
  brandSlug: z.string().min(1),
  reference: z.string().min(5),
  /** Code EAN-13 : conservé pour contrôle, la référence reste la clé de rapprochement. */
  gtin: z
    .string()
    .regex(/^\d{13}$/)
    .optional(),
  url: z.url(),
  priceCents: z.number().int().positive().optional(),
  currency: z.literal("EUR"),
  availability: z.enum(["in_stock", "out_of_stock", "preorder", "unknown"]),
});

export type Offer = z.infer<typeof offerSchema>;
