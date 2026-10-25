import { Breadcrumbs } from "@/components/breadcrumbs";
import { CatalogBrowser } from "@/components/catalog-browser";
import { hasCatalogFilters, loadCatalogParams } from "@/lib/catalog/search-params";
import { getDictionary } from "@/lib/i18n/server";
import { localizedMetadata } from "@/lib/seo/localized-metadata";

export async function generateMetadata({ searchParams }: PageProps<"/[lang]/montres">) {
  const t = (await getDictionary()).dict.catalog.catalogPage;
  return localizedMetadata({
    title: t.metaTitle,
    description: t.metaDescription,
    path: "/montres",
    index: !hasCatalogFilters(loadCatalogParams(await searchParams)),
  });
}

export default async function CatalogPage({ searchParams }: PageProps<"/[lang]/montres">) {
  const { dict } = await getDictionary();
  return (
    <div className="flex flex-col gap-6">
      <Breadcrumbs crumbs={[{ name: dict.catalog.breadcrumb.watches }]} />
      <h1 className="text-3xl font-semibold tracking-tight">{dict.catalog.catalogPage.title}</h1>
      <CatalogBrowser searchParams={searchParams} />
    </div>
  );
}
