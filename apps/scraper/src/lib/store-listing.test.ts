import { load } from "cheerio";
import { describe, expect, it } from "vitest";

import { parseStoreListing } from "./store-listing.ts";

const page = (...nodes: unknown[]) =>
  load(
    nodes.map((n) => `<script type="application/ld+json">${JSON.stringify(n)}</script>`).join(""),
  );

describe("parseStoreListing", () => {
  it("lit une boutique Longines (Store, coordonnées numériques), sans e-mail ni téléphone", () => {
    const $ = page([{ "@type": "Organization", name: "Longines" }], {
      "@type": "Store",
      name: "El Corte Inglés",
      telephone: "976 21 11 21",
      email: "contact@example.test",
      address: {
        "@type": "PostalAddress",
        streetAddress: "Sagasta, 3",
        addressLocality: "ZARAGOZA",
        postalCode: "50008",
        addressCountry: "ES",
      },
      geo: { "@type": "GeoCoordinates", latitude: 41.645363708, longitude: -0.8853495231 },
    });
    expect(parseStoreListing($)).toEqual({
      name: "El Corte Inglés",
      street: "Sagasta, 3",
      postalCode: "50008",
      city: "Zaragoza",
      country: "ES",
      latitude: 41.645363708,
      longitude: -0.8853495231,
    });
  });

  it("lit une boutique Hamilton (JewelryStore, coordonnées en texte)", () => {
    const $ = page({
      "@type": "JewelryStore",
      name: "ALAIN JOAILLIER",
      address: {
        streetAddress: "35 RUE DU TEMPLE",
        addressLocality: "La Rochelle",
        postalCode: "17000",
        addressCountry: "fr",
      },
      geo: { latitude: "46.1586213", longitude: "-1.1533299" },
    });
    expect(parseStoreListing($)).toMatchObject({
      city: "La Rochelle",
      country: "FR",
      latitude: 46.1586213,
    });
  });

  it("refuse une page sans adresse ou sans coordonnées valides", () => {
    expect(parseStoreListing(page({ "@type": "Organization", name: "Longines" }))).toBeNull();
    expect(
      parseStoreListing(
        page({
          "@type": "Store",
          name: "X",
          address: { addressLocality: "Y", addressCountry: "FR" },
          geo: {},
        }),
      ),
    ).toBeNull();
  });
});
