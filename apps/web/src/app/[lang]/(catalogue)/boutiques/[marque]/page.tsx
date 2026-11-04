import { notFound } from "next/navigation";

import { Breadcrumbs } from "@/components/breadcrumbs";
import { StoresExplorer } from "@/components/stores-explorer";
import { getBrand, getStoreCounts, getStores } from "@/lib/catalog/queries";
import { PLACEHOLDER_SLUG, withPlaceholder } from "@/lib/catalog/static-params";
import { format } from "@/lib/i18n/dictionary";
import { getDictionary } from "@/lib/i18n/server";
import { localizedMetadata } from "@/lib/seo/localized-metadata";

/** Même gabarit que les autres pages dynamiques indexables (AGENTS.md) : vrai 404. */
export const instant = false;

export async function generateStaticParams() {
  const counts = await getStoreCounts();
  return withPlaceholder(
    counts.map((c) => ({ marque: c.brandSlug })),
    { marque: PLACEHOLDER_SLUG },
  );
}

export async function generateMetadata({ params }: PageProps<"/[lang]/boutiques/[marque]">) {
  const { marque } = await params;
  const [brand, stores] = await Promise.all([getBrand(marque), getStores(marque)]);
  if (!brand || stores.length === 0) return {};
  const countries = new Set(stores.map((s) => s.country)).size;
  const t = (await getDictionary()).dict.community.stores;
  return localizedMetadata({
    title: format(t.brandMetaTitle, { brand: brand.name, count: stores.length }),
    description: format(t.brandMetaDescription, {
      count: stores.length,
      brand: brand.name,
      countries,
    }),
    path: `/boutiques/${brand.slug}`,
  });
}

export default async function BrandStoresPage({ params }: PageProps<"/[lang]/boutiques/[marque]">) {
  const { marque } = await params;
  const [brand, stores] = await Promise.all([getBrand(marque), getStores(marque)]);
  if (!brand || stores.length === 0) notFound();
  const t = (await getDictionary()).dict.community.stores;

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <Breadcrumbs crumbs={[{ name: t.breadcrumb, path: "/boutiques" }, { name: brand.name }]} />
        <h1 className="text-3xl font-semibold tracking-tight">
          {format(t.brandTitle, { brand: brand.name })}
        </h1>
        <p className="max-w-3xl text-muted-foreground">
          {format(t.brandIntro, { count: stores.length, brand: brand.name })}
        </p>
      </div>
      <StoresExplorer stores={stores} />
    </div>
  );
}
