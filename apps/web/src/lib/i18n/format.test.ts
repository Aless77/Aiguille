import { describe, expect, it } from "vitest";

import { formatters } from "./format";

describe("formats multilingues", () => {
  it("adapte les décimales, les prix et les pays à la langue", () => {
    const fr = formatters("fr");
    const en = formatters("en");
    expect(fr.mm(38.5)).toBe("38,5 mm");
    expect(en.mm(38.5)).toBe("38.5 mm");
    expect(fr.price(125000)).toBe("1 250 €");
    expect(en.price(125000)).toBe("€1,250");
    expect(fr.price(null)).toBeNull();
    expect(en.country("DE")).toBe("Germany");
    expect(formatters("it").country("DE")).toBe("Germania");
    expect(formatters("es").country("DE")).toBe("Alemania");
  });

  it("affiche les dates en heure de Paris même près de minuit UTC", () => {
    const date = new Date("2026-10-24T22:30:00Z");
    expect(formatters("fr").date(date)).toBe("25 octobre 2026");
    expect(formatters("en").date(date)).toBe("25 October 2026");
  });

  it("choisit le pluriel selon la langue et formate le nombre", () => {
    const forms = { one: "{count} watch", other: "{count} watches" };
    const en = formatters("en");
    expect(en.plural(forms, 0)).toBe("0 watches");
    expect(en.plural(forms, 1)).toBe("1 watch");
    expect(en.plural(forms, 1250)).toBe("1,250 watches");
    expect(formatters("fr").plural({ one: "{count} montre", other: "{count} montres" }, 0)).toBe(
      "0 montre",
    );
  });
});
