"use client";

import { Star } from "lucide-react";

import { Button } from "@/components/ui/button";
import { type FavoriteBrand } from "@/lib/catalog/brand-directory";
import { useBrandFavorites } from "@/lib/catalog/brand-favorites-client";
import { useLocale } from "@/lib/i18n/client";
import { format } from "@/lib/i18n/dictionary";
import { cn } from "@/lib/utils";

/** Étoile d'épinglage d'une marque ; absente sans compte. `labelled` ajoute le texte visible. */
export function BrandFavoriteButton({
  brand,
  labelled = false,
}: {
  brand: FavoriteBrand;
  labelled?: boolean;
}) {
  const { favorites, canPin, toggle } = useBrandFavorites();
  const { t } = useLocale();
  if (!canPin) return null;

  const pinned = favorites.some((f) => f.slug === brand.slug);
  const label = format(pinned ? t.brands.unpin : t.brands.pin, { brand: brand.name });
  const icon = <Star className={cn(pinned && "fill-current text-primary")} aria-hidden />;

  return (
    <Button
      type="button"
      variant={labelled ? "outline" : "ghost"}
      size={labelled ? "sm" : "icon-sm"}
      aria-pressed={pinned}
      aria-label={label}
      title={label}
      onClick={() => toggle(brand)}
    >
      {icon}
      {labelled && (pinned ? t.brands.pinned : t.brands.pinShort)}
    </Button>
  );
}
