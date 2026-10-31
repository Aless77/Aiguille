import { describe, expect, it } from "vitest";

import { ADMIN_SESSION_SECONDS, createAdminToken, validAdminToken } from "./admin-token";
import { accessRequestInput } from "./access-input";

const env = {
  ADMIN_USERNAME: "proprietaire",
  ADMIN_PASSWORD: "une-phrase-secrete-solide",
  BETTER_AUTH_SECRET: "a".repeat(32),
};
const now = 1_800_000_000_000;

describe("session administrateur", () => {
  it("accepte test/test uniquement en développement local", () => {
    const local = {
      ...env,
      NODE_ENV: "development",
      ADMIN_USERNAME: "test",
      ADMIN_PASSWORD: "test",
    };
    const token = createAdminToken(local, now);
    expect(token).not.toBeNull();
    expect(validAdminToken(token!, local, now)).toBe(true);
    expect(createAdminToken({ ...local, ADMIN_PASSWORD: "" }, now)).toBeNull();
    expect(createAdminToken({ ...local, NODE_ENV: "production" }, now)).toBeNull();
    expect(createAdminToken({ ...local, VERCEL: "1" }, now)).toBeNull();
  });
  it("refuse une configuration absente ou faible", () => {
    expect(createAdminToken({})).toBeNull();
    expect(createAdminToken({ ...env, ADMIN_PASSWORD: "court" })).toBeNull();
    expect(createAdminToken({ ...env, BETTER_AUTH_SECRET: "court" })).toBeNull();
    expect(validAdminToken(undefined, env, now)).toBe(false);
  });
  it("valide une signature jusqu'à expiration", () => {
    const token = createAdminToken(env, now)!;
    expect(validAdminToken(token, env, now)).toBe(true);
    expect(validAdminToken(token, env, now + ADMIN_SESSION_SECONDS * 1000)).toBe(false);
    expect(validAdminToken(token, env, now - 1000)).toBe(false);
  });
  it("rejette les falsifications et révoque à chaque changement des identifiants", () => {
    const token = createAdminToken(env, now)!;
    expect(validAdminToken(token.slice(0, -1) + "z", env, now)).toBe(false);
    expect(
      validAdminToken(token, { ...env, ADMIN_PASSWORD: "autre-phrase-secrete-solide" }, now),
    ).toBe(false);
    expect(validAdminToken(token, { ...env, ADMIN_USERNAME: "autre" }, now)).toBe(false);
    expect(validAdminToken(token, { ...env, BETTER_AUTH_SECRET: "b".repeat(32) }, now)).toBe(false);
  });
});

describe("demande d'accès", () => {
  const input = {
    motivation: "Je souhaite comparer les montres avant mon prochain achat.",
    origin: "France, un ami",
    interestedBrands: "Tissot, Hamilton",
  };
  it("valide les réponses et retire les espaces superflus", () => {
    expect(accessRequestInput.parse({ ...input, origin: " France " }).origin).toBe("France");
  });
  it("refuse les réponses manquantes, trop courtes ou trop longues", () => {
    expect(accessRequestInput.safeParse({}).success).toBe(false);
    expect(accessRequestInput.safeParse({ ...input, motivation: " " }).success).toBe(false);
    expect(
      accessRequestInput.safeParse({ ...input, interestedBrands: "a".repeat(501) }).success,
    ).toBe(false);
  });
});
