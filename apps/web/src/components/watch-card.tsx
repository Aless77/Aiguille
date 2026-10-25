import { Link } from "@/lib/i18n/client";

import { Badge } from "@/components/ui/badge";
import { displayName, formatPrice, MOVEMENT_LABELS } from "@/lib/catalog/format";
import { type WatchCard as WatchCardData, watchPath } from "@/lib/catalog/types";

import { features } from "@/lib/features";

import { ScoreBadge } from "./score-badge";
import { WatchImage } from "./watch-image";

export function WatchCard({ watch, priority }: { watch: WatchCardData; priority?: boolean }) {
  const name = displayName(watch.brandName, watch.name);
  const details = [
    watch.movement ? MOVEMENT_LABELS[watch.movement] : null,
    watch.diameterMm ? `${String(watch.diameterMm).replace(".", ",")} mm` : null,
  ].filter(Boolean);

  return (
    <Link
      href={watchPath(watch)}
      className="group flex flex-col gap-3 rounded-xl p-2 transition-colors hover:bg-muted/60"
    >
      <WatchImage
        src={watch.imageUrl}
        alt={`${name}, référence ${watch.reference}`}
        priority={priority}
      />
      <div className="space-y-1 px-1">
        <p className="text-xs text-muted-foreground">{watch.reference}</p>
        <h3 className="leading-snug font-medium group-hover:underline">{name}</h3>
        {details.length > 0 && (
          <p className="text-sm text-muted-foreground">{details.join(" · ")}</p>
        )}
        <div className="flex items-center gap-2 pt-1">
          <span className="font-semibold">
            {formatPrice(watch.priceCents) ?? "Prix non communiqué"}
          </span>
          {watch.discontinued && <Badge variant="secondary">Plus produite</Badge>}
          {watch.score !== null && features.score() && (
            <ScoreBadge score={watch.score} className="ml-auto" />
          )}
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
