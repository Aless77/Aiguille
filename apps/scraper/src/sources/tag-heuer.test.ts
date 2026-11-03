import { readFileSync } from "node:fs";
import { load } from "cheerio";
import { describe, expect, it } from "vitest";

import { listingSchema } from "../lib/listing";
import { parseTagHeuer, tagHeuer } from "./tag-heuer";

const html = readFileSync(
  new URL("./__fixtures__/tag-heuer-aquaracer.html", import.meta.url),
  "utf8",
);
const url =
  "https://www.lepage.fr/fr/21000-montre-tag-heuer-aquaracer-solargraph-solaire-index-diamants-34-mm-wbp1313ba0005.html";

describe("TAG Heuer via Lepage", () => {
  it("lit la fiche neuve : référence, nom, collection, calibre et caractéristiques", () => {
    const parsed = listingSchema.parse(parseTagHeuer(load(html), url));
    expect(parsed).toMatchObject({
      brandSlug: "tag-heuer",
      reference: "WBP1313.BA0005",
      name: "Aquaracer Solargraph 34 mm",
      collectionName: "Aquaracer",
      priceCents: 340000,
      specs: {
        movement: "solaire",
        caliber: "TH50-01",
        diameterMm: 34,
        waterResistanceM: 200,
        caseMaterial: "Acier",
        dialColor: "Nacre blanche",
      },
    });
    expect(Object.keys(parsed.rawSpecs).join("|")).not.toMatch(/Garantie|Etat|Marque/);
  });

  it("n'affiche pas « Quartz Swiss Made » comme un calibre", () => {
    const generic = html.replaceAll("Calibre TH50-01", "Quartz Swiss Made");
    expect(parseTagHeuer(load(generic), url)?.specs.caliber).toBeUndefined();
  });

  it("écarte les pièces d'occasion, par l'adresse comme par l'état", () => {
    expect(tagHeuer.parse(load(html), url.replace(".html", "-full-set-2023.html"))).toBeNull();
    const used = html.replace(/(<dt>\s*(?:<div>)?\s*Etat[\s\S]*?<dd>\s*)Neuf/, "$1Occasion");
    expect(used).not.toBe(html);
    expect(parseTagHeuer(load(used), url)).toBeNull();
  });

  it("déclare un catalogue partiel et une source de revendeur", () => {
    expect(tagHeuer.partialCatalog).toBe(true);
    expect(tagHeuer.id).toBe("lepage-tag-heuer");
  });
});
