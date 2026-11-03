import { readFileSync } from "node:fs";
import { load } from "cheerio";
import { describe, expect, it } from "vitest";

import { listingSchema } from "../lib/listing";
import { parseGrandSeiko, translateGrandSeiko } from "./grand-seiko";

const fixture = (name: string) =>
  readFileSync(new URL(`./__fixtures__/${name}.html`, import.meta.url), "utf8");
const html = fixture("grand-seiko-sbga211");
const url = "https://www.grand-seiko.com/fr-fr/collections/sbga211g";

describe("Grand Seiko officiel", () => {
  it("lit la fiche : caractéristiques, prix en euros et dimensions", () => {
    const parsed = listingSchema.parse(parseGrandSeiko(load(html), url));
    expect(parsed).toMatchObject({
      brandSlug: "grand-seiko",
      reference: "SBGA211",
      name: "Heritage SBGA211",
      collectionName: "Heritage",
      priceCents: 700000,
      specs: {
        caliber: "9R65",
        diameterMm: 41,
        thicknessMm: 12.5,
        lugWidthMm: 20,
        waterResistanceM: 100,
        powerReserveH: 72,
        caseMaterial: "Titane haute intensité",
      },
    });
    expect(parsed.rawSpecs).toMatchObject({
      "Type de calibre": "Spring Drive",
      "Numéro du calibre": "9R65",
      Poids: "100 g",
    });
  });

  it("garde la photo du produit et les vues détaillées, sans les versions mobiles", () => {
    const { imageUrls } = parseGrandSeiko(load(html), url)!;
    expect(imageUrls[0]).toContain("/SBGA211G/SBGA211G.png");
    expect(imageUrls.length).toBeGreaterThan(1);
    expect(imageUrls.join()).not.toMatch(/_sp\.jpg/);
    expect(imageUrls.every((image) => image.startsWith("https://www.grand-seiko.com/"))).toBe(true);
  });

  it("ignore une page sans fiche et les pages de collection", () => {
    expect(parseGrandSeiko(load("<html><body></body></html>"), url)).toBeNull();
    const page = "https://www.grand-seiko.com/fr-fr/collections/heritage";
    expect(parseGrandSeiko(load(html), page)).toBeNull();
  });

  it("garde les libellés de rawSpecs dans la version française, pivot des traductions", () => {
    const parsed = parseGrandSeiko(load(html), url)!;
    const french = translateGrandSeiko(load(html), url)!;
    expect(Object.values(french.specs).map((s) => s.label)).toEqual(Object.keys(parsed.rawSpecs));
  });

  it("range la version allemande sous les mêmes clés, avec ses libellés", () => {
    const germanUrl = url.replace("/fr-fr/", "/de-de/");
    const german = translateGrandSeiko(load(fixture("grand-seiko-sbga211-de")), germanUrl)!;
    const french = translateGrandSeiko(load(html), url)!;
    expect(Object.keys(german.specs).sort()).toEqual(Object.keys(french.specs).sort());
    expect(german.specs.caliber).toEqual({ label: "Kalibernummer", value: "9R65" });
  });
});
