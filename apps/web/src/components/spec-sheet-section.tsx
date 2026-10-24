import { buildSpecSheet } from "@aiguille/db/spec-sheet";
import { ExternalLink } from "lucide-react";
import Link from "next/link";

import { type WatchDetail } from "@/lib/catalog/queries";

const UNKNOWN = "Non communiqué";

/**
 * Fiche technique commune à toutes les marques (packages/db/src/spec-sheet.ts) : mêmes rubriques
 * et mêmes lignes partout, pour trouver une information au même endroit d'une fiche à l'autre.
 * Rendu serveur : tout le contenu est dans le HTML (SEO, accessibilité).
 */
export function SpecSheetSection({
  watch: w,
  storeCount,
}: {
  watch: WatchDetail;
  storeCount: number;
}) {
  const sheet = buildSpecSheet({ ...w, storeCount });
  const vintage = sheet.groups.some((g) => g.id === "historique");

  return (
    <section id="technique" aria-labelledby="technique-titre" className="scroll-mt-20 space-y-5">
      <div className="space-y-2">
        <h2 id="technique-titre" className="text-2xl font-semibold tracking-tight">
          Fiche technique
        </h2>
        <p className="text-sm text-muted-foreground">
          Les informations publiées par {w.brandName}, présentées de la même façon pour toutes les
          marques. « {UNKNOWN} » : la marque ne publie pas l&apos;information.
        </p>
        <nav aria-label="Rubriques de la fiche technique" className="flex flex-wrap gap-2 pt-1">
          {sheet.groups.map((g) => (
            <a
              key={g.id}
              href={`#fiche-${g.id}`}
              className="rounded-full border px-3 py-1 text-sm transition-colors hover:bg-muted"
            >
              {g.title}
            </a>
          ))}
          {sheet.care.length > 0 && (
            <a
              href="#fiche-conseils"
              className="rounded-full border px-3 py-1 text-sm transition-colors hover:bg-muted"
            >
              Conseils d&apos;entretien
            </a>
          )}
        </nav>
      </div>

      {vintage && (
        <p className="rounded-lg border p-3 text-sm">
          Pièce vintage vendue d&apos;occasion par {w.brandName} : son historique figure dans la
          rubrique « Historique ». Elle n&apos;est pas comparée aux montres neuves.
        </p>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {sheet.groups.map((g) => (
          <div
            key={g.id}
            id={`fiche-${g.id}`}
            className="scroll-mt-20 rounded-xl border p-4 sm:p-5"
          >
            <h3 className="mb-2 text-lg font-semibold">{g.title}</h3>
            <dl className="divide-y text-sm">
              {g.rows.map((r) => (
                <div
                  key={r.label}
                  className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-4 py-2"
                >
                  <dt className="text-muted-foreground">{r.label}</dt>
                  <dd className={r.value === null ? "text-muted-foreground" : "font-medium"}>
                    {r.value ?? UNKNOWN}
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
                        className="mt-1 flex w-fit items-center gap-1 text-xs font-normal underline underline-offset-4"
                      >
                        {r.link.label} {w.brandName}
                        <ExternalLink className="size-3" aria-hidden />
                        <span className="sr-only">(nouvel onglet)</span>
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
          <h3 className="mb-1 text-lg font-semibold">Bien entretenir cette montre</h3>
          <p className="mb-3 text-sm text-muted-foreground">
            Conseils adaptés à ses caractéristiques (couronne, chronographe, pile…), reformulés par
            Aiguille.
          </p>
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
                    Recommandé par {w.brandName}
                    <span className="sr-only"> (nouvel onglet)</span>
                  </a>
                ) : (
                  <span className="text-xs text-muted-foreground">Conseil général</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {sheet.others.length > 0 && (
        <details className="rounded-xl border p-4 text-sm">
          <summary className="cursor-pointer font-medium">
            Autres informations publiées par {w.brandName} ({sheet.others.length})
          </summary>
          <dl className="mt-2 divide-y">
            {sheet.others.map(([label, value]) => (
              <div key={label} className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-4 py-2">
                <dt className="text-muted-foreground">{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        </details>
      )}

      <p className="text-sm text-muted-foreground">
        D&apos;où viennent ces informations :{" "}
        <Link href="/methodologie#technique" className="underline underline-offset-4">
          notre méthodologie
        </Link>
        .
      </p>
    </section>
  );
}
