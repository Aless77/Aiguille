import { describe, expect, it } from "vitest";

import { reviewInput } from "./input";

const valid = {
  watchId: 1,
  ratings: { finishing: 5, design: 4, comfort: 4, legibility: 3, accuracy: 4, value: 5 },
  ownership: "owner",
  comment: "  Belle montre.  ",
};

describe("reviewInput", () => {
  it("accepte un avis complet et nettoie le commentaire", () => {
    const parsed = reviewInput.parse(valid);
    expect(parsed.comment).toBe("Belle montre.");
  });

  it("transforme un commentaire vide en absence de commentaire", () => {
    expect(reviewInput.parse({ ...valid, comment: "   " }).comment).toBeNull();
    expect(reviewInput.parse({ ...valid, comment: undefined }).comment).toBeUndefined();
  });

  it("refuse une note hors de 1 à 5 ou un critère manquant", () => {
    expect(
      reviewInput.safeParse({ ...valid, ratings: { ...valid.ratings, comfort: 6 } }).success,
    ).toBe(false);
    expect(
      reviewInput.safeParse({ ...valid, ratings: { ...valid.ratings, value: 0 } }).success,
    ).toBe(false);
    const { value: _omit, ...partial } = valid.ratings;
    expect(reviewInput.safeParse({ ...valid, ratings: partial }).success).toBe(false);
  });

  it("refuse les liens (spam)", () => {
    for (const comment of [
      "Voir https://exemple.fr",
      "promo sur www.exemple",
      "achetez sur exemple.com",
    ]) {
      expect(reviewInput.safeParse({ ...valid, comment }).success).toBe(false);
    }
  });

  it("refuse un commentaire trop long", () => {
    expect(reviewInput.safeParse({ ...valid, comment: "a".repeat(2001) }).success).toBe(false);
  });
});

describe("reviewInput (design)", () => {
  it("exige la note de design pour un nouvel avis", () => {
    const { design: _omit, ...withoutDesign } = valid.ratings;
    expect(reviewInput.safeParse({ ...valid, ratings: withoutDesign }).success).toBe(false);
  });
});
