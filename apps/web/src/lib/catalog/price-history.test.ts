import { describe, expect, it } from "vitest";

import { buildPriceHistory, currentOffers, type Observation, sourceLabel } from "./price-history";

const obs = (
  date: string,
  priceCents: number | null,
  availability: Observation["availability"] = "in_stock",
  source = "tissot-officiel",
): Observation => ({ source, priceCents, availability, observedAt: `${date}T03:00:00Z` });

describe("sourceLabel", () => {
  it("nomme les sources officielles", () => {
    expect(sourceLabel("tissot-officiel", "Tissot")).toBe("Site officiel Tissot");
  });
});

describe("buildPriceHistory", () => {
  it("prolonge un prix stable jusqu'au dernier relevé", () => {
    const h = buildPriceHistory([obs("2026-10-18", 77500)], "Tissot", "2026-11-02T03:00:00Z");
    expect(h.series[0]?.points).toEqual([
      { date: "2026-10-18", priceCents: 77500 },
      { date: "2026-11-02", priceCents: 77500 },
    ]);
    expect(h.current).toEqual({ priceCents: 77500, availability: "in_stock", date: "2026-10-18" });
    expect(h.since).toBe("2026-10-18");
  });

  it("calcule le plus bas et le plus haut avec leur date", () => {
    const h = buildPriceHistory(
      [obs("2026-10-18", 77500), obs("2026-11-15", 72500), obs("2027-01-10", 79500)],
      "Tissot",
      "2027-01-20T03:00:00Z",
    );
    expect(h.lowest).toMatchObject({ priceCents: 72500, date: "2026-11-15" });
    expect(h.highest).toMatchObject({ priceCents: 79500, date: "2027-01-10" });
    expect(h.current?.priceCents).toBe(79500);
    expect(h.changes.map((c) => c.date)).toEqual(["2027-01-10", "2026-11-15", "2026-10-18"]);
  });

  it("garde la première date à prix égal", () => {
    const h = buildPriceHistory(
      [obs("2026-10-18", 70000), obs("2026-11-01", 75000), obs("2026-12-01", 70000)],
      "Tissot",
      "2026-12-05",
    );
    expect(h.lowest?.date).toBe("2026-10-18");
  });

  it("suit le stock même sans prix, et sépare les sources", () => {
    const h = buildPriceHistory(
      [
        obs("2026-10-18", 77500),
        obs("2026-10-25", null, "out_of_stock"),
        obs("2026-10-20", 69900, "in_stock", "ocarat"),
      ],
      "Tissot",
      "2026-10-26",
      "tissot-officiel",
    );
    expect(h.current).toMatchObject({ priceCents: null, availability: "out_of_stock" });
    expect(h.series.map((s) => s.label)).toEqual(["Site officiel Tissot", "Ocarat"]);
    expect(h.lowest).toMatchObject({ priceCents: 69900, source: "ocarat" });
  });

  it("gère l'absence de relevé", () => {
    const h = buildPriceHistory([], "Tissot", "2026-10-18");
    expect(h).toMatchObject({ series: [], current: null, lowest: null, since: null });
  });
});

describe("currentOffers", () => {
  it("garde le dernier relevé de chaque vendeur et trie par disponibilité puis prix", () => {
    const offers = currentOffers(
      [
        obs("2026-10-18", 77500),
        obs("2026-10-18", 79000, "in_stock", "lepage"),
        obs("2026-10-25", 74000, "preorder", "lepage"),
        obs("2026-10-20", 76000, "in_stock", "ocarat"),
      ],
      "Tissot",
    );
    expect(offers.map((o) => [o.label, o.priceCents, o.availability])).toEqual([
      ["Ocarat", 76000, "in_stock"],
      ["Site officiel Tissot", 77500, "in_stock"],
      ["Lepage", 74000, "preorder"],
    ]);
    expect(offers.find((o) => o.official)?.source).toBe("tissot-officiel");
  });

  it("n'affiche plus une offre retirée", () => {
    const offers = currentOffers(
      [
        obs("2026-10-18", 79000, "in_stock", "lepage"),
        obs("2026-10-25", null, "out_of_stock", "lepage"),
      ],
      "Tissot",
    );
    expect(offers).toEqual([]);
  });
});
