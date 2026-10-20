import { load } from "cheerio";
import { describe, expect, it } from "vitest";

import { parseCountryPrice } from "./country-prices.ts";

const page = (price: unknown, currency: string, availability = "https://schema.org/InStock") =>
  load(
    `<script type="application/ld+json">${JSON.stringify({
      "@type": "Product",
      sku: "T1374071104100",
      offers: { "@type": "Offer", price, priceCurrency: currency, availability },
    })}</script>`,
  );

describe("parseCountryPrice", () => {
  it("lit le prix national dans la devise du pays", () => {
    expect(parseCountryPrice(page("685.00", "CHF"), "CH")).toEqual({
      priceCents: 68500,
      currency: "CHF",
      availability: "in_stock",
    });
    expect(parseCountryPrice(page(9095, "SEK"), "SE")?.priceCents).toBe(909500);
  });

  it("rejette une devise inattendue (redirection vers un autre marché)", () => {
    // Hamilton « international » répond en CHF pour le Portugal.
    expect(parseCountryPrice(page("620.00", "CHF"), "PT")).toBeNull();
  });

  it("rejette une page sans prix", () => {
    expect(parseCountryPrice(page(undefined, "EUR"), "DE")).toBeNull();
    expect(parseCountryPrice(load("<html></html>"), "DE")).toBeNull();
  });
});
