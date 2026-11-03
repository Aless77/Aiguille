import { type CatalogTrail } from "./trail";

/**
 * Parcours en cours, gardé par onglet (sessionStorage) : deux onglets peuvent feuilleter deux
 * listes différentes, et rien ne transite par l'URL des fiches (canoniques, cache et SEO intacts).
 * Le stockage peut être indisponible (navigation privée stricte) : le parcours est alors absent.
 */
const KEY = "aiguille:parcours";

const listeners = new Set<() => void>();

export function subscribeTrail(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function readStoredTrail(): string | null {
  try {
    return sessionStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function saveTrail(trail: CatalogTrail): void {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(trail));
  } catch {
    return;
  }
  listeners.forEach((listener) => listener());
}
