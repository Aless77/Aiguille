import { describe, expect, it } from "vitest";

import { loadCatalogParams, serializeCatalogParams, toFilter } from "./search-params";

describe("paramètres du catalogue", () => {
  it("lit les filtres depuis l'URL et ignore les valeurs invalides", () => {
    const params = loadCatalogParams(
      "?marque=tissot,hamilton&mouvement=automatique,inconnu&prixMax=1000&tri=prix-desc&page=2",
    );
    expect(toFilter(params)).toEqual({
      brands: ["tissot", "hamilton"],
      movements: ["automatique"],
      priceMin: null,
      priceMax: 1000,
      diameterMin: null,
      diameterMax: null,
      sort: "prix-desc",
      page: 2,
    });
  });

  it("applique les valeurs par défaut", () => {
    expect(toFilter(loadCatalogParams(""))).toMatchObject({
      brands: [],
      sort: "prix-asc",
      page: 1,
    });
  });

  it("sérialise sans les valeurs par défaut", () => {
    expect(
      serializeCatalogParams("/montres", { marque: ["tissot"], page: 1, tri: "prix-asc" }),
    ).toBe("/montres?marque=tissot");
  });
});
