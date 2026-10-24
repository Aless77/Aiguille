import { BRAND_INFO, movementMaker, warrantyFor } from "./brand-info.ts";
import {
  extractConstructionFacts,
  extractMovementFacts,
  extractOwnershipFacts,
  type WatchSource,
} from "./facts.ts";

export interface CoverageInput extends WatchSource {
  brandSlug: string;
  priceCents: number | null;
  imageCount: number;
}

/** Une information suivie : sur quelles montres elle s'applique, et si elle est connue. */
const CHECKS: {
  label: string;
  applies: (w: CoverageInput) => boolean;
  known: (w: CoverageInput) => boolean;
}[] = [
  { label: "Prix catalogue", applies: () => true, known: (w) => w.priceCents !== null },
  { label: "Photo", applies: () => true, known: (w) => w.imageCount > 0 },
  { label: "Type de mouvement", applies: () => true, known: (w) => w.movement !== null },
  { label: "Calibre", applies: () => true, known: (w) => Boolean(w.caliber?.trim()) },
  {
    label: "Constructeur du mouvement",
    applies: () => true,
    known: (w) => movementMaker(w.brandSlug, w.caliber) !== null,
  },
  { label: "Diamètre", applies: () => true, known: (w) => w.diameterMm !== null },
  { label: "Étanchéité", applies: () => true, known: (w) => w.waterResistanceM !== null },
  { label: "Verre", applies: () => true, known: (w) => Boolean(w.crystal?.trim()) },
  {
    label: "Matière du boîtier",
    applies: () => true,
    known: (w) => Boolean(w.caseMaterial?.trim()),
  },
  {
    label: "Réserve de marche (mécaniques)",
    applies: (w) => w.movement === "automatique" || w.movement === "manuel",
    known: (w) => w.powerReserveH !== null,
  },
  {
    label: "Fréquence (mécaniques)",
    applies: (w) => w.movement === "automatique" || w.movement === "manuel",
    known: (w) => extractMovementFacts(w).frequencyVph !== null,
  },
  {
    label: "Référence de pile (quartz)",
    applies: (w) => w.movement === "quartz",
    known: (w) => extractOwnershipFacts(w).battery !== null,
  },
  {
    label: "Garantie",
    applies: () => true,
    known: (w) => warrantyFor(w.brandSlug, extractOwnershipFacts(w).warrantyMonths) !== null,
  },
  {
    label: "Pays de fabrication",
    applies: () => true,
    known: (w) => extractOwnershipFacts(w).madeIn !== null,
  },
  {
    label: "Bracelet (boucle, interchangeabilité)",
    applies: () => true,
    known: (w) => {
      const o = extractOwnershipFacts(w);
      return (
        o.deployantClasp ||
        o.interchangeableStrap ||
        /boucle/i.test(Object.keys(w.rawSpecs).join(" "))
      );
    },
  },
  {
    label: "Fond et couronne",
    applies: () => true,
    known: (w) => {
      const c = extractConstructionFacts(w);
      return (
        c.exhibitionCaseback ||
        c.screwDownCrown ||
        /fond|couronne/i.test(Object.keys(w.rawSpecs).join(" "))
      );
    },
  },
];

export interface CoverageRow {
  label: string;
  /** Part des montres concernées pour lesquelles l'information est connue (0 à 100), par marque. */
  byBrand: Record<string, { known: number; applicable: number }>;
}

/** Couverture de chaque information, marque par marque (npm run db:couverture). */
export function coverage(watches: CoverageInput[]): CoverageRow[] {
  const brands = [...new Set(watches.map((w) => w.brandSlug))].sort();
  return CHECKS.map((check) => ({
    label: check.label,
    byBrand: Object.fromEntries(
      brands.map((b) => {
        const applicable = watches.filter((w) => w.brandSlug === b && check.applies(w));
        return [b, { known: applicable.filter(check.known).length, applicable: applicable.length }];
      }),
    ),
  }));
}

/** Informations de marque (brand-info.ts) encore à sourcer. */
export function missingBrandInfo(brandSlugs: string[]): string[] {
  return brandSlugs.flatMap((b) => {
    const info = BRAND_INFO[b];
    if (!info) return [`${b} : aucune entrée dans brand-info.ts`];
    return [
      ...(info.warranty ? [] : [`${b} : garantie de la marque non sourcée`]),
      ...(info.movementMakers.length ? [] : [`${b} : aucun fabricant de mouvement sourcé`]),
    ];
  });
}
