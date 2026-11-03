import { describe, expect, it } from "vitest";

import { formatters } from "../i18n/format";
import { sections } from "../i18n/messages/sections";
import {
  buildEuropePrices,
  COUNTRY_INFO,
  type CountryPriceRow,
  europeSummary,
  formatEuropeDelta,
} from "./europe-prices";

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
    expect(prices.map((p) => [p.country, p.eurCents])).toEqual([
      ["CH", 237555],
      ["DE", 255000],
      ["FR", 260000],
      ["GB", 273143],
    ]);
    for (const [index, delta] of [-8.6, -1.9, 0, 5.1].entries())
      expect(prices[index]!.deltaPercent).toBeCloseTo(delta, 1);
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

  it("conserve les écarts inférieurs à la précision d'affichage", () => {
    const prices = buildEuropePrices([row("FR", 100000), row("DE", 99999)], {});
    expect(prices[0]!.deltaPercent).toBeCloseTo(-0.001, 8);
  });

  it("écarte les prix et taux non utilisables sans inventer de comparaison", () => {
    const prices = buildEuropePrices(
      [row("FR", 0), row("DE", 100000), row("GB", 90000, "GBP"), row("CH", 95000, "CHF")],
      { GBP: -1, CHF: Number.POSITIVE_INFINITY },
    );
    expect(prices.map((p) => p.country)).toEqual(["DE"]);
    expect(europeSummary(prices)).toBeNull();
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

  it("ne nomme pas de faux gagnant lorsque la France est à égalité", () => {
    for (const rows of [
      [row("DE", 100000), row("FR", 100000)],
      [row("FR", 100000), row("DE", 100000)],
    ])
      expect(europeSummary(buildEuropePrices(rows, {}))).toBe(
        "La France fait partie des pays où cette montre est la moins chère.",
      );
  });

  it("distingue le voisinage de zéro du seuil exact de 0,1 %", () => {
    expect(europeSummary(buildEuropePrices([row("FR", 100000), row("DE", 99901)], {}))).toMatch(
      /^Prix très proche/,
    );
    expect(europeSummary(buildEuropePrices([row("FR", 100000), row("DE", 99900)], {}))).toBe(
      "Moins chère en Allemagne : environ 0,1 % de moins qu'en France après conversion.",
    );
  });

  it.each([
    [
      "fr",
      "Prix très proche en Allemagne : moins de 0,1 % d’écart avec la France après conversion.",
    ],
    [
      "en",
      "Very similar price in Germany: less than 0.1% difference from France after conversion.",
    ],
    [
      "de",
      "Sehr ähnlicher Preis in Deutschland: nach Umrechnung weniger als 0,1 % Unterschied zu Frankreich.",
    ],
    [
      "it",
      "Prezzo molto simile in Germania: meno dello 0,1 % di differenza rispetto alla Francia dopo la conversione.",
    ],
    [
      "es",
      "Precio muy similar en Alemania: menos de un 0,1 % de diferencia con Francia tras la conversión.",
    ],
  ] as const)("n'annonce pas une économie arrondie à zéro en %s", (locale, expected) => {
    const f = formatters(locale);
    const prices = buildEuropePrices([row("FR", 100000), row("DE", 99999)], {});
    expect(
      europeSummary(prices, {
        ...sections[locale].europe,
        inCountry: (code) => (locale === "fr" ? COUNTRY_INFO[code]!.inName : f.country(code)),
        number: f.number,
      }),
    ).toBe(expected);
  });
});

describe("formatEuropeDelta", () => {
  it("garde les signes des écarts visibles et distingue un arrondi d'une vraie égalité", () => {
    expect(formatEuropeDelta(-0.001)).toBe("≈ 0 %");
    expect(formatEuropeDelta(0.001)).toBe("≈ 0 %");
    expect(formatEuropeDelta(0)).toBe("0 %");
    expect(formatEuropeDelta(-0)).toBe("0 %");
    expect(formatEuropeDelta(null)).toBe("—");
    expect(formatEuropeDelta(-0.05)).toBe("-0,1 %");
    expect(formatEuropeDelta(0.05)).toBe("+0,1 %");
    expect(formatEuropeDelta(-8.6, formatters("en").number)).toBe("-8.6 %");
  });
});
