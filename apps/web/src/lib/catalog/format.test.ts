import { describe, expect, it } from "vitest";

import { displayName, formatPrice, truncate, watchSummary } from "./format";

describe("formatPrice", () => {
  it("formate en euros à la française", () => {
    expect(formatPrice(77500)).toBe("775 €");
    expect(formatPrice(125000)).toBe("1 250 €");
    expect(formatPrice(null)).toBeNull();
  });
});

describe("displayName", () => {
  it("ajoute la marque seulement si absente", () => {
    expect(displayName("Tissot", "Tissot PRX 40mm")).toBe("Tissot PRX 40mm");
    expect(displayName("Hamilton", "Khaki Field Mechanical")).toBe(
      "Hamilton Khaki Field Mechanical",
    );
  });
});

describe("watchSummary", () => {
  it("rédige une phrase factuelle à partir des données", () => {
    expect(
      watchSummary({
        brandName: "Hamilton",
        name: "Khaki Field Mechanical",
        reference: "H69409930",
        movement: "manuel",
        caliber: "H-50",
        diameterMm: 38,
        waterResistanceM: 50,
        powerReserveH: 80,
        catalogPriceCents: 69500,
      }),
    ).toBe(
      "La Hamilton Khaki Field Mechanical (référence H69409930) est une montre à remontage manuel de 38 mm, équipée du calibre H-50, étanche à 50 m, avec 80 heures de réserve de marche. Prix catalogue officiel relevé : 695 €.",
    );
  });

  it("reste correcte avec peu de données", () => {
    expect(
      watchSummary({
        brandName: "Tissot",
        name: "Tissot Le Locle 25.3mm",
        reference: "T41.1.183.16",
        movement: null,
        caliber: null,
        diameterMm: 25.3,
        waterResistanceM: null,
        powerReserveH: null,
        catalogPriceCents: null,
      }),
    ).toBe("La Tissot Le Locle 25.3mm (référence T41.1.183.16) est une montre de 25,3 mm.");
  });
});

describe("truncate", () => {
  it("coupe sur une limite de mot", () => {
    expect(truncate("un deux trois quatre", 12)).toBe("un deux…");
    expect(truncate("court", 12)).toBe("court");
  });
});
