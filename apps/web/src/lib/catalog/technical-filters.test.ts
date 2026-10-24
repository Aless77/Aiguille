import { describe, expect, it } from "vitest";

import {
  filterFacts,
  type FilterSource,
  matchesTechnical,
  materialCategory,
  colorCategory,
  technicalFacets,
} from "./technical-filters";

const watch = (over: Partial<FilterSource> = {}): FilterSource => ({
  id: 1,
  name: "Montre",
  brandSlug: "tissot",
  brandName: "Tissot",
  collectionSlug: "prx",
  collectionName: "PRX",
  movement: "automatique",
  caliber: "Powermatic 80",
  diameterMm: 40,
  waterResistanceM: 100,
  powerReserveH: 80,
  caseMaterial: "Acier inoxydable 316L",
  crystal: "Glace saphir antireflet",
  strapMaterial: "Cuir de veau",
  dialColor: "Bleu soleillé",
  rawSpecs: {},
  ...over,
});

describe("filtres techniques", () => {
  it("regroupe les variantes sans confondre acier revêtu et boîtier en or", () => {
    expect(materialCategory("Acier inoxydable 316L avec revêtement PVD or jaune")).toBe("Acier");
    expect(materialCategory("acier et coiffe en or rose 18 carats")).toBe("Acier");
    expect(materialCategory("Or rose 18 carats")).toBe("Or");
    expect(materialCategory("Cuir d'alligator")).toBe("Cuir");
    expect(materialCategory(null)).toBeNull();
    expect(colorCategory("Argenté soleil")).toBe("Argenté");
    expect(colorCategory("Nacre blanche")).toBe("Nacre");
  });

  it("combine matières au choix, puis exige chaque fonction et équipement sélectionné", () => {
    const facts = filterFacts(
      watch({
        name: "Chronographe GMT COSC",
        rawSpecs: { "Spiral en silicium": "Oui", Nivachron: "Oui" },
      }),
    );
    expect(
      matchesTechnical(facts, {
        technical: {
          boitier: ["Acier", "Titane"],
          bracelet: ["Cuir"],
          verre: ["Saphir"],
          couleur: ["Bleu"],
          fonction: ["chronograph", "gmt"],
          equipement: ["cosc", "antimagnetique"],
        },
      }),
    ).toBe(true);
    expect(
      matchesTechnical(facts, { technical: { equipement: ["cosc", "couronne-vissee"] } }),
    ).toBe(false);
    expect(
      matchesTechnical(filterFacts(watch({ name: "Chronographe" })), {
        technical: { fonction: ["chronograph", "gmt"] },
      }),
    ).toBe(false);
  });

  it("exclut les valeurs absentes et calcule les compteurs sans les inventer", () => {
    const known = filterFacts(watch());
    const unknown = filterFacts(watch({ id: 2, crystal: null, caseMaterial: null, rawSpecs: {} }));
    expect(matchesTechnical(unknown, { technical: { verre: ["Saphir"] } })).toBe(false);
    expect(matchesTechnical(unknown, { technical: { equipement: ["cosc"] } })).toBe(false);
    expect(technicalFacets([known, unknown]).verre).toEqual([
      { value: "Saphir", label: "Saphir", count: 1 },
    ]);
  });

  it("utilise la garantie sourcée applicable et n'étend pas celle des pièces vintage", () => {
    expect(
      matchesTechnical(filterFacts(watch({ brandSlug: "longines" })), { warrantyMin: 60 }),
    ).toBe(true);
    expect(
      matchesTechnical(filterFacts(watch({ brandSlug: "longines", movement: "quartz" })), {
        warrantyMin: 60,
      }),
    ).toBe(false);
    expect(
      matchesTechnical(
        filterFacts(watch({ brandSlug: "longines", rawSpecs: { "Date de production": "1960" } })),
        { warrantyMin: 60 },
      ),
    ).toBe(false);
    expect(
      matchesTechnical(filterFacts(watch({ brandSlug: "inconnue" })), { warrantyMin: 24 }),
    ).toBe(false);
  });
});
