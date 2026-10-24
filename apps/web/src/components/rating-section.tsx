import {
  type Confidence,
  PILLAR_LABELS,
  PILLAR_WEIGHTS,
  type PillarId,
  REVIEW_CRITERIA,
  type ReviewCriterion,
} from "@aiguille/db/rating";
import Link from "next/link";

import { ReviewForm } from "@/components/review-form";
import { ScoreBadge, scoreTone } from "@/components/score-badge";
import { formatDate } from "@/lib/catalog/format";
import { type WatchRating } from "@/lib/catalog/queries";
import { cn } from "@/lib/utils";

export const CONFIDENCE_LABELS: Record<Confidence, string> = {
  low: "Confiance faible",
  medium: "Confiance moyenne",
  high: "Confiance élevée",
};

const AIGUILLE_HELP: Record<Confidence, string> = {
  low: "Fiche de la marque incomplète ou peu de montres comparables : note indicative.",
  medium: "Fiche assez complète, comparée à au moins 10 montres semblables.",
  high: "Fiche complète, comparée à au moins 20 montres semblables.",
};

const COMMUNITY_HELP: Record<Confidence, string> = {
  low: "Moins de 3 avis : à confirmer.",
  medium: "Quelques avis concordants.",
  high: "Au moins 10 avis.",
};

const CRITERIA = Object.keys(REVIEW_CRITERIA) as ReviewCriterion[];
const decimal = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 1 });
const ordinal = (n: number) => (n === 1 ? "1re" : `${n}e`);

/** Note moyenne sur 5 d'un avis (critères notés seulement : le design peut manquer). */
function reviewAverage(ratings: Record<ReviewCriterion, number | null>): number {
  const values = CRITERIA.map((c) => ratings[c]).filter((v): v is number => v !== null);
  return values.reduce((a, b) => a + b, 0) / values.length;
}

/**
 * Deux évaluations côte à côte (lot 5) : la Note Aiguille, factuelle et calculée dans la
 * catégorie de la montre, et l'avis de la communauté. Rendu serveur : dans le HTML (SEO).
 */
export function RatingSection({
  watchId,
  rating,
  path,
  turnstileSiteKey,
  showScore,
  showReviews,
}: {
  watchId: number;
  rating: WatchRating;
  path: string;
  turnstileSiteKey: string | null;
  /** Interrupteurs FEATURE_SCORE et FEATURE_REVIEWS (lib/features.ts). */
  showScore: boolean;
  showReviews: boolean;
}) {
  const { score, reviews } = rating;
  const averages = CRITERIA.map((c) => {
    const values = reviews.map((r) => r.ratings[c]).filter((v): v is number => v !== null);
    return {
      criterion: c,
      average: values.length ? values.reduce((a, b) => a + b, 0) / values.length : null,
    };
  });

  return (
    <section id="note" aria-labelledby="note-titre" className="scroll-mt-20 space-y-10">
      <h2 id="note-titre" className="text-2xl font-semibold tracking-tight">
        {showScore ? "Note et avis" : "Avis"}
      </h2>

      {/* ── Note Aiguille ─────────────────────────────────────────────────────────── */}
      {showScore && (
        <div className="space-y-5">
          <div className="space-y-1">
            <h3 className="text-xl font-semibold tracking-tight">Note Aiguille</h3>
            <p className="text-sm text-muted-foreground">
              Notre évaluation, fondée sur les données publiées par la marque et toujours{" "}
              <strong>dans son registre</strong> : la montre est comparée aux montres de même gamme
              de prix et de même usage, pas à toutes les montres.
            </p>
          </div>

          {score ? (
            <div className="grid gap-8 md:grid-cols-[auto_1fr]">
              <div className="max-w-60 space-y-2">
                <ScoreBadge score={score.score} size="lg" />
                <p className="text-sm font-medium">{score.categoryLabel}</p>
                {score.categorySize > 1 && (
                  <p className="text-sm">
                    {ordinal(score.categoryRank)} sur {score.categorySize} montres comparables
                  </p>
                )}
                <p className="text-sm text-muted-foreground">
                  {CONFIDENCE_LABELS[score.confidence]} · {AIGUILLE_HELP[score.confidence]}
                </p>
              </div>

              <ul className="space-y-5">
                {(Object.keys(PILLAR_WEIGHTS) as PillarId[]).map((id) => {
                  const pillar = score.pillars[id];
                  return (
                    <li key={id} className="space-y-1.5">
                      <div className="flex items-baseline justify-between gap-4">
                        <span className="font-medium">
                          {PILLAR_LABELS[id]}{" "}
                          <span className="text-sm font-normal text-muted-foreground">
                            ({PILLAR_WEIGHTS[id]} %)
                          </span>
                        </span>
                        <span className="tabular-nums">{pillar.score}/100</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-muted" aria-hidden>
                        <div
                          className={cn("h-full rounded-full", scoreTone(pillar.score))}
                          style={{ width: `${pillar.score}%` }}
                        />
                      </div>
                      <ul className="text-sm text-muted-foreground">
                        {pillar.details.map((d) => (
                          <li key={d}>{d}</li>
                        ))}
                      </ul>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : (
            <p className="text-muted-foreground">Note en cours de calcul.</p>
          )}

          <p className="text-sm text-muted-foreground">
            La Note Aiguille ne juge ni le design ni la finition, affaire de goût et
            d&apos;expérience au poignet : c&apos;est le rôle des avis ci-dessous. Calcul détaillé
            dans{" "}
            <Link href="/methodologie#note" className="underline underline-offset-4">
              notre méthodologie
            </Link>
            .
          </p>
        </div>
      )}

      {/* ── Avis de la communauté ─────────────────────────────────────────────────── */}
      {showReviews && (
        <div className="space-y-5">
          <div className="space-y-1">
            <h3 className="text-xl font-semibold tracking-tight">Avis de la communauté</h3>
            <p className="text-sm text-muted-foreground">
              Ce qu&apos;en pensent ceux qui la portent ou l&apos;ont essayée, notée par rapport à
              ce qu&apos;on peut attendre à son prix.
            </p>
          </div>

          {score?.reviewAverage != null && reviews.length > 0 ? (
            <div className="grid gap-8 md:grid-cols-[auto_1fr]">
              <div className="max-w-60 space-y-2">
                <p className="text-4xl font-semibold tabular-nums">
                  {decimal(score.reviewAverage)}
                  <span className="text-lg font-normal text-muted-foreground">/5</span>
                </p>
                <p className="text-sm font-medium">
                  {reviews.length} avis {reviews.length > 1 ? "de visiteurs" : "d'un visiteur"}
                </p>
                {score.communityConfidence && (
                  <p className="text-sm text-muted-foreground">
                    {CONFIDENCE_LABELS[score.communityConfidence]} ·{" "}
                    {COMMUNITY_HELP[score.communityConfidence]}
                  </p>
                )}
              </div>
              <dl className="grid max-w-xl grid-cols-[auto_1fr_auto] items-center gap-x-4 gap-y-2 text-sm">
                {averages.map(({ criterion, average }) => (
                  <div key={criterion} className="contents">
                    <dt>{REVIEW_CRITERIA[criterion]}</dt>
                    <div className="h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden>
                      <div
                        className="h-full rounded-full bg-foreground/70"
                        style={{ width: `${((average ?? 0) / 5) * 100}%` }}
                      />
                    </div>
                    <dd className="tabular-nums">
                      {average === null ? "—" : `${decimal(average)}/5`}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          ) : (
            <p className="text-muted-foreground">
              Pas encore d&apos;avis sur cette montre. Les notes d&apos;autres sites spécialisés
              s&apos;ajouteront ici, avec un lien vers leur source.
            </p>
          )}

          {reviews.length > 0 && (
            <ul className="space-y-4">
              {reviews.map((r) => (
                <li key={r.id} className="space-y-2 rounded-xl border p-4">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                    {r.authorImage ? (
                      // Avatar fourni par Google ou GitHub.
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={r.authorImage}
                        alt=""
                        width={28}
                        height={28}
                        loading="lazy"
                        referrerPolicy="no-referrer"
                        className="size-7 rounded-full"
                      />
                    ) : null}
                    <span className="font-medium">{r.authorName}</span>
                    <span className="text-muted-foreground">
                      {r.ownership === "owner" ? "Propriétaire" : "L'a essayée"} ·{" "}
                      {formatDate(r.updatedAt)}
                    </span>
                    <span className="ml-auto font-semibold tabular-nums">
                      {decimal(reviewAverage(r.ratings))}/5
                    </span>
                  </div>
                  {r.comment && <p className="leading-relaxed whitespace-pre-line">{r.comment}</p>}
                  <p className="text-xs text-muted-foreground">
                    {CRITERIA.filter((c) => r.ratings[c] !== null)
                      .map((c) => `${REVIEW_CRITERIA[c]} ${r.ratings[c]}/5`)
                      .join(" · ")}
                  </p>
                </li>
              ))}
            </ul>
          )}

          <ReviewForm watchId={watchId} path={path} turnstileSiteKey={turnstileSiteKey} />
        </div>
      )}
    </section>
  );
}
