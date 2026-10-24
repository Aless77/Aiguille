/**
 * Comparaison technique, sans note (décision du 24 octobre 2026) : pour une montre donnée, les
 * montres du même usage **au moins aussi bien équipées sur chaque point technique** et nettement
 * moins chères. « Vous regardez une montre à 800 € ; celle-ci, à 300 €, est automatique et plus
 * étanche. » Le goût (design, finition) n'entre jamais en compte : seuls des faits publiés.
 */
import {
  COMPLICATIONS,
  type ConstructionFacts,
  type Family,
  type MovementFacts,
  type OwnershipFacts,
} from "./facts.ts";

export interface ComparableWatch {
  id: number;
  name: string;
  priceCents: number | null;
  family: Family;
  diameterMm: number | null;
  /** Pièce vintage : ni comparée ni proposée (une montre de 1958 n'a pas d'équivalent neuf). */
  vintage: boolean;
  /** Montre plus produite ou pièce vintage : jamais proposée comme alternative. */
  available: boolean;
  movement: MovementFacts;
  construction: ConstructionFacts;
  ownership: OwnershipFacts;
  /** Garantie connue (fiche ou règle sourcée de la marque), en mois. */
  warrantyMonths: number | null;
}

export interface Alternative {
  watchId: number;
  /** Économie sur le prix catalogue, en centimes. */
  savingCents: number;
  /** Avantages techniques, en clair (« Mouvement mécanique », « 200 m au lieu de 50 m »…). */
  advantages: string[];
}

/** Au moins 10 % et 50 € moins chère pour être proposée. */
const MIN_SAVING_RATIO = 0.1;
const MIN_SAVING_CENTS = 5_000;
/** La taille n'est ni meilleure ni moins bonne : on ne compare que des montres de taille proche. */
export const DIAMETER_TOLERANCE_MM = 3;
export const MAX_ALTERNATIVES = 3;

const mechanical = (m: MovementFacts) => m.type === "automatique" || m.type === "manuel";
const movementTier = (m: MovementFacts) => (mechanical(m) ? 2 : m.type === "solaire" ? 1 : 0);

/**
 * Comparaison point par point. null si `candidate` est moins bien équipée sur un point, ou si une
 * donnée connue pour `base` manque pour `candidate` (on ne promet rien sans preuve) ; sinon la
 * liste de ses avantages (éventuellement vide : équivalente, mais moins chère).
 */
export function technicalAdvantages(
  base: ComparableWatch,
  candidate: ComparableWatch,
): string[] | null {
  const b = base.movement;
  const c = candidate.movement;
  const advantages: string[] = [];

  if (base.diameterMm !== null) {
    if (candidate.diameterMm === null) return null;
    if (Math.abs(candidate.diameterMm - base.diameterMm) > DIAMETER_TOLERANCE_MM) return null;
  }
  // Or, titane, céramique… : une montre en matière noble n'est pas remplacée par de l'acier.
  if (base.construction.nobleMaterial && !candidate.construction.nobleMaterial) return null;

  if (movementTier(c) < movementTier(b)) return null;
  if (movementTier(c) > movementTier(b)) {
    advantages.push(
      mechanical(c) ? "Mouvement mécanique" : "Quartz solaire, sans changement de pile",
    );
  }

  if (mechanical(b) && mechanical(c) && b.powerReserveH !== null) {
    if (c.powerReserveH === null || c.powerReserveH < b.powerReserveH) return null;
    if (c.powerReserveH >= b.powerReserveH + 10) {
      advantages.push(`${c.powerReserveH} h de réserve de marche au lieu de ${b.powerReserveH} h`);
    }
  }

  const bc = base.construction;
  const cc = candidate.construction;
  if (bc.sapphire && !cc.sapphire) return null;
  // Lunette céramique et couronne vissée : éléments de construction, exigés s'ils sont présents.
  if (bc.ceramicBezel && !cc.ceramicBezel) return null;
  if (bc.screwDownCrown && !cc.screwDownCrown) return null;
  if (cc.sapphire && !bc.sapphire) advantages.push("Verre saphir");

  if (bc.waterResistanceM !== null) {
    if (cc.waterResistanceM === null || cc.waterResistanceM < bc.waterResistanceM) return null;
    if (cc.waterResistanceM > bc.waterResistanceM && cc.waterResistanceM >= 100) {
      advantages.push(`Étanche à ${cc.waterResistanceM} m au lieu de ${bc.waterResistanceM} m`);
    }
  }

  for (const [has, label] of [
    [(m: MovementFacts) => m.siliconHairspring, "Spiral en silicium"],
    [(m: MovementFacts) => m.antimagnetic, "Antimagnétique"],
    [(m: MovementFacts) => m.chronometer, "Chronomètre certifié COSC"],
  ] as const) {
    if (has(b) && !has(c)) return null;
    if (has(c) && !has(b)) advantages.push(label);
  }

  // Une alternative garde toutes les fonctions de la montre regardée.
  if (!b.complications.every((x) => c.complications.includes(x))) return null;
  const extra = c.complications.filter((x) => !b.complications.includes(x));
  if (extra.length) advantages.push(extra.map((x) => COMPLICATIONS[x]).join(", "));

  if (base.warrantyMonths !== null) {
    if (candidate.warrantyMonths === null || candidate.warrantyMonths < base.warrantyMonths) {
      return null;
    }
    if (candidate.warrantyMonths > base.warrantyMonths) {
      advantages.push(`Garantie de ${candidate.warrantyMonths / 12} ans`);
    }
  }

  // Petits plus, sans exigence : ils ne départagent que les montres déjà comparables.
  if (cc.exhibitionCaseback && !bc.exhibitionCaseback) advantages.push("Fond transparent");
  if (cc.screwDownCrown && !bc.screwDownCrown) advantages.push("Couronne vissée");
  if (cc.ceramicBezel && !bc.ceramicBezel) advantages.push("Lunette en céramique");
  if (candidate.ownership.interchangeableStrap && !base.ownership.interchangeableStrap) {
    advantages.push("Bracelet interchangeable sans outil");
  }
  return advantages;
}

/**
 * Jusqu'à 3 alternatives par montre : même usage, disponible, au moins aussi bien équipée,
 * nettement moins chère. Les plus avantageuses d'abord, puis les moins chères ; une seule
 * déclinaison par modèle (même nom), la moins chère.
 */
export function findAlternatives(all: ComparableWatch[]): Map<number, Alternative[]> {
  const result = new Map<number, Alternative[]>();
  const candidates = all.filter(
    (w) => w.available && w.priceCents !== null && w.family !== "joaillerie",
  );

  for (const base of all) {
    if (base.priceCents === null || base.vintage || base.family === "joaillerie") continue;
    const ceiling = Math.min(
      base.priceCents * (1 - MIN_SAVING_RATIO),
      base.priceCents - MIN_SAVING_CENTS,
    );
    const found: (Alternative & { name: string; price: number })[] = [];
    for (const c of candidates) {
      if (c.id === base.id || c.family !== base.family || c.priceCents! > ceiling) continue;
      const advantages = technicalAdvantages(base, c);
      if (advantages === null) continue;
      found.push({
        watchId: c.id,
        savingCents: base.priceCents - c.priceCents!,
        advantages,
        name: c.name,
        price: c.priceCents!,
      });
    }
    const perModel = new Map<string, (typeof found)[number]>();
    for (const f of found) {
      const kept = perModel.get(f.name);
      if (!kept || f.price < kept.price) perModel.set(f.name, f);
    }
    const best = [...perModel.values()]
      .sort((a, b) => b.advantages.length - a.advantages.length || a.price - b.price)
      .slice(0, MAX_ALTERNATIVES)
      .map(({ watchId, savingCents, advantages }) => ({ watchId, savingCents, advantages }));
    if (best.length) result.set(base.id, best);
  }
  return result;
}
