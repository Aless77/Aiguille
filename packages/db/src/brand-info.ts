/**
 * Informations de marque que les fiches produit ne donnent pas : garantie, groupe, fabricant des
 * mouvements. Chaque valeur est **sourcée et datée** ; sans vérification, elle reste null et le
 * site affiche « non communiqué ». À compléter pour chaque nouvelle marque
 * (docs/integrer-une-marque.md). Ne jamais remplir de mémoire.
 */

export interface Sourced<T> {
  value: T;
  /** Page publique qui l'établit. */
  source: string;
  /** Date de la dernière vérification (AAAA-MM-JJ). */
  checkedAt: string;
}

export interface WarrantyPolicy {
  /** Garantie internationale standard, en mois. */
  months: number;
  /** Durées plus longues pour certains modèles, telles que la marque les décrit. */
  extended: { months: number; when: string }[];
}

export interface BrandInfo {
  warranty: Sourced<WarrantyPolicy> | null;
  /** Groupe horloger propriétaire de la marque. */
  group: Sourced<string> | null;
  /**
   * Fabricant des mouvements par motif de calibre (le premier qui correspond). Un calibre sans
   * règle sourcée reste « constructeur non communiqué ».
   */
  movementMakers: (Sourced<string> & { caliber: RegExp })[];
}

export const BRAND_INFO: Record<string, BrandInfo> = {
  tissot: {
    warranty: {
      value: {
        months: 24,
        extended: [{ months: 36, when: "Lightmaster Solar et chronomètres certifiés COSC" }],
      },
      source: "https://www.tissotwatches.com/fr-fr/conditions-of-sale-202606.html",
      checkedAt: "2026-10-24",
    },
    group: null,
    movementMakers: [],
  },
  // Sites indisponibles lors de l'audit du 24 octobre 2026 (Longines en maintenance, Hamilton
  // filtré) : garantie et fabricant à vérifier sur leurs conditions de garantie.
  hamilton: {
    warranty: null,
    group: null,
    // La fiche officielle nomme ETA dans le calibre (« ETA F05.105 mh2 »).
    movementMakers: [
      {
        caliber: /^ETA\b/i,
        value: "ETA",
        source: "https://www.hamiltonwatch.com/fr-fr/ (fiche produit, champ Calibre)",
        checkedAt: "2026-10-24",
      },
    ],
  },
  longines: { warranty: null, group: null, movementMakers: [] },
};

/** Garantie applicable à une montre : celle de sa fiche, sinon la règle sourcée de la marque. */
export function warrantyFor(
  brandSlug: string,
  fromProductPage: number | null,
): { months: number; source: string; extended: WarrantyPolicy["extended"] } | null {
  const policy = BRAND_INFO[brandSlug]?.warranty;
  if (fromProductPage !== null) {
    return {
      months: fromProductPage,
      source: "Fiche officielle de la montre",
      extended: [],
    };
  }
  return policy
    ? { months: policy.value.months, source: policy.source, extended: policy.value.extended }
    : null;
}

/** Fabricant du mouvement, si une règle sourcée existe pour ce calibre. */
export function movementMaker(brandSlug: string, caliber: string | null): Sourced<string> | null {
  if (!caliber) return null;
  return BRAND_INFO[brandSlug]?.movementMakers.find((m) => m.caliber.test(caliber)) ?? null;
}
