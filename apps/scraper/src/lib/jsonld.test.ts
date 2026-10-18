import { load } from "cheerio";
import { describe, expect, it } from "vitest";

import { findProduct, parseAvailability } from "./jsonld.ts";

const page = (...blocks: string[]) =>
  load(blocks.map((b) => `<script type="application/ld+json">${b}</script>`).join(""));

describe("findProduct", () => {
  it("lit un Product à la racine", () => {
    const $ = page(
      JSON.stringify({
        "@type": "Product",
        name: "Tissot PRX 40mm",
        sku: "T1374071104100",
        offers: { "@type": "Offer", price: "775.00", priceCurrency: "EUR" },
      }),
    );
    expect(findProduct($)).toMatchObject({
      name: "Tissot PRX 40mm",
      sku: "T1374071104100",
      price: "775.00",
    });
  });

  it("lit un Product dans un @graph et ignore les blocs invalides", () => {
    const $ = page(
      "{ invalide",
      JSON.stringify({
        "@graph": [
          { "@type": "BreadcrumbList" },
          { "@type": "Product", mpn: "H69409930", image: ["https://x.test/a.png", 3] },
        ],
      }),
    );
    expect(findProduct($)).toMatchObject({ sku: "H69409930", images: ["https://x.test/a.png"] });
  });

  it("accepte une image décrite par un ImageObject", () => {
    const $ = page(
      JSON.stringify({
        "@type": "Product",
        sku: "L3.369.4.87.6",
        image: { "@type": "ImageObject", url: "https://x.test/hero.png" },
      }),
    );
    expect(findProduct($)?.images).toEqual(["https://x.test/hero.png"]);
  });

  it("renvoie undefined sans Product", () => {
    expect(findProduct(page(JSON.stringify({ "@type": "Organization" })))).toBeUndefined();
  });
});

describe("parseAvailability", () => {
  it("traduit les URL schema.org", () => {
    expect(parseAvailability("https://schema.org/InStock")).toBe("in_stock");
    expect(parseAvailability("http://schema.org/OutOfStock")).toBe("out_of_stock");
    expect(parseAvailability("https://schema.org/PreOrder")).toBe("preorder");
    expect(parseAvailability(undefined)).toBe("unknown");
  });
});
