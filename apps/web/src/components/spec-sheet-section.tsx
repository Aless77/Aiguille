import { buildSpecSheet } from "@aiguille/db/spec-sheet";
import { ExternalLink, Languages } from "lucide-react";

import { type WatchDetail } from "@/lib/catalog/queries";
import { type Locale } from "@/lib/i18n/config";
import { Link } from "@/lib/i18n/client";
import { type Dictionary, format, translateLabel } from "@/lib/i18n/dictionary";

/**
 * Fiche technique commune à toutes les marques (packages/db/src/spec-sheet.ts) : mêmes rubriques
 * et mêmes lignes partout, pour trouver une information au même endroit d'une fiche à l'autre.
 * Rendu serveur : tout le contenu est dans le HTML (SEO, accessibilité).
 *
 * Hors français : libellés traduits par le dictionnaire, valeurs de la fiche de la marque dans la
 * langue (`watch` déjà traduite) ; `labels` donne les libellés publiés par la marque.
 */
export function SpecSheetSection({
  watch: w,
  storeCount,
  dict,
  labels = {},
  fallbackNotice = null,
  locale,
}: {
  watch: WatchDetail;
  storeCount: number;
  dict: Dictionary;
  labels?: Record<string, string>;
  fallbackNotice?: string | null;
  locale: Locale;
}) {
  const t = dict.specSheet;
  const unknown = dict.common.unknown;
  const sheet = buildSpecSheet({ ...w, storeCount }, locale);
  const vintage = sheet.groups.some((g) => g.id === "historique");

  return (
    <section id="technique" aria-labelledby="technique-titre" className="scroll-mt-20 space-y-5">
      <div className="space-y-2">
        <h2 id="technique-titre" className="text-2xl font-semibold tracking-tight">
          {t.title}
        </h2>
        <p className="text-sm text-muted-foreground">
          {format(t.intro, { brand: w.brandName, unknown })}
        </p>
        {fallbackNotice && (
          <p
            role="note"
            className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm dark:border-amber-800 dark:bg-amber-950"
          >
            <Languages className="mt-0.5 size-4 shrink-0" aria-hidden />
            {fallbackNotice}
          </p>
        )}
        <nav aria-label={t.navLabel} className="flex flex-wrap gap-2 pt-1">
          {sheet.groups.map((g) => (
            <a
              key={g.id}
              href={`#fiche-${g.id}`}
              className="rounded-full border px-3 py-1 text-sm transition-colors hover:bg-muted"
            >
              {t.groups[g.id] ?? g.title}
            </a>
          ))}
          {sheet.care.length > 0 && (
            <a
              href="#fiche-conseils"
              className="rounded-full border px-3 py-1 text-sm transition-colors hover:bg-muted"
            >
              {t.careNav}
            </a>
          )}
        </nav>
      </div>

      {vintage && (
        <p className="rounded-lg border p-3 text-sm">{format(t.vintage, { brand: w.brandName })}</p>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {sheet.groups.map((g) => (
          <div
            key={g.id}
            id={`fiche-${g.id}`}
            className="scroll-mt-20 rounded-xl border p-4 sm:p-5"
          >
            <h3 className="mb-2 text-lg font-semibold">{t.groups[g.id] ?? g.title}</h3>
            <dl className="divide-y text-sm">
              {g.rows.map((r) => (
                <div
                  key={r.label}
                  className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-4 py-2"
                >
                  <dt className="text-muted-foreground">{translateLabel(t.rows, r.label)}</dt>
                  <dd className={r.value === null ? "text-muted-foreground" : "font-medium"}>
                    {r.value ?? unknown}
                    {r.note && (
                      <span className="block text-xs font-normal text-muted-foreground">
                        {r.note}
                      </span>
                    )}
                    {r.link && (
                      <a
                        href={r.link.href}
                        target="_blank"
                        rel="nofollow noopener noreferrer"
                        className="mt-1 inline-flex items-center gap-1 text-xs font-normal underline underline-offset-4"
                      >
                        {r.link.label} {w.brandName}
                        <ExternalLink className="size-3" aria-hidden />
                        <span className="sr-only">{dict.common.newTab}</span>
                      </a>
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </div>

      {sheet.care.length > 0 && (
        <div id="fiche-conseils" className="scroll-mt-20 rounded-xl border p-4 sm:p-5">
          <h3 className="mb-1 text-lg font-semibold">{t.careTitle}</h3>
          <p className="mb-3 text-sm text-muted-foreground">{t.careIntro}</p>
          <ul className="space-y-2 text-sm">
            {sheet.care.map((tip) => (
              <li key={tip.id} className="flex flex-wrap items-baseline gap-x-2">
                <span>{tip.text}</span>
                {tip.source ? (
                  <a
                    href={tip.source}
                    target="_blank"
                    rel="nofollow noopener noreferrer"
                    className="text-xs text-muted-foreground underline underline-offset-4"
                  >
                    {format(t.recommendedBy, { brand: w.brandName })}
                    <span className="sr-only"> {dict.common.newTab}</span>
                  </a>
                ) : (
                  <span className="text-xs text-muted-foreground">{t.generalTip}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {sheet.others.length > 0 && (
        <details className="rounded-xl border p-4 text-sm">
          <summary className="cursor-pointer font-medium">
            {format(t.others, { brand: w.brandName, count: sheet.others.length })}
          </summary>
          <dl className="mt-2 divide-y">
            {sheet.others.map(([label, v]) => (
              <div key={label} className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-4 py-2">
                <dt className="text-muted-foreground">{labels[label] ?? label}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
        </details>
      )}

      <p className="text-sm text-muted-foreground">
        {t.sources}{" "}
        <Link href="/methodologie#technique" className="underline underline-offset-4">
          {t.methodology}
        </Link>
        .
      </p>
    </section>
  );
}
