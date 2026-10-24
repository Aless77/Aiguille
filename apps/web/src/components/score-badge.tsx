import { cn } from "@/lib/utils";

/** Couleur d'une note sur 100 : vert (très bonne) → orange (faible). */
export function scoreTone(score: number): string {
  if (score >= 75) return "bg-emerald-600 text-white dark:bg-emerald-500 dark:text-emerald-950";
  if (score >= 60) return "bg-lime-600 text-white dark:bg-lime-400 dark:text-lime-950";
  if (score >= 45) return "bg-amber-500 text-amber-950 dark:bg-amber-400";
  return "bg-orange-600 text-white dark:bg-orange-500 dark:text-orange-950";
}

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
  return (
    <span
      className={cn(
        "inline-flex items-baseline justify-center rounded-lg font-semibold tabular-nums",
        size === "lg" ? "px-3 py-1.5 text-4xl" : "px-1.5 py-0.5 text-sm",
        scoreTone(score),
        className,
      )}
    >
      <span className="sr-only">Note : </span>
      {score}
      <span className={cn("font-normal opacity-80", size === "lg" ? "text-lg" : "text-[0.7em]")}>
        <span aria-hidden>/100</span>
        <span className="sr-only"> sur 100</span>
      </span>
    </span>
  );
}
