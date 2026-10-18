import { describe, expect, it } from "vitest";

import { hasChanged } from "./persist.ts";

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
