import { z } from "zod";

/**
 * Fiche montre telle qu'extraite d'une source, validée avant tout enregistrement.
 * Une source qui change sa structure produit des fiches invalides : elles sont rejetées et
 * comptées en erreur au lieu de polluer la base.
 */
export const listingSchema = z.object({
  brandSlug: z.string().min(1),
  url: z.url(),
  reference: z.string().min(3),
  name: z.string().min(1),
  collectionName: z.string().min(1).optional(),
  description: z.string().optional(),
  imageUrls: z.array(z.url()).default([]),
  priceCents: z.number().int().positive().optional(),
  currency: z.literal("EUR"),
  availability: z.enum(["in_stock", "out_of_stock", "preorder", "unknown"]),
  specs: z.object({
    movement: z.enum(["automatique", "manuel", "quartz", "solaire", "autre"]).optional(),
    caliber: z.string().optional(),
    diameterMm: z.number().positive().max(70).optional(),
    thicknessMm: z.number().positive().max(30).optional(),
    lugWidthMm: z.number().positive().max(40).optional(),
    waterResistanceM: z.number().int().positive().max(12000).optional(),
    powerReserveH: z.number().int().positive().max(2000).optional(),
    caseMaterial: z.string().optional(),
    crystal: z.string().optional(),
    dialColor: z.string().optional(),
    strapMaterial: z.string().optional(),
  }),
  rawSpecs: z.record(z.string(), z.string()),
});

export type Listing = z.infer<typeof listingSchema>;
