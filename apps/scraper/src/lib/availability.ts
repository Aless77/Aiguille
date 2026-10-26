import { DOMAIN_DELAY_SECS } from "../config.ts";
import { throttleDomain } from "./throttle.ts";

/**
 * Site en panne, en maintenance ou qui nous demande de ralentir : on arrête de le solliciter
 * (docs/sources.md, « Disjoncteur »). Erreur distincte d'une source cassée : elle est journalisée
 * sans faire échouer la collecte, et la source est retentée la nuit suivante.
 */
export class SourceUnavailableError extends Error {
  constructor(detail: string) {
    super(
      `Source indisponible : ${detail}. Collecte interrompue, nouvel essai à la prochaine collecte.`,
    );
    this.name = "SourceUnavailableError";
  }
}

/** Erreurs serveur d'affilée (tentatives comprises) avant d'arrêter de solliciter le site. */
export const CIRCUIT_BREAKER_THRESHOLD = 10;

const NETWORK_ERRORS =
  /ETIMEDOUT|ECONNRESET|ECONNREFUSED|ENOTFOUND|EAI_AGAIN|EHOSTUNREACH|socket hang up|timed? ?out/i;

/** 5xx (panne, maintenance) ou 429 (trop de requêtes) : le site ne peut pas ou ne veut pas répondre. */
export function isServerUnavailableStatus(status: number): boolean {
  return status >= 500 || status === 429;
}

/**
 * Échec d'une requête dû à l'indisponibilité du site (et non à la page elle-même). Le statut
 * vient de la réponse si elle existe, sinon du message de Crawlee (« 503 - Service Unavailable »).
 */
export function isUnavailabilityFailure(failure: { status?: number; message: string }): boolean {
  const status = failure.status ?? Number(/^(\d{3}) - /.exec(failure.message)?.[1]);
  if (Number.isFinite(status) && status > 0) return isServerUnavailableStatus(status);
  return NETWORK_ERRORS.test(failure.message);
}

/**
 * Disjoncteur : compte les échecs d'indisponibilité consécutifs ; une réponse valide remet le
 * compteur à zéro. Au seuil, `tripped` passe à vrai et le reste de la file est abandonné.
 */
export function createCircuitBreaker(threshold = CIRCUIT_BREAKER_THRESHOLD) {
  let consecutive = 0;
  let lastFailure = "";
  return {
    success() {
      consecutive = 0;
    },
    /** Enregistre un échec ; renvoie vrai si le disjoncteur vient de se déclencher. */
    failure(failure: { status?: number; message: string }): boolean {
      if (!isUnavailabilityFailure(failure)) {
        consecutive = 0;
        return false;
      }
      consecutive++;
      lastFailure = failure.message.split("\n")[0]!.slice(0, 120);
      return consecutive === threshold;
    },
    get tripped() {
      return consecutive >= threshold;
    },
    get reason() {
      return `${consecutive} erreurs serveur d'affilée (dernière : ${lastFailure})`;
    },
  };
}

/**
 * Requête simple vers une source (robots.txt, sitemap), avec notre User-Agent. Panne réseau,
 * 5xx ou 429 : SourceUnavailableError, pour ne pas enchaîner sur le reste de la collecte.
 */
export async function fetchFromSource(
  url: string,
  what: string,
  init: { headers: Record<string, string> },
): Promise<Response> {
  let response: Response;
  await throttleDomain(url, DOMAIN_DELAY_SECS * 1000);
  try {
    response = await fetch(url, init);
  } catch (error) {
    // fetch() lève « fetch failed » ; la vraie raison (ETIMEDOUT…) est dans error.cause.
    const cause = error instanceof Error && error.cause instanceof Error ? error.cause : error;
    const detail =
      cause instanceof Error ? String(("code" in cause && cause.code) || cause.message) : cause;
    throw new SourceUnavailableError(`${what} injoignable (${String(detail)})`);
  }
  if (isServerUnavailableStatus(response.status)) {
    throw new SourceUnavailableError(`${what} : HTTP ${response.status}`);
  }
  return response;
}
