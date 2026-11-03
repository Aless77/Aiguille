import { readFileSync } from "node:fs";
import { load } from "cheerio";
import { describe, expect, it } from "vitest";

import { listingSchema } from "../lib/listing";
import { parseLip, translateLip } from "./lip";

const fixture = (name: string) =>
  readFileSync(new URL(`./__fixtures__/${name}.html`, import.meta.url), "utf8");
const churchill = "https://lip.fr/fr/churchill/198-lip-churchill-t18-671933";
const nautic = "https://lip.fr/fr/nautic-666/413-lip-manufacture-nautic-666-676050";

describe("Lip officiel", () => {
  it("lit une montre à quartz au boîtier rectangulaire, sans diamètre inventé", () => {
    const parsed = listingSchema.parse(parseLip(load(fixture("lip-churchill")), churchill));
    expect(parsed).toMatchObject({
      brandSlug: "lip",
      reference: "671933",
      name: "Churchill T18",
      collectionName: "Churchill",
      priceCents: 19900,
      availability: "in_stock",
      specs: {
        movement: "quartz",
        caliber: "Ronda 1064",
        waterResistanceM: 30,
        caseMaterial: "Acier inoxydable 316L",
        crystal: "Minéral plat",
        dialColor: "Argenté soleillé",
      },
    });
    expect(parsed.specs.diameterMm).toBeUndefined();
    expect(parsed.imageUrls[0]).toMatch(/large_default\/lip-churchill-t18-671933\.jpg$/);
    expect(parsed.rawSpecs).toMatchObject({
      "Dimension du boîtier": "21.2mm x 38.5mm",
      "Forme du boitier": "Rectangle",
      Rubis: "2",
      Précision: "-10/+20 secondes/mois",
      "Mouvement · Pile": "321",
    });
    expect(parsed.specs.lugWidthMm).toBe(18);
  });

  it("sépare les valeurs écrites sur une même ligne, sans couper le reste du texte", () => {
    const html = `<html><body><h1>Essai</h1><div class="bloc">
      <div class="line">Mouvement : mécanique à remontage automatique</div>
      <div class="line"><p>Fréquence : 28800 alternances/heure. Rubis : 24. Précision : +/-15 sec /Jour stop seconde. Réserve de marche en pleine charge : 38 heures. Finitions : côtes de Genève.</p></div>
      <div class="line">Fonctions : 2 aiguilles : heures/minutes. Date. Stop seconde.</div>
      </div>
      <script type="application/ld+json">{"@type":"Product","sku":"671000"}</script></body></html>`;
    const parsed = parseLip(load(html), churchill)!;
    expect(parsed.specs.powerReserveH).toBe(38);
    expect(parsed.rawSpecs).toMatchObject({
      Fréquence: "28800 alternances/heure",
      Rubis: "24",
      Précision: "+/-15 sec /Jour",
      "Réserve de marche": "38 heures",
      "Autres caractéristiques": "côtes de Genève.",
      "Fonctions du mouvement": "2 aiguilles : heures/minutes. Date. Stop seconde.",
    });
  });

  it("lit une montre automatique de manufacture", () => {
    const parsed = listingSchema.parse(parseLip(load(fixture("lip-nautic")), nautic));
    expect(parsed).toMatchObject({
      reference: "676050",
      name: "Nautic 666 Automatique 39 mm",
      collectionName: "Nautic 666",
      priceCents: 94000,
      specs: { movement: "automatique", caliber: "R26D", diameterMm: 39, waterResistanceM: 200 },
    });
  });

  it("garde les libellés de rawSpecs dans la version française, pivot des traductions", () => {
    const parsed = parseLip(load(fixture("lip-churchill")), churchill)!;
    const french = translateLip(load(fixture("lip-churchill")), churchill)!;
    expect(Object.values(french.specs).map((s) => s.label)).toEqual(Object.keys(parsed.rawSpecs));
  });

  it("range la version anglaise sous les mêmes clés", () => {
    const url = churchill.replace("/fr/", "/en/");
    const english = translateLip(load(fixture("lip-churchill-en")), url)!;
    const french = translateLip(load(fixture("lip-churchill")), churchill)!;
    expect(Object.keys(english.specs).sort()).toEqual(Object.keys(french.specs).sort());
    expect(english.specs.dial).toEqual({ label: "Dial", value: "silver pressed pattern" });
    expect(english.fields.caseMaterial).toBe("Metal");
  });

  it("ignore les pages sans mouvement et les catégories d'accessoires", () => {
    const empty = "<html><body><h1>Bracelet</h1></body></html>";
    expect(parseLip(load(empty), churchill)).toBeNull();
    const bracelet = "https://lip.fr/fr/bracelets/280-bracelet-lip-20mm-noir-croco-675414";
    expect(parseLip(load(fixture("lip-churchill")), bracelet)).toBeNull();
  });
});
