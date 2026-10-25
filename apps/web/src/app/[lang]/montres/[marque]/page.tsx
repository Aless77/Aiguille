import { groupByFamily } from "@aiguille/db/collection-families";
import { Link } from "@/lib/i18n/client";
import { notFound } from "next/navigation";

import { Breadcrumbs } from "@/components/breadcrumbs";
import { CatalogBrowser } from "@/components/catalog-browser";
import { CollectionExplorer } from "@/components/collection-explorer";
import { formatPrice } from "@/lib/catalog/format";
import {
  getBrand,
  getBrands,
  getCollectionPreviews,
  getCollections,
  getStoreCounts,
} from "@/lib/catalog/queries";
import { hasCatalogFilters, loadCatalogParams } from "@/lib/catalog/search-params";
import { PLACEHOLDER_SLUG, withPlaceholder } from "@/lib/catalog/static-params";
import { JsonLd, itemListJsonLd } from "@/lib/seo/json-ld";
import { pageMetadata } from "@/lib/seo/metadata";

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
  const brand = await getBrand(marque);
  if (!brand) return {};
  const range =
    brand.minPriceCents !== null
      ? ` de ${formatPrice(brand.minPriceCents)} à ${formatPrice(brand.maxPriceCents)}`
      : "";
  return pageMetadata({
    title: `Montres ${brand.name} : prix et collections`,
    description: `${brand.watchCount} montres ${brand.name} suivies${range}. Prix catalogue officiels, mouvements, diamètres et collections.`,
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

  const [collections, previews, storeCounts] = await Promise.all([
    getCollections(brand.slug),
    getCollectionPreviews(brand.slug),
    getStoreCounts(),
  ]);
  const storeCount = storeCounts.find((c) => c.brandSlug === brand.slug)?.count ?? 0;
  // Gammes officielles de la marque (Longines : Master, Conquest…), à plat sinon.
  const groups = groupByFamily(brand.slug, collections);

  return (
    <div className="space-y-10">
      <div className="space-y-4">
        <Breadcrumbs crumbs={[{ name: "Montres", path: "/montres" }, { name: brand.name }]} />
        <h1 className="text-3xl font-semibold tracking-tight">Montres {brand.name}</h1>
        {brand.watchCount > 0 ? (
          <p className="max-w-2xl text-muted-foreground">
            {brand.watchCount} références {brand.name} suivies, réparties en {collections.length}{" "}
            collections, avec des prix catalogue officiels de {formatPrice(brand.minPriceCents)} à{" "}
            {formatPrice(brand.maxPriceCents)}.
            {storeCount > 0 && (
              <>
                {" "}
                <Link href={`/boutiques/${brand.slug}`} className="underline underline-offset-4">
                  Voir les {storeCount} boutiques agréées en Europe
                </Link>
                .
              </>
            )}
          </p>
        ) : (
          <p className="text-muted-foreground">
            Les montres {brand.name} arrivent bientôt : leur collecte n&apos;est pas encore en
            place.
          </p>
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
              collections.map((c) => ({ name: c.name, path: `/montres/${brand.slug}/${c.slug}` })),
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
