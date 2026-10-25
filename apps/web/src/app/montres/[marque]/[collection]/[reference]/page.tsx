import { reviewMean } from "@aiguille/db/rating";
import { modelVariants } from "@aiguille/db/variants";
import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Breadcrumbs } from "@/components/breadcrumbs";
import { EuropePricesSection } from "@/components/europe-prices-section";
import { OffersSection } from "@/components/offers-section";
import { AlternativesSection } from "@/components/alternatives-section";
import { PriceHistorySection } from "@/components/price-history-section";
import { SpecSheetSection } from "@/components/spec-sheet-section";
import { CONFIDENCE_LABELS, RatingSection } from "@/components/rating-section";
import { ScoreBadge } from "@/components/score-badge";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { WatchGrid } from "@/components/watch-card";
import { VariantsPicker } from "@/components/variants-picker";
import { WatchImage } from "@/components/watch-image";
import { displayName, formatDate, formatPrice, watchSummary } from "@/lib/catalog/format";
import { AVAILABILITY_LABELS, buildPriceHistory, currentOffers } from "@/lib/catalog/price-history";
import { buildEuropePrices } from "@/lib/catalog/europe-prices";
import {
  getAllWatchPaths,
  getCollectionFamily,
  getCountryPrices,
  type FamilyWatch,
  getLatestRates,
  getStoreCounts,
  getPriceObservations,
  getSimilarWatches,
  getWatch,
  getWatchRating,
  getWatchAlternatives,
} from "@/lib/catalog/queries";
import { PLACEHOLDER_SLUG, withPlaceholder } from "@/lib/catalog/static-params";
import { isWatchIndexable, watchPath } from "@/lib/catalog/types";
import { JsonLd, productJsonLd } from "@/lib/seo/json-ld";
import { pageMetadata } from "@/lib/seo/metadata";
import { turnstileSiteKey } from "@/lib/reviews/turnstile";
import { features } from "@/lib/features";

type Props = PageProps<"/montres/[marque]/[collection]/[reference]">;

/**
 * Toutes les fiches sont prérendues au build : HTML complet servi aux moteurs dès la première visite.
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
  const showScore = features.score();
  const showReviews = features.reviews();
  const summary = watchSummary({ ...w, catalogPriceCents: w.priceCents });
  const model = modelVariants<FamilyWatch>(
    w.brandSlug,
    w,
    await getCollectionFamily(w.brandSlug, w.collectionSlug),
  );
  // Les déclinaisons déjà dans le sélecteur ne sont pas reproposées dans « Autres modèles ».
  const shown = [...model.variants, ...model.sizes].map((v) => v.watch.slug);
  const [similar, observations, countryPrices, rates, storeCounts, rating, alternatives] =
    await Promise.all([
      getSimilarWatches(w.id, w.brandSlug, w.collectionSlug, w.priceCents, shown),
      getPriceObservations(w.id),
      getCountryPrices(w.id, `${w.brandSlug}-officiel`),
      getLatestRates(),
      getStoreCounts(),
      getWatchRating(w.id),
      getWatchAlternatives(w.id),
    ]);
  const storeCount = storeCounts.find((c) => c.brandSlug === w.brandSlug)?.count ?? 0;
  const europePrices = buildEuropePrices(countryPrices, rates.unitsPerEur);
  const history = buildPriceHistory(
    observations,
    w.brandName,
    w.lastSeenAt,
    `${w.brandSlug}-officiel`,
  );
  const offers = currentOffers(observations, w.brandName);
  const bestRetailer = offers
    .filter((o) => !o.official && o.availability !== "out_of_stock")
    .sort((a, b) => a.priceCents - b.priceCents)[0];
  // Statut de stock sur le site officiel (cahier des charges, lot 3 : « Disponibilité »).
  const availability = w.discontinued ? null : (history.current?.availability ?? "unknown");
  const collectionName = w.collectionName ?? "Autres modèles";
  const collectionPath = `/montres/${w.brandSlug}/${w.collectionSlug}`;

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
            <p className="flex flex-wrap items-center gap-x-2 text-sm text-muted-foreground">
              <Link href={`/montres/${w.brandSlug}`} className="underline-offset-4 hover:underline">
                {w.brandName}
              </Link>
              <span aria-hidden>·</span>
              <Link
                href={collectionPath}
                className="font-medium text-foreground underline underline-offset-4"
              >
                {w.collectionName ? `Collection ${w.collectionName}` : collectionName}
              </Link>
              <span aria-hidden>·</span>
              <span>Référence {w.reference}</span>
            </p>
            <h1 className="text-3xl font-semibold tracking-tight">{name}</h1>
            {w.discontinued && <Badge variant="secondary">Plus produite</Badge>}
          </div>

          <VariantsPicker model={model} />

          {showScore && rating.score && (
            <a
              href="#note"
              className="flex items-center gap-3 rounded-xl border p-3 transition-colors hover:bg-muted/60"
            >
              <ScoreBadge score={rating.score.score} />
              <span className="text-sm">
                <span className="block font-medium">
                  Note Aiguille ·{" "}
                  {rating.score.categoryRank > 0 && rating.score.categorySize > 1
                    ? `${rating.score.categoryRank === 1 ? "1re" : `${rating.score.categoryRank}e`} sur ${rating.score.categorySize}`
                    : CONFIDENCE_LABELS[rating.score.confidence].toLowerCase()}
                </span>
                <span className="block text-muted-foreground">
                  {rating.score.reviewAverage != null && rating.reviews.length
                    ? `Communauté : ${rating.score.reviewAverage.toLocaleString("fr-FR", { maximumFractionDigits: 1 })}/5 (${rating.reviews.length} avis)`
                    : "Pas encore d'avis de la communauté"}
                </span>
              </span>
            </a>
          )}

          <div className="space-y-1 rounded-xl border p-4">
            <p className="text-sm text-muted-foreground">Prix catalogue officiel</p>
            <p className="text-3xl font-semibold">
              {formatPrice(w.priceCents) ?? "Non communiqué"}
            </p>
            {availability && (
              <p className="flex items-center gap-2 text-sm">
                <span
                  aria-hidden
                  className={`size-2 rounded-full ${availability === "in_stock" ? "bg-emerald-500" : availability === "preorder" ? "bg-amber-500" : "bg-muted-foreground"}`}
                />
                {AVAILABILITY_LABELS[availability]} sur le site {w.brandName}
              </p>
            )}
            {bestRetailer && (
              <p className="text-sm">
                {bestRetailer.priceCents < (w.priceCents ?? Infinity)
                  ? "Meilleur prix relevé : "
                  : "Aussi chez "}
                <a href="#offres" className="font-medium underline underline-offset-4">
                  {bestRetailer.priceCents < (w.priceCents ?? Infinity)
                    ? `${formatPrice(bestRetailer.priceCents)} chez ${bestRetailer.label}`
                    : bestRetailer.label}
                </a>
              </p>
            )}
            <p className="text-sm text-muted-foreground">
              Relevé sur le site {w.brandName} le {formatDate(w.lastSeenAt)}.{" "}
              <Link href="/methodologie" className="underline underline-offset-4">
                Notre méthode
              </Link>
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

      <OffersSection offers={offers} />
      {storeCount > 0 && (
        <p className="-mt-8 text-sm text-muted-foreground">
          Pour la voir en vrai :{" "}
          <Link href={`/boutiques/${w.brandSlug}`} className="underline underline-offset-4">
            {storeCount} boutiques agréées {w.brandName} en Europe
          </Link>{" "}
          (stock non publié par la marque).
        </p>
      )}

      <SpecSheetSection watch={w} storeCount={storeCount} />

      <AlternativesSection alternatives={alternatives} priceCents={w.priceCents} />

      {(showScore || showReviews) && (
        <RatingSection
          watchId={w.id}
          rating={rating}
          path={watchPath(w)}
          turnstileSiteKey={turnstileSiteKey()}
          showScore={showScore}
          showReviews={showReviews}
        />
      )}

      <EuropePricesSection prices={europePrices} ratesDate={rates.date} />

      <PriceHistorySection history={history} />

      {similar.length > 0 && (
        <section className="space-y-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-2xl font-semibold tracking-tight">
              Autres modèles {displayName(w.brandName, collectionName)}
            </h2>
            <Link href={collectionPath} className="text-sm underline underline-offset-4">
              Voir toute la collection
            </Link>
          </div>
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
          offers,
          reviews: showReviews
            ? {
                average: rating.score?.reviewAverage ?? 0,
                count: rating.reviews.length,
                items: rating.reviews.map((r) => ({
                  author: r.authorName,
                  date: r.updatedAt,
                  rating: reviewMean(r.ratings),
                  body: r.comment,
                })),
              }
            : undefined,
        })}
      />
    </div>
  );
}
