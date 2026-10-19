import { load } from "cheerio";
import { describe, expect, it } from "vitest";

import { offerSchema } from "../lib/offer.ts";
import { parseOcarat } from "./ocarat.ts";

const URL = "https://ocarat.com/tradition-t0636101603800-tissot-37139.html";

/** Structure réduite d'une fiche ocarat.com (relevée le 2026-10-19). */
const html = (product: Record<string, unknown> = {}) => `<html><head>
  <script type="application/ld+json">${JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Product",
    name: "Montre Tradition Gent T0636101603800",
    brand: { "@type": "Brand", name: "Tissot" },
    gtin13: "7611608270943",
    sku: 37139,
    offers: {
      "@type": "Offer",
      priceCurrency: "EUR",
      price: 325,
      availability: "https://schema.org/InStock",
    },
    // Note de la boutique, pas de la montre : ne doit pas être reprise.
    aggregateRating: { "@type": "AggregateRating", ratingValue: "4.6", reviewCount: "10201" },
    ...product,
  })}</script></head><body></body></html>`;

describe("parseOcarat", () => {
  it("lit la référence dans l'URL et l'offre dans le JSON-LD", () => {
    expect(offerSchema.parse(parseOcarat(load(html()), URL))).toEqual({
      brandSlug: "tissot",
      reference: "T0636101603800",
      gtin: "7611608270943",
      url: URL,
      priceCents: 32500,
      currency: "EUR",
      availability: "in_stock",
    });
  });

  it("lit une référence Hamilton", () => {
    const url = "https://ocarat.com/jazzmaster-open-heart-auto-h32705541-hamilton-44585.html";
    expect(parseOcarat(load(html({ brand: { name: "Hamilton" } })), url)).toMatchObject({
      brandSlug: "hamilton",
      reference: "H32705541",
    });
  });

  it("écarte une fiche dont la marque contredit l'URL", () => {
    expect(parseOcarat(load(html({ brand: { name: "Seiko" } })), URL)).toBeNull();
  });

  it("ignore les autres produits", () => {
    expect(
      parseOcarat(load(html()), "https://ocarat.com/bague-solitaire-or-blanc-12345.html"),
    ).toBeNull();
  });
});
