import { describe, expect, it } from "vitest";

import { coverage, type CoverageInput, missingBrandInfo } from "./coverage.ts";

const watch = (over: Partial<CoverageInput>): CoverageInput => ({
  brandSlug: "tissot",
  name: "Montre",
  collectionName: null,
  movement: "quartz",
  caliber: null,
  diameterMm: 40,
  waterResistanceM: null,
  powerReserveH: null,
  caseMaterial: null,
  crystal: null,
  rawSpecs: {},
  priceCents: 50_000,
  imageCount: 1,
  ...over,
});

describe("coverage", () => {
  it("mesure chaque information sur les seules montres concernées", () => {
    const rows = coverage([
      watch({ waterResistanceM: 100 }),
      watch({ movement: "automatique", powerReserveH: 80 }),
    ]);
    const get = (label: string) => rows.find((r) => r.label === label)!.byBrand.tissot;
    expect(get("Étanchéité")).toEqual({ known: 1, applicable: 2 });
    expect(get("Réserve de marche (mécaniques)")).toEqual({ known: 1, applicable: 1 });
    expect(get("Référence de pile (quartz)")).toEqual({ known: 0, applicable: 1 });
  });

  it("signale les informations de marque à sourcer", () => {
    expect(missingBrandInfo(["longines", "inconnue"], new Date("2026-11-01"))).toEqual([
      "longines : aucun fabricant de mouvement sourcé",
      "inconnue : aucune entrée dans brand-info.ts",
    ]);
  });
});

describe("missingBrandInfo (fraîcheur)", () => {
  it("signale une information vérifiée il y a plus de six mois", () => {
    const later = missingBrandInfo(["longines"], new Date("2027-06-01"));
    expect(later.some((m) => m.startsWith("longines : à revérifier"))).toBe(true);
  });
});
