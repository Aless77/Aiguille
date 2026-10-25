"use client";

import { Badge } from "@/components/ui/badge";
import { displayName } from "@/lib/catalog/format";
import { type WatchCard as WatchCardData, watchPath } from "@/lib/catalog/types";
import { useFeatures } from "@/lib/features-client";
import { Link, useLocale } from "@/lib/i18n/client";
import { format } from "@/lib/i18n/dictionary";

import { ScoreBadge } from "./score-badge";
import { WatchImage } from "./watch-image";

/** Carte d'une montre, utilisable dans les pages serveur comme dans les composants navigateur. */
export function WatchCard({ watch, priority }: { watch: WatchCardData; priority?: boolean }) {
  const { dict, f } = useLocale();
  const { score } = useFeatures();
  const t = dict.catalog;
  const name = displayName(watch.brandName, watch.name);
  const details = [
    watch.movement ? t.movements[watch.movement] : null,
    watch.diameterMm ? f.mm(watch.diameterMm) : null,
  ].filter(Boolean);

  return (
    <Link
      href={watchPath(watch)}
      className="group flex flex-col gap-3 rounded-xl p-2 transition-colors hover:bg-muted/60"
    >
      <WatchImage
        src={watch.imageUrl}
        alt={format(t.card.imageAlt, { name, reference: watch.reference })}
        priority={priority}
      />
      <div className="space-y-1 px-1">
        <p className="text-xs text-muted-foreground">{watch.reference}</p>
        <h3 className="leading-snug font-medium group-hover:underline">{name}</h3>
        {details.length > 0 && (
          <p className="text-sm text-muted-foreground">{details.join(" · ")}</p>
        )}
        <div className="flex items-center gap-2 pt-1">
          <span className="font-semibold">{f.price(watch.priceCents) ?? t.card.priceUnknown}</span>
          {watch.discontinued && <Badge variant="secondary">{t.card.discontinued}</Badge>}
          {watch.score !== null && score && <ScoreBadge score={watch.score} className="ml-auto" />}
        </div>
      </div>
    </Link>
  );
}

export function WatchGrid({ watches }: { watches: WatchCardData[] }) {
  return (
    <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {watches.map((w, i) => (
        <li key={`${w.brandSlug}-${w.slug}`}>
          <WatchCard watch={w} priority={i < 4} />
        </li>
      ))}
    </ul>
  );
}
