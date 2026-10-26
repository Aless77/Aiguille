import { describe, expect, it } from "vitest";

import { baseName, modelKey, modelVariants, type VariantCandidate } from "./variants";

function watch(over: Partial<VariantCandidate> & { reference: string }): VariantCandidate {
  return {
    slug: over.reference.toLowerCase(),
    name: "Jazzmaster Open Heart Auto",
    diameterMm: 42,
    dialColor: "Bleu",
    caseMaterial: "Acier",
    strapMaterial: "Cuir",
    priceCents: 100_000,
    discontinued: false,
    ...over,
  };
}

describe("modelKey", () => {
  it("extrait la partie modèle de la référence selon la marque", () => {
    expect(modelKey("hamilton", "H32705141")).toBe("H32705");
    expect(modelKey("tissot", "T137.407.11.041.00")).toBe("T137.407");
    expect(modelKey("longines", "L3.781.4.76.6")).toBe("L3.781");
  });

  it("ignore les références hors motif (pièces vintage) et les marques inconnues", () => {
    expect(modelKey("longines", "8221-15491332")).toBeNull();
    expect(modelKey("longines", "NOSKU-2969920")).toBeNull();
    expect(modelKey("seiko", "SRPD55K1")).toBeNull();
  });
});

describe("baseName", () => {
  it("retire la taille et les espaces superflus", () => {
    expect(baseName("Jazzmaster Open Heart  Auto 42mm")).toBe("jazzmaster open heart auto");
    expect(baseName("Jazzmaster Open Heart Auto 40 mm")).toBe("jazzmaster open heart auto");
    expect(baseName("Longines Dolcevita 28.2 mm")).toBe("longines dolcevita");
  });
});

describe("modelVariants", () => {
  it("utilise les liens constructeur Citizen sans supposer un préfixe de référence", () => {
    const current = watch({ reference: "NJ0200-50Z", variantReferences: ["NJ0200-50W"] });
    const linked = watch({ reference: "NJ0200-50W" });
    const unrelated = watch({ reference: "NJ0200-50L" });
    const result = modelVariants("citizen", current, [current, linked, unrelated]);
    expect(result.variants.map((v) => v.watch.reference)).toEqual(["NJ0200-50W", "NJ0200-50Z"]);
    expect(
      modelVariants("seiko", watch({ reference: "SPB453J1" }), [watch({ reference: "SPB451J1" })])
        .variants,
    ).toEqual([]);
  });
  const current = watch({ reference: "H32705141" });
  const black = watch({ reference: "H32705131", dialColor: "Noir", priceCents: 90_000 });
  const steel = watch({ reference: "H32705140", strapMaterial: "Acier" });
  const smaller = watch({
    reference: "H32675141",
    name: "Jazzmaster Open Heart Auto 40 mm",
    diameterMm: 40,
  });
  const smallerGreen = watch({ reference: "H32675160", diameterMm: 40, dialColor: "Vert" });
  const other = watch({ reference: "H32505141", name: "Jazzmaster Day Date Auto" });

  it("regroupe les déclinaisons d'un même modèle et décrit ce qui les distingue", () => {
    const { variants } = modelVariants("hamilton", current, [current, black, steel, other]);
    expect(variants.map((v) => v.watch.reference)).toEqual(["H32705131", "H32705140", "H32705141"]);
    expect(variants.find((v) => v.current)?.watch).toBe(current);
    expect(variants[0]!.label).toBe("Cadran Noir · Bracelet Cuir");
    expect(variants[1]!.label).toBe("Cadran Bleu · Bracelet Acier");
  });

  it("propose les autres tailles du même nom, de préférence avec le même cadran", () => {
    const { variants, sizes } = modelVariants("hamilton", current, [
      current,
      smallerGreen,
      smaller,
      other,
    ]);
    expect(variants).toEqual([]);
    expect(sizes.map((s) => [s.diameterMm, s.watch.reference, s.current])).toEqual([
      [40, "H32675141", false],
      [42, "H32705141", true],
    ]);
  });

  it("place les montres plus produites après les actuelles", () => {
    const old = watch({
      reference: "H32705121",
      dialColor: "Beige",
      priceCents: 1,
      discontinued: true,
    });
    const { variants } = modelVariants("hamilton", current, [old, current]);
    expect(variants.map((v) => v.watch.reference)).toEqual(["H32705141", "H32705121"]);
  });

  it("ne renvoie rien pour une montre seule ou sans motif de référence", () => {
    expect(modelVariants("hamilton", current, [current, other])).toEqual({
      variants: [],
      sizes: [],
    });
    const vintage = watch({ reference: "8221-15491332" });
    expect(modelVariants("longines", vintage, [vintage, watch({ reference: "8221-1" })])).toEqual({
      variants: [],
      sizes: [],
    });
  });
});
