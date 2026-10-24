import { describe, expect, it } from "vitest";

import { productJsonLd, serializeJsonLd } from "./json-ld";

describe("serializeJsonLd", () => {
  it("échappe < pour empêcher la fermeture de la balise script", () => {
    const name = "</script><script>alert(1)</script>";
    const out = serializeJsonLd({ "@context": "https://schema.org", "@type": "Thing", name });
    expect(out).not.toContain("<");
    expect(JSON.parse(out).name).toBe(name);
  });
});

describe("productJsonLd", () => {
  const base = {
    name: "Tissot Test",
    reference: "TEST-0001",
    brandName: "Tissot",
    description: "Montre de test",
    path: "/montres/tissot/test/test-0001",
    imageUrls: [],
    offers: [{ priceCents: 76000, availability: "in_stock" as const }],
  };

  it("omet les avis tant qu'il n'y en a pas", () => {
    const ld = productJsonLd({ ...base, reviews: { average: 0, count: 0, items: [] } });
    expect(ld).not.toHaveProperty("aggregateRating");
    expect(ld).not.toHaveProperty("review");
  });

  it("publie la moyenne des avis sur 5 et les avis récents", () => {
    const ld = productJsonLd({
      ...base,
      reviews: {
        average: 4.333,
        count: 3,
        items: [
          { author: "Testeur 1", date: new Date("2026-10-20"), rating: 5, body: "Très bien" },
        ],
      },
    }) as unknown as Record<string, unknown>;
    expect(ld.aggregateRating).toEqual({
      "@type": "AggregateRating",
      ratingValue: 4.3,
      bestRating: 5,
      worstRating: 1,
      ratingCount: 3,
    });
    expect(ld.review).toEqual([
      {
        "@type": "Review",
        author: { "@type": "Person", name: "Testeur 1" },
        datePublished: "2026-10-20",
        reviewRating: { "@type": "Rating", ratingValue: 5, bestRating: 5, worstRating: 1 },
        reviewBody: "Très bien",
      },
    ]);
  });
});
