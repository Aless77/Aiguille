export const MOVEMENTS = ["automatique", "manuel", "quartz", "solaire", "autre"] as const;
export type Movement = (typeof MOVEMENTS)[number];

export const SORTS = ["prix-asc", "prix-desc", "note", "avis", "nom", "recents"] as const;
export type Sort = (typeof SORTS)[number];

/** Segment d'URL des montres sans collection connue. */
export const NO_COLLECTION_SLUG = "autres";

export const PAGE_SIZE = 24;

export const TECHNICAL_FILTER_LABELS = {
  collection: "Collection",
  boitier: "Matière du boîtier",
  bracelet: "Matière du bracelet",
  couleur: "Couleur du cadran",
  verre: "Verre",
  calibre: "Calibre",
  fonction: "Fonctions et complications",
  equipement: "Équipement et certifications",
} as const;
export type TechnicalFilterKey = keyof typeof TECHNICAL_FILTER_LABELS;
export const TECHNICAL_FILTER_KEYS = Object.keys(TECHNICAL_FILTER_LABELS) as TechnicalFilterKey[];
export interface FacetOption {
  value: string;
  label: string;
  count: number;
}

export interface WatchCard {
  slug: string;
  reference: string;
  name: string;
  brandSlug: string;
  brandName: string;
  collectionSlug: string;
  collectionName: string | null;
  movement: Movement | null;
  diameterMm: number | null;
  priceCents: number | null;
  imageUrl: string | null;
  discontinued: boolean;
  /** Note sur 100 (lot 5), null tant qu'elle n'est pas calculée. */
  score: number | null;
}

export interface CatalogFilter {
  search?: string;
  brands?: string[];
  brandSlug?: string;
  collectionSlug?: string;
  movements?: Movement[];
  priceMin?: number | null;
  priceMax?: number | null;
  diameterMin?: number | null;
  diameterMax?: number | null;
  technical?: Partial<Record<TechnicalFilterKey, string[]>>;
  waterMin?: number | null;
  reserveMin?: number | null;
  thicknessMax?: number | null;
  lugWidth?: number | null;
  warrantyMin?: number | null;
  status?: "active" | "discontinued" | null;
  inStock?: boolean;
  sort?: Sort;
  page?: number;
}

/**
 * Garde-fou contenu mince (docs/seo/strategie.md) : une fiche n'est indexable qu'avec un prix,
 * un mouvement et un diamètre. Même règle en SQL dans getAllWatchPaths (sitemap).
 */
export function isWatchIndexable(
  w: Pick<WatchCard, "priceCents" | "movement" | "diameterMm">,
): boolean {
  return w.priceCents !== null && w.movement !== null && w.diameterMm !== null;
}

/** Chemin public d'une fiche montre. */
export function watchPath(w: Pick<WatchCard, "brandSlug" | "collectionSlug" | "slug">): string {
  return `/montres/${w.brandSlug}/${w.collectionSlug}/${w.slug}`;
}
