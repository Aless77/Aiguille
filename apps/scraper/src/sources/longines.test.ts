import { load } from "cheerio";
import { describe, expect, it } from "vitest";

import { listingSchema } from "../lib/listing.ts";
import { parseLongines } from "./longines.ts";

const URL = "https://www.longines.com/fr/p/watch-longines-spirit-pilot-l3-809-4-93-9";
const KEY = `"fr","watch-longines-spirit-pilot-l3-809-4-93-9",`;

const option = (label: string, value: string) => ({ label, value });

/** Table des attributs réduite (relevée le 2026-10-18 sur longines.com/fr). */
const attributes = [
  { attribute_code: "name", attribute_label: "Product Name" },
  { attribute_code: "case_dimension", attribute_label: "Dimension" },
  { attribute_code: "case_thickness", attribute_label: "Épaisseur" },
  { attribute_code: "case_lug_distance", attribute_label: "Entrecorne" },
  { attribute_code: "mvt_fct_calibre_name", attribute_label: "Calibre" },
  {
    attribute_code: "case_material",
    attribute_label: "Matière",
    attribute_options: [option("Acier", "22")],
  },
  {
    attribute_code: "bracelet_material",
    attribute_label: "Matière",
    attribute_options: [option("Caoutchouc", "190")],
  },
  {
    attribute_code: "case_water_resistance",
    attribute_label: "Étanchéité",
    attribute_options: [option("Étanche à 10 bar", "45")],
  },
  {
    attribute_code: "mvt_fct_type",
    attribute_label: "Type de mouvement",
    attribute_options: [option("Quartz", "110"), option("Automatique", "112")],
  },
  {
    attribute_code: "mvt_fct_calibre",
    attribute_label: "Description mouvement",
    attribute_options: [
      option(
        "Mouvement mécanique à remontage automatique, réserve de marche jusqu'à 72 heures.",
        "900",
      ),
    ],
  },
  {
    attribute_code: "case_specificities",
    attribute_label: "Spécificités",
    attribute_options: [option("Couronne vissée", "54"), option("Fond saphir", "55")],
  },
  {
    attribute_code: "information_case",
    attribute_label: "Boîtier",
    attribute_options: [option("0", "0")],
  },
];

const nextData = (item: Record<string, unknown>) => ({
  props: {
    pageProps: {
      fallback: {
        [`@"ProductPageDocument",${KEY}`]: {
          products: {
            items: [
              {
                name: "LONGINES SPIRIT PILOT",
                preferred_category: { name: "LONGINES SPIRIT PILOT" },
                case_dimension: "Ø 39.00 mm",
                ...item,
              },
            ],
          },
        },
        [`@"ProductPageAdditionalDocument",${KEY}`]: {
          products: {
            items: [
              {
                case_thickness: "11.50 mm",
                case_lug_distance: "20 mm",
                mvt_fct_calibre_name: "L888.4",
                case_material: "22",
                bracelet_material: "190",
                case_water_resistance: "45",
                mvt_fct_calibre: "900",
                case_specificities: "54,55",
                information_case: "0",
              },
            ],
          },
        },
        [`@"ProductAttributes","fr",`]: { attributeMetadata: { items: attributes } },
      },
    },
  },
});

const html = (item: Record<string, unknown>) => `<html><head>
  <script type="application/ld+json">{"@context":"https://schema.org","@type":"Product","name":"LONGINES SPIRIT PILOT","image":{"@type":"ImageObject","url":"https://api.ecom.longines.com/media/catalog/product/w/a/l3-809-4-93-9-hero.png"},"sku":"L3.809.4.93.9","brand":{"@type":"Brand","name":"Longines"},"offers":{"@type":"Offer","priceCurrency":"EUR","price":2900,"availability":"https://schema.org/InStock"}}</script>
  </head><body><script id="__NEXT_DATA__" type="application/json">${JSON.stringify(nextData(item))}</script></body></html>`;

describe("parseLongines", () => {
  it("extrait une fiche complète en résolvant les codes d'attributs", () => {
    const listing = parseLongines(load(html({ mvt_fct_type: "112" })), URL);
    expect(listingSchema.parse(listing)).toMatchObject({
      brandSlug: "longines",
      reference: "L3.809.4.93.9",
      name: "Longines Spirit Pilot 39 mm",
      collectionName: "Longines Spirit Pilot",
      imageUrls: ["https://api.ecom.longines.com/media/catalog/product/w/a/l3-809-4-93-9-hero.png"],
      priceCents: 290000,
      availability: "in_stock",
      specs: {
        movement: "automatique",
        caliber: "L888.4",
        diameterMm: 39,
        thicknessMm: 11.5,
        lugWidthMm: 20,
        waterResistanceM: 100,
        powerReserveH: 72,
        caseMaterial: "Acier",
        strapMaterial: "Caoutchouc",
      },
    });
    expect(listing?.rawSpecs).toMatchObject({
      "Boîtier · Matière": "Acier",
      "Bracelet · Matière": "Caoutchouc",
      "Boîtier · Spécificités": "Couronne vissée, Fond saphir",
    });
    // Valeurs « 0 » (drapeaux d'affichage) ignorées.
    expect(listing?.rawSpecs["Boîtier · Boîtier"]).toBeUndefined();
  });

  it("ignore les pages sans type de mouvement (bracelets, accessoires)", () => {
    expect(parseLongines(load(html({})), URL)).toBeNull();
  });

  it("ignore les URL qui ne sont pas des fiches montres françaises", () => {
    expect(
      parseLongines(
        load(html({ mvt_fct_type: "112" })),
        "https://www.longines.com/fr/p/strap-l682101234",
      ),
    ).toBeNull();
  });
});
