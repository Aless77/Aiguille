import { readFileSync } from "node:fs";
import { load } from "cheerio";
import { describe, expect, it } from "vitest";

import { listingSchema } from "../lib/listing";
import { parseTudor, tudor } from "./tudor";

const html = readFileSync(new URL("./__fixtures__/tudor-black-bay.html", import.meta.url), "utf8");
const url =
  "https://www.lepage.fr/fr/10952-montre-tudor-black-bay-automatique-lunette-bleue-cadran-noir-bracelet-acier-41-mm-m79230b-0008.html";

describe("Tudor via Lepage", () => {
  it("lit la fiche neuve : référence, nom, prix et caractéristiques", () => {
    const parsed = listingSchema.parse(parseTudor(load(html), url));
    expect(parsed).toMatchObject({
      brandSlug: "tudor",
      reference: "M79230B-0008",
      name: "Black Bay automatique 41 mm",
      collectionName: "Black Bay",
      priceCents: 430000,
      availability: "preorder",
      specs: {
        movement: "automatique",
        caliber: "Tudor MT5602",
        diameterMm: 41,
        waterResistanceM: 200,
        powerReserveH: 70,
        caseMaterial: "Acier",
        dialColor: "Noir",
      },
    });
    expect(parsed.rawSpecs).toMatchObject({
      "Pays de fabrication": "Suisse",
      "Forme du boitier": "Ronde",
      "Matière de la lunette": "Acier",
    });
  });

  it("ne garde ni la garantie de Lepage ni ses mentions commerciales", () => {
    const { rawSpecs } = parseTudor(load(html), url)!;
    const labels = Object.keys(rawSpecs).join("|");
    expect(labels).not.toMatch(/Garantie|Etat|Marque|Incontournable/);
  });

  it("écrit le calibre et la collection de la même façon sur toutes les fiches", () => {
    const variant = html
      .replace("Tudor MT5602", "Calibre MT5813 - Tudor")
      .replace("Black Bay - Tudor", "Tudor - Black Bay 58");
    expect(parseTudor(load(variant), url)).toMatchObject({
      collectionName: "Black Bay 58",
      specs: { caliber: "Tudor MT5813" },
    });
  });

  it("garde la collection précise quand Lepage en cite deux", () => {
    const both = html.replace("Black Bay - Tudor", "Black Bay - Tudor, Black Bay 31/36/39/41");
    expect(parseTudor(load(both), url)?.collectionName).toBe("Black Bay 31/36/39/41");
  });

  it("garde toutes les photos de la montre en grand format, pas celles des voisines", () => {
    const main = /https:\/\/www\.lepage\.fr\/\d+-[a-z]+_default\/[a-z0-9-]+\.jpg/.exec(html)![0];
    const file = main.split("/").at(-1)!;
    const gallery = html.replace(
      "</body>",
      `<img src="https://www.lepage.fr/36974-large_default/${file}">
       <img src="https://www.lepage.fr/36974-medium_default/${file}">
       <img src="https://www.lepage.fr/99999-large_default/montre-tudor-voisine.jpg"></body>`,
    );
    const images = parseTudor(load(gallery), url)!.imageUrls;
    expect(images.every((image) => image.includes("-zoom_default/"))).toBe(true);
    expect(images.filter((image) => image.includes("36974-"))).toHaveLength(1);
    expect(images.join()).not.toContain("voisine");
  });

  it("écarte une pièce d'occasion", () => {
    const used = html.replace(/(<dt>\s*(?:<div>)?\s*Etat[\s\S]*?<dd>\s*)Neuf/, "$1Occasion");
    expect(used).not.toBe(html);
    expect(parseTudor(load(used), url)).toBeNull();
  });

  it("écarte une fiche sans référence Tudor moderne", () => {
    const old =
      "https://www.lepage.fr/fr/28488-montre-tudor-black-bay-automatique-full-set-2019.html";
    expect(parseTudor(load(html), old)).toBeNull();
  });

  it("déclare un catalogue partiel : Lepage ne prouve pas la fin de production", () => {
    expect(tudor.partialCatalog).toBe(true);
    expect(tudor.id.endsWith("-officiel")).toBe(false);
  });
});
