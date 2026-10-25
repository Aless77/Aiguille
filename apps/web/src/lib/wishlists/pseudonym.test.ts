import { describe, expect, it } from "vitest";

import { pseudonym } from "./pseudonym";

const env = { BETTER_AUTH_SECRET: "secret-de-test" };

describe("pseudonym", () => {
  it("reste le même pour un membre dans une liste", () => {
    expect(pseudonym(1, "alice", env)).toBe(pseudonym(1, "alice", env));
    expect(pseudonym(1, "alice", env)).toMatch(/^\p{Lu}\p{L}+ \p{L}+ \d{2}$/u);
  });

  it("change d'une liste à l'autre et d'un membre à l'autre", () => {
    expect(pseudonym(1, "alice", env)).not.toBe(pseudonym(2, "alice", env));
    expect(pseudonym(1, "alice", env)).not.toBe(pseudonym(1, "bob", env));
  });

  it("dépend du secret du serveur", () => {
    expect(pseudonym(1, "alice", env)).not.toBe(
      pseudonym(1, "alice", { BETTER_AUTH_SECRET: "autre-secret" }),
    );
  });

  it("refuse de fonctionner sans secret en production", () => {
    expect(() =>
      pseudonym(1, "alice", { NODE_ENV: "production", VERCEL_ENV: "production" }),
    ).toThrow(/BETTER_AUTH_SECRET/);
  });
});
