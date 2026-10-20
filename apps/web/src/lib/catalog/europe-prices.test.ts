import { describe, expect, it } from "vitest";

import { buildEuropePrices, type CountryPriceRow, europeSummary } from "./europe-prices";

const row = (country: string, priceCents: number | null, currency = "EUR"): CountryPriceRow => ({
  country,
  priceCents,
  currency,
  availability: "in_stock",
  observedAt: "2026-10-19T03:00:00Z",
});

const RATES = { CHF: 0.9261, GBP: 0.84205 };

describe("buildEuropePrices", () => {
  it("convertit en euros, compare à la France et trie du moins cher au plus cher", () => {
    const prices = buildEuropePrices(
      [row("FR", 260000), row("DE", 255000), row("CH", 220000, "CHF"), row("GB", 230000, "GBP")],
      RATES,
    );
    expect(prices.map((p) => [p.country, p.eurCents, p.deltaPercent])).toEqual([
      ["CH", 237555, -8.6],
      ["DE", 255000, -1.9],
      ["FR", 260000, 0],
      ["GB", 273143, 5.1],
    ]);
    expect(prices[0]).toMatchObject({ name: "Suisse", localCents: 220000, currency: "CHF" });
  });

  it("écarte les pays sans prix ou sans taux de change", () => {
    const prices = buildEuropePrices(
      [row("FR", 77500), row("DE", null), row("SE", 909500, "SEK")],
      RATES,
    );
    expect(prices.map((p) => p.country)).toEqual(["FR"]);
  });

  it("laisse l'écart vide sans prix français", () => {
    expect(buildEuropePrices([row("DE", 77500)], RATES)[0]?.deltaPercent).toBeNull();
  });
});

describe("europeSummary", () => {
  it("nomme le pays le moins cher", () => {
    const prices = buildEuropePrices([row("FR", 260000), row("CH", 220000, "CHF")], RATES);
    expect(europeSummary(prices)).toBe(
      "Moins chère en Suisse : environ 8,6 % de moins qu'en France après conversion.",
    );
  });

  it("accorde la préposition au pays", () => {
    const prices = buildEuropePrices([row("FR", 260000), row("GB", 180000, "GBP")], RATES);
    expect(europeSummary(prices)).toMatch(/^Moins chère au Royaume-Uni/);
  });

  it("signale quand la France est la moins chère, et se tait sans comparaison", () => {
    expect(europeSummary(buildEuropePrices([row("FR", 70000), row("DE", 77500)], RATES))).toMatch(
      /La France fait partie/,
    );
    expect(europeSummary(buildEuropePrices([row("FR", 70000)], RATES))).toBeNull();
  });
});
