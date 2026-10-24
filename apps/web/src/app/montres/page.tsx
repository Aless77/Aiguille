import { Suspense } from "react";

import { Breadcrumbs } from "@/components/breadcrumbs";
import { CatalogFilters } from "@/components/catalog-filters";
import { CatalogPagination } from "@/components/catalog-pagination";
import { WatchGrid } from "@/components/watch-card";
import { getFacets, getWatchCards } from "@/lib/catalog/queries";
import { loadCatalogParams, toFilter } from "@/lib/catalog/search-params";
import { type Sort } from "@/lib/catalog/types";
import { features } from "@/lib/features";
import { pageMetadata } from "@/lib/seo/metadata";

// Canonique sans paramètres : les combinaisons de filtres ne sont pas des pages à indexer
// (docs/seo/strategie.md, « Filtres et facettes »).
export const metadata = pageMetadata({
  title: "Toutes les montres : prix et caractéristiques",
  description:
    "Catalogue des montres Tissot, Hamilton et Longines : prix catalogue officiels, mouvement, diamètre. Filtrez par marque, prix et mouvement.",
  path: "/montres",
});

export default async function CatalogPage({ searchParams }: PageProps<"/montres">) {
  const facets = await getFacets();

  return (
    <div className="space-y-6">
      <Breadcrumbs crumbs={[{ name: "Montres" }]} />
      <h1 className="text-3xl font-semibold tracking-tight">Toutes les montres</h1>
      <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
        <aside>
          {/* useQueryStates lit l'URL côté client : frontière Suspense requise au prérendu. */}
          <Suspense>
            <CatalogFilters facets={facets} hiddenSorts={hiddenSorts()} />
          </Suspense>
        </aside>
        <Suspense fallback={<ResultsSkeleton />}>
          <CatalogResults searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  );
}

async function CatalogResults({ searchParams }: Pick<PageProps<"/montres">, "searchParams">) {
  const params = loadCatalogParams(await searchParams);
  const filter = toFilter(params);
  // Tri par une note masquée : retour au tri par défaut.
  if (filter.sort && hiddenSorts().includes(filter.sort)) filter.sort = "prix-asc";
  const { items, total, page, pageCount } = await getWatchCards(filter);

  return (
    <section className="space-y-6" aria-label="Résultats">
      <p className="text-sm text-muted-foreground">
        {total} montre{total > 1 ? "s" : ""}
        {pageCount > 1 && ` · page ${page} sur ${pageCount}`}
      </p>
      {items.length > 0 ? (
        <WatchGrid watches={items} />
      ) : (
        <p className="py-12 text-center text-muted-foreground">
          Aucune montre ne correspond à ces filtres.
        </p>
      )}
      <CatalogPagination params={params} page={page} pageCount={pageCount} />
    </section>
  );
}

function ResultsSkeleton() {
  return (
    <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4" aria-hidden>
      {Array.from({ length: 8 }, (_, i) => (
        <li key={i} className="aspect-[3/4] animate-pulse rounded-xl bg-muted" />
      ))}
    </ul>
  );
}

/** Tris masqués tant que la note ou les avis sont désactivés (lib/features.ts). */
function hiddenSorts(): Sort[] {
  return [
    ...(features.score() ? [] : (["note"] as const)),
    ...(features.reviews() ? [] : (["avis"] as const)),
  ];
}
