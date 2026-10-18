import {
  createLoader,
  createSerializer,
  parseAsArrayOf,
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
} from "nuqs/server";

import { type CatalogFilter, MOVEMENTS, SORTS } from "./types";

/**
 * Filtres du catalogue dans l'URL (partageables, cahier des charges). Noms courts en français :
 * /montres?marque=tissot,hamilton&mouvement=automatique&prixMax=1000&tri=prix-desc
 * Ces URL ne sont pas indexées : la canonique du catalogue pointe vers /montres.
 */
export const catalogParsers = {
  marque: parseAsArrayOf(parseAsString).withDefault([]),
  mouvement: parseAsArrayOf(parseAsStringLiteral(MOVEMENTS)).withDefault([]),
  prixMin: parseAsInteger,
  prixMax: parseAsInteger,
  diametreMin: parseAsInteger,
  diametreMax: parseAsInteger,
  tri: parseAsStringLiteral(SORTS).withDefault("prix-asc"),
  page: parseAsInteger.withDefault(1),
};

export const loadCatalogParams = createLoader(catalogParsers);
export const serializeCatalogParams = createSerializer(catalogParsers);

export type CatalogParams = Awaited<ReturnType<typeof loadCatalogParams>>;

/** Paramètres d'URL → filtre de requête. */
export function toFilter(p: CatalogParams): CatalogFilter {
  return {
    brands: p.marque,
    movements: p.mouvement,
    priceMin: p.prixMin,
    priceMax: p.prixMax,
    diameterMin: p.diametreMin,
    diameterMax: p.diametreMax,
    sort: p.tri,
    page: p.page,
  };
}
