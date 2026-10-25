import { type FamilyGroup } from "@aiguille/db/collection-families";
import { ChevronDown, ExternalLink } from "lucide-react";
import { Link } from "@/lib/i18n/client";

import { OpenDetailsOnHash } from "@/components/open-details-on-hash";
import { WatchImage } from "@/components/watch-image";
import { format, type Dictionary } from "@/lib/i18n/dictionary";
import { type Formatters } from "@/lib/i18n/format";
import { getDictionary } from "@/lib/i18n/server";
import { type CollectionPreview, type CollectionSummary } from "@/lib/catalog/queries";

/**
 * Collections d'une marque, regroupées par gamme officielle quand la marque en a
 * (packages/db/src/collection-families.ts). Chaque gamme se déplie au clic ; une carte par
 * collection avec une montre d'exemple. Tout est dans le HTML serveur, même replié (SEO).
 */
export async function CollectionExplorer({
  brandSlug,
  brandName,
  groups,
  previews,
}: {
  brandSlug: string;
  brandName: string;
  groups: FamilyGroup<CollectionSummary>[];
  previews: CollectionPreview[];
}) {
  const { dict, f } = await getDictionary();
  const t = dict.catalog.explorer;
  const imageOf = (slug: string) => previews.find((p) => p.slug === slug) ?? null;
  const hasFamilies = groups.some((g) => g.family);
  const total = groups.reduce((n, g) => n + g.collections.length, 0);

  // Menu replié par défaut : la page marque s'ouvre sur le catalogue, les collections à la demande.
  const summary = (
    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-4 font-medium [&::-webkit-details-marker]:hidden">
      <span>
        {format(t.summary, { count: total, brand: brandName })}
        {hasFamilies && format(t.families, { count: groups.filter((g) => g.family).length })}
      </span>
      <ChevronDown
        className="size-5 shrink-0 text-muted-foreground transition-transform group-open/menu:rotate-180"
        aria-hidden
      />
    </summary>
  );

  if (!hasFamilies) {
    return (
      <details id="collections" className="group/menu scroll-mt-20 rounded-xl border">
        {summary}
        <div className="px-4 pb-4">
          <CollectionGrid
            brandSlug={brandSlug}
            items={groups.flatMap((g) => g.collections)}
            imageOf={imageOf}
            t={t}
            f={f}
          />
        </div>
        <OpenDetailsOnHash />
      </details>
    );
  }

  return (
    <details id="collections" className="group/menu scroll-mt-20 rounded-xl border">
      {summary}
      <p className="px-4 pb-3 text-sm text-muted-foreground">
        {format(t.familiesIntro, { brand: brandName })}
      </p>
      <div className="divide-y border-t">
        {groups.map(({ family, collections }) => {
          const watchCount = collections.reduce((n, c) => n + c.watchCount, 0);
          const prices = collections.flatMap((c) => c.minPriceCents ?? []);
          const id = family ? `gamme-${family.slug}` : "gamme-autres";
          return (
            <details key={id} id={id} className="group scroll-mt-20">
              <summary className="flex cursor-pointer list-none items-center gap-4 p-4 transition-colors hover:bg-muted/60 [&::-webkit-details-marker]:hidden">
                <span className="flex -space-x-3" aria-hidden>
                  {collections.slice(0, 3).map((c) => (
                    <WatchImage
                      key={c.slug}
                      src={imageOf(c.slug)?.imageUrl ?? null}
                      alt=""
                      sizes="48px"
                      className="size-12 rounded-full border-2 border-background [&_img]:p-1"
                    />
                  ))}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold">{family ? family.name : t.others}</span>
                  <span className="block text-sm text-muted-foreground">
                    {f.plural(t.collections, collections.length)} · {f.plural(t.models, watchCount)}
                    {prices.length > 0 && format(t.from, { price: f.price(Math.min(...prices))! })}
                  </span>
                </span>
                <ChevronDown
                  className="size-5 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
                  aria-hidden
                />
              </summary>
              <div className="space-y-3 px-4 pb-4">
                {family && (
                  <a
                    href={family.url}
                    target="_blank"
                    rel="nofollow noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-muted-foreground underline underline-offset-4"
                  >
                    {format(t.familyLink, { name: family.name, brand: brandName })}
                    <ExternalLink className="size-3" aria-hidden />
                    <span className="sr-only">{dict.common.newTab}</span>
                  </a>
                )}
                <CollectionGrid
                  brandSlug={brandSlug}
                  items={collections}
                  imageOf={imageOf}
                  t={t}
                  f={f}
                />
              </div>
            </details>
          );
        })}
      </div>
      <OpenDetailsOnHash />
    </details>
  );
}

function CollectionGrid({
  brandSlug,
  items,
  imageOf,
  t,
  f,
}: {
  brandSlug: string;
  items: CollectionSummary[];
  imageOf: (slug: string) => CollectionPreview | null;
  t: Dictionary["catalog"]["explorer"];
  f: Formatters;
}) {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {items.map((c) => {
        const preview = imageOf(c.slug);
        return (
          <li key={c.slug}>
            <Link
              href={`/montres/${brandSlug}/${c.slug}`}
              className="block h-full space-y-2 rounded-xl border p-3 transition-colors hover:bg-muted/60"
            >
              <WatchImage
                src={preview?.imageUrl ?? null}
                alt={preview ? format(t.example, { name: preview.name }) : c.name}
                sizes="(min-width: 1024px) 15vw, (min-width: 640px) 25vw, 45vw"
              />
              <span className="block font-medium">{c.name}</span>
              <span className="block text-sm text-muted-foreground">
                {f.plural(t.models, c.watchCount)}
                {c.minPriceCents !== null && format(t.from, { price: f.price(c.minPriceCents)! })}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
