import { notFound } from "next/navigation";

import { Breadcrumbs } from "@/components/breadcrumbs";
import { StoresExplorer } from "@/components/stores-explorer";
import { getBrand, getStoreCounts, getStores } from "@/lib/catalog/queries";
import { PLACEHOLDER_SLUG, withPlaceholder } from "@/lib/catalog/static-params";
import { pageMetadata } from "@/lib/seo/metadata";

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
  return pageMetadata({
    title: `Boutiques ${brand.name} en Europe : ${stores.length} points de vente agréés`,
    description: `Carte et liste des ${stores.length} boutiques agréées ${brand.name} dans ${countries} pays européens, par ville. Adresses publiées par la marque.`,
    path: `/boutiques/${brand.slug}`,
  });
}

export default async function BrandStoresPage({ params }: PageProps<"/[lang]/boutiques/[marque]">) {
  const { marque } = await params;
  const [brand, stores] = await Promise.all([getBrand(marque), getStores(marque)]);
  if (!brand || stores.length === 0) notFound();

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <Breadcrumbs crumbs={[{ name: "Boutiques", path: "/boutiques" }, { name: brand.name }]} />
        <h1 className="text-3xl font-semibold tracking-tight">Boutiques {brand.name}</h1>
        <p className="max-w-3xl text-muted-foreground">
          {stores.length} points de vente agréés {brand.name} en Europe, tels que publiés par la
          marque. Les marques ne publient pas le stock par boutique : appelez avant de vous déplacer
          pour un modèle précis.
        </p>
      </div>
      <StoresExplorer stores={stores} />
    </div>
  );
}
