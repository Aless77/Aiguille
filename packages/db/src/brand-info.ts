/**
 * Informations de marque que les fiches produit ne donnent pas toujours : garantie (et sa page de
 * détail), tarifs et fréquences d'entretien, pièces de rechange, fabrication, fabricant des
 * mouvements, conseils d'utilisation. Chaque valeur est **sourcée et datée** ; sans vérification,
 * elle reste null et le site affiche « non communiqué ». À compléter pour chaque nouvelle marque
 * (docs/integrer-une-marque.md). Ne jamais remplir de mémoire. Les textes sont **reformulés**,
 * jamais copiés. Le rapport de couverture signale ce qui manque et ce qui date de plus de six mois.
 */
import { type Movement } from "./facts.ts";

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
  extended: {
    months: number;
    when: string;
    /** Mouvements concernés, quand la règle en dépend (ex. Longines : automatiques). */
    movements?: Movement[];
  }[];
  /** Page de la marque qui détaille la garantie (lien « Détail de la garantie »). */
  page: string;
  /** Principales exclusions, reformulées en quelques mots. */
  excludes: string[];
}

/** Grille publique de révision (euros TTC, prestations de la marque en France) et conseils. */
export interface ServicePolicy {
  /** Précisions de périmètre, affichées avec les tarifs. */
  priceNote?: string;
  batteryNote?: string;
  /** Pages complémentaires pour les recommandations et conditions. */
  adviceSources?: string[];
  tactilePrices?: { partial: number; full: number };
  /** Révision complète et partielle selon le mouvement et ses complications. */
  prices: {
    movement: "quartz" | "mecanique";
    chronograph: boolean;
    partial: number | null;
    full: number | null;
  }[];
  battery: number | null;
  /** Fréquence d'entretien complet conseillée (montres mécaniques). */
  fullServiceInterval: string | null;
  /** Fréquence de révision partielle conseillée. */
  partialServiceInterval: string | null;
  /** Contrôle d'étanchéité conseillé. */
  waterResistanceCheck: string | null;
  /** Durée de vie d'une pile annoncée par la marque. */
  batteryLife: string | null;
  /** Garantie sur l'intervention de révision, en mois. */
  serviceWarrantyMonths: number | null;
  /** Disponibilité des pièces de rechange annoncée par la marque. */
  spareParts: string | null;
  /** Prestations offertes, telles que la marque les annonce. */
  free: string[];
}

/** Conseils d'utilisation (texte reformulé par Aiguille ; la source dit qui les recommande). */
export const CARE_TIPS = {
  screwDownCrown: "Vissez la couronne à fond avant toute baignade.",
  crownNeutral: "Après un réglage, repoussez toujours la couronne en position neutre.",
  chronographPushers: "N'actionnez pas les poussoirs du chronographe sous l'eau.",
  saltWater: "Rincez la montre à l'eau claire après la mer ou la piscine.",
  magnetism: "Tenez-la à distance des aimants et appareils électriques (enceintes, portiques…).",
  temperature: "Évitez les températures extrêmes et les chocs thermiques (soleil puis eau froide).",
  chemicals: "Évitez parfums, solvants et cosmétiques : ils abîment joints et bracelets.",
  batteryAtDealer: "Faites changer la pile par un centre agréé ou un revendeur officiel.",
  cleaning: "Nettoyez boîtier étanche et bracelet métal à l'eau savonneuse, puis séchez.",
  vintageWater:
    "Pour une pièce vintage, évitez l'eau ; faites évaluer son état par un centre agréé.",
} as const;
export type CareTipId = keyof typeof CARE_TIPS;

export interface BrandInfo {
  warranty: Sourced<WarrantyPolicy> | null;
  service: Sourced<ServicePolicy> | null;
  /** Pays de fabrication déclaré pour toute la marque, quand les fiches ne le disent pas. */
  madeIn: Sourced<string> | null;
  /** Conseils d'utilisation que la marque publie elle-même. */
  care: Sourced<CareTipId[]> | null;
  /** Groupe horloger propriétaire de la marque. */
  group: Sourced<string> | null;
  /**
   * Fabricant des mouvements par motif de calibre (le premier qui correspond). Un calibre sans
   * règle sourcée reste « constructeur non communiqué ».
   */
  movementMakers: (Sourced<string> & { caliber: RegExp })[];
}

const AUDIT = "2026-10-24";

export const BRAND_INFO: Record<string, BrandInfo> = {
  citizen: {
    warranty: {
      value: {
        months: 36,
        extended: [],
        page: "https://de.citizenwatch.eu/de/info/support/garantieleistungen/",
        excludes: [
          "verre et bracelet",
          "durée de vie de la pile",
          "accidents et mauvaise utilisation",
          "intervention par une personne non agréée",
        ],
      },
      source: "https://de.citizenwatch.eu/de/info/support/garantieleistungen/",
      checkedAt: "2026-10-25",
    },
    service: null,
    madeIn: null,
    care: null,
    group: null,
    movementMakers: [],
  },
  seiko: {
    warranty: {
      value: {
        months: 36,
        extended: [],
        page: "https://www.seikowatches.com/fr-fr/customerservice/faq/catalog-and-guarantee-3",
        excludes: [
          "usure normale",
          "durée de vie de la pile",
          "accidents et mauvaise utilisation",
          "bracelets non métalliques",
        ],
      },
      source: "https://www.seikowatches.com/fr-fr/customerservice/faq/catalog-and-guarantee-3",
      checkedAt: "2026-10-25",
    },
    service: {
      value: {
        prices: [],
        battery: null,
        fullServiceInterval: null,
        partialServiceInterval: null,
        waterResistanceCheck: null,
        batteryLife: null,
        serviceWarrantyMonths: 12,
        spareParts: null,
        free: [],
      },
      source: "https://www.seikoboutique.eu/fr/fr/content/46-garantie-et-sav",
      checkedAt: "2026-10-25",
    },
    madeIn: null,
    care: null,
    group: null,
    movementMakers: [],
  },
  tissot: {
    warranty: {
      value: {
        months: 24,
        extended: [{ months: 36, when: "Lightmaster Solar et chronomètres certifiés COSC" }],
        page: "https://www.tissotwatches.com/fr-fr/customer-service-warranty.html",
        excludes: [
          "durée de vie de la pile",
          "usure normale",
          "accidents et mauvaise utilisation",
          "intervention par une personne non agréée",
        ],
      },
      source: "https://www.tissotwatches.com/fr-fr/conditions-of-sale-202606.html",
      checkedAt: AUDIT,
    },
    service: {
      value: {
        prices: [
          { movement: "quartz", chronograph: false, partial: 55, full: 120 },
          { movement: "quartz", chronograph: true, partial: 65, full: 185 },
          { movement: "mecanique", chronograph: false, partial: 55, full: 195 },
          { movement: "mecanique", chronograph: true, partial: 70, full: 290 },
        ],
        tactilePrices: { partial: 70, full: 295 },
        battery: null,
        batteryNote:
          "Changement de pile inclus dans le service partiel pour les modèles à quartz à pile.",
        priceNote:
          "Tarifs indicatifs hors frais logistiques ; diagnostic préalable. Service partiel garanti sur l'étanchéité, service complet également sur le mouvement.",
        fullServiceInterval:
          "tous les 4 à 5 ans selon la FAQ ; contrôle tous les 3 à 4 ans sur la page garantie. Suivre le manuel du modèle et l'avis du centre agréé",
        partialServiceInterval: null,
        waterResistanceCheck: "une fois par an",
        batteryLife: null,
        serviceWarrantyMonths: 24,
        spareParts:
          "au moins 10 ans après l'arrêt de production ; jusqu'à 20 ans pour les montres en or, avec substitution possible",
        free: [],
        adviceSources: [
          "https://www.tissotwatches.com/fr-fr/faq",
          "https://www.tissotwatches.com/fr-fr/customer-service-warranty.html",
        ],
      },
      source: "https://www.tissotwatches.com/fr-fr/service-prices",
      checkedAt: AUDIT,
    },
    madeIn: null,
    care: {
      value: [
        "screwDownCrown",
        "crownNeutral",
        "chronographPushers",
        "saltWater",
        "magnetism",
        "temperature",
        "chemicals",
        "batteryAtDealer",
        "cleaning",
      ],
      source: "https://www.tissotwatches.com/fr-fr/customer-service-warranty.html",
      checkedAt: AUDIT,
    },
    group: null,
    movementMakers: [],
  },
  hamilton: {
    warranty: {
      value: {
        months: 24,
        extended: [],
        page: "https://www.hamiltonwatch.com/fr-fr/warranty",
        excludes: ["durée de vie de la pile", "usure normale", "accidents"],
      },
      source: "https://www.hamiltonwatch.com/fr-fr/warranty",
      checkedAt: AUDIT,
    },
    service: {
      value: {
        prices: [
          { movement: "mecanique", chronograph: false, partial: 60, full: 230 },
          { movement: "mecanique", chronograph: true, partial: 75, full: 340 },
          { movement: "quartz", chronograph: false, partial: 60, full: 170 },
          { movement: "quartz", chronograph: true, partial: 75, full: 250 },
        ],
        battery: null,
        fullServiceInterval: "pas de fréquence fixe : selon le modèle, l'environnement et l'usage",
        partialServiceInterval: "tous les 1 à 2 ans (restauration de l'étanchéité)",
        waterResistanceCheck: "une fois par an",
        batteryLife: "2 à 5 ans selon le mouvement",
        serviceWarrantyMonths: 24,
        spareParts: "au moins 10 ans après l'arrêt de production du modèle",
        free: [],
      },
      source: "https://www.hamiltonwatch.com/fr-fr/watch-intervention.html",
      checkedAt: AUDIT,
    },
    madeIn: {
      value: "Suisse (Swiss Made)",
      source: "https://www.hamiltonwatch.com/fr-fr/faq",
      checkedAt: AUDIT,
    },
    care: {
      value: [
        "screwDownCrown",
        "crownNeutral",
        "saltWater",
        "magnetism",
        "temperature",
        "chemicals",
        "batteryAtDealer",
        "cleaning",
      ],
      source: "https://www.hamiltonwatch.com/fr-fr/faq",
      checkedAt: AUDIT,
    },
    group: null,
    movementMakers: [
      // FAQ : « En collaboration avec ETA, Hamilton développe des mouvements à quartz,
      // automatiques et mécaniques personnalisés. »
      {
        caliber: /./,
        value: "ETA, en collaboration avec Hamilton",
        source: "https://www.hamiltonwatch.com/fr-fr/faq",
        checkedAt: AUDIT,
      },
    ],
  },
  longines: {
    // Pages produit : « 24 mois sur votre montre LONGINES® et cinq (5) ans sur les montres
    // automatiques ». La page garantie dit tantôt « automatiques », tantôt « mécaniques » : règle
    // prudente (automatiques), la valeur affichée sur chaque fiche (relevée par le scraper) prime.
    warranty: {
      value: {
        months: 24,
        extended: [{ months: 60, when: "montres automatiques", movements: ["automatique"] }],
        page: "https://www.longines.com/fr/customer-service/warranty",
        excludes: [
          "durée de vie de la pile",
          "usure normale (rayures, bracelets cuir ou caoutchouc, PVD)",
          "accidents et mauvaise utilisation",
          "intervention par une personne non agréée, y compris le changement de pile",
        ],
      },
      source: "https://www.longines.com/fr/customer-service/warranty",
      checkedAt: AUDIT,
    },
    service: {
      value: {
        prices: [
          { movement: "quartz", chronograph: false, partial: 100, full: 255 },
          { movement: "quartz", chronograph: true, partial: 125, full: 370 },
          { movement: "mecanique", chronograph: false, partial: 100, full: 390 },
          { movement: "mecanique", chronograph: true, partial: 125, full: 510 },
        ],
        battery: 35,
        batteryNote:
          "Forfait étanchéité et pile proposé uniquement dans les boutiques Longines de Sèvres et Saint-Honoré.",
        priceNote:
          "Prix TTC hors frais de port ; fournitures hors forfait facturées séparément. Montres antérieures à 1990 : sur devis.",
        adviceSources: [
          "https://www.longines.com/fr/customer-service/services",
          "https://www.longines.com/fr/customer-service/care-instructions",
        ],
        fullServiceInterval: "tous les 6 à 8 ans",
        partialServiceInterval: null,
        waterResistanceCheck: "une fois par an",
        batteryLife: null,
        serviceWarrantyMonths: 24,
        spareParts: null,
        free: ["démagnétisation", "contrôle de la marche"],
      },
      source: "https://www.longines.com/fr/customer-service/services/maintenance-prices",
      checkedAt: AUDIT,
    },
    madeIn: null,
    care: {
      value: [
        "screwDownCrown",
        "crownNeutral",
        "chronographPushers",
        "saltWater",
        "magnetism",
        "temperature",
        "chemicals",
        "cleaning",
      ],
      source: "https://www.longines.com/fr/customer-service/care-instructions",
      checkedAt: AUDIT,
    },
    group: null,
    movementMakers: [],
  },
};

/**
 * Garantie applicable à une montre : celle affichée sur sa fiche, sinon la règle sourcée de la
 * marque (durée étendue si elle s'applique à son mouvement). La page de détail et les exclusions
 * viennent toujours de la règle de la marque.
 */
export function warrantyFor(
  brandSlug: string,
  fromProductPage: number | null,
  movement: Movement | null = null,
  context: { chronometer?: boolean; lightmaster?: boolean; vintage?: boolean } = {},
): {
  months: number;
  source: string;
  extended: WarrantyPolicy["extended"];
  page: string | null;
  excludes: string[];
} | null {
  const policy = BRAND_INFO[brandSlug]?.warranty;
  const details = { page: policy?.value.page ?? null, excludes: policy?.value.excludes ?? [] };
  if (fromProductPage !== null) {
    return {
      months: fromProductPage,
      source: "Fiche officielle de la montre",
      extended: [],
      ...details,
    };
  }
  if (!policy) return null;
  if (brandSlug === "longines" && context.vintage) {
    return { months: 24, source: policy.source, extended: [], ...details };
  }
  const rule = policy.value.extended.find(
    (e) =>
      (movement && e.movements?.includes(movement)) ||
      (brandSlug === "tissot" && (context.chronometer || context.lightmaster)),
  );
  return {
    months: rule?.months ?? policy.value.months,
    source: policy.source,
    extended: rule ? [] : policy.value.extended,
    ...details,
  };
}

/** Révision de la marque pour ce type de montre : tarifs, fréquences, pièces, si publiés. */
export function servicePricesFor(
  brandSlug: string,
  movement: Movement | null,
  chronograph: boolean,
  context: { tactile?: boolean; vintage?: boolean } = {},
):
  | (Omit<ServicePolicy, "prices"> & {
      partial: number | null;
      full: number | null;
      source: string;
      checkedAt: string;
    })
  | null {
  const service = BRAND_INFO[brandSlug]?.service;
  if (!service) return null;
  const kind =
    movement === "automatique" || movement === "manuel"
      ? "mecanique"
      : movement === "quartz"
        ? "quartz"
        : null;
  const row = service.value.prices.find(
    (p) => p.movement === kind && p.chronograph === chronograph,
  );
  const { prices: _prices, ...rest } = service.value;
  const selected = context.vintage ? null : context.tactile ? service.value.tactilePrices : row;
  return {
    ...rest,
    partial: selected?.partial ?? null,
    full: selected?.full ?? null,
    ...(context.vintage
      ? {
          serviceWarrantyMonths: null,
          battery: null,
          fullServiceInterval: null,
          partialServiceInterval: null,
          priceNote:
            "Pièce vintage : demander un devis au centre agréé ; les forfaits courants ne sont pas appliqués.",
        }
      : {}),
    source: service.source,
    checkedAt: service.checkedAt,
  };
}

/** Fabricant du mouvement, si une règle sourcée existe pour ce calibre. */
export function movementMaker(brandSlug: string, caliber: string | null): Sourced<string> | null {
  if (!caliber) return null;
  return BRAND_INFO[brandSlug]?.movementMakers.find((m) => m.caliber.test(caliber)) ?? null;
}

export interface CareTip {
  id: CareTipId;
  text: string;
  /** Page de la marque qui le recommande, ou null : conseil général d'Aiguille. */
  source: string | null;
}

/**
 * Conseils d'utilisation adaptés à la montre : seulement ceux qui la concernent (couronne vissée,
 * chronographe, pile…). Ceux que la marque publie portent sa source ; les autres sont des conseils
 * généraux, signalés comme tels.
 */
export function careTipsFor(
  brandSlug: string,
  watch: {
    movement: Movement | null;
    screwDownCrown: boolean;
    chronograph: boolean;
    antimagnetic: boolean;
    waterResistanceM: number | null;
    vintage?: boolean;
  },
): CareTip[] {
  const care = BRAND_INFO[brandSlug]?.care;
  const quartz = watch.movement === "quartz";
  const relevant: CareTipId[] = watch.vintage
    ? ["vintageWater", "temperature", "chemicals"]
    : [
        watch.screwDownCrown ? "screwDownCrown" : "crownNeutral",
        ...(watch.chronograph ? (["chronographPushers"] as const) : []),
        ...((watch.waterResistanceM ?? 0) >= 50 ? (["saltWater"] as const) : []),
        ...(watch.antimagnetic ? [] : (["magnetism"] as const)),
        "temperature",
        "chemicals",
        ...(quartz ? (["batteryAtDealer"] as const) : []),
      ];
  return relevant.map((id) => ({
    id,
    text: CARE_TIPS[id],
    source: care?.value.includes(id) ? care.source : null,
  }));
}
