import { describe, expect, it } from "vitest";

import { LOCALES } from "./config";
import { format, resolveDictionary, translateLabel } from "./dictionary";
import { en } from "./dictionaries/en";

describe("dictionnaires", () => {
  it("sert le français et l'anglais sans manque", () => {
    expect(resolveDictionary("fr").dict.nav.allWatches).toBe("Toutes les montres");
    expect(resolveDictionary("en").missing).toEqual([]);
  });

  it("complète une langue partielle par l'anglais et liste les manques", () => {
    const { dict, missing } = resolveDictionary("it");
    expect(dict.nav.allWatches).toBe("Tutti gli orologi");
    expect(dict.specSheet.rows["Diamètre"]).toBe("Diameter");
    expect(missing).toContain("specSheet.rows.Diamètre");
    expect(missing.every((k) => k.startsWith("specSheet."))).toBe(true);
  });

  it("traduit en allemand chaque libellé de la fiche technique", () => {
    expect(resolveDictionary("de").missing).toEqual([]);
  });

  it("traduit toutes les lignes de la fiche technique en anglais", () => {
    for (const locale of LOCALES) expect(resolveDictionary(locale).dict).toBeDefined();
    expect(Object.keys(en.specSheet.rows).length).toBeGreaterThan(40);
  });

  it("remplace les variables et garde le français sans traduction", () => {
    expect(format("{count} variants of {name}", { count: 3, name: "PRX" })).toBe(
      "3 variants of PRX",
    );
    expect(format("Bonjour {inconnu}")).toBe("Bonjour {inconnu}");
    expect(translateLabel({ Diamètre: "Diameter" }, "Diamètre")).toBe("Diameter");
    expect(translateLabel({}, "Lunette")).toBe("Lunette");
  });
});
