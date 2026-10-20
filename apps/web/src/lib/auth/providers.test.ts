import { describe, expect, it } from "vitest";

import { configuredProviders, safeReturnPath } from "./providers";

describe("configuredProviders", () => {
  it("ne garde que les fournisseurs complets", () => {
    const providers = configuredProviders({
      GOOGLE_CLIENT_ID: "id",
      GOOGLE_CLIENT_SECRET: "secret",
      GITHUB_CLIENT_ID: "id-seul",
    });
    expect(Object.keys(providers)).toEqual(["google"]);
    expect(providers.google).toEqual({
      clientId: "id",
      clientSecret: "secret",
      prompt: "select_account",
    });
  });

  it("renvoie un objet vide sans configuration", () => {
    expect(configuredProviders({})).toEqual({});
  });
});

describe("safeReturnPath", () => {
  it("accepte un chemin du site", () => {
    expect(safeReturnPath("/montres/tissot?page=2")).toBe("/montres/tissot?page=2");
    expect(safeReturnPath(["/nouveautes", "/autre"])).toBe("/nouveautes");
  });

  it("refuse les redirections vers un autre site", () => {
    expect(safeReturnPath("https://exemple.com")).toBe("/");
    expect(safeReturnPath("//exemple.com")).toBe("/");
    expect(safeReturnPath("/\\exemple.com")).toBe("/");
    expect(safeReturnPath(undefined)).toBe("/");
  });
});
