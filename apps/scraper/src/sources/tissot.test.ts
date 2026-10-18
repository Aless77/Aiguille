import { load } from "cheerio";
import { describe, expect, it } from "vitest";

import { listingSchema } from "../lib/listing.ts";
import { formatTissotReference, parseTissot } from "./tissot.ts";

const URL = "https://www.tissotwatches.com/fr-fr/T1374071104100.html";

const row = (label: string, value: string) => `
  <div class="row no-gutters ti-fs-12 ti-pdp-details-content" aria-label="${label} ${value}">
    <div class="col col-md-4 pr-10 ti-pdp-attribute" aria-hidden="true"> ${label} </div>
    <div class="col col-md-8 pl-10 pr-lg-30 ti-pdp-attribute" aria-hidden="true"> ${value} </div>
  </div>`;

/** Structure réduite d'une fiche tissotwatches.com (relevée le 2026-10-18). */
const html = (rows: string) => `<html><head>
  <meta property="og:image" content="https://www.tissotwatches.com/img/T137-407-11-041-00_shadow.png">
  <script type="application/ld+json">{"@context":"http://schema.org/","@type":"Product","name":"Tissot PRX 40mm","description":null,"mpn":"T1374071104100","sku":"T1374071104100","brand":{"@type":"Thing","name":"Tissot"},"offers":{"url":{},"@type":"Offer","priceCurrency":"EUR","price":"775.00","availability":"http://schema.org/InStock"}}</script>
  </head><body><h1> Tissot PRX </h1>${rows}</body></html>`;

const watchRows = [
  row("Référence", "T1374071104100"),
  row("Collection", "Classique Contemporain"),
  row("Largeur de la boîte (mm)", "40,00"),
  row("Epaisseur de la boîte (mm)", "10,93"),
  row("Entre-cornes (mm)", "12,00"),
  row("Etanchéité de la boîte", "Etanche jusqu’à une pression de 10 bar (100 m/330 ft)"),
  row("Matière de la boîte", "Acier inoxydable 316L"),
  row("Type de glace", "Glace saphir avec revêtement antireflet"),
  row("Type de mouvement", "Automatique"),
  row("Mouvement", "Mécanique à remontage automatique"),
  row("Réserve de marche (heures)", "80"),
  row("Couleur du cadran", "Bleu"),
  row("Matière du bracelet", "Acier inoxydable 316L"),
].join("");

describe("formatTissotReference", () => {
  it("remet les séparateurs des deux formats connus", () => {
    expect(formatTissotReference("T1374071104100")).toBe("T137.407.11.041.00");
    expect(formatTissotReference("T41118316")).toBe("T41.1.183.16");
    expect(formatTissotReference("TXYZ")).toBe("TXYZ");
  });
});

describe("parseTissot", () => {
  it("extrait une fiche complète et valide", () => {
    const listing = parseTissot(load(html(watchRows)), URL);
    expect(listingSchema.parse(listing)).toMatchObject({
      brandSlug: "tissot",
      reference: "T137.407.11.041.00",
      name: "Tissot PRX 40mm",
      collectionName: "PRX",
      imageUrls: ["https://www.tissotwatches.com/img/T137-407-11-041-00_shadow.png"],
      priceCents: 77500,
      availability: "in_stock",
      specs: {
        movement: "automatique",
        diameterMm: 40,
        thicknessMm: 10.93,
        lugWidthMm: 12,
        waterResistanceM: 100,
        powerReserveH: 80,
        caseMaterial: "Acier inoxydable 316L",
        dialColor: "Bleu",
      },
    });
    expect(listing?.rawSpecs.Collection).toBe("Classique Contemporain");
  });

  it("ignore les pages sans mouvement (bracelets, accessoires)", () => {
    expect(parseTissot(load(html(row("Matière du bracelet", "Cuir"))), URL)).toBeNull();
  });

  it("ignore les URL qui ne sont pas des fiches fr-fr", () => {
    expect(
      parseTissot(load(html(watchRows)), "https://www.tissotwatches.com/fr-ch/T1374071104100.html"),
    ).toBeNull();
  });
});
