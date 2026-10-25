import { describe, expect, it } from "vitest";

import { COUNTRY_CODES, countryOptions, isCountryAnswer, UNDISCLOSED_COUNTRY } from "./countries";

describe("pays de provenance", () => {
  it("accepte un code ISO connu ou « ne pas le dire », rien d'autre", () => {
    expect(isCountryAnswer("FR")).toBe(true);
    expect(isCountryAnswer(UNDISCLOSED_COUNTRY)).toBe(true);
    expect(isCountryAnswer("fr")).toBe(false);
    expect(isCountryAnswer("12 rue de la Paix")).toBe(false);
    expect(isCountryAnswer(null)).toBe(false);
  });

  it("couvre les 249 codes ISO, sans doublon", () => {
    expect(COUNTRY_CODES).toHaveLength(249);
    expect(new Set(COUNTRY_CODES).size).toBe(249);
  });

  it("nomme et trie les pays dans la langue d'affichage", () => {
    const fr = countryOptions("fr");
    expect(fr.find((c) => c.code === "DE")?.name).toBe("Allemagne");
    expect(countryOptions("de").find((c) => c.code === "DE")?.name).toBe("Deutschland");
    expect(fr[0]!.name.localeCompare(fr[1]!.name, "fr")).toBeLessThan(0);
  });
});
