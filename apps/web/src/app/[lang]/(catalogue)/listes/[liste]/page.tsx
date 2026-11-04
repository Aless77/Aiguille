import { VenetianMask } from "lucide-react";
import { Link } from "@/lib/i18n/client";
import { type Dictionary, format } from "@/lib/i18n/dictionary";
import { type Formatters } from "@/lib/i18n/format";
import { getDictionary } from "@/lib/i18n/server";
import { notFound } from "next/navigation";

import { Breadcrumbs } from "@/components/breadcrumbs";
import {
  DeleteCommentButton,
  ListCommentForm,
  ListOwnerBar,
  ListViewerProvider,
  PrivateListContent,
  RemoveFromListButton,
  ReplyButton,
  ShareListButton,
} from "@/components/list-viewer";
import { Badge } from "@/components/ui/badge";
import { WatchCard } from "@/components/watch-card";
import { displayName } from "@/lib/catalog/format";
import { PLACEHOLDER_SLUG } from "@/lib/catalog/static-params";
import { watchPath } from "@/lib/catalog/types";
import { turnstileSiteKey } from "@/lib/reviews/turnstile";
import { localizedMetadata } from "@/lib/seo/localized-metadata";
import { cn } from "@/lib/utils";
import { COMMENTS_PER_LIST, isPublic, listBudget, SHARE_ID_PATTERN } from "@/lib/wishlists/input";
import { ANONYMOUS_OWNER, OWNER_LABEL } from "@/lib/wishlists/present";
import { getList, type ListComment, type Person } from "@/lib/wishlists/queries";

type Props = PageProps<"/[lang]/listes/[liste]">;

/**
 * Liste de souhaits partagée : lisible sans compte (lien ou communauté). Contenu créé par les
 * membres : non indexé (docs/decisions.md). Rendu bloquant pour un vrai 404 sur un lien inconnu.
 */
export const instant = false;

export async function generateStaticParams() {
  // Aucune liste prérendue au build : chacune est rendue à la première visite, puis en cache.
  return [{ liste: PLACEHOLDER_SLUG }];
}

async function publicList(value: string) {
  if (!SHARE_ID_PATTERN.test(value)) return null;
  return getList(value);
}

export async function generateMetadata({ params }: Props) {
  const [list, { dict }] = await Promise.all([publicList((await params).liste), getDictionary()]);
  if (!list) return {};
  const t = dict.community.lists;
  const visible = isPublic(list.visibility);
  const count = list.items.length;
  return localizedMetadata({
    title: !visible
      ? t.privateTitle
      : list.anonymous
        ? format(t.anonymousTitle, { title: list.title })
        : format(t.ownedTitle, { title: list.title, name: list.owner.name }),
    description: visible
      ? format(count === 1 ? t.metaDescription.one : t.metaDescription.other, {
          count,
          by: list.anonymous ? t.byAnonymous : format(t.byName, { name: list.owner.name }),
          description: list.description ? ` : ${list.description}` : ".",
        })
      : t.privateDescription,
    path: `/listes/${list.shareId}`,
    images: visible ? list.items.flatMap((i) => i.imageUrl ?? []).slice(0, 1) : [],
    index: false,
  });
}

export default async function ListPage({ params }: Props) {
  const { dict, f } = await getDictionary();
  const t = dict.community.lists;
  const list = await publicList((await params).liste);
  if (!list) notFound();

  if (!isPublic(list.visibility)) {
    return (
      <ListViewerProvider shareId={list.shareId}>
        <div className="space-y-6">
          <Breadcrumbs crumbs={[{ name: t.myLists, path: "/listes" }, { name: t.list }]} />
          <PrivateListContent shareId={list.shareId} />
        </div>
      </ListViewerProvider>
    );
  }

  const community = list.visibility === "community";
  const budget = listBudget(list.items);
  const siteKey = turnstileSiteKey();
  const commentsByWatch = new Map<string, number>();
  for (const c of list.comments) {
    if (c.watch) commentsByWatch.set(c.watch.slug, (commentsByWatch.get(c.watch.slug) ?? 0) + 1);
  }

  return (
    <ListViewerProvider shareId={list.shareId}>
      <div className="space-y-10">
        <div className="space-y-4">
          <Breadcrumbs
            crumbs={
              community
                ? [
                    { name: dict.community.communityPage.title, path: "/communaute" },
                    { name: list.title },
                  ]
                : [{ name: list.title }]
            }
          />
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                {t.visibility[list.visibility].label}
                {format(t.updated, { date: f.date(list.updatedAt) })}
              </p>
              <h1 className="text-3xl font-semibold tracking-tight">{list.title}</h1>
              {list.anonymous ? (
                <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                  <VenetianMask className="size-4" aria-hidden />
                  {t.publishedAnonymously}
                </span>
              ) : (
                <Author person={list.owner} prefix={t.listOf} t={t} />
              )}
            </div>
            <ShareListButton title={list.title} />
          </div>
          {list.description && <p className="max-w-2xl leading-relaxed">{list.description}</p>}
          <p className="text-sm text-muted-foreground">
            {f.plural(t.watches, budget.count)}
            {budget.count > 0 &&
              format(t.total, {
                price: f.price(budget.totalCents) ?? "",
                unknown: budget.unknownPrices
                  ? f.plural(t.unknownPrices, budget.unknownPrices)
                  : "",
              })}
          </p>
          <ListOwnerBar
            shareId={list.shareId}
            visibility={list.visibility}
            anonymous={list.anonymous}
          />
        </div>

        {list.items.length > 0 ? (
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {list.items.map((w) => (
              <li key={w.slug} className="space-y-1">
                <WatchCard watch={w} />
                <div className="flex items-center justify-between gap-2 px-1 text-sm">
                  {community && commentsByWatch.get(w.slug) ? (
                    <a href="#avis" className="text-muted-foreground underline underline-offset-4">
                      {format(t.reviewsCount, { count: commentsByWatch.get(w.slug) ?? 0 })}
                    </a>
                  ) : (
                    <span />
                  )}
                  <RemoveFromListButton shareId={list.shareId} watchId={w.id} />
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground">{t.emptyList}</p>
        )}

        {community ? (
          <section id="avis" aria-labelledby="avis-titre" className="scroll-mt-20 space-y-4">
            <h2 id="avis-titre" className="text-2xl font-semibold tracking-tight">
              {format(t.communityReviews, { count: list.commentCount })}
            </h2>
            {list.comments.length > 0 ? (
              <ul className="space-y-4">
                {list.comments.map((c) => (
                  <li key={c.id} className="space-y-3">
                    <Message comment={c} shareId={list.shareId} t={t} f={f} />
                    {c.replies.length > 0 && (
                      <ul
                        aria-label={format(t.repliesTo, { name: c.author.name })}
                        className="ml-4 space-y-3 border-l-2 pl-4 sm:ml-8"
                      >
                        {c.replies.map((r) => (
                          <li key={r.id}>
                            <Message comment={r} shareId={list.shareId} t={t} f={f} />
                          </li>
                        ))}
                      </ul>
                    )}
                    <div className="ml-4 sm:ml-8">
                      <ReplyButton
                        shareId={list.shareId}
                        parentId={c.id}
                        authorName={c.author.name}
                        turnstileSiteKey={siteKey}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground">{t.noReviews}</p>
            )}
            {list.commentCount >= COMMENTS_PER_LIST ? (
              <p className="rounded-xl border p-4 text-sm text-muted-foreground">
                {format(t.closed, { count: COMMENTS_PER_LIST })}
              </p>
            ) : (
              <ListCommentForm
                shareId={list.shareId}
                watches={list.items.map((w) => ({
                  id: w.id,
                  label: displayName(w.brandName, w.name),
                }))}
                turnstileSiteKey={siteKey}
              />
            )}
          </section>
        ) : (
          <p className="text-sm text-muted-foreground">{t.linkOnly}</p>
        )}
      </div>
    </ListViewerProvider>
  );
}

/** Un avis ou une réponse. Les messages de l'auteur de la liste sont signalés. */
type ListTexts = Dictionary["community"]["lists"];

function Message({
  comment: c,
  shareId,
  t,
  f,
}: {
  comment: ListComment;
  shareId: string;
  t: ListTexts;
  f: Formatters;
}) {
  return (
    <article
      className={cn(
        "space-y-2 rounded-xl border p-4",
        c.author.listAuthor && "border-foreground/30 bg-muted/40",
      )}
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
        <Author person={c.author} t={t} />
        <span className="text-muted-foreground">{f.date(c.createdAt)}</span>
        {c.watch && (
          <span className="text-muted-foreground">
            {t.aboutWatch}{" "}
            <Link href={watchPath(c.watch)} className="underline underline-offset-4">
              {displayName(c.watch.brandName, c.watch.name)}
            </Link>
          </span>
        )}
        <span className="ml-auto">
          <DeleteCommentButton shareId={shareId} commentId={c.id} />
        </span>
      </div>
      <p className="leading-relaxed whitespace-pre-line">{c.body}</p>
    </article>
  );
}

function Author({ person, prefix, t }: { person: Person; prefix?: string; t: ListTexts }) {
  // Libellés d'auteur produits côté données en français (lib/wishlists/present.ts).
  const name =
    person.name === OWNER_LABEL
      ? t.ownerLabel
      : person.name === ANONYMOUS_OWNER
        ? t.anonymousOwner
        : person.name;
  return (
    <span className="inline-flex flex-wrap items-center gap-2 text-sm">
      {person.image ? (
        // Avatar fourni par Google ou GitHub : petite image externe, sans optimisation.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={person.image}
          alt=""
          width={24}
          height={24}
          className="size-6 rounded-full"
          referrerPolicy="no-referrer"
        />
      ) : (
        <span
          aria-hidden
          className="flex size-6 items-center justify-center rounded-full bg-muted text-muted-foreground"
        >
          {person.anonymous ? (
            <VenetianMask className="size-3.5" />
          ) : (
            <span className="text-xs font-medium">{person.name.slice(0, 1).toUpperCase()}</span>
          )}
        </span>
      )}
      {/* Auteur anonyme de la liste : le badge tient lieu de nom. */}
      {person.name !== OWNER_LABEL && (
        <span>
          {prefix ? `${prefix} ` : ""}
          <span className="font-medium">{name}</span>
        </span>
      )}
      {/* L'auteur de la liste est signalé partout dans la discussion. */}
      {person.listAuthor && !prefix && <Badge>{t.ownerLabel}</Badge>}
      {person.anonymous && !person.listAuthor && (
        <span className="text-xs text-muted-foreground">{t.anonymousTag}</span>
      )}
    </span>
  );
}
