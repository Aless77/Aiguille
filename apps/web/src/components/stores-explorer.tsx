"use client";

import { useCallback, useMemo, useState } from "react";

import { StoresList } from "@/components/stores-list";
import { StoresMap } from "@/components/stores-map";
import { Button } from "@/components/ui/button";
import { type StorePoint } from "@/lib/catalog/queries";
import { type StoreBounds, searchStores, storeAddress, storesInBounds } from "@/lib/catalog/stores";
import { useLocale } from "@/lib/i18n/client";
import { format } from "@/lib/i18n/dictionary";

const PAGE_SIZE = 6;

export function StoresExplorer({ stores }: { stores: StorePoint[] }) {
  const { dict, f } = useLocale();
  const t = dict.community.stores;
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [bounds, setBounds] = useState<StoreBounds | null>(null);
  const [resetView, setResetView] = useState(0);
  const filtered = useMemo(() => searchStores(stores, query), [stores, query]);
  const visible = useMemo(() => storesInBounds(filtered, bounds), [filtered, bounds]);
  const pageCount = Math.ceil(visible.length / PAGE_SIZE);
  const currentPage = Math.min(page, Math.max(0, pageCount - 1));
  const start = currentPage * PAGE_SIZE;
  const updateBounds = useCallback(
    (nextBounds: StoreBounds) => {
      const nextVisible = storesInBounds(filtered, nextBounds);
      // Un redimensionnement (barre d'adresse mobile…) ne doit pas interrompre la pagination.
      if (
        nextVisible.length === visible.length &&
        nextVisible.every((store, index) => store === visible[index])
      )
        return;
      setBounds(nextBounds);
      setPage(0);
    },
    [filtered, visible],
  );
  const points = useMemo(
    () =>
      filtered.map((store) => ({
        name: store.name,
        address: storeAddress(store),
        brandName: store.brandName,
        latitude: store.latitude,
        longitude: store.longitude,
      })),
    [filtered],
  );

  return (
    <section aria-labelledby="recherche-boutiques" className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 rounded-xl border bg-card p-5 text-card-foreground">
        <h2 id="recherche-boutiques" className="text-xl font-semibold">
          {t.find}
        </h2>
        <label htmlFor="store-search" className="text-sm font-medium">
          {t.searchLabel}
        </label>
        <div className="flex flex-wrap items-center gap-3">
          <input
            id="store-search"
            type="search"
            placeholder={t.searchPlaceholder}
            aria-describedby="store-search-help"
            aria-controls="store-results"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(0);
              setBounds(null);
            }}
            className="h-11 min-w-0 flex-1 basis-64 rounded-lg border border-input bg-background px-3 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
          {query && (
            <Button
              variant="outline"
              onClick={() => {
                setQuery("");
                setPage(0);
                setBounds(null);
              }}
            >
              {t.clear}
            </Button>
          )}
        </div>
        <p id="store-search-help" className="text-sm text-muted-foreground">
          {t.searchHelp}
        </p>
      </div>
      <p role="status" className="text-sm text-muted-foreground">
        {f.plural(t.found, filtered.length)}
      </p>
      <StoresMap points={points} onBoundsChange={updateBounds} resetView={resetView} />
      <section
        id="store-results"
        aria-labelledby="store-results-title"
        className="flex flex-col gap-4"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <h2 id="store-results-title" className="text-xl font-semibold">
              {t.inArea}
            </h2>
            <p className="text-sm text-muted-foreground">{t.inAreaHelp}</p>
          </div>
          {visible.length < filtered.length && (
            <Button
              variant="outline"
              onClick={() => {
                setPage(0);
                setBounds(null);
                setResetView((value) => value + 1);
              }}
            >
              {t.showAll}
            </Button>
          )}
        </div>
        {visible.length > 0 && (
          <p aria-live="polite" className="text-sm text-muted-foreground">
            {format(t.range, {
              from: start + 1,
              to: Math.min(start + PAGE_SIZE, visible.length),
              total: visible.length,
            })}
          </p>
        )}
        {filtered.length === 0 ? (
          <p className="rounded-xl border p-6 text-muted-foreground">{t.noMatch}</p>
        ) : visible.length === 0 ? (
          <p className="rounded-xl border p-6 text-muted-foreground">{t.noneInArea}</p>
        ) : (
          <StoresList stores={visible.slice(start, start + PAGE_SIZE)} />
        )}
        {pageCount > 1 && (
          <nav aria-label={t.pages} className="flex items-center justify-between gap-3">
            <Button
              variant="outline"
              disabled={currentPage === 0}
              onClick={() => setPage((value) => value - 1)}
            >
              {t.previous}
            </Button>
            <span className="text-sm text-muted-foreground">
              {format(t.page, { page: currentPage + 1, count: pageCount })}
            </span>
            <Button
              variant="outline"
              disabled={currentPage + 1 >= pageCount}
              onClick={() => setPage((value) => value + 1)}
            >
              {t.next}
            </Button>
          </nav>
        )}
      </section>
    </section>
  );
}
