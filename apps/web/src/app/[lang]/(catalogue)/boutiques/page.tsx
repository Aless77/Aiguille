import { Breadcrumbs } from "@/components/breadcrumbs";
import { StoresExplorer } from "@/components/stores-explorer";
import { getBrands, getStoreCounts, getStores } from "@/lib/catalog/queries";
import { Link } from "@/lib/i18n/client";
import { format } from "@/lib/i18n/dictionary";
import { getDictionary } from "@/lib/i18n/server";
import { localizedMetadata } from "@/lib/seo/localized-metadata";

export async function generateMetadata() {
  const t = (await getDictionary()).dict.community.stores;
  return localizedMetadata({
    title: t.metaTitle,
    description: t.metaDescription,
    path: "/boutiques",
  });
}

export default async function StoresPage() {
  const [counts, stores, brands, { dict, f }] = await Promise.all([
    getStoreCounts(),
    getStores(),
    getBrands(),
    getDictionary(),
  ]);
  const t = dict.community.stores;
  const withoutStores = brands.filter(
    (b) => b.watchCount > 0 && !counts.some((c) => c.brandSlug === b.slug),
  );

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <Breadcrumbs crumbs={[{ name: t.breadcrumb }]} />
        <h1 className="text-3xl font-semibold tracking-tight">{t.title}</h1>
        <p className="max-w-3xl text-muted-foreground">{t.intro}</p>
        <ul className="flex flex-wrap gap-3">
          {counts.map((c) => (
            <li key={c.brandSlug}>
              <Link
                href={`/boutiques/${c.brandSlug}`}
                className="block rounded-xl border px-4 py-2 transition-colors hover:bg-muted/60"
              >
                <span className="font-medium">{c.brandName}</span>{" "}
                <span className="text-sm text-muted-foreground">{f.plural(t.count, c.count)}</span>
              </Link>
            </li>
          ))}
        </ul>
        {withoutStores.length > 0 && (
          <p className="text-sm text-muted-foreground">
            {format(t.unavailable, { brands: withoutStores.map((b) => b.name).join(", ") })}
          </p>
        )}
      </div>
      <StoresExplorer stores={stores} />
    </div>
  );
}
