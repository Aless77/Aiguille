import { type ModelVariants, type Variant } from "@aiguille/db/variants";
import Link from "next/link";

import { WatchImage } from "@/components/watch-image";
import { formatPrice } from "@/lib/catalog/format";
import { type FamilyWatch } from "@/lib/catalog/queries";
import { watchPath } from "@/lib/catalog/types";
import { cn } from "@/lib/utils";

const sizeFormat = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 1 });
/** Une rangée de vignettes ; les suivantes sont repliées pour ne pas noyer la fiche. */
const VISIBLE_VARIANTS = 6;

/**
 * Sélecteur de déclinaisons, comme sur les sites des marques : autres tailles du même modèle et
 * autres cadrans, matières ou bracelets (packages/db/src/variants.ts). Chaque choix est un lien
 * vers sa propre fiche : rendu serveur, sans JavaScript, et chaque déclinaison reste indexable.
 */
export function VariantsPicker({ model }: { model: ModelVariants<FamilyWatch> }) {
  const { variants, sizes } = model;
  if (variants.length === 0 && sizes.length === 0) return null;
  const current = variants.find((v) => v.current);
  // La déclinaison affichée reste toujours visible, même loin dans la liste.
  const first = variants.slice(0, VISIBLE_VARIANTS);
  const visible = current && !first.includes(current) ? [...first.slice(0, -1), current] : first;
  const hidden = variants.filter((v) => !visible.includes(v));

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
          <VariantGrid variants={visible} />
          {hidden.length > 0 && (
            <details className="group">
              <summary className="cursor-pointer text-sm underline underline-offset-4 group-open:mb-2">
                <span className="group-open:hidden">
                  Voir les {hidden.length} autres déclinaisons
                </span>
                <span className="hidden group-open:inline">Masquer</span>
              </summary>
              <VariantGrid variants={hidden} />
            </details>
          )}
        </div>
      )}
    </div>
  );
}

function VariantGrid({ variants }: { variants: Variant<FamilyWatch>[] }) {
  return (
    <ul className="grid max-w-md grid-cols-6 gap-2">
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
              <WatchImage src={v.watch.imageUrl} alt="" sizes="64px" className="[&_img]:p-1" />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
