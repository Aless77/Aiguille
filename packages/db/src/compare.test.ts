import { describe, expect, it } from "vitest";

import { type ComparableWatch, findAlternatives, technicalAdvantages } from "./compare.ts";

let nextId = 1;
const watch = (over: Partial<ComparableWatch> & { price: number }): ComparableWatch => {
  const { price, ...rest } = over;
  return {
    id: nextId++,
    name: `Montre ${nextId}`,
    priceCents: price * 100,
    family: "quotidien",
    diameterMm: 40,
    vintage: false,
    available: true,
    warrantyMonths: null,
    movement: {
      caliber: null,
      type: "quartz",
      frequencyVph: null,
      powerReserveH: null,
      siliconHairspring: false,
      antimagnetic: false,
      chronometer: false,
      complications: [],
    },
    construction: {
      sapphire: true,
      crystalKnown: true,
      materialKnown: true,
      antiReflective: false,
      waterResistanceM: 50,
      nobleMaterial: null,
      exhibitionCaseback: false,
      screwDownCrown: false,
      luminescent: false,
      gemSet: false,
      ceramicBezel: false,
    },
    ownership: {
      warrantyMonths: null,
      madeIn: null,
      battery: null,
      endOfLifeIndicator: false,
      interchangeableStrap: false,
      deployantClasp: false,
      chronographMechanism: [],
      vintageYear: null,
    },
    ...rest,
  };
};

const automatic = (powerReserveH: number | null) => ({
  ...watch({ price: 0 }).movement,
  type: "automatique" as const,
  powerReserveH,
});

describe("technicalAdvantages", () => {
  it("liste les avantages d'une montre mieux équipée", () => {
    const base = watch({ price: 800 });
    const better = watch({
      price: 300,
      movement: automatic(80),
      construction: { ...base.construction, waterResistanceM: 100 },
    });
    expect(technicalAdvantages(base, better)).toEqual([
      "Mouvement mécanique",
      "Étanche à 100 m au lieu de 50 m",
    ]);
  });

  it("écarte une montre moins bien équipée sur un seul point", () => {
    const base = watch({ price: 800, movement: automatic(80) });
    expect(technicalAdvantages(base, watch({ price: 300 }))).toBeNull();
    expect(technicalAdvantages(base, watch({ price: 300, movement: automatic(42) }))).toBeNull();
  });

  it("ne promet rien sans preuve : une donnée connue chez l'une doit l'être chez l'autre", () => {
    const base = watch({ price: 800, movement: automatic(80) });
    expect(technicalAdvantages(base, watch({ price: 300, movement: automatic(null) }))).toBeNull();
  });

  it("ne compare que des tailles proches et garde les matières nobles", () => {
    const base = watch({ price: 800, diameterMm: 34 });
    expect(technicalAdvantages(base, watch({ price: 300, diameterMm: 40 }))).toBeNull();
    const gold = watch({
      price: 3000,
      construction: { ...base.construction, nobleMaterial: "Or rose 18 carats" },
    });
    expect(technicalAdvantages(gold, watch({ price: 900 }))).toBeNull();
  });

  it("garde toutes les fonctions de la montre regardée", () => {
    const chrono = watch({
      price: 800,
      movement: { ...watch({ price: 0 }).movement, complications: ["chronograph"] },
    });
    expect(technicalAdvantages(chrono, watch({ price: 300 }))).toBeNull();
  });

  it("compare la garantie quand elle est connue", () => {
    const base = watch({ price: 800, warrantyMonths: 24 });
    expect(technicalAdvantages(base, watch({ price: 300, warrantyMonths: 36 }))).toEqual([
      "Garantie de 3 ans",
    ]);
    expect(technicalAdvantages(base, watch({ price: 300 }))).toBeNull();
  });
});

describe("findAlternatives", () => {
  it("propose des montres du même usage nettement moins chères", () => {
    const base = watch({ price: 800 });
    const cheap = watch({ price: 300, movement: automatic(80) });
    const almost = watch({ price: 760 });
    const dress = watch({ price: 300, family: "habillee" });
    const alternatives = findAlternatives([base, cheap, almost, dress]).get(base.id);
    expect(alternatives).toEqual([
      { watchId: cheap.id, savingCents: 50_000, advantages: ["Mouvement mécanique"] },
    ]);
  });

  it("ne propose ni pièce vintage, ni montre plus produite, et ne compare pas une pièce vintage", () => {
    const base = watch({ price: 800 });
    const old = watch({ price: 300, vintage: true, available: false });
    const gone = watch({ price: 300, available: false });
    expect(findAlternatives([base, old, gone]).get(base.id)).toBeUndefined();
    const vintageBase = watch({ price: 3000, vintage: true, available: false });
    expect(
      findAlternatives([vintageBase, watch({ price: 300 })]).get(vintageBase.id),
    ).toBeUndefined();
  });

  it("garde une seule déclinaison par modèle, la moins chère", () => {
    const base = watch({ price: 800 });
    const blue = watch({ price: 400, name: "PRX 40" });
    const green = watch({ price: 350, name: "PRX 40" });
    expect(
      findAlternatives([base, blue, green])
        .get(base.id)!
        .map((a) => a.watchId),
    ).toEqual([green.id]);
  });
});

describe("technicalAdvantages (construction)", () => {
  it("exige la lunette céramique et la couronne vissée si la montre regardée les a", () => {
    const base = watch({ price: 2000 });
    const diver = {
      ...base,
      construction: { ...base.construction, ceramicBezel: true, screwDownCrown: true },
    };
    expect(technicalAdvantages(diver, watch({ price: 900 }))).toBeNull();
    expect(
      technicalAdvantages(diver, { ...watch({ price: 900 }), construction: diver.construction }),
    ).toEqual([]);
  });
});
