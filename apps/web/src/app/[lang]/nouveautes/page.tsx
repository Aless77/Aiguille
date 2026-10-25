import { Breadcrumbs } from "@/components/breadcrumbs";
import { WatchGrid } from "@/components/watch-card";
import { displayName, formatDate } from "@/lib/catalog/format";
import { getNewWatches } from "@/lib/catalog/queries";
import { watchPath } from "@/lib/catalog/types";
import { itemListJsonLd, JsonLd } from "@/lib/seo/json-ld";
import { pageMetadata } from "@/lib/seo/metadata";

export async function generateMetadata() {
  const { items } = await getNewWatches();
  return pageMetadata({
    title: "Nouveautés : les dernières montres ajoutées par les marques",
    description:
      "Les nouvelles références Tissot, Hamilton et Longines, détectées automatiquement dès leur apparition sur les sites officiels, avec leur prix.",
    path: "/nouveautes",
    // Page vide (aucune nouveauté encore détectée) : utile aux visiteurs, sans valeur de recherche.
    index: items.length > 0,
  });
}

/** Regroupe les montres par mois d'apparition (« octobre 2026 »). */
function byMonth<T extends { firstSeenAt: Date }>(items: T[]) {
  const months = new Map<string, T[]>();
  for (const item of items) {
    const label = new Intl.DateTimeFormat("fr-FR", {
      month: "long",
      year: "numeric",
      timeZone: "Europe/Paris",
    }).format(item.firstSeenAt);
    months.set(label, [...(months.get(label) ?? []), item]);
  }
  return [...months.entries()];
}

export default async function NewWatchesPage() {
  const { items, trackedSince } = await getNewWatches();

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <Breadcrumbs crumbs={[{ name: "Nouveautés" }]} />
        <h1 className="text-3xl font-semibold tracking-tight">Nouveautés</h1>
        <p className="max-w-2xl text-muted-foreground">
          Les références qui apparaissent sur les sites officiels des marques sont détectées lors de
          notre relevé quotidien et listées ici, des plus récentes aux plus anciennes.
        </p>
      </div>

      {items.length === 0 ? (
        <p className="rounded-xl border border-dashed p-6 text-muted-foreground">
          Aucune nouvelle référence détectée pour l&apos;instant
          {trackedSince && ` depuis le début du suivi, le ${formatDate(trackedSince)}`}. Les
          prochaines sorties des marques apparaîtront ici automatiquement.
        </p>
      ) : (
        byMonth(items).map(([month, watches]) => (
          <section key={month} className="space-y-4">
            <h2 className="text-2xl font-semibold tracking-tight first-letter:uppercase">
              {month}
            </h2>
            <WatchGrid watches={watches} />
          </section>
        ))
      )}

      {items.length > 0 && (
        <JsonLd
          data={itemListJsonLd(
            items.map((w) => ({ name: displayName(w.brandName, w.name), path: watchPath(w) })),
          )}
        />
      )}
    </div>
  );
}
