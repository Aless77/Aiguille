import { describe, expect, it } from "vitest";

import { BRAND_INFO, movementMaker, warrantyFor } from "./brand-info.ts";

describe("brand-info", () => {
  it("préfère la garantie de la fiche à la règle de la marque", () => {
    expect(warrantyFor("tissot", 36)).toMatchObject({
      months: 36,
      source: "Fiche officielle de la montre",
    });
    expect(warrantyFor("tissot", null)).toMatchObject({ months: 24 });
  });

  it("ne renvoie rien sans source vérifiée", () => {
    expect(warrantyFor("longines", null)).toBeNull();
    expect(movementMaker("longines", "L888.5")).toBeNull();
  });

  it("attribue un fabricant seulement quand la fiche le nomme", () => {
    expect(movementMaker("hamilton", "ETA F05.105 mh2")?.value).toBe("ETA");
    expect(movementMaker("hamilton", "H-10")).toBeNull();
  });

  it("date et source chaque information renseignée", () => {
    for (const info of Object.values(BRAND_INFO)) {
      for (const entry of [info.warranty, info.group, ...info.movementMakers]) {
        if (!entry) continue;
        expect(entry.source).toMatch(/^https:\/\//);
        expect(entry.checkedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      }
    }
  });
});
