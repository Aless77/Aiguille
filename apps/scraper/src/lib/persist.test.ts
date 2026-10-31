import { describe, expect, it } from "vitest";

import { hasChanged, withoutFailedPages } from "./persist.ts";

describe("withoutFailedPages", () => {
  const rows = [
    { id: 1, url: "https://exemple.test/a" },
    { id: 2, url: "https://exemple.test/b" },
    { id: 3, url: null },
  ];

  it("garde ce qui a vraiment disparu, écarte les pages en échec", () => {
    const kept = withoutFailedPages(rows, new Set(["https://exemple.test/a"]));
    expect(kept.map((r) => r.id)).toEqual([2, 3]);
  });

  it("garde tout sans échec", () => {
    expect(withoutFailedPages(rows, new Set())).toEqual(rows);
  });
});

describe("hasChanged", () => {
  const last = { priceCents: 77500, availability: "in_stock" };

  it("enregistre le premier relevé", () => {
    expect(hasChanged(undefined, { priceCents: 77500, availability: "in_stock" })).toBe(true);
  });

  it("ignore un relevé identique", () => {
    expect(hasChanged(last, { priceCents: 77500, availability: "in_stock" })).toBe(false);
  });

  it("détecte un changement de prix ou de stock", () => {
    expect(hasChanged(last, { priceCents: 72500, availability: "in_stock" })).toBe(true);
    expect(hasChanged(last, { priceCents: 77500, availability: "out_of_stock" })).toBe(true);
    expect(hasChanged(last, { priceCents: undefined, availability: "in_stock" })).toBe(true);
  });
});
