"use client";

import { Popover } from "@base-ui/react/popover";
import { ChevronDown, Search, Star } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";

import { BrandFavoriteButton } from "@/components/brand-favorite-button";
import { type FavoriteBrand, matchBrands } from "@/lib/catalog/brand-directory";
import { useBrandFavorites } from "@/lib/catalog/brand-favorites-client";
import { useFeatures } from "@/lib/features-client";
import { Link, useLocale, useLocalePath } from "@/lib/i18n/client";
import { format } from "@/lib/i18n/dictionary";

/** Liens directs dans la barre : au-delà, elle redeviendrait illisible. */
const DIRECT_FAVORITES = 3;

const brandPath = (slug: string) => `/montres/${slug}`;

export interface BrandMenuItem extends FavoriteBrand {
  watchCount: number;
}

/** Marques épinglées, en accès direct dans la barre de navigation. */
export function FavoriteBrandLinks() {
  const { favorites } = useBrandFavorites();
  const { t } = useLocale();
  if (favorites.length === 0) return null;
  return (
    <>
      <span aria-hidden className="h-4 w-px shrink-0 bg-border" />
      <Star
        className="size-3.5 shrink-0 fill-current text-muted-foreground"
        role="img"
        aria-label={t.brands.mine}
      />
      {favorites.slice(0, DIRECT_FAVORITES).map((brand) => (
        <Link
          key={brand.slug}
          href={brandPath(brand.slug)}
          className="whitespace-nowrap text-muted-foreground hover:text-foreground"
        >
          {brand.name}
        </Link>
      ))}
    </>
  );
}

/** Une entrée « Marques » : recherche, marques épinglées, puis toutes les marques de A à Z. */
export function BrandMenu({ brands }: { brands: BrandMenuItem[] }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const search = useRef<HTMLInputElement>(null);
  const { favorites, canPin } = useBrandFavorites();
  const { accounts } = useFeatures();
  const { t, dict, f } = useLocale();
  const localize = useLocalePath();
  const pathname = usePathname();
  const router = useRouter();
  const results = useMemo(() => matchBrands(brands, query), [brands, query]);

  const close = () => setOpen(false);
  const counts = new Map(brands.map((b) => [b.slug, b.watchCount]));

  const row = (brand: FavoriteBrand) => (
    <li key={brand.slug} className="flex min-w-0 items-center gap-1">
      <Link
        href={brandPath(brand.slug)}
        onClick={close}
        className="flex min-w-0 flex-1 items-baseline justify-between gap-2 rounded-md px-2 py-1.5 hover:bg-muted focus-visible:bg-muted focus-visible:outline-none"
      >
        <span className="truncate">{brand.name}</span>
        {counts.has(brand.slug) && (
          <span className="text-xs text-muted-foreground tabular-nums">
            {f.number(counts.get(brand.slug)!, 0)}
          </span>
        )}
      </Link>
      <BrandFavoriteButton brand={brand} />
    </li>
  );

  return (
    <Popover.Root
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setQuery("");
      }}
    >
      <Popover.Trigger className="flex shrink-0 items-center gap-1 whitespace-nowrap text-muted-foreground outline-none hover:text-foreground focus-visible:text-foreground data-popup-open:text-foreground">
        {dict.nav.brands}
        <ChevronDown className="size-3.5" aria-hidden />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner sideOffset={8} align="start" collisionPadding={16} className="z-50">
          <Popover.Popup
            // Pas de clavier virtuel d'office sur mobile : il cacherait la liste.
            initialFocus={(type) => (type === "touch" ? true : search.current)}
            aria-label={dict.nav.brands}
            className="flex max-h-[min(32rem,var(--available-height))] w-[min(32rem,calc(100vw-2rem))] flex-col rounded-xl border bg-popover text-sm text-popover-foreground shadow-lg outline-none"
          >
            <form
              className="relative border-b p-2"
              onSubmit={(event) => {
                event.preventDefault();
                const first = results[0];
                if (!first) return;
                close();
                setQuery("");
                router.push(localize(brandPath(first.slug)));
              }}
            >
              <Search
                className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <input
                ref={search}
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t.brands.search}
                aria-label={t.brands.search}
                className="h-9 w-full rounded-md bg-transparent pr-2 pl-8 outline-none placeholder:text-muted-foreground"
              />
            </form>

            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-2">
              {!query && favorites.length > 0 && (
                <section aria-label={t.brands.mine}>
                  <h2 className="px-2 pb-1 text-xs font-medium text-muted-foreground">
                    {t.brands.mine}
                  </h2>
                  <ul className="grid gap-x-2 sm:grid-cols-2">{favorites.map(row)}</ul>
                </section>
              )}
              <section aria-label={t.brands.all}>
                {!query && favorites.length > 0 && (
                  <h2 className="px-2 pb-1 text-xs font-medium text-muted-foreground">
                    {t.brands.all}
                  </h2>
                )}
                {results.length > 0 ? (
                  <ul className="grid gap-x-2 sm:grid-cols-2">{results.map(row)}</ul>
                ) : (
                  <p role="status" className="px-2 py-4 text-center text-muted-foreground">
                    {format(t.brands.empty, { query })}
                  </p>
                )}
              </section>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-t p-3 text-xs">
              <Link href="/marques" onClick={close} className="font-medium hover:underline">
                {format(t.brands.seeAll, { count: f.number(brands.length, 0) })}
              </Link>
              {accounts && !canPin && (
                <Link
                  href={`/connexion?retour=${encodeURIComponent(pathname)}`}
                  onClick={close}
                  rel="nofollow"
                  className="text-muted-foreground hover:text-foreground"
                >
                  {t.brands.signInToPin}
                </Link>
              )}
            </div>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
