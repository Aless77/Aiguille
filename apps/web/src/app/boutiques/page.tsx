import Link from "next/link";

import { Breadcrumbs } from "@/components/breadcrumbs";
import { StoresExplorer } from "@/components/stores-explorer";
import { getBrands, getStoreCounts, getStores } from "@/lib/catalog/queries";
import { pageMetadata } from "@/lib/seo/metadata";

export const metadata = pageMetadata({
  title: "Boutiques agréées Longines et Hamilton en Europe",
  description:
    "Trouvez une boutique agréée Longines ou Hamilton par pays, ville ou adresse. Carte des points de vente en Europe et liens Google Maps.",
  path: "/boutiques",
});

export default async function StoresPage() {
  const [counts, stores, brands] = await Promise.all([getStoreCounts(), getStores(), getBrands()]);
  const withoutStores = brands.filter(
    (b) => b.watchCount > 0 && !counts.some((c) => c.brandSlug === b.slug),
  );

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <Breadcrumbs crumbs={[{ name: "Boutiques" }]} />
        <h1 className="text-3xl font-semibold tracking-tight">Boutiques agréées</h1>
        <p className="max-w-3xl text-muted-foreground">
          Points de vente agréés publiés par les marques en Europe. Le stock par boutique n&apos;est
          publié par aucune marque : appelez avant de vous déplacer pour un modèle précis.
        </p>
        <ul className="flex flex-wrap gap-3">
          {counts.map((c) => (
            <li key={c.brandSlug}>
              <Link
                href={`/boutiques/${c.brandSlug}`}
                className="block rounded-xl border px-4 py-2 transition-colors hover:bg-muted/60"
              >
                <span className="font-medium">{c.brandName}</span>{" "}
                <span className="text-sm text-muted-foreground">({c.count} boutiques)</span>
              </Link>
            </li>
          ))}
        </ul>
        {withoutStores.length > 0 && (
          <p className="text-sm text-muted-foreground">
            {withoutStores.map((b) => b.name).join(", ")} : liste des boutiques non disponible (la
            marque n&apos;autorise pas sa collecte).
          </p>
        )}
      </div>
      <StoresExplorer stores={stores} />
    </div>
  );
}
