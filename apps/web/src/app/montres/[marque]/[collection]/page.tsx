import { notFound } from "next/navigation";

import { Breadcrumbs } from "@/components/breadcrumbs";
import { WatchGrid } from "@/components/watch-card";
import { displayName, formatPrice, MOVEMENT_LABELS } from "@/lib/catalog/format";
import { getCollection, getCollections, getWatchCards } from "@/lib/catalog/queries";
import { PLACEHOLDER_SLUG, withPlaceholder } from "@/lib/catalog/static-params";
import { watchPath } from "@/lib/catalog/types";
import { JsonLd, itemListJsonLd } from "@/lib/seo/json-ld";
import { pageMetadata } from "@/lib/seo/metadata";

/**
 * Rendu bloquant assumé : params est lu hors <Suspense> pour que notFound() renvoie un vrai 404
 * (avec streaming, la réponse partirait en 200 : « soft 404 » pour les moteurs). Les pages connues
 * sont prérendues au build, la navigation reste donc instantanée en pratique.
 */
export const instant = false;

export async function generateStaticParams() {
  const collections = await getCollections();
  return withPlaceholder(
    collections.map((c) => ({ marque: c.brandSlug, collection: c.slug })),
    { marque: PLACEHOLDER_SLUG, collection: PLACEHOLDER_SLUG },
  );
}

export async function generateMetadata({ params }: PageProps<"/montres/[marque]/[collection]">) {
  const { marque, collection } = await params;
  const c = await getCollection(marque, collection);
  if (!c) return {};
  const name = displayName(c.brandName, c.name);
  const range =
    c.minPriceCents !== null
      ? c.minPriceCents === c.maxPriceCents
        ? ` à ${formatPrice(c.minPriceCents)}`
        : ` de ${formatPrice(c.minPriceCents)} à ${formatPrice(c.maxPriceCents)}`
      : "";
  return pageMetadata({
    title: `${name} : tous les modèles et leurs prix`,
    description: `${c.watchCount} références ${name}${range} (prix catalogue officiels). Comparez mouvements, diamètres et caractéristiques.`,
    path: `/montres/${c.brandSlug}/${c.slug}`,
  });
}

export default async function CollectionPage({
  params,
}: PageProps<"/montres/[marque]/[collection]">) {
  const { marque, collection } = await params;
  const c = await getCollection(marque, collection);
  if (!c) notFound();

  // Une collection compte rarement plus de quelques dizaines de références : tout sur une page.
  const pages = Math.ceil(c.watchCount / 24);
  const results = await Promise.all(
    Array.from({ length: pages }, (_, i) =>
      getWatchCards({ brandSlug: c.brandSlug, collectionSlug: c.slug, page: i + 1 }),
    ),
  );
  const watches = results.flatMap((r) => r.items);
  const name = displayName(c.brandName, c.name);

  const movements = [...new Set(watches.map((w) => w.movement).filter((m) => m !== null))];
  const diameters = watches.map((w) => w.diameterMm).filter((d): d is number => d !== null);

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <Breadcrumbs
          crumbs={[
            { name: "Montres", path: "/montres" },
            { name: c.brandName, path: `/montres/${c.brandSlug}` },
            { name: c.name },
          ]}
        />
        <h1 className="text-3xl font-semibold tracking-tight">{name}</h1>
        <p className="max-w-2xl text-muted-foreground">
          {c.watchCount} référence{c.watchCount > 1 ? "s" : ""} {name}
          {c.minPriceCents !== null &&
            `, de ${formatPrice(c.minPriceCents)} à ${formatPrice(c.maxPriceCents)}`}
          {movements.length > 0 &&
            `. Mouvements : ${movements.map((m) => MOVEMENT_LABELS[m].toLowerCase()).join(", ")}`}
          {diameters.length > 0 &&
            `. Diamètres de ${Math.min(...diameters)} à ${Math.max(...diameters)} mm`}
          .
        </p>
      </div>
      <WatchGrid watches={watches} />
      <JsonLd
        data={itemListJsonLd(
          watches.map((w) => ({ name: displayName(w.brandName, w.name), path: watchPath(w) })),
        )}
      />
    </div>
  );
}
