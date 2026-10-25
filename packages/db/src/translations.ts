import { z } from "zod";

/**
 * Fiches des marques dans d'autres langues (docs/decisions.md, 25 octobre 2026). Les marques
 * publient leurs fiches en plusieurs langues ; on garde les valeurs de chaque version, rangées
 * par une clé stable propre à la marque (code d'attribut Longines…), identique d'une langue à
 * l'autre. La version française sert de pivot : elle relie chaque libellé de `rawSpecs` à sa clé.
 */
export const translationSchema = z.object({
  /** Nom de la montre dans cette langue. */
  name: z.string().min(1).nullable(),
  /** Caractéristiques par clé stable : libellé et valeur dans cette langue. */
  specs: z.record(z.string(), z.object({ label: z.string().min(1), value: z.string().min(1) })),
  /** Champs normalisés traduits (les nombres, eux, ne changent pas). */
  fields: z.object({
    dialColor: z.string().optional(),
    caseMaterial: z.string().optional(),
    strapMaterial: z.string().optional(),
    crystal: z.string().optional(),
  }),
});

export type WatchTranslationData = z.infer<typeof translationSchema>;

/** Langue des versions nationales relevées pour les prix (lot 4) : un pays, une langue. */
export const COUNTRY_LANGUAGES: Partial<Record<string, string>> = {
  DE: "de",
  IT: "it",
  ES: "es",
  GB: "en",
};

export interface TranslatableWatch {
  name: string;
  rawSpecs: Record<string, string>;
  dialColor: string | null;
  caseMaterial: string | null;
  strapMaterial: string | null;
  crystal: string | null;
}

export type TranslationStatus =
  /** Version publiée par la marque dans la langue demandée. */
  | "native"
  /** Langue demandée absente : version anglaise de la marque. */
  | "english"
  /** Aucune version traduite : informations telles que publiées en français. */
  | "source";

export interface TranslatedWatch<T extends TranslatableWatch> {
  watch: T;
  status: TranslationStatus;
  /** Libellé français de `rawSpecs` → libellé publié dans la langue affichée. */
  labels: Record<string, string>;
}

/**
 * Applique la version d'une langue à la fiche : valeurs de `rawSpecs` (gardées sous leurs
 * libellés français, lus par la fiche technique), nom et champs normalisés. Sans version dans
 * la langue, l'anglais sert de repli ; sans anglais, la fiche reste en français.
 */
export function translateWatch<T extends TranslatableWatch>(
  w: T,
  locale: string,
  versions: Partial<Record<string, WatchTranslationData>>,
): TranslatedWatch<T> {
  if (locale === "fr") return { watch: w, status: "native", labels: {} };
  const pivot = versions.fr;
  const own = versions[locale];
  const target = own ?? versions.en;
  if (!target || !pivot) return { watch: w, status: "source", labels: {} };

  const rawSpecs = { ...w.rawSpecs };
  const labels: Record<string, string> = {};
  for (const [key, french] of Object.entries(pivot.specs)) {
    const local = target.specs[key];
    if (!local || !(french.label in rawSpecs)) continue;
    rawSpecs[french.label] = local.value;
    labels[french.label] = local.label;
  }
  return {
    watch: {
      ...w,
      name: target.name ?? w.name,
      rawSpecs,
      dialColor: target.fields.dialColor ?? w.dialColor,
      caseMaterial: target.fields.caseMaterial ?? w.caseMaterial,
      strapMaterial: target.fields.strapMaterial ?? w.strapMaterial,
      crystal: target.fields.crystal ?? w.crystal,
    },
    status: own ? "native" : "english",
    labels,
  };
}
