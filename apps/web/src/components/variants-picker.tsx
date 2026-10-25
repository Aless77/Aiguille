import { type ModelVariants, type Variant } from "@aiguille/db/variants";
import { Link } from "@/lib/i18n/client";

import { WatchImage } from "@/components/watch-image";
import { formatPrice } from "@/lib/catalog/format";
import { type FamilyWatch } from "@/lib/catalog/queries";
import { watchPath } from "@/lib/catalog/types";
import { type Dictionary, format } from "@/lib/i18n/dictionary";
import { cn } from "@/lib/utils";

/** Une rangée de vignettes ; les suivantes sont repliées pour ne pas noyer la fiche. */
const VISIBLE_VARIANTS = 6;

/**
 * Sélecteur de déclinaisons, comme sur les sites des marques : autres tailles du même modèle et
 * autres cadrans, matières ou bracelets (packages/db/src/variants.ts). Chaque choix est un lien
 * vers sa propre fiche : rendu serveur, sans JavaScript, et chaque déclinaison reste indexable.
 */
type Texts = Dictionary["variants"];

/** Libellé traduit d'une déclinaison : « Cadran Bleu · Bracelet Cuir ». */
function variantLabel(v: Variant<FamilyWatch>, t: Texts): string {
  return v.parts.map((p) => `${t[p.field]} ${p.value}`).join(" · ") || v.watch.reference;
}

export function VariantsPicker({
  model,
  t,
  locale,
}: {
  model: ModelVariants<FamilyWatch>;
  t: Texts;
  locale: string;
}) {
  const sizeFormat = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 });
  const { variants, sizes } = model;
  if (variants.length === 0 && sizes.length === 0) return null;
  const current = variants.find((v) => v.current);
  // La déclinaison affichée reste toujours visible, même loin dans la liste.
  const first = variants.slice(0, VISIBLE_VARIANTS);
  const visible = current && !first.includes(current) ? [...first.slice(0, -1), current] : first;
  const hidden = variants.filter((v) => !visible.includes(v));

  return (
    <div className="space-y-4" aria-label={t.label} role="group">
      {sizes.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">{t.caseSize}</p>
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
            {format(t.count, { count: variants.length })}
            {current && (
              <>
                {" "}
                · <span className="text-foreground">{variantLabel(current, t)}</span>
              </>
            )}
          </p>
          <VariantGrid variants={visible} t={t} locale={locale} />
          {hidden.length > 0 && (
            <details className="group">
              <summary className="cursor-pointer text-sm underline underline-offset-4 group-open:mb-2">
                <span className="group-open:hidden">
                  {format(t.showMore, { count: hidden.length })}
                </span>
                <span className="hidden group-open:inline">{t.hide}</span>
              </summary>
              <VariantGrid variants={hidden} t={t} locale={locale} />
            </details>
          )}
        </div>
      )}
    </div>
  );
}

function VariantGrid({
  variants,
  t,
  locale,
}: {
  variants: Variant<FamilyWatch>[];
  t: Texts;
  locale: string;
}) {
  return (
    <ul className="grid max-w-md grid-cols-6 gap-2">
      {variants.map((v) => {
        const description = [
          variantLabel(v, t),
          formatPrice(v.watch.priceCents, locale),
          v.watch.discontinued ? t.discontinued : null,
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
