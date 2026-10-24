import { describe, expect, it } from "vitest";

import {
  extractConstructionFacts,
  extractMovementFacts,
  extractOwnershipFacts,
  family,
  priceBand,
  type WatchSource,
} from "./facts.ts";

const watch = (over: Partial<WatchSource> = {}): WatchSource => ({
  name: "Montre de test",
  collectionName: null,
  movement: "automatique",
  caliber: null,
  diameterMm: 40,
  waterResistanceM: 100,
  powerReserveH: null,
  caseMaterial: "Acier inoxydable",
  crystal: "Glace saphir",
  rawSpecs: {},
  ...over,
});

describe("extractMovementFacts", () => {
  it("lit la fiche Longines (fréquence, silicium, chronomètre)", () => {
    const facts = extractMovementFacts(
      watch({
        caliber: "L888.5",
        powerReserveH: 72,
        rawSpecs: {
          "Mouvement · Description mouvement":
            "Mouvement mécanique à remontage automatique oscillant à 25 200 vibrations par heure, équipé d'un ressort spiral en monocristal de silicium",
          "Général · Chronometer Officially Certified": "Oui",
        },
      }),
    );
    expect(facts).toMatchObject({
      caliber: "L888.5",
      frequencyVph: 25200,
      siliconHairspring: true,
      antimagnetic: true,
      chronometer: true,
      complications: [],
    });
  });

  it("lit la fiche Hamilton (Nivachron) sans le confondre avec du silicium", () => {
    const facts = extractMovementFacts(watch({ rawSpecs: { Nivachron: "Oui" } }));
    expect(facts.siliconHairspring).toBe(false);
    expect(facts.antimagnetic).toBe(true);
    expect(extractMovementFacts(watch({ rawSpecs: { Nivachron: "Non" } })).antimagnetic).toBe(
      false,
    );
  });

  it("repère les complications, sans prendre « chronomètre » pour un chronographe", () => {
    const chrono = extractMovementFacts(
      watch({
        name: "PRX Chronograph",
        rawSpecs: { "Fonctions du mouvement": "Phases de Lune, Second fuseau horaire" },
      }),
    );
    expect(chrono.complications).toEqual(["chronograph", "gmt", "moonphase"]);
    expect(
      extractMovementFacts(watch({ name: "Ultra-chron Chronomètre certifié" })).complications,
    ).toEqual([]);
  });

  it("ne suppose rien que la marque ne publie pas", () => {
    expect(extractMovementFacts(watch())).toMatchObject({
      frequencyVph: null,
      siliconHairspring: false,
      antimagnetic: false,
      chronometer: false,
    });
  });
});

describe("extractConstructionFacts", () => {
  it("lit verre, matière, fond et couronne", () => {
    const facts = extractConstructionFacts(
      watch({
        caseMaterial: "Titane grade 2",
        crystal: "Glace saphir avec revêtement antireflet",
        rawSpecs: {
          "Boîtier · Fond": "Fond transparent avec glace saphir",
          "Couronne vissée": "Oui",
        },
      }),
    );
    expect(facts).toMatchObject({
      sapphire: true,
      antiReflective: true,
      nobleMaterial: "Titane grade 2",
      exhibitionCaseback: true,
      screwDownCrown: true,
    });
  });
});

describe("priceBand et family", () => {
  it("range les prix par gamme", () => {
    expect(priceBand(45_000)).toBe("entree");
    expect(priceBand(150_000)).toBe("milieu");
    expect(priceBand(2_000_000)).toBe("luxe");
    expect(priceBand(null)).toBeNull();
  });

  const familyOf = (over: Partial<WatchSource>) => {
    const w = watch(over);
    return family(w, extractMovementFacts(w), extractConstructionFacts(w));
  };

  it("déduit la famille du nom, de la collection et des caractéristiques", () => {
    expect(familyOf({ collectionName: "HydroConquest" })).toBe("plongee");
    expect(familyOf({ waterResistanceM: 300 })).toBe("plongee");
    expect(familyOf({ name: "Spirit Zulu Time GMT" })).toBe("gmt");
    expect(familyOf({ name: "PR 516 Chronograph" })).toBe("chronographe");
    expect(familyOf({ collectionName: "Khaki Aviation" })).toBe("pilote");
    expect(familyOf({ rawSpecs: { "Cadran · Diamants": "Cadran serti de 12 diamants" } })).toBe(
      "joaillerie",
    );
    expect(familyOf({ collectionName: "Le Locle" })).toBe("habillee");
    expect(familyOf({ collectionName: "PRX" })).toBe("quotidien");
  });
});

describe("extractOwnershipFacts et constructions Tissot", () => {
  it("lit la garantie, le pays, la pile et le bracelet", () => {
    const facts = extractOwnershipFacts(
      watch({
        rawSpecs: {
          Garantie: "3 ans de garantie",
          "Pays de fabrication": "Suisse",
          "Mouvement · Pile": "RENATA 321 - SR716SW - 1.55V",
          "Mouvement · Fonction spéciale": "E.O.L.",
          "Option du bracelet": "Bracelet interchangeable à ouverture facile",
          "Type de boucle": "Boucle déployante avec boutons poussoirs",
          "Mouvement · Chronographe": "Chronographe à roue à colonne, Flyback",
        },
      }),
    );
    expect(facts).toEqual({
      warrantyMonths: 36,
      madeIn: "Suisse",
      battery: "SR716SW",
      endOfLifeIndicator: true,
      interchangeableStrap: true,
      deployantClasp: true,
      chronographMechanism: ["Roue à colonnes", "Flyback"],
      vintageYear: null,
    });
  });

  it("repère les pièces vintage (Longines Heritage)", () => {
    expect(
      extractOwnershipFacts(watch({ rawSpecs: { "Date de production": "1958" } })).vintageYear,
    ).toBe(1958);
  });

  it("lit les libellés Tissot du fond, de la couronne et de la lunette", () => {
    const facts = extractConstructionFacts(
      watch({
        rawSpecs: {
          "Options de la boîte": "Fond de boîte transparent, Couronne et fond de boîte vissés",
          "Matière de la lunette": "Acier inoxydable 316L et céramique",
        },
      }),
    );
    expect(facts).toMatchObject({
      exhibitionCaseback: true,
      screwDownCrown: true,
      ceramicBezel: true,
    });
  });
});
