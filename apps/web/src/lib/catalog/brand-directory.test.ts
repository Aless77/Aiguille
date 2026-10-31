import { describe, expect, it } from "vitest";

import {
  groupBrandsByLetter,
  matchBrands,
  sortBrands,
  withFavorite,
} from "@/lib/catalog/brand-directory";

const named = (...names: string[]) => names.map((name) => ({ name }));

describe("sortBrands", () => {
  it("trie sans tenir compte de la casse ni des accents", () => {
    const sorted = sortBrands(named("Tissot", "Épée 1839", "hamilton", "Longines"), "fr");
    expect(sorted.map((b) => b.name)).toEqual(["Épée 1839", "hamilton", "Longines", "Tissot"]);
  });

  it("ne modifie pas la liste reçue", () => {
    const brands = named("Tissot", "Hamilton");
    sortBrands(brands, "fr");
    expect(brands[0]?.name).toBe("Tissot");
  });
});

describe("matchBrands", () => {
  const brands = named("Baume & Mercier", "Mercier", "Tissot");

  it("rend tout pour une recherche vide", () => {
    expect(matchBrands(brands, "  ")).toEqual(brands);
  });

  it("ignore les accents et la casse", () => {
    expect(matchBrands(named("Épée 1839"), "EPEE")).toEqual(named("Épée 1839"));
  });

  it("place d'abord les marques qui commencent par la recherche", () => {
    expect(matchBrands(brands, "merc").map((b) => b.name)).toEqual(["Mercier", "Baume & Mercier"]);
  });

  it("ne rend rien sans correspondance", () => {
    expect(matchBrands(brands, "rolex")).toEqual([]);
  });
});

describe("groupBrandsByLetter", () => {
  it("regroupe par initiale sans accent, chiffres sous #", () => {
    const groups = groupBrandsByLetter(named("107 Watch", "Épée 1839", "Eterna", "Tissot"));
    expect(groups.map((g) => [g.letter, g.brands.length])).toEqual([
      ["#", 1],
      ["E", 2],
      ["T", 1],
    ]);
  });
});

describe("withFavorite", () => {
  const tissot = { slug: "tissot", name: "Tissot" };
  const hamilton = { slug: "hamilton", name: "Hamilton" };

  it("ajoute à la fin", () => {
    expect(withFavorite([tissot], hamilton, true)).toEqual([tissot, hamilton]);
  });

  it("n'ajoute pas deux fois la même marque", () => {
    expect(withFavorite([tissot], tissot, true)).toEqual([tissot]);
  });

  it("retire", () => {
    expect(withFavorite([tissot, hamilton], tissot, false)).toEqual([hamilton]);
  });
});
