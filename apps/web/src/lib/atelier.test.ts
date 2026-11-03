import { describe, expect, it } from "vitest";
import { getAtelierUrl } from "./atelier";
import { features } from "./features";

describe("visibilité de l'atelier", () => {
  it("masque les entrées même si une destination est configurée", () => {
    expect(
      features.atelier({ FEATURE_ATELIER: "false", ATELIER_URL: "https://atelier.example" }),
    ).toBe(false);
    expect(features.atelier({ FEATURE_ATELIER: "0", NODE_ENV: "development" })).toBe(false);
    expect(features.atelier({})).toBe(true);
    expect(features.atelier({ FEATURE_ATELIER: "true" })).toBe(true);
  });
});

describe("adresse de l'atelier", () => {
  it("n'invente aucune adresse de publication", () => {
    expect(getAtelierUrl({ NODE_ENV: "production" })).toBeNull();
  });

  it("accepte une destination HTTPS explicite", () => {
    expect(getAtelierUrl({ ATELIER_URL: "https://atelier.example/", NODE_ENV: "production" })).toBe(
      "https://atelier.example/",
    );
  });

  it.each([
    "javascript:alert(1)",
    "https://utilisateur:secret@atelier.example/",
    "http://atelier.example/",
    "https://localhost:4173/",
    "https://127.0.0.1:4173/",
    "https://[::1]:4173/",
    "/atelier",
    "adresse invalide",
  ])("masque une destination impropre à la production : %s", (ATELIER_URL) => {
    expect(getAtelierUrl({ ATELIER_URL, NODE_ENV: "production" })).toBeNull();
  });

  it("permet un serveur HTTP explicitement choisi en développement", () => {
    expect(getAtelierUrl({ ATELIER_URL: "http://127.0.0.1:4173", NODE_ENV: "development" })).toBe(
      "http://127.0.0.1:4173/",
    );
  });
});
