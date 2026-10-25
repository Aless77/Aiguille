import { MessageSquare } from "lucide-react";
import { Link } from "@/lib/i18n/client";
import { notFound } from "next/navigation";

import { Breadcrumbs } from "@/components/breadcrumbs";
import { WatchImage } from "@/components/watch-image";
import { formatDate, formatPrice } from "@/lib/catalog/format";
import { features } from "@/lib/features";
import { pageMetadata } from "@/lib/seo/metadata";
import { getCommunityLists } from "@/lib/wishlists/queries";

export const metadata = pageMetadata({
  title: "Communauté : listes de souhaits et avis",
  description:
    "Les listes de montres partagées par les membres d'Aiguille : sélections, budgets et avis de la communauté.",
  path: "/communaute",
  // Contenu des membres : non indexé tant que la modération reste manuelle (docs/decisions.md).
  index: false,
});

/** Forum : listes publiées par les membres, la plus récemment active en premier. */
export default async function CommunityPage() {
  if (!features.community()) notFound();
  const lists = await getCommunityLists();

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <Breadcrumbs crumbs={[{ name: "Communauté" }]} />
        <h1 className="text-3xl font-semibold tracking-tight">Communauté</h1>
        <p className="max-w-2xl text-muted-foreground">
          Les sélections partagées par les membres. Ouvrez une liste pour donner votre avis sur les
          montres choisies, conseiller une alternative ou simplement vous inspirer.
        </p>
        <p className="text-sm">
          <Link href="/listes" className="font-medium underline underline-offset-4">
            Créer ma liste
          </Link>{" "}
          puis choisissez « Publiée dans la communauté ».
        </p>
      </div>

      {lists.length === 0 ? (
        <p className="rounded-xl border p-6 text-muted-foreground">
          Aucune liste publiée pour l&apos;instant : la vôtre peut être la première.
        </p>
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
                    {l.owner.anonymous ? "Liste anonyme" : `par ${l.owner.name}`} ·{" "}
                    {formatDate(l.updatedAt)}
                  </span>
                  {l.description && (
                    <span className="line-clamp-2 block text-sm">{l.description}</span>
                  )}
                  <span className="flex flex-wrap items-center gap-x-3 text-sm text-muted-foreground">
                    <span>
                      {l.watchCount} montre{l.watchCount > 1 ? "s" : ""}
                      {l.totalCents > 0 && ` · ${formatPrice(l.totalCents)}`}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <MessageSquare className="size-3.5" aria-hidden />
                      {l.commentCount} avis
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
