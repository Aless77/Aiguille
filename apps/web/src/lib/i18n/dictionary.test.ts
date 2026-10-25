import { describe, expect, it } from "vitest";

import { LOCALES } from "./config";
import { format, resolveDictionary, translateLabel } from "./dictionary";
import { en } from "./dictionaries/en";

describe("dictionnaires", () => {
  it("sert le français et l'anglais sans manque", () => {
    expect(resolveDictionary("fr").dict.nav.allWatches).toBe("Toutes les montres");
    expect(resolveDictionary("en").missing).toEqual([]);
  });

  it("traduit chaque texte du site dans toutes les langues", () => {
    for (const locale of ["de", "it", "es"] as const) {
      expect(resolveDictionary(locale).missing, locale).toEqual([]);
    }
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

  it("conserve les variables de chaque message dans les cinq langues", () => {
    const flatten = (tree: object, prefix = ""): Record<string, string> =>
      Object.fromEntries(
        Object.entries(tree).flatMap(([key, value]) => {
          const path = `${prefix}${key}`;
          return typeof value === "string"
            ? [[path, value]]
            : Object.entries(flatten(value as object, `${path}.`));
        }),
      );
    const variables = (text: string) => [...new Set(text.match(/\{\w+\}/g) ?? [])].sort();
    const reference = flatten(resolveDictionary("fr").dict);
    for (const locale of LOCALES) {
      const messages = flatten(resolveDictionary(locale).dict);
      for (const [key, text] of Object.entries(reference)) {
        // Les avertissements secondaires nomment leur langue directement (« auf Deutsch »).
        const expected = variables(text).filter(
          (variable) =>
            !(
              key.startsWith("fallback.") &&
              variable === "{language}" &&
              !["fr", "en"].includes(locale)
            ),
        );
        expect(variables(messages[key]!), `${locale}: ${key}`).toEqual(expected);
      }
    }
  });
});
