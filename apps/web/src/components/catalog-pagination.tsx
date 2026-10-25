import { Link } from "@/lib/i18n/client";
import { getDictionary } from "@/lib/i18n/server";

import { buttonVariants } from "@/components/ui/button";
import { type CatalogParams, serializeCatalogParams } from "@/lib/catalog/search-params";
import { cn } from "@/lib/utils";

/** Pagination en vrais liens <a href> : crawlables, contrairement à un bouton « charger plus ». */
export async function CatalogPagination({
  params,
  page,
  pageCount,
  basePath = "/montres",
}: {
  params: CatalogParams;
  page: number;
  pageCount: number;
  basePath?: string;
}) {
  if (pageCount <= 1) return null;
  const t = (await getDictionary()).dict.catalog.results;
  const href = (p: number) => serializeCatalogParams(basePath, { ...params, page: p });
  const pages = Array.from({ length: pageCount }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === pageCount || Math.abs(p - page) <= 2,
  );

  return (
    <nav aria-label={t.pagination} className="flex flex-wrap items-center justify-center gap-1">
      {page > 1 && (
        <Link href={href(page - 1)} className={buttonVariants({ variant: "outline", size: "sm" })}>
          {t.previous}
        </Link>
      )}
      {pages.map((p, i) => (
        <span key={p} className="flex items-center gap-1">
          {i > 0 && p - pages[i - 1]! > 1 && <span className="px-1 text-muted-foreground">…</span>}
          <Link
            href={href(p)}
            aria-current={p === page ? "page" : undefined}
            className={cn(
              buttonVariants({ variant: p === page ? "default" : "ghost", size: "sm" }),
            )}
          >
            {p}
          </Link>
        </span>
      ))}
      {page < pageCount && (
        <Link href={href(page + 1)} className={buttonVariants({ variant: "outline", size: "sm" })}>
          {t.next}
        </Link>
      )}
    </nav>
  );
}
