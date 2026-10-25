import { Suspense } from "react";

import { CatalogFilters } from "@/components/catalog-filters";
import { CatalogPagination } from "@/components/catalog-pagination";
import { WatchGrid } from "@/components/watch-card";
import { displayName } from "@/lib/catalog/format";
import { getFacets, getWatchCards } from "@/lib/catalog/queries";
import { loadCatalogParams, toFilter } from "@/lib/catalog/search-params";
import { type CatalogFilter, type Sort, watchPath } from "@/lib/catalog/types";
import { features } from "@/lib/features";
import { format } from "@/lib/i18n/dictionary";
import { getDictionary } from "@/lib/i18n/server";
import { JsonLd, itemListJsonLd } from "@/lib/seo/json-ld";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
type Scope = Pick<CatalogFilter, "brandSlug" | "collectionSlug">;

/** Un même catalogue dans toutes les listes ; le chemin de la page fixe son périmètre. */
export async function CatalogBrowser({
  searchParams,
  scope = {},
  basePath = "/montres",
}: {
  searchParams: SearchParams;
  scope?: Scope;
  basePath?: string;
}) {
  const [facets, { dict }] = await Promise.all([getFacets(scope), getDictionary()]);
  const t = dict.catalog.results;
  return (
    <div id="catalogue" className="grid scroll-mt-20 gap-8 lg:grid-cols-[240px_minmax(0,1fr)]">
      <aside aria-label={t.filtersLabel}>
        <Suspense>
          <CatalogFilters
            facets={facets}
            hiddenSorts={hiddenSorts()}
            scoped={Boolean(scope.brandSlug)}
          />
        </Suspense>
      </aside>
      <Suspense fallback={<p role="status">{t.loading}</p>}>
        <CatalogResults searchParams={searchParams} scope={scope} basePath={basePath} />
      </Suspense>
    </div>
  );
}

async function CatalogResults({
  searchParams,
  scope,
  basePath,
}: {
  searchParams: SearchParams;
  scope: Scope;
  basePath: string;
}) {
  const params = loadCatalogParams(await searchParams);
  const filter = { ...toFilter(params), ...scope };
  // La marque du chemin prime aussi sur un éventuel paramètre hérité d'une autre page.
  if (scope.brandSlug) filter.brands = [];
  if (filter.sort && hiddenSorts().includes(filter.sort)) filter.sort = "prix-asc";
  const [{ items, total, page, pageCount }, { dict, f, path }] = await Promise.all([
    getWatchCards(filter),
    getDictionary(),
  ]);
  const t = dict.catalog.results;
  return (
    <section className="flex min-w-0 flex-col gap-6" aria-label={t.label} aria-live="polite">
      <p className="text-sm text-muted-foreground">
        {f.plural(t.count, total)}
        {pageCount > 1 && format(t.page, { page, pages: pageCount })}
      </p>
      {items.length > 0 ? (
        <WatchGrid watches={items} />
      ) : (
        <p className="py-12 text-center text-muted-foreground">{t.empty}</p>
      )}
      <CatalogPagination params={params} page={page} pageCount={pageCount} basePath={basePath} />
      <JsonLd
        data={itemListJsonLd(
          items.map((w) => ({ name: displayName(w.brandName, w.name), path: path(watchPath(w)) })),
        )}
      />
    </section>
  );
}

function hiddenSorts(): Sort[] {
  return [
    ...(features.score() ? [] : (["note"] as const)),
    ...(features.reviews() ? [] : (["avis"] as const)),
  ];
}
