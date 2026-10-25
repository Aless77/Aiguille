import { type ModelVariants } from "@aiguille/db/variants";
import Link from "next/link";

import { WatchImage } from "@/components/watch-image";
import { formatPrice } from "@/lib/catalog/format";
import { type FamilyWatch } from "@/lib/catalog/queries";
import { watchPath } from "@/lib/catalog/types";
import { cn } from "@/lib/utils";

const sizeFormat = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 1 });

/**
 * Sélecteur de déclinaisons, comme sur les sites des marques : autres tailles du même modèle et
 * autres cadrans, matières ou bracelets (packages/db/src/variants.ts). Chaque choix est un lien
 * vers sa propre fiche : rendu serveur, sans JavaScript, et chaque déclinaison reste indexable.
 */
export function VariantsPicker({ model }: { model: ModelVariants<FamilyWatch> }) {
  const { variants, sizes } = model;
  if (variants.length === 0 && sizes.length === 0) return null;
  const current = variants.find((v) => v.current);

  return (
    <div className="space-y-4" aria-label="Déclinaisons de ce modèle" role="group">
      {sizes.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Taille du boîtier</p>
          <ul className="flex flex-wrap gap-2">
            {sizes.map((s) => (
              <li key={s.diameterMm}>
                <Link
                  href={watchPath(s.watch)}
                  aria-current={s.current ? "page" : undefined}
                  className={cn(
                    "inline-flex rounded-full border px-3 py-1 text-sm transition-colors",
                    s.current
                      ? "border-foreground bg-foreground text-background"
                      : "hover:bg-muted",
                  )}
                >
                  {sizeFormat.format(s.diameterMm)} mm
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {variants.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            {variants.length} déclinaisons
            {current && (
              <>
                {" "}
                · <span className="text-foreground">{current.label}</span>
              </>
            )}
          </p>
          <ul className="grid grid-cols-5 gap-2 sm:grid-cols-6">
            {variants.map((v) => {
              const description = [
                v.label,
                formatPrice(v.watch.priceCents),
                v.watch.discontinued ? "plus produite" : null,
              ]
                .filter(Boolean)
                .join(", ");
              return (
                <li key={v.watch.slug}>
                  <Link
                    href={watchPath(v.watch)}
                    aria-current={v.current ? "page" : undefined}
                    aria-label={`${v.watch.reference} : ${description}`}
                    title={description}
                    className={cn(
                      "block rounded-lg border-2 transition-colors",
                      v.current ? "border-foreground" : "border-transparent hover:border-border",
                      v.watch.discontinued && !v.current && "opacity-50",
                    )}
                  >
                    <WatchImage
                      src={v.watch.imageUrl}
                      alt=""
                      sizes="64px"
                      className="[&_img]:p-1"
                    />
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
