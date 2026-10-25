import { ChevronRight } from "lucide-react";
import { Fragment } from "react";

import { Link } from "@/lib/i18n/client";
import { getDictionary } from "@/lib/i18n/server";
import { breadcrumbJsonLd, type Crumb, JsonLd } from "@/lib/seo/json-ld";

/** Fil d'Ariane visible + BreadcrumbList JSON-LD (checklist SEO). Le dernier élément est la page courante. */
export async function Breadcrumbs({ crumbs }: { crumbs: Crumb[] }) {
  const { dict, path } = await getDictionary();
  const t = dict.catalog.breadcrumb;
  const all: Crumb[] = [{ name: t.home, path: "/" }, ...crumbs];
  return (
    <>
      <nav aria-label={t.label} className="text-sm text-muted-foreground">
        <ol className="flex flex-wrap items-center gap-1">
          {all.map((c, i) => (
            <Fragment key={`${c.name}-${i}`}>
              {i > 0 && <ChevronRight className="size-3.5" aria-hidden />}
              <li>
                {c.path && i < all.length - 1 ? (
                  <Link href={c.path} className="hover:text-foreground">
                    {c.name}
                  </Link>
                ) : (
                  <span aria-current="page" className="text-foreground">
                    {c.name}
                  </span>
                )}
              </li>
            </Fragment>
          ))}
        </ol>
      </nav>
      <JsonLd
        data={breadcrumbJsonLd(all.map((c) => (c.path ? { ...c, path: path(c.path) } : c)))}
      />
    </>
  );
}
