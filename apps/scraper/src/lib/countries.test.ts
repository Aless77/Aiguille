import { describe, expect, it } from "vitest";

import { type Country, countriesForDay } from "./countries.ts";

const ALL: Country[] = [
  "FR",
  "DE",
  "IT",
  "ES",
  "NL",
  "BE",
  "AT",
  "PT",
  "IE",
  "CH",
  "GB",
  "SE",
  "DK",
  "PL",
];

describe("countriesForDay", () => {
  it("relève 2 pays par jour, jamais la France (relevée chaque jour)", () => {
    const day = countriesForDay(ALL, new Date("2026-10-19T03:00:00Z"));
    expect(day).toHaveLength(2);
    expect(day).not.toContain("FR");
  });

  it("revoit chaque pays en une semaine", () => {
    const seen = new Set<Country>();
    for (let i = 0; i < 7; i++) {
      for (const c of countriesForDay(ALL, new Date(Date.UTC(2026, 9, 19 + i, 3)))) seen.add(c);
    }
    expect(seen.size).toBe(13);
  });

  it("s'adapte aux pays disponibles pour une marque", () => {
    expect(countriesForDay(["FR", "CH"], new Date("2026-10-19"))).toEqual(["CH"]);
    expect(countriesForDay(["FR"], new Date("2026-10-19"))).toEqual([]);
  });
});
