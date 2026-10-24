import { Check } from "lucide-react";

import { WatchCard } from "@/components/watch-card";
import { formatPrice } from "@/lib/catalog/format";
import { type WatchAlternative } from "@/lib/catalog/queries";

/**
 * « Mieux équipées pour moins cher » : comparaison technique pure (packages/db/src/compare.ts).
 * Chaque alternative est au moins aussi bien équipée sur chaque point publié, de taille proche,
 * du même usage, et nettement moins chère.
 */
export function AlternativesSection({
  alternatives,
  priceCents,
}: {
  alternatives: WatchAlternative[];
  priceCents: number | null;
}) {
  if (alternatives.length === 0 || priceCents === null) return null;
  return (
    <section aria-labelledby="alternatives-titre" className="space-y-4">
      <div className="space-y-1">
        <h2 id="alternatives-titre" className="text-2xl font-semibold tracking-tight">
          Aussi bien équipées, pour moins cher
        </h2>
        <p className="text-sm text-muted-foreground">
          Montres du même usage et de taille proche, au moins aussi bien équipées sur chaque point
          technique publié. Le design et la finition restent une affaire de goût : à vous de voir.
        </p>
      </div>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {alternatives.map((a) => (
          <li
            key={`${a.watch.brandSlug}-${a.watch.slug}`}
            className="space-y-3 rounded-xl border p-2"
          >
            <WatchCard watch={a.watch} />
            <div className="space-y-2 px-3 pb-2 text-sm">
              <p className="font-medium text-emerald-700 dark:text-emerald-400">
                {formatPrice(a.savingCents)} de moins
              </p>
              {a.advantages.length > 0 ? (
                <ul className="space-y-1">
                  {a.advantages.map((adv) => (
                    <li key={adv} className="flex gap-2">
                      <Check className="mt-0.5 size-4 shrink-0 text-emerald-600" aria-hidden />
                      {adv}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground">Équipement équivalent.</p>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
