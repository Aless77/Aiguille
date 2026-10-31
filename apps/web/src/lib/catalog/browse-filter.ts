import { features } from "@/lib/features";

import { type CatalogParams, toFilter } from "./search-params";
import { type CatalogFilter, type Sort } from "./types";

export type CatalogScope = Pick<CatalogFilter, "brandSlug" | "collectionSlug">;

/** Tris masqués avec les fonctions correspondantes (lib/features.ts). */
export function hiddenSorts(): Sort[] {
  return [
    ...(features.score() ? [] : (["note"] as const)),
    ...(features.reviews() ? [] : (["avis"] as const)),
  ];
}

/** Filtre d'une liste du catalogue : mêmes résultats pour la page et pour le parcours. */
export function browseFilter(params: CatalogParams, scope: CatalogScope): CatalogFilter {
  const filter = { ...toFilter(params), ...scope };
  // La marque du chemin prime aussi sur un éventuel paramètre hérité d'une autre page.
  if (scope.brandSlug) filter.brands = [];
  if (filter.sort && hiddenSorts().includes(filter.sort)) filter.sort = "prix-asc";
  return filter;
}
