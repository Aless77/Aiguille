import { readFileSync } from "node:fs";
import { load } from "cheerio";
import { describe, expect, it } from "vitest";

import { parseCountryPrice } from "../lib/country-prices";
import { listingSchema } from "../lib/listing";
import { parseSeiko, seikoCountryPrice, translateSeiko } from "./seiko";

const html = readFileSync(new URL("./__fixtures__/seiko-prospex.html", import.meta.url), "utf8");
const url = "https://www.seikowatches.com/fr-fr/products/prospex/spb453j1";

describe("Seiko officiel", () => {
  it("garde SPB453J1 malgré le H1 SPB453 et sépare les dimensions", () => {
    const parsed = listingSchema.parse(parseSeiko(load(html), url));
    expect(parsed).toMatchObject({
      reference: "SPB453J1",
      name: "Prospex SPB453J1",
      collectionName: "Prospex",
      priceCents: 144000,
      availability: "unknown",
      specs: {
        caliber: "6R55",
        movement: "automatique",
        diameterMm: 40,
        thicknessMm: 13,
        lugWidthMm: 20,
        powerReserveH: 72,
        waterResistanceM: 300,
      },
    });
    expect(parsed.rawSpecs["Corne à corne"]).toBe("46.4 mm");
    expect(parsed.imageUrls[0]).toContain("https://www.seikowatches.com/fr-fr/");
  });

  it("valide le marché et la devise du prix HTML, sans inventer de stock", () => {
    const $ = load(html.replace("EUR 1&nbsp;440,00", "GBP 1,250.00"));
    const price = () => seikoCountryPrice($, url);
    expect(parseCountryPrice($, "GB", price)).toEqual({
      priceCents: 125000,
      currency: "GBP",
      availability: "unknown",
    });
    expect(parseCountryPrice($, "FR", price)).toBeNull();
  });

  it("lit aussi Euro et le format allemand des prix", () => {
    expect(
      seikoCountryPrice(load(html.replace("EUR 1&nbsp;440,00", "Euro 1.590,00")), url)?.priceCents,
    ).toBe(159000);
    expect(
      seikoCountryPrice(load(html.replace("EUR 1&nbsp;440,00", "1.440,00 EUR UVP")), url)
        ?.priceCents,
    ).toBe(144000);
  });

  it("rejette les fausses 404 en HTTP 200 et les références incompatibles", () => {
    expect(parseSeiko(load("<h1>404 Page non trouvée</h1>"), url)).toBeNull();
    expect(parseSeiko(load(html), url.replace("spb453j1", "spb451j1"))).toBeNull();
    expect(translateSeiko(load(html), url)?.specs.caliber?.value).toBe("6R55");
  });

  it("conserve une fiche valide sans prix ou sans couleur de cadran publiée", () => {
    const $ = load(html);
    $("._price").remove();
    const parsed = listingSchema.parse(parseSeiko($, url));
    expect(parsed.priceCents).toBeUndefined();
    expect(parsed.specs.dialColor).toBeUndefined();
  });

  it("conserve l'autonomie solaire en mois sans fabriquer une réserve mécanique en heures", () => {
    const $ = load(html);
    $(".productSpec-item dt").each((_, e) => {
      if ($(e).text().trim() === "Type de mouvement") $(e).next("dd").text("Solaire");
      if ($(e).text().trim() === "Autonomie") $(e).next("dd").text("Environ 6 mois");
    });
    const parsed = listingSchema.parse(parseSeiko($, url));
    expect(parsed.specs.movement).toBe("solaire");
    expect(parsed.specs.powerReserveH).toBeUndefined();
    expect(parsed.rawSpecs.Autonomie).toBe("Environ 6 mois");
  });

  it("n'enregistre pas un montant en euros sans devise reconnue", () => {
    const $ = load(html.replace("EUR 1&nbsp;440,00", "1,440.00 USD"));
    expect(listingSchema.parse(parseSeiko($, url)).priceCents).toBeUndefined();
  });
});
