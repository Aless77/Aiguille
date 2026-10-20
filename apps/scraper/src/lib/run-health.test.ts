import { describe, expect, it } from "vitest";

import { extractionFailure } from "./run-health.ts";

describe("extractionFailure", () => {
  it("échoue quand rien n'a pu être lu", () => {
    expect(extractionFailure({ matched: 0, unmatched: 0 }, true)).toMatch(/Zéro montre/);
    expect(extractionFailure({ matched: 0, unmatched: 0 }, false)).toMatch(/Zéro montre/);
  });

  it("accepte un essai limité tombé sur une montre hors catalogue", () => {
    expect(extractionFailure({ matched: 0, unmatched: 1 }, true)).toBeNull();
  });

  it("échoue sur une collecte complète où rien n'est rattaché", () => {
    expect(extractionFailure({ matched: 0, unmatched: 300 }, false)).toMatch(/rapprochement/);
  });

  it("passe dès qu'une montre est rattachée", () => {
    expect(extractionFailure({ matched: 1, unmatched: 300 }, false)).toBeNull();
  });
});
