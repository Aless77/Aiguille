import {
  PILLAR_LABELS,
  PILLAR_WEIGHTS,
  type PillarId,
  REVIEW_CRITERIA,
  type ReviewCriterion,
} from "@aiguille/db/rating";
import { Link } from "@/lib/i18n/client";

import { ReviewForm } from "@/components/review-form";
import { ScoreBadge } from "@/components/score-badge";
import { scoreTone } from "@/lib/score-tone";
import { format } from "@/lib/i18n/dictionary";
import { getDictionary } from "@/lib/i18n/server";
import { type WatchRating } from "@/lib/catalog/queries";
import { cn } from "@/lib/utils";

const CRITERIA = Object.keys(REVIEW_CRITERIA) as ReviewCriterion[];

/** Note moyenne sur 5 d'un avis (critères notés seulement : le design peut manquer). */
function reviewAverage(ratings: Record<ReviewCriterion, number | null>): number {
  const values = CRITERIA.map((c) => ratings[c]).filter((v): v is number => v !== null);
  return values.reduce((a, b) => a + b, 0) / values.length;
}

/**
 * Deux évaluations côte à côte (lot 5) : la Note Aiguille, factuelle et calculée dans la
 * catégorie de la montre, et l'avis de la communauté. Rendu serveur : dans le HTML (SEO).
 */
export async function RatingSection({
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
  const { dict, f } = await getDictionary();
  const t = dict.community.reviews;
  const decimal = (n: number) => f.number(n);
  const ordinal = (n: number) =>
    n === 1 ? t.ordinalFirst : t.ordinalOther.replace("{n}", String(n));
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
        {showScore ? t.titleWithScore : t.title}
      </h2>

      {/* ── Note Aiguille ─────────────────────────────────────────────────────────── */}
      {showScore && (
        <div className="space-y-5">
          <div className="space-y-1">
            <h3 className="text-xl font-semibold tracking-tight">{t.scoreTitle}</h3>
            <p className="text-sm text-muted-foreground">{t.scoreIntro}</p>
          </div>

          {score ? (
            <div className="grid gap-8 md:grid-cols-[auto_1fr]">
              <div className="max-w-60 space-y-2">
                <ScoreBadge score={score.score} size="lg" />
                <p className="text-sm font-medium">{score.categoryLabel}</p>
                {score.categorySize > 1 && (
                  <p className="text-sm">
                    {format(t.rank, {
                      rank: ordinal(score.categoryRank),
                      count: score.categorySize,
                    })}
                  </p>
                )}
                <p className="text-sm text-muted-foreground">
                  {t.confidence[score.confidence]} · {t.scoreHelp[score.confidence]}
                </p>
              </div>

              <ul className="space-y-5">
                {(Object.keys(PILLAR_WEIGHTS) as PillarId[]).map((id) => {
                  const pillar = score.pillars[id];
                  return (
                    <li key={id} className="space-y-1.5">
                      <div className="flex items-baseline justify-between gap-4">
                        <span className="font-medium">
                          {t.pillars[id] ?? PILLAR_LABELS[id]}{" "}
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
            <p className="text-muted-foreground">{t.scorePending}</p>
          )}

          <p className="text-sm text-muted-foreground">
            {t.scoreDisclaimer}{" "}
            <Link href="/methodologie#note" className="underline underline-offset-4">
              {t.methodology}
            </Link>
            .
          </p>
        </div>
      )}

      {/* ── Avis de la communauté ─────────────────────────────────────────────────── */}
      {showReviews && (
        <div className="space-y-5">
          <div className="space-y-1">
            <h3 className="text-xl font-semibold tracking-tight">{t.communityTitle}</h3>
            <p className="text-sm text-muted-foreground">{t.communityIntro}</p>
          </div>

          {score?.reviewAverage != null && reviews.length > 0 ? (
            <div className="grid gap-8 md:grid-cols-[auto_1fr]">
              <div className="max-w-60 space-y-2">
                <p className="text-4xl font-semibold tabular-nums">
                  {decimal(score.reviewAverage)}
                  <span className="text-lg font-normal text-muted-foreground">/5</span>
                </p>
                <p className="text-sm font-medium">{f.plural(t.reviewCount, reviews.length)}</p>
                {score.communityConfidence && (
                  <p className="text-sm text-muted-foreground">
                    {t.confidence[score.communityConfidence]} ·{" "}
                    {t.communityHelp[score.communityConfidence]}
                  </p>
                )}
              </div>
              <dl className="grid max-w-xl grid-cols-[auto_1fr_auto] items-center gap-x-4 gap-y-2 text-sm">
                {averages.map(({ criterion, average }) => (
                  <div key={criterion} className="contents">
                    <dt>{t.criteria[criterion]}</dt>
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
            <p className="text-muted-foreground">{t.none}</p>
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
                      {r.ownership === "owner" ? t.owner : t.tried} · {f.date(r.updatedAt)}
                    </span>
                    <span className="ml-auto font-semibold tabular-nums">
                      {decimal(reviewAverage(r.ratings))}/5
                    </span>
                  </div>
                  {r.comment && <p className="leading-relaxed whitespace-pre-line">{r.comment}</p>}
                  <p className="text-xs text-muted-foreground">
                    {CRITERIA.filter((c) => r.ratings[c] !== null)
                      .map((c) => `${t.criteria[c]} ${r.ratings[c]}/5`)
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
