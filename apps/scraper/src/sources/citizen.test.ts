import { readFileSync } from "node:fs";
import { load } from "cheerio";
import { describe, expect, it } from "vitest";

import { listingSchema } from "../lib/listing";
import { parseCitizen, translateCitizen } from "./citizen";

const fixture = (name: string) =>
  load(readFileSync(new URL(`./__fixtures__/${name}.html`, import.meta.url), "utf8"));
const url = "https://fr.citizenwatch.eu/fr/p/nj0200-50z/";

describe("Citizen officiel", () => {
  it("lit la référence complète, le prix et les faits de la TSUYOSA", () => {
    const parsed = listingSchema.parse(parseCitizen(fixture("citizen-automatic"), url));
    expect(parsed).toMatchObject({
      reference: "NJ0200-50Z",
      collectionName: "TSUYOSA",
      priceCents: 29900,
      availability: "out_of_stock",
      specs: {
        movement: "automatique",
        caliber: "8210",
        diameterMm: 37,
        thicknessMm: 12,
        waterResistanceM: 50,
        powerReserveH: 42,
      },
    });
    expect(parsed.specs.lugWidthMm).toBeUndefined();
    expect(parsed.specs.dialColor).toBeUndefined();
    expect(parsed.rawSpecs["Références des déclinaisons"]).toContain("NJ0200-50W");
  });

  it("conserve l'autonomie solaire de 180 jours sans l'interpréter comme 180 heures", () => {
    const parsed = listingSchema.parse(
      parseCitizen(fixture("citizen-solar"), "https://fr.citizenwatch.eu/fr/p/eo2023-00a/"),
    );
    expect(parsed.specs).toMatchObject({
      movement: "solaire",
      caliber: "E168",
      diameterMm: 36.5,
      lugWidthMm: 18,
    });
    expect(parsed.specs.powerReserveH).toBeUndefined();
    expect(parsed.rawSpecs["Réserve de marche"]).toBe("180 jours");
  });

  it("relie les traductions officielles avec les mêmes identifiants", () => {
    const fr = translateCitizen(fixture("citizen-automatic"), url)!;
    const en = translateCitizen(fixture("citizen-en"), "https://citizenwatch.eu/en/p/nj0200-50z/")!;
    expect(fr.specs["case-material"]?.value).toBe("Acier inoxydable");
    expect(en.specs["case-material"]?.value).toBe("Stainless Steel");
    expect(en.specs["power-reserve"]?.value).toBe("42 hours");
  });

  it("accepte les fiches avec seulement un type de calibre sans inventer le remontage", () => {
    const $ = fixture("citizen-automatic");
    $(".c-attribute-table__item--movement").remove();
    $(".c-attribute-table__item--caliber-type .c-attribute-table__value").text("Mécanique");
    const parsed = listingSchema.parse(parseCitizen($, url));
    expect(parsed.specs.movement).toBe("autre");
    expect(parsed.rawSpecs["Type de calibre"]).toBe("Mécanique");
  });

  it("conserve une entre-cornes aberrante dans les faits sans bloquer la fiche", () => {
    const $ = fixture("citizen-automatic");
    $("body").append(`<div class="c-attribute-table__item c-attribute-table__item--strap-lug-width">
      <div class="c-attribute-table__attribute">Largeur de la patte de fixation du bracelet:</div>
      <div class="c-attribute-table__value">200 mm</div></div>`);
    const parsed = listingSchema.parse(parseCitizen($, url));
    expect(parsed.specs.lugWidthMm).toBeUndefined();
    expect(Object.values(parsed.rawSpecs)).toContain("200 mm");
  });

  it("reconnaît Eco-Drive dans les caractéristiques même avec un calibre quartz analogique", () => {
    const $ = fixture("citizen-solar");
    $(".c-attribute-table__item--movement").remove();
    $(".c-attribute-table__item--caliber-type .c-attribute-table__value").text("Quartz analogique");
    const parsed = listingSchema.parse(
      parseCitizen($, "https://fr.citizenwatch.eu/fr/p/eo2023-00a/"),
    );
    expect(parsed.specs.movement).toBe("solaire");
    expect(parsed.specs.powerReserveH).toBeUndefined();
  });

  it("rejette une fiche d'une autre référence ou une page sans mouvement", () => {
    expect(
      parseCitizen(fixture("citizen-automatic"), "https://fr.citizenwatch.eu/fr/p/nj0200-50w/"),
    ).toBeNull();
    expect(parseCitizen(load("<h1>Montres</h1>"), url)).toBeNull();
  });
});
