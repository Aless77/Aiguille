import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { Fragment } from "react";

import { breadcrumbJsonLd, type Crumb, JsonLd } from "@/lib/seo/json-ld";

/** Fil d'Ariane visible + BreadcrumbList JSON-LD (checklist SEO). Le dernier élément est la page courante. */
export function Breadcrumbs({ crumbs }: { crumbs: Crumb[] }) {
  const all: Crumb[] = [{ name: "Accueil", path: "/" }, ...crumbs];
  return (
    <>
      <nav aria-label="Fil d'Ariane" className="text-sm text-muted-foreground">
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
      <JsonLd data={breadcrumbJsonLd(all)} />
    </>
  );
}
