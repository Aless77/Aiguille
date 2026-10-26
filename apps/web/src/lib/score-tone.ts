/** Couleur d'une note sur 100 : vert (très bonne) → orange (faible). Utilisable partout. */
export function scoreTone(score: number): string {
  if (score >= 75) return "bg-emerald-600 text-white dark:bg-emerald-500 dark:text-emerald-950";
  if (score >= 60) return "bg-lime-600 text-white dark:bg-lime-400 dark:text-lime-950";
  if (score >= 45) return "bg-amber-500 text-amber-950 dark:bg-amber-400";
  return "bg-orange-600 text-white dark:bg-orange-500 dark:text-orange-950";
}
