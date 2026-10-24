/**
 * Deux notes distinctes (cahier des charges, lot 5) :
 * - la **Note Aiguille** sur 100, notre évaluation factuelle, toujours **dans son registre** : chaque
 *   montre est comparée aux montres de même gamme de prix et de même famille (une montre à 500 €
 *   peut obtenir 90/100) ;
 * - l'**avis de la communauté** sur 5 : moyenne des avis des visiteurs (et plus tard des notes
 *   externes agrégées), affichée à côté, jamais mélangée à la nôtre.
 * Fonctions pures, testées dans rating.test.ts, appelées par scores.ts.
 */
import {
  COMPLICATIONS,
  type Complication,
  type ConstructionFacts,
  type Family,
  FAMILIES,
  type Movement,
  type MovementFacts,
  PRICE_BANDS,
  type PriceBand,
} from "./facts.ts";

// ── Avis de la communauté ───────────────────────────────────────────────────────────────────

/** Critères d'un avis, notés de 1 à 5, « par rapport à ce qu'on peut attendre à ce prix ». */
export const REVIEW_CRITERIA = {
  finishing: "Finition",
  design: "Design",
  comfort: "Confort au poignet",
  legibility: "Lisibilité",
  accuracy: "Précision",
  value: "Rapport qualité-prix",
} as const;

export type ReviewCriterion = keyof typeof REVIEW_CRITERIA;
/** Le design s'est ajouté après les premiers avis : il peut manquer sur un ancien avis. */
export type ReviewRatings = Omit<Record<ReviewCriterion, number>, "design"> & {
  design: number | null;
};

/** Avis fictifs ajoutés à la moyenne bayésienne : 2 avis à 5/5 ne battent pas 200 avis à 4,6. */
export const BAYES_PRIOR_WEIGHT = 5;
/** Moyenne a priori tant que le site compte moins de 20 avis au total. */
export const DEFAULT_PRIOR_MEAN = 3.5;

/** Moyenne d'un avis sur ses critères notés (1 à 5). */
export function reviewMean(r: ReviewRatings): number {
  const values = (Object.keys(REVIEW_CRITERIA) as ReviewCriterion[])
    .map((k) => r[k])
    .filter((v): v is number => v !== null);
  return values.reduce((a, b) => a + b, 0) / values.length;
}

/** Moyenne a priori : moyenne de tous les avis du site, ou 3,5 tant qu'il y en a moins de 20. */
export function priorMean(allReviewMeans: number[]): number {
  if (allReviewMeans.length < 20) return DEFAULT_PRIOR_MEAN;
  return allReviewMeans.reduce((a, b) => a + b, 0) / allReviewMeans.length;
}

export type Confidence = "low" | "medium" | "high";

export interface CommunityScore {
  /** Moyenne brute sur 5, affichée. */
  average: number;
  /** Moyenne bayésienne sur 5 : sert au tri, pour ne pas favoriser un avis isolé. */
  bayesian: number;
  count: number;
  confidence: Confidence;
}

/** Avis de la communauté ; null sans aucun avis. Confiance : 3 avis (moyenne), 10 (élevée). */
export function communityScore(reviews: ReviewRatings[], prior: number): CommunityScore | null {
  if (reviews.length === 0) return null;
  const sum = reviews.map(reviewMean).reduce((a, b) => a + b, 0);
  const round2 = (n: number) => Math.round(n * 100) / 100;
  return {
    average: round2(sum / reviews.length),
    bayesian: round2((prior * BAYES_PRIOR_WEIGHT + sum) / (BAYES_PRIOR_WEIGHT + reviews.length)),
    count: reviews.length,
    confidence: reviews.length >= 10 ? "high" : reviews.length >= 3 ? "medium" : "low",
  };
}

// ── Note Aiguille : barèmes absolus ─────────────────────────────────────────────────────────

export interface Points {
  /** Sur 100. */
  points: number;
  /** Atouts lisibles, affichés sous le pilier. */
  strengths: string[];
}

const COMPLICATION_POINTS: Record<Complication, number> = {
  perpetualCalendar: 14,
  annualCalendar: 10,
  chronograph: 8,
  gmt: 7,
  moonphase: 6,
  powerReserveIndicator: 4,
  alarm: 4,
  dayDate: 3,
};

const MOVEMENT_LABELS: Record<Movement, string> = {
  automatique: "Mouvement mécanique automatique",
  manuel: "Mouvement mécanique à remontage manuel",
  solaire: "Mouvement quartz solaire",
  quartz: "Mouvement quartz",
  autre: "Mouvement d'un autre type",
};

const fr = (n: number) => n.toLocaleString("fr-FR").replace(/ /g, " ");

/**
 * Mouvement sur 100 : type (30), réserve de marche (15), fréquence (8), spiral silicium ou
 * antimagnétisme (10), certification chronomètre (15), complications (22 au plus). Donnée non
 * publiée par la marque : valeur moyenne, pour ne pas pénaliser une fiche incomplète.
 */
export function movementPoints(m: MovementFacts): Points {
  const strengths: string[] = [];
  const mechanical = m.type === "automatique" || m.type === "manuel";
  let points = { automatique: 30, manuel: 30, solaire: 18, quartz: 12, autre: 8 }[
    m.type ?? "autre"
  ];

  if (m.type) strengths.push(MOVEMENT_LABELS[m.type]);
  if (m.caliber) strengths.push(`Calibre ${m.caliber}`);
  if (mechanical) {
    const pr = m.powerReserveH;
    points += pr === null ? 7 : pr >= 80 ? 15 : pr >= 70 ? 13 : pr >= 60 ? 11 : pr >= 45 ? 8 : 5;
    if (pr !== null) strengths.push(`${pr} h de réserve de marche`);
    const f = m.frequencyVph;
    points += f === null ? 4 : f >= 36_000 ? 8 : f >= 28_800 ? 6 : f >= 25_200 ? 5 : 3;
    if (f !== null) strengths.push(`${fr(f)} alternances par heure`);
  } else {
    points += m.type === "solaire" ? 10 : 6;
    points += 4;
  }

  if (m.siliconHairspring) {
    points += 10;
    strengths.push("Spiral en silicium (antimagnétique)");
  } else if (m.antimagnetic) {
    points += 7;
    strengths.push("Spiral ou mouvement antimagnétique");
  }
  if (m.chronometer) {
    points += 15;
    strengths.push("Chronomètre certifié (COSC)");
  }
  const complicationPoints = m.complications.reduce((s, c) => s + COMPLICATION_POINTS[c], 0);
  points += Math.min(22, complicationPoints);
  if (m.complications.length) {
    strengths.push(m.complications.map((c) => COMPLICATIONS[c]).join(", "));
  }
  return { points: Math.min(100, points), strengths };
}

/**
 * Construction sur 100 : verre (25 + 7 si antireflet), étanchéité **attendue pour la famille**
 * (25 ; une montre habillée n'a pas à descendre à 300 m), matière (15), fond transparent (8),
 * couronne vissée (8), luminescence (7). Total ramené à 100.
 */
export function constructionPoints(c: ConstructionFacts, f: Family): Points {
  const strengths: string[] = [];
  let points = 0;

  points += c.sapphire ? 25 : 10;
  if (c.sapphire) strengths.push(c.antiReflective ? "Verre saphir antireflet" : "Verre saphir");
  if (c.antiReflective) points += 7;

  const wr = c.waterResistanceM;
  if (wr === null) points += 12;
  else if (f === "plongee") points += wr >= 300 ? 25 : wr >= 200 ? 20 : 8;
  else if (f === "habillee" || f === "joaillerie") points += wr >= 50 ? 25 : wr >= 30 ? 18 : 10;
  else points += wr >= 100 ? 25 : wr >= 50 ? 18 : wr >= 30 ? 12 : 6;
  if (wr !== null) strengths.push(`Étanche à ${wr} m`);

  if (c.nobleMaterial) {
    points += 15;
    strengths.push(`Boîtier ${c.nobleMaterial.toLowerCase()}`);
  } else points += 8;
  if (c.exhibitionCaseback) {
    points += 8;
    strengths.push("Fond transparent");
  }
  if (c.screwDownCrown) {
    points += 8;
    strengths.push("Couronne vissée");
  }
  if (c.luminescent) points += 7;

  return { points: Math.round((points / 95) * 100), strengths };
}

// ── Comparaison dans la catégorie ───────────────────────────────────────────────────────────

/** Part des montres comparées dont la valeur est inférieure (égalités à moitié), sur 100. */
export function percentile(value: number, values: number[]): number {
  if (values.length === 0) return 50;
  const below = values.filter((v) => v < value).length;
  const ties = values.filter((v) => v === value).length;
  return Math.round(((below + ties / 2) / values.length) * 100);
}

/** Au moins 10 montres pour qu'une comparaison ait du sens. */
export const MIN_PEERS = 10;

export interface CategoryMember {
  id: number;
  band: PriceBand | null;
  family: Family;
  priceCents: number | null;
}

export interface Category {
  /** « Milieu de gamme · plongée (1 000 à 2 000 €) » */
  label: string;
  memberIds: number[];
}

const bandIndex = (b: PriceBand) => PRICE_BANDS.findIndex((x) => x.id === b);

function bandRange(from: number, to: number): string {
  const low = from === 0 ? 0 : PRICE_BANDS[from - 1]!.max;
  const high = PRICE_BANDS[to]!.max;
  if (low === 0) return `moins de ${fr(high)} €`;
  if (high === Infinity) return `plus de ${fr(low)} €`;
  return `${fr(low)} à ${fr(high)} €`;
}

/**
 * Montres comparables : même famille et même gamme de prix ; s'il y en a moins de 10, même
 * famille sur les gammes voisines ; sinon toutes les familles de la gamme ; sinon tout le
 * catalogue. Le libellé dit toujours à quoi la montre est comparée.
 */
export function categoryFor(w: CategoryMember, all: CategoryMember[]): Category {
  const family = FAMILIES[w.family];
  if (w.band === null) {
    return {
      label: `Montres ${family} (prix non communiqué)`,
      memberIds: all.filter((o) => o.family === w.family).map((o) => o.id),
    };
  }
  const i = bandIndex(w.band);
  const sameFamily = all.filter((o) => o.family === w.family && o.band !== null);

  for (const spread of [0, 1]) {
    const from = Math.max(0, i - spread);
    const to = Math.min(PRICE_BANDS.length - 1, i + spread);
    const peers = sameFamily.filter((o) => {
      const j = bandIndex(o.band!);
      return j >= from && j <= to;
    });
    if (peers.length >= MIN_PEERS) {
      const name = spread === 0 ? PRICE_BANDS[i]!.label : "Gammes voisines";
      return {
        label: `${name} · ${family} (${bandRange(from, to)})`,
        memberIds: peers.map((o) => o.id),
      };
    }
  }
  const sameBand = all.filter((o) => o.band === w.band);
  if (sameBand.length >= MIN_PEERS) {
    return {
      label: `${PRICE_BANDS[i]!.label} · toutes familles (${bandRange(i, i)})`,
      memberIds: sameBand.map((o) => o.id),
    };
  }
  return { label: "Tout le catalogue", memberIds: all.map((o) => o.id) };
}

// ── Piliers et note finale ──────────────────────────────────────────────────────────────────

export const PILLAR_WEIGHTS = { movement: 45, construction: 30, value: 25 } as const;
export type PillarId = keyof typeof PILLAR_WEIGHTS;

export const PILLAR_LABELS: Record<PillarId, string> = {
  movement: "Mouvement",
  construction: "Construction",
  value: "Rapport qualité-prix",
};

export interface Pillar {
  /** Sur 100. */
  score: number;
  /** Raisons lisibles, affichées telles quelles sous la barre du pilier. */
  details: string[];
}

export type Pillars = Record<PillarId, Pillar>;

/** Pilier « dans son registre » : 25 % barème absolu, 75 % rang parmi les montres comparables. */
export function relativePillar(own: Points, peerPoints: number[], comparison: string): Pillar {
  const rank = percentile(own.points, peerPoints);
  return {
    score: Math.round(0.25 * own.points + 0.75 * rank),
    details: [...own.strengths, `${comparison} ${rank} % des montres comparables`],
  };
}

export type Availability = "in_stock" | "out_of_stock" | "preorder" | "unknown";

export interface MarketInput {
  catalogPriceCents: number | null;
  /** Meilleur prix chez un revendeur, montre en stock ou en précommande. */
  bestRetailerPriceCents: number | null;
  /** Meilleure disponibilité relevée, toutes sources confondues. */
  availability: Availability;
  retailerCount: number;
  discontinued: boolean;
}

const AVAILABILITY_POINTS: Record<Availability, [number, string]> = {
  in_stock: [100, "En stock"],
  preorder: [60, "En précommande"],
  out_of_stock: [20, "En rupture partout"],
  unknown: [50, "Disponibilité inconnue"],
};

/**
 * Rapport qualité-prix sur 100 : équipement (mouvement + construction) face au prix, parmi les
 * montres comparables (60 %), remise chez les revendeurs (25 %, 100 dès 20 %), disponibilité
 * (15 %). Montre plus produite : équipement face au prix seulement.
 */
export function valuePillar(
  equipmentRank: number,
  cheaperThanRank: number,
  m: MarketInput,
): Pillar {
  const ratio = Math.round((equipmentRank + cheaperThanRank) / 2);
  const details = [
    `Mieux équipée que ${equipmentRank} % des montres comparables`,
    `Moins chère que ${cheaperThanRank} % d'entre elles`,
  ];
  if (m.discontinued || m.catalogPriceCents === null) return { score: ratio, details };

  let discountPoints = 40;
  if (m.bestRetailerPriceCents !== null) {
    const discount = Math.max(
      0,
      (m.catalogPriceCents - m.bestRetailerPriceCents) / m.catalogPriceCents,
    );
    discountPoints = 40 + 300 * Math.min(discount, 0.2);
    details.push(
      discount >= 0.01
        ? `Jusqu'à ${Math.round(discount * 100)} % sous le prix catalogue chez un revendeur`
        : "Vendue au prix catalogue chez les revendeurs",
    );
  }
  const [availabilityPoints, availabilityLabel] = AVAILABILITY_POINTS[m.availability];
  details.push(
    m.retailerCount > 0
      ? `${availabilityLabel} (${m.retailerCount} revendeur${m.retailerCount > 1 ? "s" : ""} suivi${m.retailerCount > 1 ? "s" : ""})`
      : `${availabilityLabel} chez la marque`,
  );
  return {
    score: Math.round(0.6 * ratio + 0.25 * discountPoints + 0.15 * availabilityPoints),
    details,
  };
}

/** Note Aiguille : moyenne pondérée 45 / 30 / 25 des trois piliers. */
export function aiguilleScore(p: Pillars): number {
  const ids = Object.keys(PILLAR_WEIGHTS) as PillarId[];
  return Math.round(ids.reduce((s, id) => s + p[id].score * PILLAR_WEIGHTS[id], 0) / 100);
}

/**
 * Confiance de la Note Aiguille : données publiées par la marque (calibre, réserve ou quartz,
 * verre, étanchéité, matière) et taille du groupe de comparaison.
 */
export function dataConfidence(
  m: MovementFacts,
  c: ConstructionFacts,
  peers: number,
  hasPrice: boolean,
): Confidence {
  const known = [
    m.caliber !== null,
    m.type !== null && (m.type === "quartz" || m.type === "solaire" || m.powerReserveH !== null),
    c.crystalKnown,
    c.waterResistanceM !== null && c.materialKnown,
    hasPrice,
  ].filter(Boolean).length;
  if (known >= 5 && peers >= 20) return "high";
  if (known >= 3 && peers >= MIN_PEERS) return "medium";
  return "low";
}
