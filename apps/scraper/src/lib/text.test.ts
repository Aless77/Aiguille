import { describe, expect, it } from "vitest";

import { parseNumber, referenceKey, slugify, titleCase, toCents } from "./text.ts";

describe("titleCase", () => {
  it("met en forme un nom en capitales en gardant les sigles", () => {
    expect(titleCase("LONGINES SPIRIT PILOT")).toBe("Longines Spirit Pilot");
    expect(titleCase("CONQUEST V.H.P. GMT")).toBe("Conquest V.H.P. GMT");
    expect(titleCase("HYDROCONQUEST")).toBe("Hydroconquest");
  });
});

describe("slugify", () => {
  it("produit un slug d'URL sans accents", () => {
    expect(slugify("Khaki Field")).toBe("khaki-field");
    expect(slugify("Classique Contemporain")).toBe("classique-contemporain");
    expect(slugify("Réserve d'énergie")).toBe("reserve-d-energie");
    expect(slugify("T137.407.11.041.00")).toBe("t137-407-11-041-00");
  });
});

describe("referenceKey", () => {
  it("retire séparateurs et casse", () => {
    expect(referenceKey("T137.407.11.041.00")).toBe("T1374071104100");
    expect(referenceKey("h69409930")).toBe("H69409930");
  });
});

describe("parseNumber", () => {
  it("lit virgule ou point décimal et ignore les unités", () => {
    expect(parseNumber("40,00")).toBe(40);
    expect(parseNumber("10,93")).toBe(10.93);
    expect(parseNumber("38mm")).toBe(38);
    expect(parseNumber("80 heures")).toBe(80);
    expect(parseNumber("aucun")).toBeUndefined();
    expect(parseNumber(undefined)).toBeUndefined();
  });
});

describe("toCents", () => {
  it("convertit un prix en centimes", () => {
    expect(toCents("775.00")).toBe(77500);
    expect(toCents(695)).toBe(69500);
    expect(toCents("1 250,50")).toBe(125050);
    expect(toCents(undefined)).toBeUndefined();
  });
});
