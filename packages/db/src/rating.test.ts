import { describe, expect, it } from "vitest";

import { type ConstructionFacts, type MovementFacts } from "./facts.ts";
import {
  aiguilleScore,
  categoryFor,
  type CategoryMember,
  communityScore,
  constructionPoints,
  dataConfidence,
  movementPoints,
  percentile,
  priorMean,
  relativePillar,
  reviewMean,
  valuePillar,
} from "./rating.ts";

const mvt = (over: Partial<MovementFacts> = {}): MovementFacts => ({
  caliber: null,
  type: "automatique",
  frequencyVph: null,
  powerReserveH: null,
  siliconHairspring: false,
  antimagnetic: false,
  chronometer: false,
  complications: [],
  ...over,
});

const build = (over: Partial<ConstructionFacts> = {}): ConstructionFacts => ({
  sapphire: true,
  crystalKnown: true,
  materialKnown: true,
  antiReflective: false,
  waterResistanceM: 100,
  nobleMaterial: null,
  exhibitionCaseback: false,
  screwDownCrown: false,
  luminescent: false,
  gemSet: false,
  ceramicBezel: false,
  ...over,
});

const stars = (n: number) => ({
  finishing: n,
  design: n,
  comfort: n,
  legibility: n,
  accuracy: n,
  value: n,
});

describe("movementPoints", () => {
  it("valorise réserve, fréquence, silicium et certification", () => {
    const l888 = mvt({
      caliber: "L888.5",
      powerReserveH: 72,
      frequencyVph: 25200,
      siliconHairspring: true,
    });
    // 30 + 13 (72 h) + 5 (25 200) + 10 (silicium) = 58
    expect(movementPoints(l888).points).toBe(58);
    expect(movementPoints({ ...l888, chronometer: true }).points).toBe(73);
    expect(movementPoints(l888).strengths).toEqual([
      "Mouvement mécanique automatique",
      "Calibre L888.5",
      "72 h de réserve de marche",
      "25 200 alternances par heure",
      "Spiral en silicium (antimagnétique)",
    ]);
  });

  it("compte les complications, plafonnées à 22 points", () => {
    const base = movementPoints(mvt()).points;
    expect(movementPoints(mvt({ complications: ["chronograph"] })).points).toBe(base + 8);
    expect(
      movementPoints(mvt({ complications: ["perpetualCalendar", "chronograph", "moonphase"] }))
        .points,
    ).toBe(base + 22);
  });

  it("donne une valeur moyenne à une donnée non publiée", () => {
    // 30 + 7 (réserve inconnue) + 4 (fréquence inconnue) = 41
    expect(movementPoints(mvt()).points).toBe(41);
  });
});

describe("constructionPoints", () => {
  it("attend l'étanchéité propre à chaque famille", () => {
    const at = (m: number, f: Parameters<typeof constructionPoints>[1]) =>
      constructionPoints(build({ waterResistanceM: m }), f).points;
    // Une montre habillée étanche à 50 m est au maximum de sa famille ; pas une plongeuse.
    expect(at(50, "habillee")).toBe(at(300, "plongee"));
    expect(at(50, "plongee")).toBeLessThan(at(50, "habillee"));
  });

  it("valorise saphir, matière noble, fond transparent et couronne vissée", () => {
    const top = build({
      antiReflective: true,
      waterResistanceM: 100,
      nobleMaterial: "Titane",
      exhibitionCaseback: true,
      screwDownCrown: true,
      luminescent: true,
    });
    expect(constructionPoints(top, "quotidien").points).toBe(100);
  });
});

describe("percentile et relativePillar", () => {
  it("situe une valeur parmi ses semblables, égalités à moitié", () => {
    expect(percentile(5, [1, 2, 3, 4])).toBe(100);
    expect(percentile(1, [1, 2, 3, 4])).toBe(13);
    expect(percentile(3, [])).toBe(50);
  });

  it("juge la montre dans son registre (75 % de rang)", () => {
    const pillar = relativePillar(
      { points: 40, strengths: ["Quartz"] },
      [10, 20, 30, 40],
      "Mieux que",
    );
    // Rang : 3 dessous + 1 égalité/2 sur 4 = 88 ; 0,25 × 40 + 0,75 × 88 = 76
    expect(pillar.score).toBe(76);
    expect(pillar.details).toEqual(["Quartz", "Mieux que 88 % des montres comparables"]);
  });
});

describe("categoryFor", () => {
  const members = (n: number, over: Partial<CategoryMember>, start = 0): CategoryMember[] =>
    Array.from({ length: n }, (_, i) => ({
      id: start + i,
      band: "milieu" as const,
      family: "plongee" as const,
      priceCents: 150_000,
      ...over,
    }));

  it("compare à la même famille et à la même gamme", () => {
    const all = [...members(12, {}), ...members(30, { family: "habillee" }, 100)];
    const c = categoryFor(all[0]!, all);
    expect(c.label).toBe("Milieu de gamme · plongée (1 000 à 2 000 €)");
    expect(c.memberIds).toHaveLength(12);
  });

  it("élargit aux gammes voisines puis à toutes les familles si besoin", () => {
    const neighbours = [...members(4, {}), ...members(8, { band: "accessible" }, 50)];
    expect(categoryFor(neighbours[0]!, neighbours).label).toBe(
      "Gammes voisines · plongée (500 à 5 000 €)",
    );
    const mixed = [...members(3, {}), ...members(20, { family: "quotidien" }, 50)];
    expect(categoryFor(mixed[0]!, mixed).label).toBe(
      "Milieu de gamme · toutes familles (1 000 à 2 000 €)",
    );
  });
});

describe("valuePillar et aiguilleScore", () => {
  const market = {
    catalogPriceCents: 100_000,
    bestRetailerPriceCents: 85_000,
    availability: "in_stock" as const,
    retailerCount: 2,
    discontinued: false,
  };

  it("combine équipement face au prix, remise et disponibilité", () => {
    const pillar = valuePillar(80, 60, market);
    // Ratio 70 ; remise 15 % → 85 ; stock 100 : 0,6 × 70 + 0,25 × 85 + 0,15 × 100 = 78,25
    expect(pillar.score).toBe(78);
    expect(pillar.details).toEqual([
      "Mieux équipée que 80 % des montres comparables",
      "Moins chère que 60 % d'entre elles",
      "Jusqu'à 15 % sous le prix catalogue chez un revendeur",
      "En stock (2 revendeurs suivis)",
    ]);
  });

  it("se limite au rapport équipement-prix pour une montre plus produite", () => {
    expect(valuePillar(80, 60, { ...market, discontinued: true }).score).toBe(70);
  });

  it("pondère 45 / 30 / 25", () => {
    const p = (score: number) => ({ score, details: [] });
    // 0,45 × 80 + 0,3 × 60 + 0,25 × 40 = 64
    expect(aiguilleScore({ movement: p(80), construction: p(60), value: p(40) })).toBe(64);
  });

  it("donne la confiance selon les données publiées et la taille de la catégorie", () => {
    const full = mvt({ caliber: "H-10", powerReserveH: 80 });
    expect(dataConfidence(full, build(), 25, true)).toBe("high");
    expect(dataConfidence(full, build(), 12, true)).toBe("medium");
    expect(dataConfidence(mvt(), build({ crystalKnown: false }), 25, false)).toBe("low");
  });
});

describe("avis de la communauté", () => {
  it("n'existe pas sans avis", () => {
    expect(communityScore([], 3.5)).toBeNull();
  });

  it("affiche la moyenne brute et trie sur la moyenne bayésienne", () => {
    const two = communityScore([stars(5), stars(5)], 3.5)!;
    // Bayes : (3,5 × 5 + 10) / 7 = 3,93
    expect(two).toEqual({ average: 5, bayesian: 3.93, count: 2, confidence: "low" });
    const many = communityScore(
      Array.from({ length: 200 }, () => ({ ...stars(5), comfort: 3 })),
      3.5,
    )!;
    expect(many.bayesian).toBeGreaterThan(two.bayesian);
    expect(many.confidence).toBe("high");
  });

  it("ignore le design absent des anciens avis", () => {
    expect(reviewMean({ ...stars(4), design: null })).toBe(4);
    expect(
      reviewMean({ finishing: 5, design: 5, comfort: 4, legibility: 3, accuracy: 2, value: 5 }),
    ).toBe(4);
  });

  it("utilise 3,5 tant que le site a moins de 20 avis", () => {
    expect(priorMean([5, 5])).toBe(3.5);
    expect(priorMean(Array.from({ length: 20 }, () => 4))).toBe(4);
  });
});
