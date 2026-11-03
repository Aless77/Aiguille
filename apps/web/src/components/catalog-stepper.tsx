"use client";

import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useSyncExternalStore } from "react";

import { buttonVariants } from "@/components/ui/button";
import {
  extendTrail,
  parseTrail,
  trailPageSchema,
  trailPageUrl,
  trailPosition,
} from "@/lib/catalog/trail";
import { readStoredTrail, saveTrail, subscribeTrail } from "@/lib/catalog/trail-store";
import { Link, useLocale, useLocalePath } from "@/lib/i18n/client";
import { splitLocale } from "@/lib/i18n/config";
import { format } from "@/lib/i18n/dictionary";
import { cn } from "@/lib/utils";

/**
 * Feuilletage depuis une fiche : montre précédente ou suivante de la liste filtrée d'où vient le
 * visiteur, flèches du clavier comprises. Rien ne s'affiche pour une fiche ouverte directement
 * (moteur de recherche, lien partagé).
 */
export function CatalogStepper() {
  const raw = useSyncExternalStore(subscribeTrail, readStoredTrail, () => null);
  const trail = useMemo(() => parseTrail(raw), [raw]);
  const { dict, f } = useLocale();
  const pathname = splitLocale(usePathname()).path;
  const localize = useLocalePath();
  const router = useRouter();
  const position = trail ? trailPosition(trail, pathname) : null;
  const previous = position?.previous ?? null;
  const next = position?.next ?? null;
  const missingPage = position?.missingPage ?? null;

  // Au bord des résultats connus, charge la page voisine pour continuer sans repasser par la liste.
  useEffect(() => {
    if (!trail || missingPage === null) return;
    let cancelled = false;
    fetch(trailPageUrl(trail, missingPage))
      .then((response) => (response.ok ? response.json() : null))
      .then((body: unknown) => {
        const page = trailPageSchema.safeParse(body);
        if (!cancelled && page.success) saveTrail(extendTrail(trail, page.data));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [trail, missingPage]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing = target?.closest("input, textarea, select, [contenteditable=true]");
      if (typing || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
      const destination =
        event.key === "ArrowLeft" ? previous : event.key === "ArrowRight" ? next : null;
      if (destination) router.push(localize(destination));
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [previous, next, router, localize]);

  if (!trail || !position) return null;
  const t = dict.catalog.trail;
  const results = dict.catalog.results;
  const step = buttonVariants({ variant: "outline", size: "sm" });

  return (
    <nav
      aria-label={t.label}
      className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-xl border p-2"
    >
      <Link href={trail.list} className={buttonVariants({ variant: "ghost", size: "sm" })}>
        <ArrowLeft aria-hidden />
        {t.back}
      </Link>
      <div className="flex items-center gap-2">
        {previous ? (
          <Link href={previous} rel="prev" className={step}>
            <ChevronLeft aria-hidden />
            {results.previous}
          </Link>
        ) : (
          <span aria-disabled className={cn(step, "pointer-events-none opacity-50")}>
            <ChevronLeft aria-hidden />
            {results.previous}
          </span>
        )}
        <span aria-live="polite" className="text-sm whitespace-nowrap text-muted-foreground">
          {format(t.position, {
            rank: f.number(position.rank, 0),
            total: f.number(trail.total, 0),
          })}
        </span>
        {next ? (
          <Link href={next} rel="next" className={step}>
            {results.next}
            <ChevronRight aria-hidden />
          </Link>
        ) : (
          <span aria-disabled className={cn(step, "pointer-events-none opacity-50")}>
            {results.next}
            <ChevronRight aria-hidden />
          </span>
        )}
      </div>
    </nav>
  );
}
