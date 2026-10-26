import { MessageSquare } from "lucide-react";
import { notFound } from "next/navigation";

import { Breadcrumbs } from "@/components/breadcrumbs";
import { WatchImage } from "@/components/watch-image";
import { features } from "@/lib/features";
import { Link } from "@/lib/i18n/client";
import { format } from "@/lib/i18n/dictionary";
import { getDictionary } from "@/lib/i18n/server";
import { localizedMetadata } from "@/lib/seo/localized-metadata";
import { getCommunityLists } from "@/lib/wishlists/queries";

export async function generateMetadata() {
  const t = (await getDictionary()).dict.community.communityPage;
  return localizedMetadata({
    title: t.metaTitle,
    description: t.metaDescription,
    path: "/communaute",
    // Contenu des membres : non indexé tant que la modération reste manuelle (docs/decisions.md).
    index: false,
  });
}

/** Forum : listes publiées par les membres, la plus récemment active en premier. */
export default async function CommunityPage() {
  if (!features.community()) notFound();
  const [lists, { dict, f }] = await Promise.all([getCommunityLists(), getDictionary()]);
  const t = dict.community.communityPage;
  const lt = dict.community.lists;

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <Breadcrumbs crumbs={[{ name: t.title }]} />
        <h1 className="text-3xl font-semibold tracking-tight">{t.title}</h1>
        <p className="max-w-2xl text-muted-foreground">{t.intro}</p>
        <p className="text-sm">
          <Link href="/listes" className="font-medium underline underline-offset-4">
            {t.create}
          </Link>{" "}
          {t.createEnd}
        </p>
      </div>

      {lists.length === 0 ? (
        <p className="rounded-xl border p-6 text-muted-foreground">{t.empty}</p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {lists.map((l) => (
            <li key={l.shareId}>
              <Link
                href={`/listes/${l.shareId}`}
                className="flex h-full gap-4 rounded-xl border p-4 transition-colors hover:bg-muted/60"
              >
                <span className="grid size-24 shrink-0 grid-cols-2 gap-1" aria-hidden>
                  {Array.from({ length: 4 }, (_, i) => (
                    <WatchImage
                      key={i}
                      src={l.imageUrls[i] ?? null}
                      alt=""
                      sizes="48px"
                      className="rounded-md [&_img]:p-0.5 [&_svg]:size-4"
                    />
                  ))}
                </span>
                <span className="min-w-0 flex-1 space-y-1">
                  <span className="block font-semibold">{l.title}</span>
                  <span className="block text-sm text-muted-foreground">
                    {l.owner.anonymous ? t.anonymous : format(t.by, { name: l.owner.name })} ·{" "}
                    {f.date(l.updatedAt)}
                  </span>
                  {l.description && (
                    <span className="line-clamp-2 block text-sm">{l.description}</span>
                  )}
                  <span className="flex flex-wrap items-center gap-x-3 text-sm text-muted-foreground">
                    <span>
                      {f.plural(lt.watches, l.watchCount)}
                      {l.totalCents > 0 && ` · ${f.price(l.totalCents)}`}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <MessageSquare className="size-3.5" aria-hidden />
                      {format(lt.reviewsCount, { count: l.commentCount })}
                    </span>
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
