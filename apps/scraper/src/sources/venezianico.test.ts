import { readFileSync } from "node:fs";
import { load } from "cheerio";
import { describe, expect, it } from "vitest";

import { listingSchema } from "../lib/listing";
import { parseVenezianico } from "./venezianico";

const html = readFileSync(
  new URL("./__fixtures__/venezianico-nereide.html", import.meta.url),
  "utf8",
);
const url = "https://www.venezianico.com/products/nereide-42-3321502c";

describe("Venezianico officiel", () => {
  it("lit la fiche : tableau détaillé, puis accordéon pour ce qui manque", () => {
    const parsed = listingSchema.parse(parseVenezianico(load(html), url));
    expect(parsed).toMatchObject({
      brandSlug: "venezianico",
      reference: "3321502C",
      name: "Nereide 42",
      collectionName: "Nereide",
      priceCents: 56500,
      availability: "out_of_stock",
      specs: {
        movement: "automatique",
        caliber: "Seiko NH35A",
        diameterMm: 42,
        thicknessMm: 13.3,
        waterResistanceM: 200,
        caseMaterial: "316L Stainless Steel",
        crystal: "Sapphire with anti-reflective coating",
        dialColor: "Blue",
        strapMaterial: "Canova",
      },
    });
    expect(parsed.rawSpecs).toMatchObject({
      "Bezel Insert": "BK7 Crystal, Polished and Durable with High Optical Clarity",
      Bezel: "BK7 Crystal, 120 clicks",
      Dial: "Brass with Sunray Finish",
      "Lug to lug": "49 mm",
    });
    // Livraison : hors de l'accordéon des caractéristiques.
    expect(parsed.rawSpecs["Eu Countries"]).toBeUndefined();
  });

  it("isole le calibre et lit la couronne, la couleur venant des tags", () => {
    const sellita = html
      .replace(
        "Seiko NH35A, automatic, 3-hands, with date",
        "Swiss Made Sellita SW200-1 Automatic, 3 Hands with Date Function",
      )
      .replace('"tags": ["archive"]', '"tags": ["best-seller", "black", "male"]')
      .replace(
        '<div class="feature-chart__heading bold">DIAL</div>',
        '<div class="feature-chart__heading bold">CROWN</div><div class="feature-chart__value"><p>Screw-Down</p></div></div><div class="feature-chart__table-row"><div class="feature-chart__heading bold">DIAL</div>',
      );
    const parsed = parseVenezianico(load(sellita), url);
    expect(parsed?.specs.caliber).toBe("Sellita SW200-1");
    expect(parsed?.specs.dialColor).toBe("Black");
    expect(parsed?.rawSpecs.Crown).toBe("Screw-Down");
  });

  it("n'expose pas de prix hors euros", () => {
    const usd = html.replace('"priceCurrency": "EUR"', '"priceCurrency": "USD"');
    expect(parseVenezianico(load(usd), url)?.priceCents).toBeUndefined();
  });

  it("écarte bracelets, accessoires et pages sans catégorie montre", () => {
    expect(
      parseVenezianico(load(html), "https://www.venezianico.com/products/canova-bracelet-22mm"),
    ).toBeNull();
    const strap = html.replace('"category": "Watches"', '"category": "Straps"');
    expect(parseVenezianico(load(strap), url)).toBeNull();
  });
});
