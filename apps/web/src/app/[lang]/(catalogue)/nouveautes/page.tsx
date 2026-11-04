import { Breadcrumbs } from "@/components/breadcrumbs";
import { WatchGrid } from "@/components/watch-card";
import { displayName } from "@/lib/catalog/format";
import { getNewWatches } from "@/lib/catalog/queries";
import { watchPath } from "@/lib/catalog/types";
import { format } from "@/lib/i18n/dictionary";
import { getDictionary } from "@/lib/i18n/server";
import { itemListJsonLd, JsonLd } from "@/lib/seo/json-ld";
import { localizedMetadata } from "@/lib/seo/localized-metadata";

export async function generateMetadata() {
  const [{ items }, { dict }] = await Promise.all([getNewWatches(), getDictionary()]);
  return localizedMetadata({
    title: dict.catalog.news.metaTitle,
    description: dict.catalog.news.metaDescription,
    path: "/nouveautes",
    // Page vide (aucune nouveauté encore détectée) : utile aux visiteurs, sans valeur de recherche.
    index: items.length > 0,
  });
}

/** Regroupe les montres par mois d'apparition (« octobre 2026 »). */
function byMonth<T extends { firstSeenAt: Date }>(items: T[], month: (date: Date) => string) {
  const months = new Map<string, T[]>();
  for (const item of items) {
    const label = month(item.firstSeenAt);
    months.set(label, [...(months.get(label) ?? []), item]);
  }
  return [...months.entries()];
}

export default async function NewWatchesPage() {
  const [{ items, trackedSince }, { dict, f, path }] = await Promise.all([
    getNewWatches(),
    getDictionary(),
  ]);
  const t = dict.catalog.news;

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <Breadcrumbs crumbs={[{ name: t.title }]} />
        <h1 className="text-3xl font-semibold tracking-tight">{t.title}</h1>
        <p className="max-w-2xl text-muted-foreground">{t.intro}</p>
      </div>

      {items.length === 0 ? (
        <p className="rounded-xl border border-dashed p-6 text-muted-foreground">
          {t.empty}
          {trackedSince && format(t.since, { date: f.date(trackedSince) })}
          {t.emptyEnd}
        </p>
      ) : (
        byMonth(items, f.month).map(([month, watches]) => (
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
            items.map((w) => ({
              name: displayName(w.brandName, w.name),
              path: path(watchPath(w)),
            })),
          )}
        />
      )}
    </div>
  );
}
