import { describe, expect, it } from "vitest";

import { features } from "./features";

describe("features.score", () => {
  it("est masquée tant qu'elle n'est pas explicitement activée", () => {
    expect(features.score({})).toBe(false);
    expect(features.score({ FEATURE_SCORE: "" })).toBe(false);
    expect(features.score({ FEATURE_SCORE: "oui" })).toBe(false);
    expect(features.score({ FEATURE_SCORE: "true" })).toBe(true);
    expect(features.score({ FEATURE_SCORE: "1" })).toBe(true);
  });
});

describe("features.reviews", () => {
  it("est affichée par défaut, même sans réglage", () => {
    expect(features.reviews({})).toBe(true);
    expect(features.reviews({ FEATURE_REVIEWS: "" })).toBe(true);
    expect(features.reviews({ FEATURE_REVIEWS: "true" })).toBe(true);
  });

  it("n'est masquée qu'avec false ou 0", () => {
    expect(features.reviews({ FEATURE_REVIEWS: "false" })).toBe(false);
    expect(features.reviews({ FEATURE_REVIEWS: "0" })).toBe(false);
  });
});

describe("features.community", () => {
  it("est affichée par défaut et masquée seulement avec false ou 0", () => {
    expect(features.community({})).toBe(true);
    expect(features.community({ FEATURE_COMMUNITY: "true" })).toBe(true);
    expect(features.community({ FEATURE_COMMUNITY: "false" })).toBe(false);
    expect(features.community({ FEATURE_COMMUNITY: "0" })).toBe(false);
  });
});
