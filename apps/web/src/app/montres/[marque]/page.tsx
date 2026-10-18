import Link from "next/link";
import { notFound } from "next/navigation";

import { Breadcrumbs } from "@/components/breadcrumbs";
import { buttonVariants } from "@/components/ui/button";
import { WatchGrid } from "@/components/watch-card";
import { formatPrice } from "@/lib/catalog/format";
import { getBrand, getBrands, getCollections, getWatchCards } from "@/lib/catalog/queries";
import { serializeCatalogParams } from "@/lib/catalog/search-params";
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

export async function generateMetadata({ params }: PageProps<"/montres/[marque]">) {
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
    index: brand.watchCount > 0,
  });
}

export default async function BrandPage({ params }: PageProps<"/montres/[marque]">) {
  // notFound() avant tout Suspense : vraie réponse 404 (docs streaming, « Status codes »).
  const { marque } = await params;
  const brand = await getBrand(marque);
  if (!brand) notFound();

  const [collections, top] = await Promise.all([
    getCollections(brand.slug),
    getWatchCards({ brandSlug: brand.slug, sort: "prix-asc", page: 1 }),
  ]);

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
          </p>
        ) : (
          <p className="text-muted-foreground">
            Les montres {brand.name} arrivent bientôt : leur collecte n&apos;est pas encore en
            place.
          </p>
        )}
      </div>

      {collections.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight">Collections {brand.name}</h2>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {collections.map((c) => (
              <li key={c.slug}>
                <Link
                  href={`/montres/${brand.slug}/${c.slug}`}
                  className="block h-full rounded-xl border p-4 transition-colors hover:bg-muted/60"
                >
                  <span className="font-medium">{c.name}</span>
                  <span className="block text-sm text-muted-foreground">
                    {c.watchCount} modèle{c.watchCount > 1 ? "s" : ""}
                    {c.minPriceCents !== null && ` · dès ${formatPrice(c.minPriceCents)}`}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <JsonLd
            data={itemListJsonLd(
              collections.map((c) => ({ name: c.name, path: `/montres/${brand.slug}/${c.slug}` })),
            )}
          />
        </section>
      )}

      {top.items.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight">
            Les montres {brand.name} les plus abordables
          </h2>
          <WatchGrid watches={top.items.slice(0, 8)} />
          <Link
            href={serializeCatalogParams("/montres", { marque: [brand.slug] })}
            className={buttonVariants({ variant: "outline" })}
          >
            Voir les {brand.watchCount} montres {brand.name} avec filtres
          </Link>
        </section>
      )}
    </div>
  );
}
