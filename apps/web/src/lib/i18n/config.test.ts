import { describe, expect, it } from "vitest";

import { enabledLocales, localizePath, splitLocale } from "./config";

describe("langues", () => {
  it("garde le français seul sans la variable LANGUAGES", () => {
    expect(enabledLocales({})).toEqual(["fr"]);
    expect(enabledLocales({ LANGUAGES: "EN, de, xx" })).toEqual(["fr", "en", "de"]);
  });

  it("préfixe les chemins hors français, sans toucher aux liens externes", () => {
    expect(localizePath("fr", "/montres")).toBe("/montres");
    expect(localizePath("en", "/montres/tissot")).toBe("/en/montres/tissot");
    expect(localizePath("de", "/")).toBe("/de");
    expect(localizePath("en", "/connexion?retour=%2F")).toBe("/en/connexion?retour=%2F");
    expect(localizePath("en", "/en/montres")).toBe("/en/montres");
    expect(localizePath("en", "https://www.tissotwatches.com")).toBe(
      "https://www.tissotwatches.com",
    );
    expect(localizePath("en", "#technique")).toBe("#technique");
  });

  it("sépare la langue du chemin", () => {
    expect(splitLocale("/en/montres")).toEqual({ locale: "en", path: "/montres" });
    expect(splitLocale("/de")).toEqual({ locale: "de", path: "/" });
    expect(splitLocale("/montres")).toEqual({ locale: "fr", path: "/montres" });
    expect(splitLocale("/fr/montres")).toEqual({ locale: "fr", path: "/fr/montres" });
  });
});
