import { describe, expect, it } from "vitest";

import { absoluteUrl, getSiteUrl, isIndexable } from "./site";

describe("getSiteUrl", () => {
  it("privilégie NEXT_PUBLIC_SITE_URL et retire la barre finale", () => {
    expect(getSiteUrl({ NEXT_PUBLIC_SITE_URL: "https://aiguille.fr/" })).toBe(
      "https://aiguille.fr",
    );
  });

  it("utilise le domaine de production Vercel en production", () => {
    expect(
      getSiteUrl({ VERCEL_ENV: "production", VERCEL_PROJECT_PRODUCTION_URL: "aiguille.fr" }),
    ).toBe("https://aiguille.fr");
  });

  it("utilise l'URL du déploiement pour une preview", () => {
    expect(getSiteUrl({ VERCEL_ENV: "preview", VERCEL_URL: "aiguille-abc.vercel.app" })).toBe(
      "https://aiguille-abc.vercel.app",
    );
  });

  it("retombe sur localhost sans variable", () => {
    expect(getSiteUrl({})).toBe("http://localhost:3000");
  });
});

describe("isIndexable", () => {
  it("interdit l'indexation du site privé, y compris en production", () => {
    expect(isIndexable({ VERCEL_ENV: "production" })).toBe(false);
    expect(isIndexable({ VERCEL_ENV: "preview" })).toBe(false);
    expect(isIndexable({})).toBe(false);
  });
});

describe("absoluteUrl", () => {
  const env = { NEXT_PUBLIC_SITE_URL: "https://aiguille.fr" };

  it("construit une URL absolue", () => {
    expect(absoluteUrl("/montres/tissot", env)).toBe("https://aiguille.fr/montres/tissot");
    expect(absoluteUrl("montres", env)).toBe("https://aiguille.fr/montres");
  });

  it("n'ajoute pas de barre finale à l'accueil", () => {
    expect(absoluteUrl("/", env)).toBe("https://aiguille.fr");
  });
});
