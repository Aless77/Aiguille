import { familyOf } from "@aiguille/db/collection-families";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Breadcrumbs } from "@/components/breadcrumbs";
import { CatalogBrowser } from "@/components/catalog-browser";
import { displayName, formatPrice, MOVEMENT_LABELS } from "@/lib/catalog/format";
import { getCollection, getCollections, getFacets } from "@/lib/catalog/queries";
import { hasCatalogFilters, loadCatalogParams } from "@/lib/catalog/search-params";
import { PLACEHOLDER_SLUG, withPlaceholder } from "@/lib/catalog/static-params";
import { pageMetadata } from "@/lib/seo/metadata";
import { cn } from "@/lib/utils";

/**
 * Rendu bloquant assumé : params est lu hors <Suspense> pour que notFound() renvoie un vrai 404
 * (avec streaming, la réponse partirait en 200 : « soft 404 » pour les moteurs). Les pages connues
 * sont prérendues au build, la navigation reste donc instantanée en pratique.
 */
export const instant = false;

export async function generateStaticParams() {
  const collections = await getCollections();
  return withPlaceholder(
    collections.map((c) => ({ marque: c.brandSlug, collection: c.slug })),
    { marque: PLACEHOLDER_SLUG, collection: PLACEHOLDER_SLUG },
  );
}

export async function generateMetadata({
  params,
  searchParams,
}: PageProps<"/montres/[marque]/[collection]">) {
  const { marque, collection } = await params;
  const c = await getCollection(marque, collection);
  if (!c) return {};
  const name = displayName(c.brandName, c.name);
  const range =
    c.minPriceCents !== null
      ? c.minPriceCents === c.maxPriceCents
        ? ` à ${formatPrice(c.minPriceCents)}`
        : ` de ${formatPrice(c.minPriceCents)} à ${formatPrice(c.maxPriceCents)}`
      : "";
  return pageMetadata({
    title: `${name} : tous les modèles et leurs prix`,
    description: `${c.watchCount} références ${name}${range} (prix catalogue officiels). Comparez mouvements, diamètres et caractéristiques.`,
    path: `/montres/${c.brandSlug}/${c.slug}`,
    index: !hasCatalogFilters(loadCatalogParams(await searchParams)),
  });
}

export default async function CollectionPage({
  params,
  searchParams,
}: PageProps<"/montres/[marque]/[collection]">) {
  const { marque, collection } = await params;
  const c = await getCollection(marque, collection);
  if (!c) notFound();

  const scope = { brandSlug: c.brandSlug, collectionSlug: c.slug };
  const family = familyOf(c.brandSlug, c.slug);
  const [facets, brandCollections] = await Promise.all([
    getFacets(scope),
    family ? getCollections(c.brandSlug) : Promise.resolve([]),
  ]);
  // Collections de la même gamme officielle, dans l'ordre de la marque.
  const siblings = family
    ? family.collections.flatMap((slug) => brandCollections.filter((x) => x.slug === slug))
    : [];
  const name = displayName(c.brandName, c.name);

  const movements = facets.movements.map((m) => m.value);

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <Breadcrumbs
          crumbs={[
            { name: "Montres", path: "/montres" },
            { name: c.brandName, path: `/montres/${c.brandSlug}` },
            { name: c.name },
          ]}
        />
        <h1 className="text-3xl font-semibold tracking-tight">{name}</h1>
        <p className="max-w-2xl text-muted-foreground">
          {c.watchCount} référence{c.watchCount > 1 ? "s" : ""} {name}
          {c.minPriceCents !== null &&
            `, de ${formatPrice(c.minPriceCents)} à ${formatPrice(c.maxPriceCents)}`}
          {movements.length > 0 &&
            `. Mouvements : ${movements.map((m) => MOVEMENT_LABELS[m].toLowerCase()).join(", ")}`}
          {facets.diameterMinMm !== null &&
            `. Diamètres de ${facets.diameterMinMm.toLocaleString("fr-FR")} à ${facets.diameterMaxMm?.toLocaleString("fr-FR")} mm`}
          .
        </p>
        {family && siblings.length > 1 && (
          <nav aria-label={`Gamme ${family.name}`} className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Gamme{" "}
              <Link
                href={`/montres/${c.brandSlug}#gamme-${family.slug}`}
                className="font-medium text-foreground underline underline-offset-4"
              >
                {family.name}
              </Link>{" "}
              chez {c.brandName} :
            </p>
            <ul className="flex flex-wrap gap-2">
              {siblings.map((s) => (
                <li key={s.slug}>
                  <Link
                    href={`/montres/${c.brandSlug}/${s.slug}`}
                    aria-current={s.slug === c.slug ? "page" : undefined}
                    className={cn(
                      "inline-flex rounded-full border px-3 py-1 text-sm transition-colors",
                      s.slug === c.slug
                        ? "border-foreground bg-foreground text-background"
                        : "hover:bg-muted",
                    )}
                  >
                    {s.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </div>
      <CatalogBrowser
        searchParams={searchParams}
        scope={scope}
        basePath={`/montres/${c.brandSlug}/${c.slug}`}
      />
    </div>
  );
}
