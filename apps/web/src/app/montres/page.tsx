import { Breadcrumbs } from "@/components/breadcrumbs";
import { CatalogBrowser } from "@/components/catalog-browser";
import { hasCatalogFilters, loadCatalogParams } from "@/lib/catalog/search-params";
import { pageMetadata } from "@/lib/seo/metadata";

export async function generateMetadata({ searchParams }: PageProps<"/montres">) {
  return pageMetadata({
    title: "Toutes les montres : prix et caractéristiques",
    description:
      "Tissot, Hamilton et Longines : recherchez un nom ou une référence et filtrez les montres par prix, mouvement et diamètre.",
    path: "/montres",
    index: !hasCatalogFilters(loadCatalogParams(await searchParams)),
  });
}

export default function CatalogPage({ searchParams }: PageProps<"/montres">) {
  return (
    <div className="flex flex-col gap-6">
      <Breadcrumbs crumbs={[{ name: "Montres" }]} />
      <h1 className="text-3xl font-semibold tracking-tight">Toutes les montres</h1>
      <CatalogBrowser searchParams={searchParams} />
    </div>
  );
}
