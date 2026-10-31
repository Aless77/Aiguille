import { Suspense } from "react";

import { CatalogFilters } from "@/components/catalog-filters";
import { CatalogPagination } from "@/components/catalog-pagination";
import { CatalogTrailMarker } from "@/components/catalog-trail-marker";
import { WatchGrid } from "@/components/watch-card";
import { browseFilter, type CatalogScope, hiddenSorts } from "@/lib/catalog/browse-filter";
import { displayName } from "@/lib/catalog/format";
import { getFacets, getWatchCards } from "@/lib/catalog/queries";
import { loadCatalogParams } from "@/lib/catalog/search-params";
import { PAGE_SIZE, watchPath } from "@/lib/catalog/types";
import { format } from "@/lib/i18n/dictionary";
import { getDictionary } from "@/lib/i18n/server";
import { JsonLd, itemListJsonLd } from "@/lib/seo/json-ld";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

/** Un même catalogue dans toutes les listes ; le chemin de la page fixe son périmètre. */
export async function CatalogBrowser({
  searchParams,
  scope = {},
  basePath = "/montres",
}: {
  searchParams: SearchParams;
  scope?: CatalogScope;
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
  scope: CatalogScope;
  basePath: string;
}) {
  const params = loadCatalogParams(await searchParams);
  const [{ items, total, page, pageCount }, { dict, f, path }] = await Promise.all([
    getWatchCards(browseFilter(params, scope)),
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
      <CatalogTrailMarker
        paths={items.map((w) => watchPath(w))}
        offset={(page - 1) * PAGE_SIZE}
        total={total}
      />
      <JsonLd
        data={itemListJsonLd(
          items.map((w) => ({ name: displayName(w.brandName, w.name), path: path(watchPath(w)) })),
        )}
      />
    </section>
  );
}
