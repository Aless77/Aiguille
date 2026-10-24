import { warrantyFor } from "@aiguille/db/brand-info";
import {
  COMPLICATIONS,
  extractConstructionFacts,
  extractMovementFacts,
  extractOwnershipFacts,
  type WatchSource,
} from "@aiguille/db/facts";

import {
  type CatalogFilter,
  type FacetOption,
  type TechnicalFilterKey,
  TECHNICAL_FILTER_KEYS,
} from "./types";

export interface FilterSource extends WatchSource {
  id: number;
  brandSlug: string;
  brandName: string;
  collectionSlug: string;
  strapMaterial: string | null;
  dialColor: string | null;
}
export interface FilterFacts {
  id: number;
  options: Record<TechnicalFilterKey, { value: string; label: string }[]>;
  warrantyMonths: number | null;
}

const choice = (value: string | null, label = value) => (value && label ? [{ value, label }] : []);
const clean = (value: string | null) => value?.normalize("NFC").trim().replace(/\s+/g, " ") || null;

/** Regroupements conservateurs : une coiffe ou un PVD or sur acier ne devient pas un boîtier en or. */
export function materialCategory(value: string | null): string | null {
  const text = clean(value);
  if (!text) return null;
  if (/acier|steel/i.test(text)) return "Acier";
  if (/titane|titanium/i.test(text)) return "Titane";
  if (/cuir|leather|alligator|veau|vachette|croco/i.test(text)) return "Cuir";
  if (/caoutchouc|rubber|silicone/i.test(text)) return "Caoutchouc / silicone";
  if (/textile|tissu|nylon|nato|satin|polyester/i.test(text)) return "Textile";
  if (/c[ée]ramique|ceramic/i.test(text)) return "Céramique";
  if (/^or\b|^gold\b/i.test(text)) return "Or";
  if (/bronze/i.test(text)) return "Bronze";
  if (/platine|platinum/i.test(text)) return "Platine";
  return text;
}

export function colorCategory(value: string | null): string | null {
  const text = clean(value);
  if (!text) return null;
  const colors: [RegExp, string][] = [
    [/nacre|mother.of.pearl/i, "Nacre"],
    [/noir|black/i, "Noir"],
    [/bleu|blue/i, "Bleu"],
    [/vert|green/i, "Vert"],
    [/blanc|white/i, "Blanc"],
    [/argent|silver/i, "Argenté"],
    [/gris|grey|gray/i, "Gris"],
    [/rose|pink/i, "Rose"],
    [/rouge|red/i, "Rouge"],
    [/brun|marron|brown/i, "Brun"],
    [/beige|cr[eè]me|cream/i, "Beige / crème"],
    [/dor[ée]|champagne|gold/i, "Doré / champagne"],
    [/orange/i, "Orange"],
    [/jaune|yellow/i, "Jaune"],
  ];
  return colors.find(([pattern]) => pattern.test(text))?.[1] ?? text;
}

export function filterFacts(w: FilterSource): FilterFacts {
  const m = extractMovementFacts(w);
  const c = extractConstructionFacts(w);
  const o = extractOwnershipFacts(w);
  const crystal = /saphir|sapphire/i.test(w.crystal ?? "")
    ? "Saphir"
    : /min[eé]ral/i.test(w.crystal ?? "")
      ? "Minéral"
      : /hesalite|h[ée]salite|plexi|acry/i.test(w.crystal ?? "")
        ? "Acrylique / hésalite"
        : clean(w.crystal);
  const equipment: [string, string, boolean][] = [
    ["cosc", "Chronomètre certifié COSC", m.chronometer],
    ["antimagnetique", "Résistance magnétique annoncée", m.antimagnetic],
    ["silicium", "Spiral en silicium", m.siliconHairspring],
    ["antireflet", "Traitement antireflet", c.antiReflective],
    ["couronne-vissee", "Couronne vissée", c.screwDownCrown],
    ["fond-transparent", "Fond transparent", c.exhibitionCaseback],
    ["luminescence", "Luminescence", c.luminescent],
    ["lunette-ceramique", "Lunette en céramique", c.ceramicBezel],
    ["bracelet-interchangeable", "Bracelet interchangeable sans outil", o.interchangeableStrap],
    ["boucle-deployante", "Boucle déployante", o.deployantClasp],
    ["diamants", "Diamants mentionnés", c.gemSet],
  ];
  return {
    id: w.id,
    options: {
      collection: choice(
        `${w.brandSlug}/${w.collectionSlug}`,
        `${w.brandName} · ${w.collectionName ?? "Autres modèles"}`,
      ),
      boitier: choice(materialCategory(w.caseMaterial)),
      bracelet: choice(materialCategory(w.strapMaterial)),
      couleur: choice(colorCategory(w.dialColor)),
      verre: choice(crystal),
      calibre: choice(clean(w.caliber)),
      fonction: m.complications.map((value) => ({ value, label: COMPLICATIONS[value] })),
      equipement: equipment
        .filter(([, , known]) => known)
        .map(([value, label]) => ({ value, label })),
    },
    warrantyMonths:
      warrantyFor(w.brandSlug, o.warrantyMonths, m.type, {
        chronometer: m.chronometer,
        lightmaster: /lightmaster/i.test(`${w.name} ${JSON.stringify(w.rawSpecs)}`),
        vintage:
          o.vintageYear !== null ||
          ["Numéro de série", "Date de vente", "Condition", "Documents"].some((key) =>
            Boolean(w.rawSpecs[key]),
          ),
      })?.months ?? null,
  };
}

/** OU dans chaque famille de choix ; ET entre les familles. Inconnu ne vaut jamais « oui ». */
export function matchesTechnical(facts: FilterFacts, filter: CatalogFilter): boolean {
  return (
    TECHNICAL_FILTER_KEYS.every((key) => {
      const selected = filter.technical?.[key] ?? [];
      if (!selected.length) return true;
      const available = facts.options[key].map((option) => option.value);
      return key === "fonction" || key === "equipement"
        ? selected.every((value) => available.includes(value))
        : selected.some((value) => available.includes(value));
    }) &&
    (filter.warrantyMin == null ||
      (facts.warrantyMonths !== null && facts.warrantyMonths >= filter.warrantyMin))
  );
}

export function technicalFacets(rows: FilterFacts[]): Record<TechnicalFilterKey, FacetOption[]> {
  return Object.fromEntries(
    TECHNICAL_FILTER_KEYS.map((key) => {
      const counts = new Map<string, FacetOption>();
      for (const row of rows)
        for (const option of row.options[key]) {
          const current = counts.get(option.value);
          if (current) current.count++;
          else counts.set(option.value, { ...option, count: 1 });
        }
      return [key, [...counts.values()].sort((a, b) => a.label.localeCompare(b.label, "fr"))];
    }),
  ) as Record<TechnicalFilterKey, FacetOption[]>;
}
