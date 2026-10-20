import { describe, expect, it } from "vitest";

import { type StorePoint } from "./queries";
import { searchStores, storeAddress, storeMapsUrl, storesInBounds } from "./stores";

const lyon: StorePoint = {
  name: "Bijouterie Étoile & Fils",
  street: "12 rue de la République",
  postalCode: "69002",
  city: "Lyon",
  country: "FR",
  brandName: "Longines",
  brandSlug: "longines",
  latitude: 45.76,
  longitude: 4.83,
};
const zurich: StorePoint = {
  ...lyon,
  name: "Horlogerie du Lac",
  street: null,
  postalCode: null,
  city: "Zürich",
  country: "CH",
  latitude: 47.37,
  longitude: 8.54,
};
const stores = [lyon, zurich];

describe("boutiques dans la zone de la carte", () => {
  it("conserve la liste complète avant le chargement de la carte", () => {
    expect(storesInBounds(stores, null)).toEqual(stores);
  });
  it("filtre les adresses par latitude et longitude, bornes comprises", () => {
    expect(storesInBounds(stores, { west: 4, east: 5, south: 45, north: 46 })).toEqual([lyon]);
    expect(
      storesInBounds([lyon], { west: lyon.longitude, east: 5, south: lyon.latitude, north: 46 }),
    ).toEqual([lyon]);
    expect(storesInBounds(stores, { west: 4, east: 5, south: 0, north: 1 })).toEqual([]);
  });
  it("gère les copies de la carte et le passage de l'antiméridien", () => {
    expect(storesInBounds([lyon], { west: 364, east: 365, south: 45, north: 46 })).toEqual([lyon]);
    const pacific = { ...lyon, longitude: -175 };
    expect(
      storesInBounds([pacific, lyon], { west: 170, east: 190, south: -90, north: 90 }),
    ).toEqual([pacific]);
    expect(storesInBounds(stores, { west: -200, east: 200, south: -90, north: 90 })).toEqual(
      stores,
    );
  });
});

describe("recherche de boutiques", () => {
  it("retrouve un pays en français ou par son code", () => {
    expect(searchStores(stores, "France")).toEqual([lyon]);
    expect(searchStores(stores, "CH")).toEqual([zurich]);
  });
  it("ignore la casse et les accents des villes et adresses", () => {
    expect(searchStores(stores, "ZURICH")).toEqual([zurich]);
    expect(searchStores(stores, "republique LYON")).toEqual([lyon]);
  });
  it("combine nom, code postal et adresse dans n'importe quel ordre", () => {
    expect(searchStores(stores, "69002 etoile 12")).toEqual([lyon]);
    expect(searchStores(stores, "rue-de-la-republique")).toEqual([lyon]);
  });
  it("ne conserve pas une correspondance sur un seul mot", () => {
    expect(searchStores(stores, "Lyon Suisse")).toEqual([]);
  });
  it("réinitialise la liste pour une recherche vide", () => {
    expect(searchStores(stores, "  ")).toEqual(stores);
    expect(searchStores(stores, "---")).toEqual(stores);
  });
  it("retourne une liste vide pour une adresse inconnue", () => {
    expect(searchStores(stores, "adresse introuvable")).toEqual([]);
  });
});

describe("lien Google Maps", () => {
  it("encode le nom et l'adresse complète, y compris le pays", () => {
    const url = new URL(storeMapsUrl(lyon.name, storeAddress(lyon)));
    expect(url.origin + url.pathname).toBe("https://www.google.com/maps/search/");
    expect(url.searchParams.get("api")).toBe("1");
    expect(url.searchParams.get("query")).toBe(
      "Bijouterie Étoile & Fils, 12 rue de la République, 69002 Lyon, France",
    );
  });
  it("gère les adresses incomplètes sans afficher null", () => {
    expect(storeAddress(zurich)).toBe("Zürich, Suisse");
  });
});
