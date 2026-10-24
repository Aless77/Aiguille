import {
  createLoader,
  createSerializer,
  parseAsArrayOf,
  parseAsInteger,
  parseAsFloat,
  parseAsBoolean,
  parseAsString,
  parseAsStringLiteral,
} from "nuqs/server";
import { z } from "zod";

import { type CatalogFilter, MOVEMENTS, SORTS, TECHNICAL_FILTER_KEYS } from "./types";

/**
 * Filtres du catalogue dans l'URL (partageables, cahier des charges). Noms courts en français :
 * /montres?marque=tissot,hamilton&mouvement=automatique&prixMax=1000&tri=prix-desc
 * Ces URL ne sont pas indexées : la canonique du catalogue pointe vers /montres.
 */
export const catalogParsers = {
  recherche: parseAsString.withDefault(""),
  marque: parseAsArrayOf(parseAsString).withDefault([]),
  mouvement: parseAsArrayOf(parseAsStringLiteral(MOVEMENTS)).withDefault([]),
  prixMin: parseAsInteger,
  prixMax: parseAsInteger,
  diametreMin: parseAsFloat,
  diametreMax: parseAsFloat,
  collection: parseAsArrayOf(parseAsString).withDefault([]),
  boitier: parseAsArrayOf(parseAsString).withDefault([]),
  bracelet: parseAsArrayOf(parseAsString).withDefault([]),
  couleur: parseAsArrayOf(parseAsString).withDefault([]),
  verre: parseAsArrayOf(parseAsString).withDefault([]),
  calibre: parseAsArrayOf(parseAsString).withDefault([]),
  fonction: parseAsArrayOf(parseAsString).withDefault([]),
  equipement: parseAsArrayOf(parseAsString).withDefault([]),
  etancheiteMin: parseAsInteger,
  reserveMin: parseAsInteger,
  epaisseurMax: parseAsFloat,
  entrecornes: parseAsFloat,
  garantieMin: parseAsInteger,
  statut: parseAsStringLiteral(["active", "arretee"] as const),
  enStock: parseAsBoolean.withDefault(false),
  tri: parseAsStringLiteral(SORTS).withDefault("prix-asc"),
  page: parseAsInteger.withDefault(1),
};

export const loadCatalogParams = createLoader(catalogParsers);
export const serializeCatalogParams = createSerializer(catalogParsers);

export type CatalogParams = Awaited<ReturnType<typeof loadCatalogParams>>;

/** Les variantes filtrées gardent la canonique de la page, mais ne sont pas indexées. */
export function hasCatalogFilters(p: CatalogParams): boolean {
  return Boolean(
    p.recherche ||
    p.marque.length ||
    p.mouvement.length ||
    p.prixMin !== null ||
    p.prixMax !== null ||
    p.diametreMin !== null ||
    p.diametreMax !== null ||
    TECHNICAL_FILTER_KEYS.some((key) => p[key].length > 0) ||
    [p.etancheiteMin, p.reserveMin, p.epaisseurMax, p.entrecornes, p.garantieMin].some(
      (v) => v !== null,
    ) ||
    p.statut !== null ||
    p.enStock ||
    p.tri !== "prix-asc" ||
    p.page > 1,
  );
}

const bound = z.number().finite().min(0).max(10_000_000).nullable().catch(null);

/** Bornes externes : valeurs invalides ignorées, ordre min/max rétabli. */
export function catalogRange(min: number | null, max: number | null) {
  const low = bound.parse(min);
  const high = bound.parse(max);
  return low !== null && high !== null && low > high
    ? ([high, low] as const)
    : ([low, high] as const);
}

/** Paramètres d'URL → filtre de requête. */
export function toFilter(p: CatalogParams): CatalogFilter {
  const [priceMin, priceMax] = catalogRange(p.prixMin, p.prixMax);
  const [diameterMin, diameterMax] = catalogRange(p.diametreMin, p.diametreMax);
  return {
    search: z.string().trim().max(120).catch("").parse(p.recherche),
    brands: p.marque,
    movements: p.mouvement,
    priceMin,
    priceMax,
    diameterMin,
    diameterMax,
    technical: Object.fromEntries(
      TECHNICAL_FILTER_KEYS.map((key) => [
        key,
        z.array(z.string().trim().min(1).max(120)).max(40).catch([]).parse(p[key]),
      ]),
    ),
    waterMin: bound.parse(p.etancheiteMin),
    reserveMin: bound.parse(p.reserveMin),
    thicknessMax: bound.parse(p.epaisseurMax),
    lugWidth: bound.parse(p.entrecornes),
    warrantyMin: bound.parse(p.garantieMin),
    status: p.statut === "arretee" ? "discontinued" : p.statut,
    inStock: p.enStock,
    sort: p.tri,
    page: Math.max(1, p.page),
  };
}
