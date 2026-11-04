import { buttonVariants } from "@/components/ui/button";
import { WatchGrid } from "@/components/watch-card";
import { getBrands, getWatchCards } from "@/lib/catalog/queries";
import { Link } from "@/lib/i18n/client";
import { format } from "@/lib/i18n/dictionary";
import { getDictionary } from "@/lib/i18n/server";
import { localizedMetadata } from "@/lib/seo/localized-metadata";
import { siteConfig } from "@/lib/site";

export async function generateMetadata() {
  const { site } = (await getDictionary()).dict.catalog;
  const title = `${siteConfig.name} – ${site.shortDescription}`;
  return {
    ...(await localizedMetadata({ title, description: site.description, path: "/" })),
    // Le titre de l'accueil ne reçoit pas le suffixe « | Aiguille ».
    title: { absolute: title },
  };
}

export default async function Home() {
  const [brands, latest, { dict, f }] = await Promise.all([
    getBrands(),
    getWatchCards({ sort: "recents", page: 1 }),
    getDictionary(),
  ]);
  const t = dict.catalog.home;
  const total = brands.reduce((sum, b) => sum + b.watchCount, 0);

  return (
    <div className="space-y-12">
      <section className="space-y-4 py-8">
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">{t.title}</h1>
        <p className="max-w-2xl text-lg text-muted-foreground">{dict.catalog.site.description}</p>
        <Link href="/montres" className={buttonVariants({ size: "lg" })}>
          {format(t.browse, { count: f.number(total, 0) })}
        </Link>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">{t.brands}</h2>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {brands.map((b) => (
            <li key={b.slug}>
              <Link
                href={`/montres/${b.slug}`}
                className="block rounded-xl border p-4 transition-colors hover:bg-muted/60"
              >
                <span className="font-medium">{b.name}</span>
                <span className="block text-sm text-muted-foreground">
                  {b.watchCount > 0
                    ? format(t.brandCount, {
                        count: f.number(b.watchCount, 0),
                        price: f.price(b.minPriceCents) ?? "",
                      })
                    : t.soon}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {latest.items.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight">{t.latest}</h2>
          <WatchGrid watches={latest.items.slice(0, 8)} />
        </section>
      )}
    </div>
  );
}
