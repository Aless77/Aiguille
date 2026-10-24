import { describe, expect, it } from "vitest";

import {
  catalogRange,
  hasCatalogFilters,
  loadCatalogParams,
  serializeCatalogParams,
  toFilter,
} from "./search-params";

describe("paramètres du catalogue", () => {
  it("lit les filtres depuis l'URL et ignore les valeurs invalides", () => {
    const params = loadCatalogParams(
      "?marque=tissot,hamilton&mouvement=automatique,inconnu&prixMax=1000&tri=prix-desc&page=2",
    );
    expect(toFilter(params)).toMatchObject({
      search: "",
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

  it("conserve les filtres avancés, valide leurs bornes et exclut leurs URL de l'index", () => {
    const params = loadCatalogParams(
      "?mouvement=quartz,automatique&boitier=Acier&fonction=chronograph,gmt&equipement=cosc&etancheiteMin=100&reserveMin=80&epaisseurMax=10.5&entrecornes=20&garantieMin=60&enStock=true&statut=arretee",
    );
    expect(toFilter(params)).toMatchObject({
      movements: ["quartz", "automatique"],
      technical: { boitier: ["Acier"], fonction: ["chronograph", "gmt"], equipement: ["cosc"] },
      waterMin: 100,
      reserveMin: 80,
      thicknessMax: 10.5,
      lugWidth: 20,
      warrantyMin: 60,
      inStock: true,
      status: "discontinued",
    });
    expect(hasCatalogFilters(params)).toBe(true);
    expect(
      toFilter(loadCatalogParams("?epaisseurMax=-1&enStock=invalide&statut=inconnu")),
    ).toMatchObject({ thicknessMax: null, inStock: false, status: null });
  });

  it("conserve la recherche et les diamètres décimaux dans une URL partageable", () => {
    const url = serializeCatalogParams("/montres/tissot/prx", {
      recherche: "T137.407",
      diametreMin: 35.5,
    });
    const query = new URL(url, "https://aiguille.test").searchParams;
    expect(toFilter(loadCatalogParams(query))).toMatchObject({
      search: "T137.407",
      diameterMin: 35.5,
    });
    expect(hasCatalogFilters(loadCatalogParams(query))).toBe(true);
    expect(hasCatalogFilters(loadCatalogParams(""))).toBe(false);
  });

  it("valide les bornes, remet min/max dans l'ordre et empêche une page négative", () => {
    expect(catalogRange(1000, 500)).toEqual([500, 1000]);
    expect(catalogRange(-1, Number.POSITIVE_INFINITY)).toEqual([null, null]);
    expect(
      toFilter(loadCatalogParams("?prixMin=0&prixMax=0&page=-2&recherche=%20PRX%20")),
    ).toMatchObject({ priceMin: 0, priceMax: 0, page: 1, search: "PRX" });
    expect(toFilter(loadCatalogParams(`?recherche=${"x".repeat(121)}`)).search).toBe("");
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
