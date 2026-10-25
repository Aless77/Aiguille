import { groupByFamily } from "@aiguille/db/collection-families";
import { notFound } from "next/navigation";

import { Breadcrumbs } from "@/components/breadcrumbs";
import { CatalogBrowser } from "@/components/catalog-browser";
import { CollectionExplorer } from "@/components/collection-explorer";
import {
  getBrand,
  getBrands,
  getCollectionPreviews,
  getCollections,
  getStoreCounts,
} from "@/lib/catalog/queries";
import { hasCatalogFilters, loadCatalogParams } from "@/lib/catalog/search-params";
import { PLACEHOLDER_SLUG, withPlaceholder } from "@/lib/catalog/static-params";
import { Link } from "@/lib/i18n/client";
import { format } from "@/lib/i18n/dictionary";
import { getDictionary } from "@/lib/i18n/server";
import { JsonLd, itemListJsonLd } from "@/lib/seo/json-ld";
import { localizedMetadata } from "@/lib/seo/localized-metadata";

/**
 * Rendu bloquant assumé : params est lu hors <Suspense> pour que notFound() renvoie un vrai 404
 * (avec streaming, la réponse partirait en 200 : « soft 404 » pour les moteurs). Les pages connues
 * sont prérendues au build, la navigation reste donc instantanée en pratique.
 */
export const instant = false;

export async function generateStaticParams() {
  const brands = await getBrands();
  return withPlaceholder(
    brands.map((b) => ({ marque: b.slug })),
    { marque: PLACEHOLDER_SLUG },
  );
}

export async function generateMetadata({
  params,
  searchParams,
}: PageProps<"/[lang]/montres/[marque]">) {
  const { marque } = await params;
  const [brand, { dict, f }] = await Promise.all([getBrand(marque), getDictionary()]);
  if (!brand) return {};
  const t = dict.catalog.brandPage;
  const range =
    brand.minPriceCents !== null
      ? format(t.range, { min: f.price(brand.minPriceCents)!, max: f.price(brand.maxPriceCents)! })
      : "";
  return localizedMetadata({
    title: format(t.metaTitle, { brand: brand.name }),
    description: format(t.metaDescription, { count: brand.watchCount, brand: brand.name, range }),
    path: `/montres/${brand.slug}`,
    // Marque pas encore collectée : page utile mais trop pauvre pour être indexée.
    index: brand.watchCount > 0 && !hasCatalogFilters(loadCatalogParams(await searchParams)),
  });
}

export default async function BrandPage({
  params,
  searchParams,
}: PageProps<"/[lang]/montres/[marque]">) {
  // notFound() avant tout Suspense : vraie réponse 404 (docs streaming, « Status codes »).
  const { marque } = await params;
  const brand = await getBrand(marque);
  if (!brand) notFound();

  const [collections, previews, storeCounts, { dict, f, path }] = await Promise.all([
    getCollections(brand.slug),
    getCollectionPreviews(brand.slug),
    getStoreCounts(),
    getDictionary(),
  ]);
  const t = dict.catalog.brandPage;
  const storeCount = storeCounts.find((c) => c.brandSlug === brand.slug)?.count ?? 0;
  // Gammes officielles de la marque (Longines : Master, Conquest…), à plat sinon.
  const groups = groupByFamily(brand.slug, collections);

  return (
    <div className="space-y-10">
      <div className="space-y-4">
        <Breadcrumbs
          crumbs={[
            { name: dict.catalog.breadcrumb.watches, path: "/montres" },
            { name: brand.name },
          ]}
        />
        <h1 className="text-3xl font-semibold tracking-tight">
          {format(t.title, { brand: brand.name })}
        </h1>
        {brand.watchCount > 0 ? (
          <p className="max-w-2xl text-muted-foreground">
            {format(t.intro, {
              count: f.number(brand.watchCount, 0),
              brand: brand.name,
              collections: collections.length,
              min: f.price(brand.minPriceCents) ?? "",
              max: f.price(brand.maxPriceCents) ?? "",
            })}
            {storeCount > 0 && (
              <>
                {" "}
                <Link href={`/boutiques/${brand.slug}`} className="underline underline-offset-4">
                  {format(t.stores, { count: f.number(storeCount, 0) })}
                </Link>
                .
              </>
            )}
          </p>
        ) : (
          <p className="text-muted-foreground">{format(t.soon, { brand: brand.name })}</p>
        )}
      </div>

      {collections.length > 0 && (
        <>
          <CollectionExplorer
            brandSlug={brand.slug}
            brandName={brand.name}
            groups={groups}
            previews={previews}
          />
          <JsonLd
            data={itemListJsonLd(
              collections.map((c) => ({
                name: c.name,
                path: path(`/montres/${brand.slug}/${c.slug}`),
              })),
            )}
          />
        </>
      )}

      <CatalogBrowser
        searchParams={searchParams}
        scope={{ brandSlug: brand.slug }}
        basePath={`/montres/${brand.slug}`}
      />
    </div>
  );
}
