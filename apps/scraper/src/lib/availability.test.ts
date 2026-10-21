import { describe, expect, it } from "vitest";

import {
  SourceUnavailableError,
  createCircuitBreaker,
  isServerUnavailableStatus,
  isUnavailabilityFailure,
} from "./availability.ts";

describe("isServerUnavailableStatus", () => {
  it("vise les pannes et les demandes de ralentir", () => {
    expect(isServerUnavailableStatus(503)).toBe(true);
    expect(isServerUnavailableStatus(500)).toBe(true);
    expect(isServerUnavailableStatus(429)).toBe(true);
  });

  it("ignore les erreurs propres à une page", () => {
    expect(isServerUnavailableStatus(404)).toBe(false);
    expect(isServerUnavailableStatus(403)).toBe(false);
    expect(isServerUnavailableStatus(200)).toBe(false);
  });
});

describe("isUnavailabilityFailure", () => {
  it("lit le statut dans le message de Crawlee", () => {
    expect(isUnavailabilityFailure({ message: "503 - Internal Server Error: <HTML>" })).toBe(true);
    expect(isUnavailabilityFailure({ message: "404 - Not Found" })).toBe(false);
  });

  it("préfère le statut de la réponse quand il existe", () => {
    expect(isUnavailabilityFailure({ status: 429, message: "Request blocked" })).toBe(true);
    expect(isUnavailabilityFailure({ status: 410, message: "Gone" })).toBe(false);
  });

  it("compte les pannes réseau, pas les erreurs de lecture", () => {
    expect(isUnavailabilityFailure({ message: "connect ETIMEDOUT 1.2.3.4:443" })).toBe(true);
    expect(isUnavailabilityFailure({ message: "Navigation timed out after 60 seconds." })).toBe(
      true,
    );
    expect(isUnavailabilityFailure({ message: "Cannot read properties of undefined" })).toBe(false);
  });
});

describe("createCircuitBreaker", () => {
  const down = { message: "503 - Service Unavailable" };

  it("se déclenche au seuil d'échecs consécutifs, une seule fois", () => {
    const breaker = createCircuitBreaker(3);
    expect(breaker.failure(down)).toBe(false);
    expect(breaker.failure(down)).toBe(false);
    expect(breaker.failure(down)).toBe(true);
    expect(breaker.tripped).toBe(true);
    expect(breaker.failure(down)).toBe(false);
    expect(breaker.reason).toMatch(/4 erreurs serveur d'affilée.*503/);
  });

  it("repart de zéro après une réponse valide ou une erreur de page", () => {
    const breaker = createCircuitBreaker(3);
    breaker.failure(down);
    breaker.failure(down);
    breaker.success();
    breaker.failure(down);
    breaker.failure({ message: "404 - Not Found" });
    breaker.failure(down);
    expect(breaker.tripped).toBe(false);
  });
});

describe("SourceUnavailableError", () => {
  it("explique que la source sera retentée", () => {
    const error = new SourceUnavailableError("robots.txt HTTP 503");
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe(
      "Source indisponible : robots.txt HTTP 503. Collecte interrompue, nouvel essai à la prochaine collecte.",
    );
  });
});
