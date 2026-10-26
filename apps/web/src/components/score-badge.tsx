"use client";

import { useLocale } from "@/lib/i18n/client";
import { scoreTone } from "@/lib/score-tone";
import { cn } from "@/lib/utils";

/** Pastille « 72/100 », lisible par un lecteur d'écran (« Note : 72 sur 100 »). */
export function ScoreBadge({
  score,
  size = "sm",
  className,
}: {
  score: number;
  size?: "sm" | "lg";
  className?: string;
}) {
  const t = useLocale().dict.community.misc;
  return (
    <span
      className={cn(
        "inline-flex items-baseline justify-center rounded-lg font-semibold tabular-nums",
        size === "lg" ? "px-3 py-1.5 text-4xl" : "px-1.5 py-0.5 text-sm",
        scoreTone(score),
        className,
      )}
    >
      <span className="sr-only">{t.scoreLabel}</span>
      {score}
      <span className={cn("font-normal opacity-80", size === "lg" ? "text-lg" : "text-[0.7em]")}>
        <span aria-hidden>/100</span>
        <span className="sr-only">{t.outOf100}</span>
      </span>
    </span>
  );
}
