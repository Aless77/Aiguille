import { describe, expect, it } from "vitest";

import { type BrandCountryRow, buildEuropeIndex } from "./europe-index";

const row = (
  watchId: number,
  country: string,
  priceCents: number | null,
  currency = "EUR",
  availability: BrandCountryRow["availability"] = "in_stock",
): BrandCountryRow => ({
  brandSlug: "tissot",
  brandName: "Tissot",
  watchId,
  country,
  priceCents,
  currency,
  availability,
});

describe("buildEuropeIndex", () => {
  it("calcule l'écart médian avec la France et la part en stock par pays", () => {
    const rows = [
      row(1, "FR", 100000),
      row(2, "FR", 50000),
      row(3, "FR", 80000),
      row(1, "CH", 83355, "CHF"), // 90 000 € : -10 %
      row(2, "CH", 41678, "CHF"), // 45 000 € : -10 %
      row(3, "CH", 81500, "CHF", "out_of_stock"), // 88 003 € : +10 %
      row(1, "DE", 100000),
      row(2, "DE", 50000),
      row(3, "DE", 80000),
    ];
    const [tissot] = buildEuropeIndex(rows, { CHF: 0.9261 });
    expect(
      tissot?.countries.map((c) => [c.country, c.medianDeltaPercent, c.compared, c.inStockPercent]),
    ).toEqual([
      ["CH", -10, 3, 67],
      ["DE", 0, 3, 100],
    ]);
  });

  it("écarte les pays avec trop peu de montres comparables", () => {
    const rows = [row(1, "FR", 100000), row(1, "IT", 100000)];
    expect(buildEuropeIndex(rows, {})).toEqual([]);
    expect(buildEuropeIndex(rows, {}, 1)[0]?.countries[0]?.country).toBe("IT");
  });
});
