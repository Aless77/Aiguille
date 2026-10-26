import { describe, expect, it } from "vitest";

import { localizedEntries } from "./sitemap-entries";

describe("localizedEntries", () => {
  it("garde une entrée simple avec le français seul", () => {
    expect(localizedEntries("/montres", ["fr"])).toEqual([
      { url: "http://localhost:3000/montres" },
    ]);
  });

  it("publie une entrée par langue, reliée aux autres versions", () => {
    const entries = localizedEntries("/montres", ["fr", "en"], { lastModified: "2026-10-25" });
    expect(entries.map((e) => e.url)).toEqual([
      "http://localhost:3000/montres",
      "http://localhost:3000/en/montres",
    ]);
    expect(entries[1]).toMatchObject({
      lastModified: "2026-10-25",
      alternates: {
        languages: {
          "fr-FR": "http://localhost:3000/montres",
          "en-GB": "http://localhost:3000/en/montres",
        },
      },
    });
  });
});
