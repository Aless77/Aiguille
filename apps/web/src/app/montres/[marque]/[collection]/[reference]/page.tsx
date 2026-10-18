import { ExternalLink } from "lucide-react";
import { notFound } from "next/navigation";

import { Breadcrumbs } from "@/components/breadcrumbs";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableRow } from "@/components/ui/table";
import { WatchGrid } from "@/components/watch-card";
import { WatchImage } from "@/components/watch-image";
import {
  displayName,
  formatDate,
  formatPrice,
  MOVEMENT_LABELS,
  watchSummary,
} from "@/lib/catalog/format";
import {
  getAllWatchPaths,
  getSimilarWatches,
  getWatch,
  type WatchDetail,
} from "@/lib/catalog/queries";
import { PLACEHOLDER_SLUG, withPlaceholder } from "@/lib/catalog/static-params";
import { isWatchIndexable, watchPath } from "@/lib/catalog/types";
import { JsonLd, productJsonLd } from "@/lib/seo/json-ld";
import { pageMetadata } from "@/lib/seo/metadata";

type Props = PageProps<"/montres/[marque]/[collection]/[reference]">;

/** Toutes les fiches sont prérendues au build : HTML complet servi aux moteurs dès la première visite. */
/**
 * Rendu bloquant assumé : params est lu hors <Suspense> pour que notFound() renvoie un vrai 404
 * (avec streaming, la réponse partirait en 200 : « soft 404 » pour les moteurs). Les pages connues
 * sont prérendues au build, la navigation reste donc instantanée en pratique.
 */
export const instant = false;

export async function generateStaticParams() {
  const paths = await getAllWatchPaths();
  return withPlaceholder(
    paths.map((p) => ({ marque: p.brandSlug, collection: p.collectionSlug, reference: p.slug })),
    { marque: PLACEHOLDER_SLUG, collection: PLACEHOLDER_SLUG, reference: PLACEHOLDER_SLUG },
  );
}

export async function generateMetadata({ params }: Props) {
  const { marque, collection, reference } = await params;
  const w = await getWatch(marque, collection, reference);
  if (!w) return {};
  const name = displayName(w.brandName, w.name);
  return pageMetadata({
    title: `${name} (${w.reference}) : prix et caractéristiques`,
    description: watchSummary({ ...w, catalogPriceCents: w.priceCents }),
    path: watchPath(w),
    images: w.imageUrls.slice(0, 1),
    // Garde-fou contenu mince (docs/seo/strategie.md) : prix, mouvement et diamètre requis.
    index: isWatchIndexable(w),
  });
}

export default async function WatchPage({ params }: Props) {
  // notFound() avant tout Suspense : vraie réponse 404 pour une référence inconnue.
  const { marque, collection, reference } = await params;
  const w = await getWatch(marque, collection, reference);
  if (!w) notFound();

  const name = displayName(w.brandName, w.name);
  const summary = watchSummary({ ...w, catalogPriceCents: w.priceCents });
  const similar = await getSimilarWatches(w.id, w.brandSlug, w.collectionSlug, w.priceCents);
  const collectionName = w.collectionName ?? "Autres modèles";

  return (
    <div className="space-y-12">
      <Breadcrumbs
        crumbs={[
          { name: "Montres", path: "/montres" },
          { name: w.brandName, path: `/montres/${w.brandSlug}` },
          { name: collectionName, path: `/montres/${w.brandSlug}/${w.collectionSlug}` },
          { name: w.reference },
        ]}
      />

      <div className="grid gap-8 md:grid-cols-2">
        <div className="space-y-2">
          <WatchImage
            src={w.imageUrls[0] ?? null}
            alt={`${name}, référence ${w.reference}`}
            priority
            sizes="(min-width: 768px) 50vw, 100vw"
          />
          {w.imageUrls.length > 0 && (
            <p className="text-xs text-muted-foreground">Photo : © {w.brandName}</p>
          )}
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Référence {w.reference}</p>
            <h1 className="text-3xl font-semibold tracking-tight">{name}</h1>
            {w.discontinued && <Badge variant="secondary">Plus produite</Badge>}
          </div>

          <div className="space-y-1 rounded-xl border p-4">
            <p className="text-sm text-muted-foreground">Prix catalogue officiel</p>
            <p className="text-3xl font-semibold">
              {formatPrice(w.priceCents) ?? "Non communiqué"}
            </p>
            <p className="text-sm text-muted-foreground">
              Relevé sur le site {w.brandName} le {formatDate(w.lastSeenAt)}.
            </p>
            {w.officialUrl && (
              <a
                href={w.officialUrl}
                target="_blank"
                rel="nofollow noopener noreferrer"
                className={buttonVariants({ variant: "outline", size: "sm", className: "mt-3" })}
              >
                Voir sur le site {w.brandName}
                <ExternalLink aria-hidden />
              </a>
            )}
          </div>

          <p className="leading-relaxed">{summary}</p>
        </div>
      </div>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">Caractéristiques</h2>
        <SpecsTable watch={w} />
      </section>

      {similar.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight">
            Autres modèles {displayName(w.brandName, collectionName)}
          </h2>
          <WatchGrid watches={similar} />
        </section>
      )}

      <JsonLd
        data={productJsonLd({
          name,
          reference: w.reference,
          brandName: w.brandName,
          description: summary,
          path: watchPath(w),
          imageUrls: w.imageUrls,
          priceCents: w.priceCents,
          inStock: !w.discontinued,
        })}
      />
    </div>
  );
}

function SpecsTable({ watch: w }: { watch: WatchDetail }) {
  const mm = (v: number | null) => (v === null ? null : `${String(v).replace(".", ",")} mm`);
  const rows: [string, string | null][] = [
    ["Référence", w.reference],
    ["Collection", w.collectionName],
    ["Mouvement", w.movement ? MOVEMENT_LABELS[w.movement] : null],
    ["Calibre", w.caliber],
    ["Réserve de marche", w.powerReserveH ? `${w.powerReserveH} heures` : null],
    ["Diamètre", mm(w.diameterMm)],
    ["Épaisseur", mm(w.thicknessMm)],
    ["Entre-cornes", mm(w.lugWidthMm)],
    ["Étanchéité", w.waterResistanceM ? `${w.waterResistanceM} m` : null],
    ["Boîtier", w.caseMaterial],
    ["Verre", w.crystal],
    ["Cadran", w.dialColor],
    ["Bracelet", w.strapMaterial],
  ];

  return (
    <Table>
      <TableBody>
        {rows
          .filter((r): r is [string, string] => r[1] !== null && r[1] !== "")
          .map(([label, value]) => (
            <TableRow key={label}>
              <TableHead scope="row" className="w-1/3 font-medium">
                {label}
              </TableHead>
              <TableCell className="whitespace-normal">{value}</TableCell>
            </TableRow>
          ))}
      </TableBody>
    </Table>
  );
}
