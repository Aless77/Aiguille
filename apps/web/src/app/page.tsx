import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { WatchGrid } from "@/components/watch-card";
import { formatPrice } from "@/lib/catalog/format";
import { getBrands, getWatchCards } from "@/lib/catalog/queries";
import { pageMetadata } from "@/lib/seo/metadata";
import { siteConfig } from "@/lib/site";

export const metadata = {
  ...pageMetadata({
    title: `${siteConfig.name} – ${siteConfig.shortDescription}`,
    description: siteConfig.description,
    path: "/",
  }),
  // Le titre de l'accueil ne reçoit pas le suffixe « | Aiguille ».
  title: { absolute: `${siteConfig.name} – ${siteConfig.shortDescription}` },
};

export default async function Home() {
  const [brands, latest] = await Promise.all([
    getBrands(),
    getWatchCards({ sort: "recents", page: 1 }),
  ]);
  const total = brands.reduce((sum, b) => sum + b.watchCount, 0);

  return (
    <div className="space-y-12">
      <section className="space-y-4 py-8">
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          Choisir une montre grâce aux données
        </h1>
        <p className="max-w-2xl text-lg text-muted-foreground">{siteConfig.description}</p>
        <Link href="/montres" className={buttonVariants({ size: "lg" })}>
          Parcourir les {total} montres
        </Link>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">Marques suivies</h2>
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
                    ? `${b.watchCount} montres · dès ${formatPrice(b.minPriceCents)}`
                    : "Bientôt disponible"}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {latest.items.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight">Dernières références ajoutées</h2>
          <WatchGrid watches={latest.items.slice(0, 8)} />
        </section>
      )}
    </div>
  );
}
