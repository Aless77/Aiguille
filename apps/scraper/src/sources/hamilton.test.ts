import { load } from "cheerio";
import { describe, expect, it } from "vitest";

import { listingSchema } from "../lib/listing.ts";
import { parseHamilton } from "./hamilton.ts";

const URL = "https://www.hamiltonwatch.com/fr-fr/h69409930-khaki-field.html";

const attr = (label: string, value: string) =>
  `<li> <span class="attribute-label">${label}</span> <span class="attribute-value">${value}</span> </li>`;

/** Structure réduite d'une fiche hamiltonwatch.com (relevée le 2026-10-18). */
const html = (attrs: string) => `<html><head>
  <script type="application/ld+json">{"@context":"https://schema.org","@graph":[{"@type":"BreadcrumbList","itemListElement":[]},{"@type":"Product","name":"Khaki Field Mechanical","image":["https://www.hamiltonwatch.com/media/catalog/product/h/6/h69409930_1.png"],"description":"Boîtier de 38 mm.","sku":"H69409930","brand":{"@type":"Brand","name":"Hamilton Watch"},"offers":{"@type":"Offer","priceCurrency":"EUR","price":"695.00","availability":"https://schema.org/InStock"}}]}</script>
  </head><body><ul>${attrs}</ul></body></html>`;

const watchAttrs = [
  attr("Référence", "H69409930"),
  attr("Calibre", "H-50"),
  attr("Collection", "Khaki Field"),
  attr("Mouvement", "Mécanique"),
  attr("Dimension du boîtier", "38mm"),
  attr("Épaisseur (mm)", "9.5"),
  attr("Couleur du cadran", "Noir"),
  attr("Matériau du boîtier", "Acier inoxydable"),
  attr("Verre", "Saphir"),
  attr("Largeur corne", "20mm"),
  attr("Réserve de marche", "80 heures"),
  attr("Étanchéité", "jusqu’à 5 bar (50m)"),
  attr("Type de bracelet", "Textile"),
].join("");

describe("parseHamilton", () => {
  it("extrait une fiche complète et valide", () => {
    const listing = parseHamilton(load(html(watchAttrs)), URL);
    expect(listingSchema.parse(listing)).toMatchObject({
      brandSlug: "hamilton",
      reference: "H69409930",
      name: "Khaki Field Mechanical",
      collectionName: "Khaki Field",
      priceCents: 69500,
      availability: "in_stock",
      specs: {
        movement: "manuel",
        caliber: "H-50",
        diameterMm: 38,
        thicknessMm: 9.5,
        lugWidthMm: 20,
        waterResistanceM: 50,
        powerReserveH: 80,
        crystal: "Saphir",
        strapMaterial: "Textile",
      },
    });
  });

  it("ignore les pages sans mouvement (bracelets)", () => {
    expect(parseHamilton(load(html(attr("Référence", "H69409930"))), URL)).toBeNull();
  });
});
