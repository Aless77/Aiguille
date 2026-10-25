import { describe, expect, it } from "vitest";

import {
  COLLECTION_FAMILIES,
  familyCoverage,
  familyOf,
  groupByFamily,
} from "./collection-families";

describe("COLLECTION_FAMILIES", () => {
  it("rattache chaque collection à une seule gamme, avec une page officielle", () => {
    for (const [brand, config] of Object.entries(COLLECTION_FAMILIES)) {
      const slugs = config.families.flatMap((f) => f.collections);
      expect(new Set(slugs).size, brand).toBe(slugs.length);
      for (const f of config.families) expect(f.url).toMatch(new RegExp(`^https://www\\.${brand}`));
    }
  });
});

describe("familyOf", () => {
  it("trouve la gamme officielle d'une collection", () => {
    expect(familyOf("longines", "the-longines-master-collection-moonphase")?.name).toBe("Master");
    expect(familyOf("longines", "conquest-heritage")?.name).toBe("Heritage");
    expect(familyOf("tissot", "pr100-tour-de-france")?.name).toBe("PR 100");
    expect(familyOf("tissot", "gentleman")).toBeNull();
    expect(familyOf("hamilton", "jazzmaster")).toBeNull();
  });
});

describe("groupByFamily", () => {
  it("regroupe dans l'ordre de la marque, collections sans gamme à la fin", () => {
    const groups = groupByFamily("tissot", [
      { slug: "gentleman" },
      { slug: "seastar-2000" },
      { slug: "prx" },
      { slug: "seastar-1000" },
    ]);
    expect(groups.map((g) => [g.family?.slug ?? null, g.collections.map((c) => c.slug)])).toEqual([
      ["prx", ["prx"]],
      ["seastar", ["seastar-1000", "seastar-2000"]],
      [null, ["gentleman"]],
    ]);
  });

  it("laisse les collections à plat pour une marque sans gamme", () => {
    expect(groupByFamily("hamilton", [{ slug: "jazzmaster" }])).toEqual([
      { family: null, collections: [{ slug: "jazzmaster" }] },
    ]);
  });
});

describe("familyCoverage", () => {
  it("signale les collections sans gamme et les slugs inconnus", () => {
    const check = familyCoverage("longines", ["conquest", "nouvelle-collection", "autres"]);
    expect(check?.unassigned).toEqual(["nouvelle-collection"]);
    expect(check?.unknown).toContain("hydroconquest");
    expect(familyCoverage("hamilton", ["jazzmaster"])).toEqual({ unassigned: [], unknown: [] });
    expect(familyCoverage("seiko", ["presage"])).toBeNull();
  });
});
