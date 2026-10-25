import { describe, expect, it } from "vitest";

import { pageMetadata } from "./metadata";

describe("métadonnées multilingues", () => {
  const input = { title: "Watch prices", description: "Prices in Europe", path: "/prix-en-europe" };

  it("garde les URL françaises et localise la canonique et Open Graph", () => {
    expect(pageMetadata(input).alternates?.canonical).toBe("/prix-en-europe");
    const metadata = pageMetadata({ ...input, locale: "en" });
    expect(metadata.alternates?.canonical).toBe("/en/prix-en-europe");
    expect(metadata.openGraph).toMatchObject({ url: "/en/prix-en-europe", locale: "en_GB" });
  });

  it("limite hreflang aux langues explicitement indexables", () => {
    expect(
      pageMetadata({ ...input, alternateLocales: ["fr"] }).alternates?.languages,
    ).toBeUndefined();
    expect(
      pageMetadata({ ...input, alternateLocales: ["fr", "en"] }).alternates?.languages,
    ).toEqual({
      "fr-FR": "/prix-en-europe",
      "en-GB": "/en/prix-en-europe",
      "x-default": "/prix-en-europe",
    });
  });

  it("conserve le noindex demandé sur une version traduite", () => {
    expect(pageMetadata({ ...input, locale: "de", index: false }).robots).toEqual({
      index: false,
      follow: true,
    });
  });
});
