import { z } from "zod";

import { PAGE_SIZE } from "./types";

/**
 * Parcours du catalogue : la liste filtrée depuis laquelle une fiche a été ouverte, pour passer à
 * la montre suivante ou précédente. Fonctions pures ; le stockage est dans trail-store.ts.
 */
const trailSchema = z.object({
  /** Liste d'origine, sans préfixe de langue : chemin et filtres (« /montres/tissot?tri=nom »). */
  list: z.string().startsWith("/"),
  /** Rang de la première montre connue dans la liste complète (0 pour la première). */
  offset: z.number().int().min(0),
  /** Chemins des fiches connues, à la suite : une ou plusieurs pages de résultats. */
  paths: z.array(z.string().startsWith("/")),
  total: z.number().int().min(0),
});

export type CatalogTrail = z.infer<typeof trailSchema>;

/** Une page de résultats renvoyée par /api/catalogue/parcours. */
export const trailPageSchema = trailSchema.pick({ paths: true, total: true, offset: true });
export type TrailPage = z.infer<typeof trailPageSchema>;

export function parseTrail(raw: string | null): CatalogTrail | null {
  if (!raw) return null;
  try {
    const parsed = trailSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export interface TrailPosition {
  /** Rang de la montre dans la liste, à partir de 1. */
  rank: number;
  previous: string | null;
  next: string | null;
  /** Page de résultats à charger pour connaître une montre voisine encore inconnue. */
  missingPage: number | null;
}

/** Position d'une fiche dans le parcours ; null si elle n'en fait pas partie. */
export function trailPosition(trail: CatalogTrail, path: string): TrailPosition | null {
  const index = trail.paths.indexOf(path);
  if (index < 0) return null;
  const end = trail.offset + trail.paths.length;
  const rank = trail.offset + index + 1;
  const needsNext = index === trail.paths.length - 1 && end < trail.total;
  const needsPrevious = index === 0 && trail.offset > 0;
  return {
    rank,
    previous: trail.paths[index - 1] ?? null,
    next: trail.paths[index + 1] ?? null,
    missingPage: needsNext
      ? Math.floor(end / PAGE_SIZE) + 1
      : needsPrevious
        ? Math.floor((trail.offset - 1) / PAGE_SIZE) + 1
        : null,
  };
}

/** Ajoute une page voisine ; une page qui ne touche pas le parcours (liste changée) est ignorée. */
export function extendTrail(trail: CatalogTrail, page: TrailPage): CatalogTrail {
  const end = trail.offset + trail.paths.length;
  if (page.offset === end) {
    return { ...trail, paths: [...trail.paths, ...page.paths], total: page.total };
  }
  if (page.offset + page.paths.length === trail.offset) {
    return {
      ...trail,
      offset: page.offset,
      paths: [...page.paths, ...trail.paths],
      total: page.total,
    };
  }
  return trail;
}

/** Adresse de la page de résultats voisine, avec les mêmes filtres que la liste d'origine. */
export function trailPageUrl(trail: CatalogTrail, page: number): string {
  const [pathname, search] = trail.list.split("?");
  const params = new URLSearchParams(search);
  params.set("liste", pathname!);
  params.set("page", String(page));
  return `/api/catalogue/parcours?${params}`;
}
