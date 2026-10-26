import { describe, expect, it } from "vitest";

import {
  BRAND_INFO,
  careTipsFor,
  movementMaker,
  servicePricesFor,
  warrantyFor,
} from "./brand-info.ts";

describe("warrantyFor", () => {
  it("lit les garanties officielles Citizen et Seiko sans supposer leur pays de fabrication", () => {
    expect(warrantyFor("citizen", null)?.months).toBe(36);
    expect(warrantyFor("seiko", null)?.months).toBe(36);
    expect(BRAND_INFO.citizen?.madeIn).toBeNull();
    expect(BRAND_INFO.seiko?.madeIn).toBeNull();
  });
  it("préfère la garantie de la fiche, avec la page de détail de la marque", () => {
    expect(warrantyFor("tissot", 36)).toMatchObject({
      months: 36,
      source: "Fiche officielle de la montre",
      page: "https://www.tissotwatches.com/fr-fr/customer-service-warranty.html",
    });
    expect(warrantyFor("tissot", null)).toMatchObject({ months: 24 });
  });

  it("applique la durée étendue selon le mouvement", () => {
    expect(warrantyFor("longines", null, "automatique")?.months).toBe(60);
    expect(warrantyFor("longines", null, "quartz")?.months).toBe(24);
    expect(warrantyFor("longines", null)?.excludes).toContain("durée de vie de la pile");
  });

  it("ne renvoie rien sans source vérifiée", () => {
    expect(warrantyFor("oris", null)).toBeNull();
    expect(movementMaker("longines", "L888.5")).toBeNull();
  });
});

describe("servicePricesFor", () => {
  it("distingue les écrans tactiles, le solaire et les pièces vintage", () => {
    expect(servicePricesFor("tissot", "solaire", true, { tactile: true })).toMatchObject({
      full: 295,
      partial: 70,
    });
    expect(servicePricesFor("tissot", "solaire", false)).toMatchObject({
      full: null,
      partial: null,
    });
    expect(servicePricesFor("hamilton", null, false)).toMatchObject({ full: null, partial: null });
    expect(servicePricesFor("longines", "manuel", false, { vintage: true })).toMatchObject({
      full: null,
      partial: null,
      serviceWarrantyMonths: null,
    });
  });
  it("choisit la ligne de tarif selon le mouvement et le chronographe", () => {
    expect(servicePricesFor("hamilton", "automatique", false)).toMatchObject({
      full: 230,
      partial: 60,
      waterResistanceCheck: "une fois par an",
    });
    expect(servicePricesFor("hamilton", "quartz", true)).toMatchObject({ full: 250, partial: 75 });
    expect(servicePricesFor("longines", "manuel", true)).toMatchObject({ full: 510 });
    expect(servicePricesFor("tissot", "automatique", false)).toMatchObject({
      full: 195,
      partial: 55,
    });
  });
});

describe("movementMaker et careTipsFor", () => {
  it("attribue un fabricant seulement si une page de la marque l'établit", () => {
    expect(movementMaker("hamilton", "H-10")?.value).toBe("ETA, en collaboration avec Hamilton");
    expect(movementMaker("tissot", "Powermatic 80")).toBeNull();
  });

  it("adapte les conseils à la montre et dit qui les recommande", () => {
    const tips = careTipsFor("longines", {
      movement: "automatique",
      screwDownCrown: true,
      chronograph: true,
      antimagnetic: true,
      waterResistanceM: 300,
    });
    expect(tips.map((t) => t.id)).toEqual([
      "screwDownCrown",
      "chronographPushers",
      "saltWater",
      "temperature",
      "chemicals",
    ]);
    expect(tips.every((t) => t.source?.startsWith("https://www.longines.com"))).toBe(true);
    const quartz = careTipsFor("tissot", {
      movement: "quartz",
      screwDownCrown: false,
      chronograph: false,
      antimagnetic: false,
      waterResistanceM: 30,
    });
    expect(quartz.map((t) => t.id)).toContain("batteryAtDealer");
    // Les conseils publiés par Tissot sont reliés à la page officielle.
    expect(quartz.find((t) => t.id === "batteryAtDealer")?.source).toContain("tissotwatches.com");
  });
});

describe("BRAND_INFO", () => {
  it("date et source chaque information renseignée", () => {
    for (const info of Object.values(BRAND_INFO)) {
      for (const entry of [
        info.warranty,
        info.service,
        info.madeIn,
        info.care,
        info.group,
        ...info.movementMakers,
      ]) {
        if (!entry) continue;
        expect(entry.source).toMatch(/^https:\/\//);
        expect(entry.checkedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      }
    }
  });
});
