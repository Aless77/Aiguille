import { BRAND_INFO, movementMaker, warrantyFor } from "./brand-info.ts";
import {
  extractConstructionFacts,
  extractMovementFacts,
  extractOwnershipFacts,
  type WatchSource,
} from "./facts.ts";
import { buildSpecSheet, type SheetInput } from "./spec-sheet.ts";

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
    known: (w) =>
      warrantyFor(w.brandSlug, extractOwnershipFacts(w).warrantyMonths, w.movement) !== null,
  },
  {
    label: "Pays de fabrication",
    applies: () => true,
    known: (w) =>
      extractOwnershipFacts(w).madeIn !== null || Boolean(BRAND_INFO[w.brandSlug]?.madeIn),
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
/** Informations de marque (brand-info.ts) encore à sourcer, ou vérifiées il y a plus de 6 mois. */
export function missingBrandInfo(brandSlugs: string[], today = new Date()): string[] {
  const stale = (checkedAt: string) =>
    today.getTime() - new Date(checkedAt).getTime() > 183 * 86_400_000;
  return brandSlugs.flatMap((b) => {
    const info = BRAND_INFO[b];
    if (!info) return [`${b} : aucune entrée dans brand-info.ts`];
    const sourced = [
      info.warranty,
      info.service,
      info.madeIn,
      info.care,
      info.group,
      ...info.movementMakers,
    ].filter((e): e is NonNullable<typeof e> => e !== null);
    return [
      ...(info.warranty ? [] : [`${b} : garantie de la marque non sourcée`]),
      ...(info.service ? [] : [`${b} : tarifs de révision non sourcés`]),
      ...(info.care
        ? []
        : [`${b} : conseils d'utilisation non sourcés (conseils généraux affichés)`]),
      ...(info.movementMakers.length ? [] : [`${b} : aucun fabricant de mouvement sourcé`]),
      ...sourced
        .filter((e) => stale(e.checkedAt))
        .map((e) => `${b} : à revérifier (${e.source}, vérifié le ${e.checkedAt})`),
    ];
  });
}

/**
 * Remplissage de la fiche technique commune, ligne par ligne et par marque. Les rubriques propres
 * à certaines montres (historique des pièces vintage) ne comptent que pour elles.
 */
export function sheetCoverage(watches: (SheetInput & { brandSlug: string })[]): CoverageRow[] {
  const rows = new Map<string, CoverageRow>();
  for (const w of watches) {
    for (const group of buildSpecSheet(w).groups) {
      for (const r of group.rows) {
        const label = `${group.title} › ${r.label}`;
        const row = rows.get(label) ?? { label, byBrand: {} };
        const cell = (row.byBrand[w.brandSlug] ??= { known: 0, applicable: 0 });
        cell.applicable++;
        if (r.value !== null) cell.known++;
        rows.set(label, row);
      }
    }
  }
  return [...rows.values()];
}
