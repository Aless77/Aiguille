/**
 * Gammes officielles : regroupement des collections tel que chaque marque le présente sur son
 * site (menu, pages de collection). Relevé à la main, avec la page source et la date : on ne
 * crée aucune gamme qui n'existe pas chez la marque. Une collection absente de toute gamme reste
 * affichée seule (« Autres collections »). Procédure : docs/integrer-une-marque.md.
 *
 * Les collections sont désignées par leur slug Aiguille (immuable, voir AGENTS.md). Le rapport de
 * couverture (`npm run db:couverture`) signale les collections sans gamme et les slugs inconnus.
 */

export interface CollectionFamily {
  slug: string;
  name: string;
  /** Page officielle de la gamme. */
  url: string;
  collections: string[];
}

export interface BrandFamilies {
  /** Page où la structure a été relevée. */
  source: string;
  checkedAt: string;
  /** true : toute collection de la marque appartient à une gamme (la couverture le vérifie). */
  complete: boolean;
  families: CollectionFamily[];
}

export const COLLECTION_FAMILIES: Record<string, BrandFamilies> = {
  // Menus officiels : lignes de produits à plat, sans gamme supérieure inventée.
  citizen: {
    source: "https://fr.citizenwatch.eu/fr/",
    checkedAt: "2026-10-25",
    complete: false,
    families: [],
  },
  seiko: {
    source: "https://www.seikowatches.com/fr-fr/products",
    checkedAt: "2026-10-25",
    complete: false,
    families: [],
  },
  // Menu de la boutique : collections à plat, sans gamme supérieure.
  venezianico: {
    source: "https://www.venezianico.com/collections/all-watches",
    checkedAt: "2026-10-31",
    complete: false,
    families: [],
  },
  // Menu « Montres » : cinq univers, chacun listant ses collections.
  longines: {
    source: "https://www.longines.com/fr/watches",
    checkedAt: "2026-10-25",
    complete: true,
    families: [
      {
        slug: "master",
        name: "Master",
        url: "https://www.longines.com/fr/watches/master",
        collections: [
          "the-longines-master-collection",
          "the-longines-master-collection-chronograph",
          "the-longines-master-collection-moonphase",
          "the-longines-master-collection-gmt",
          "the-longines-master-collection-chrono-monopusher",
        ],
      },
      {
        slug: "conquest",
        name: "Conquest",
        url: "https://www.longines.com/fr/watches/conquest",
        collections: [
          "conquest",
          "conquest-classic",
          "conquest-chronograph",
          "hydroconquest",
          "hydroconquest-gmt",
        ],
      },
      {
        slug: "spirit",
        name: "Spirit",
        url: "https://www.longines.com/fr/watches/spirit",
        collections: [
          "longines-spirit",
          "longines-spirit-zulu-time",
          "longines-spirit-flyback",
          "longines-spirit-chronograph",
          "longines-spirit-pilot",
          "longines-spirit-pilot-flyback",
        ],
      },
      {
        slug: "elegance",
        name: "Elegance",
        url: "https://www.longines.com/fr/watches/elegance",
        collections: [
          "longines-mini-dolcevita",
          "longines-dolcevita",
          "longines-primaluna",
          "flagship-classic",
          "longines-evidenza",
          "record",
          "longines-elegant-collection",
          "la-grande-classique-de-longines",
        ],
      },
      {
        slug: "heritage",
        name: "Heritage",
        url: "https://www.longines.com/fr/watches/heritage",
        collections: [
          "longines-legend-diver",
          "ultra-chron",
          "longines-pilot-majetek",
          "conquest-heritage",
          "flagship-heritage",
          "the-longines-avigation",
          "heritage-classic",
        ],
      },
    ],
  },
  // « Collections emblématiques » : seules celles qui regroupent plusieurs lignes, membres
  // vérifiés sur chaque page. Les autres lignes Tissot sont des collections autonomes.
  tissot: {
    source: "https://www.tissotwatches.com/fr-fr/collection/main-collections.html",
    checkedAt: "2026-10-25",
    complete: false,
    families: [
      {
        slug: "prx",
        name: "PRX",
        url: "https://www.tissotwatches.com/fr-fr/collection/main-collections/tissot-prx.html",
        collections: ["prx", "prx-damian-lillard", "prx-ufo-robot-goldorak"],
      },
      {
        slug: "pr-100",
        name: "PR 100",
        url: "https://www.tissotwatches.com/fr-fr/collection/main-collections/tissot-pr-100.html",
        collections: ["pr100", "pr100-jungfraubahn", "pr100-tour-de-france", "pr-100-cycling"],
      },
      {
        slug: "seastar",
        name: "Seastar",
        url: "https://www.tissotwatches.com/fr-fr/collection/main-collections/tissot-seastar.html",
        collections: ["seastar-1000", "seastar-2000"],
      },
      {
        slug: "le-locle",
        name: "Le Locle",
        url: "https://www.tissotwatches.com/fr-fr/collection/main-collections/tissot-le-locle.html",
        collections: ["le-locle", "le-locle-20eme-anniversaire"],
      },
      {
        slug: "supersport-chrono",
        name: "Supersport Chrono",
        url: "https://www.tissotwatches.com/fr-fr/men/main-collections/tissot-supersport-chrono.html",
        collections: ["supersport", "supersport-nba", "supersport-basketball"],
      },
      {
        slug: "t-race",
        name: "T-Race",
        url: "https://www.tissotwatches.com/fr-fr/men/main-collections/tissot-t-race.html",
        collections: ["t-race", "t-race-motogp"],
      },
      {
        slug: "xl",
        name: "XL",
        url: "https://www.tissotwatches.com/fr-fr/men/main-collections/tissot-xl.html",
        collections: ["chrono-l", "chrono-xl"],
      },
    ],
  },
  // Menu « Collections » : six collections à plat, aucune gamme au-dessus.
  hamilton: {
    source: "https://www.hamiltonwatch.com/fr-fr/",
    checkedAt: "2026-10-25",
    complete: false,
    families: [],
  },
};

export function familyOf(brandSlug: string, collectionSlug: string): CollectionFamily | null {
  return (
    COLLECTION_FAMILIES[brandSlug]?.families.find((f) => f.collections.includes(collectionSlug)) ??
    null
  );
}

export interface FamilyGroup<T> {
  family: CollectionFamily | null;
  collections: T[];
}

/**
 * Collections d'une marque regroupées par gamme, dans l'ordre de la marque (gammes puis
 * collections) ; les collections sans gamme suivent, dans leur ordre d'origine.
 */
export function groupByFamily<T extends { slug: string }>(
  brandSlug: string,
  collections: T[],
): FamilyGroup<T>[] {
  const families = COLLECTION_FAMILIES[brandSlug]?.families ?? [];
  const groups: FamilyGroup<T>[] = families
    .map((family) => ({
      family,
      collections: family.collections
        .map((slug) => collections.find((c) => c.slug === slug))
        .filter((c): c is T => c !== undefined),
    }))
    .filter((g) => g.collections.length > 0);
  const others = collections.filter((c) => !familyOf(brandSlug, c.slug));
  return others.length ? [...groups, { family: null, collections: others }] : groups;
}

/** Contrôle de couverture : collections sans gamme (marques « complete ») et slugs inconnus. */
export function familyCoverage(brandSlug: string, collectionSlugs: string[]) {
  const config = COLLECTION_FAMILIES[brandSlug];
  if (!config) return null;
  const mapped = config.families.flatMap((f) => f.collections);
  return {
    unassigned: config.complete
      ? collectionSlugs.filter((s) => !mapped.includes(s) && s !== "autres")
      : [],
    unknown: mapped.filter((s) => !collectionSlugs.includes(s)),
  };
}
