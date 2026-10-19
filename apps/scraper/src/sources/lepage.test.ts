import { load } from "cheerio";
import { describe, expect, it } from "vitest";

import { offerSchema } from "../lib/offer.ts";
import { parseSitemapLocs } from "../lib/sitemap.ts";
import { parseLepage } from "./lepage.ts";

const URL =
  "https://www.lepage.fr/fr/846-montre-hamilton-ventura-cadran-noir-bracelet-cuir-de-veau-graine-facon-lezard-noir-h24211732.html";

/** Structure réduite d'une fiche lepage.fr (relevée le 2026-10-19). */
const html = (product: Record<string, unknown>) => `<html><head>
  <script type="application/ld+json">{"@context":"https://schema.org","@type":"Organization","name":"Lepage"}</script>
  <script type="application/ld+json">${JSON.stringify({
    "@context": "https://schema.org/",
    "@type": "Product",
    name: "Montre Hamilton Ventura Classic S quartz cadran noir",
    sku: "H24211732",
    mpn: "H24211732",
    gtin13: "7640113831455",
    brand: { "@type": "Thing", name: "HAMILTON" },
    offers: {
      "@type": "Offer",
      priceCurrency: "EUR",
      price: "995",
      availability: "https://schema.org/PreOrder",
    },
    ...product,
  })}</script></head><body></body></html>`;

describe("parseLepage", () => {
  it("extrait une offre valide avec la référence de la marque", () => {
    expect(offerSchema.parse(parseLepage(load(html({})), URL))).toEqual({
      brandSlug: "hamilton",
      reference: "H24211732",
      gtin: "7640113831455",
      url: URL,
      priceCents: 99500,
      currency: "EUR",
      availability: "preorder",
    });
  });

  it("accepte une référence avec séparateurs (Longines)", () => {
    const url = "https://www.lepage.fr/fr/9001-montre-longines-spirit-cadran-bleu-l38094936.html";
    const offer = parseLepage(
      load(html({ sku: "L3.809.4.93.6", mpn: "L3.809.4.93.6", brand: { name: "LONGINES" } })),
      url,
    );
    expect(offer).toMatchObject({ brandSlug: "longines", reference: "L3.809.4.93.6" });
  });

  it("écarte une référence qui ne correspond pas à la marque", () => {
    expect(parseLepage(load(html({ sku: "ZZ123456", mpn: "ZZ123456" })), URL)).toBeNull();
  });

  it("ignore les autres marques et les pages qui ne sont pas des montres", () => {
    expect(
      parseLepage(load(html({})), "https://www.lepage.fr/fr/24431-montre-omega-seamaster.html"),
    ).toBeNull();
    expect(
      parseLepage(load(html({})), "https://www.lepage.fr/fr/12-bague-or-blanc-diamant.html"),
    ).toBeNull();
  });
});

describe("sitemap Lepage", () => {
  it("lit les URL en CDATA", () => {
    const xml = `<?xml version="1.0"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      <url><loc><![CDATA[${URL}]]></loc></url></urlset>`;
    expect(parseSitemapLocs(xml).pages).toEqual([URL]);
  });
});
