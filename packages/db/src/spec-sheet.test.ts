import { describe, expect, it } from "vitest";

import { buildSpecSheet, type SheetInput } from "./spec-sheet.ts";

const base = (over: Partial<SheetInput> = {}): SheetInput => ({
  brandSlug: "tissot",
  name: "Montre",
  collectionName: null,
  movement: "automatique",
  caliber: null,
  diameterMm: 40,
  thicknessMm: 11.2,
  lugWidthMm: 20,
  waterResistanceM: 100,
  powerReserveH: 80,
  caseMaterial: "Acier inoxydable 316L",
  crystal: "Glace saphir",
  dialColor: "Bleu",
  strapMaterial: "Cuir",
  storeCount: 0,
  rawSpecs: {},
  ...over,
});

const row = (sheet: ReturnType<typeof buildSpecSheet>, group: string, label: string) =>
  sheet.groups.find((g) => g.id === group)?.rows.find((r) => r.label === label);

describe("buildSpecSheet", () => {
  it("donne les mêmes rubriques et les mêmes lignes à toutes les marques", () => {
    const labels = (s: ReturnType<typeof buildSpecSheet>) =>
      s.groups.map((g) => [g.id, g.rows.map((r) => r.label)]);
    const tissot = buildSpecSheet(base());
    const longines = buildSpecSheet(base({ brandSlug: "longines" }));
    expect(labels(longines)).toEqual(labels(tissot));
    expect(tissot.groups.map((g) => g.id)).toEqual([
      "mouvement",
      "boitier",
      "cadran",
      "bracelet",
      "garantie",
    ]);
  });

  it("harmonise les libellés et les unités de chaque marque", () => {
    const hamilton = buildSpecSheet(
      base({
        brandSlug: "hamilton",
        rawSpecs: { "Lug to lug": "47mm", "Largeur de la boucle": "18mm" },
      }),
    );
    const longines = buildSpecSheet(
      base({
        brandSlug: "longines",
        rawSpecs: { "Boîtier · Hauteur corne à corne": "47.00 mm", "Boîtier · Poids": "100.0 g" },
      }),
    );
    expect(row(hamilton, "boitier", "Corne à corne")?.value).toBe("47 mm");
    expect(row(longines, "boitier", "Corne à corne")?.value).toBe("47 mm");
    expect(row(longines, "boitier", "Poids")?.value).toBe("100 g");
    expect(row(hamilton, "bracelet", "Largeur à la boucle")?.value).toBe("18 mm");
  });

  it("lit les libellés aux accents décomposés (Tissot)", () => {
    const sheet = buildSpecSheet(base({ rawSpecs: { "Réserve de marche (heures)": "80" } }));
    expect(sheet.others).toEqual([]);
  });

  it("affiche « non communiqué » (null) sans inventer, et garde le reste en « autres »", () => {
    const sheet = buildSpecSheet(
      base({ brandSlug: "inconnue", rawSpecs: { "Gravure spéciale": "Oui" } }),
    );
    expect(row(sheet, "cadran", "Index")?.value).toBeNull();
    expect(row(sheet, "garantie", "Révision complète")?.value).toBeNull();
    expect(sheet.others).toEqual([["Gravure spéciale", "Oui"]]);
  });

  it("n'affiche les dimensions que pour une montre non ronde", () => {
    const round = buildSpecSheet(base({ rawSpecs: { "Boîtier · Dimension": "40.00 x 40.00 mm" } }));
    const tank = buildSpecSheet(base({ rawSpecs: { "Dimension du boîtier": "19mm x 27mm" } }));
    expect(row(round, "boitier", "Dimensions")).toBeUndefined();
    expect(row(tank, "boitier", "Dimensions")?.value).toBe("19 × 27 mm");
  });

  it("ajoute l'historique d'une pièce vintage", () => {
    const sheet = buildSpecSheet(
      base({
        brandSlug: "longines",
        rawSpecs: {
          "Date de production": "1936",
          "Numéro de série": "5410422",
          Documents: "Certificat d'authenticité Longines",
        },
      }),
    );
    expect(sheet.groups.at(-1)).toMatchObject({
      id: "historique",
      rows: expect.arrayContaining([
        { label: "Année de production", value: "1936" },
        { label: "Numéro de série", value: "5410422" },
      ]),
    });
  });

  it("donne la pile des montres à quartz et la garantie de la fiche", () => {
    const sheet = buildSpecSheet(
      base({
        movement: "quartz",
        powerReserveH: null,
        rawSpecs: {
          "Mouvement · Pile": "RENATA 321 - SR716SW - 1.55V",
          Garantie: "2 ans de garantie",
        },
      }),
    );
    expect(row(sheet, "mouvement", "Pile")?.value).toBe("SR716SW");
    expect(row(sheet, "mouvement", "Réserve de marche")?.value).toBe("Sans objet (quartz)");
    expect(row(sheet, "garantie", "Garantie internationale")?.value).toBe("2 ans");
  });
});

describe("buildSpecSheet (garantie et révision de la marque)", () => {
  it("applique les tarifs Tissot et la garantie COSC sans étendre tous les solaires", () => {
    const chrono = buildSpecSheet(base({ name: "Chronographe COSC" }));
    expect(row(chrono, "garantie", "Révision complète")?.value).toBe("290 €");
    expect(row(chrono, "garantie", "Garantie internationale")?.value).toBe("3 ans");
    const tactile = buildSpecSheet(base({ name: "T-Touch Connect Solar", movement: "solaire" }));
    expect(row(tactile, "garantie", "Révision complète")?.value).toBe("295 €");
    expect(row(tactile, "garantie", "Garantie internationale")?.value).toBe("2 ans");
    const lightmaster = buildSpecSheet(
      base({ name: "PRC 100 Lightmaster Solar", movement: "solaire" }),
    );
    expect(row(lightmaster, "garantie", "Garantie internationale")?.value).toBe("3 ans");
    expect(row(lightmaster, "garantie", "Révision complète")?.value).toBeNull();
  });

  it("n'attribue pas de forfait courant ni de conseils de baignade aux pièces vintage", () => {
    const sheet = buildSpecSheet(
      base({ brandSlug: "longines", rawSpecs: { "Date de production": "1936" } }),
    );
    expect(row(sheet, "garantie", "Révision complète")?.value).toBeNull();
    expect(row(sheet, "garantie", "Révision complète")?.note).toContain("devis");
    expect(row(sheet, "garantie", "Garantie internationale")?.value).toBe("2 ans");
    expect(sheet.care.map((t) => t.id)).toContain("vintageWater");
    expect(sheet.care.map((t) => t.id)).not.toContain("saltWater");
  });
  it("applique la règle sourcée de la marque et sa grille de révision", () => {
    const auto = buildSpecSheet(base({ brandSlug: "longines" }));
    expect(row(auto, "garantie", "Garantie internationale")?.value).toBe("5 ans");
    expect(row(auto, "garantie", "Révision complète")?.value).toBe("390 €");
    expect(row(auto, "garantie", "Révision complète conseillée")?.value).toBe("Tous les 6 à 8 ans");
    expect(row(auto, "garantie", "Contrôle d'étanchéité conseillé")?.value).toBe("Une fois par an");
    expect(row(auto, "garantie", "Garantie internationale")?.link?.href).toBe(
      "https://www.longines.com/fr/customer-service/warranty",
    );

    const quartz = buildSpecSheet(
      base({ brandSlug: "longines", movement: "quartz", powerReserveH: null }),
    );
    expect(row(quartz, "garantie", "Garantie internationale")?.value).toBe("2 ans");
    expect(row(quartz, "garantie", "Remplacement de la pile")?.value).toBe("35 €");
  });

  it("préfère la garantie affichée sur la fiche", () => {
    const sheet = buildSpecSheet(
      base({ brandSlug: "longines", rawSpecs: { Garantie: "Garantie Longines de 5 ans" } }),
    );
    expect(row(sheet, "garantie", "Garantie internationale")?.value).toBe("5 ans");
  });

  it("garde les mêmes lignes pour une marque sans grille publiée", () => {
    const tissot = buildSpecSheet(base({ brandSlug: "inconnue" }));
    expect(row(tissot, "garantie", "Révision complète")?.value).toBeNull();
    expect(row(tissot, "garantie", "Révision complète conseillée")?.value).toBeNull();
  });
});
