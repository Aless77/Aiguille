import { VenetianMask } from "lucide-react";
import Link from "next/link";
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
import { displayName, formatDate, formatPrice } from "@/lib/catalog/format";
import { PLACEHOLDER_SLUG } from "@/lib/catalog/static-params";
import { watchPath } from "@/lib/catalog/types";
import { turnstileSiteKey } from "@/lib/reviews/turnstile";
import { pageMetadata } from "@/lib/seo/metadata";
import { cn } from "@/lib/utils";
import {
  COMMENTS_PER_LIST,
  isPublic,
  listBudget,
  SHARE_ID_PATTERN,
  VISIBILITY_LABELS,
} from "@/lib/wishlists/input";
import { OWNER_LABEL } from "@/lib/wishlists/present";
import { getList, type ListComment, type Person } from "@/lib/wishlists/queries";

type Props = PageProps<"/listes/[liste]">;

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
  const list = await publicList((await params).liste);
  if (!list) return {};
  const visible = isPublic(list.visibility);
  return pageMetadata({
    title: !visible
      ? "Liste privée"
      : list.anonymous
        ? `${list.title}, une liste anonyme`
        : `${list.title}, la liste de ${list.owner.name}`,
    description: visible
      ? `${list.items.length} montre${list.items.length > 1 ? "s" : ""} sélectionnée${list.items.length > 1 ? "s" : ""} ${list.anonymous ? "anonymement" : `par ${list.owner.name}`} sur Aiguille${list.description ? ` : ${list.description}` : "."}`
      : "Liste de souhaits privée.",
    path: `/listes/${list.shareId}`,
    images: visible ? list.items.flatMap((i) => i.imageUrl ?? []).slice(0, 1) : [],
    index: false,
  });
}

export default async function ListPage({ params }: Props) {
  const list = await publicList((await params).liste);
  if (!list) notFound();

  if (!isPublic(list.visibility)) {
    return (
      <ListViewerProvider shareId={list.shareId}>
        <div className="space-y-6">
          <Breadcrumbs crumbs={[{ name: "Mes listes", path: "/listes" }, { name: "Liste" }]} />
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
                ? [{ name: "Communauté", path: "/communaute" }, { name: list.title }]
                : [{ name: list.title }]
            }
          />
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                {VISIBILITY_LABELS[list.visibility].label} · mise à jour le{" "}
                {formatDate(list.updatedAt)}
              </p>
              <h1 className="text-3xl font-semibold tracking-tight">{list.title}</h1>
              {list.anonymous ? (
                <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                  <VenetianMask className="size-4" aria-hidden />
                  Liste publiée anonymement
                </span>
              ) : (
                <Author person={list.owner} prefix="Liste de" />
              )}
            </div>
            <ShareListButton title={list.title} />
          </div>
          {list.description && <p className="max-w-2xl leading-relaxed">{list.description}</p>}
          <p className="text-sm text-muted-foreground">
            {budget.count} montre{budget.count > 1 ? "s" : ""}
            {budget.count > 0 &&
              ` · ${formatPrice(budget.totalCents)} au total (prix catalogue officiels${budget.unknownPrices ? `, ${budget.unknownPrices} prix non communiqué${budget.unknownPrices > 1 ? "s" : ""}` : ""})`}
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
                      {commentsByWatch.get(w.slug)} avis
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
          <p className="text-muted-foreground">Cette liste ne contient encore aucune montre.</p>
        )}

        {community ? (
          <section id="avis" aria-labelledby="avis-titre" className="scroll-mt-20 space-y-4">
            <h2 id="avis-titre" className="text-2xl font-semibold tracking-tight">
              Avis de la communauté ({list.commentCount})
            </h2>
            {list.comments.length > 0 ? (
              <ul className="space-y-4">
                {list.comments.map((c) => (
                  <li key={c.id} className="space-y-3">
                    <Message comment={c} shareId={list.shareId} />
                    {c.replies.length > 0 && (
                      <ul
                        aria-label={`Réponses à ${c.author.name}`}
                        className="ml-4 space-y-3 border-l-2 pl-4 sm:ml-8"
                      >
                        {c.replies.map((r) => (
                          <li key={r.id}>
                            <Message comment={r} shareId={list.shareId} />
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
              <p className="text-muted-foreground">
                Pas encore d&apos;avis : soyez le premier à commenter cette sélection.
              </p>
            )}
            {list.commentCount >= COMMENTS_PER_LIST ? (
              <p className="rounded-xl border p-4 text-sm text-muted-foreground">
                Cette discussion a atteint {COMMENTS_PER_LIST} messages : elle est close.
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
          <p className="text-sm text-muted-foreground">
            Liste partagée par lien : elle n&apos;apparaît pas dans la communauté. Son auteur peut
            l&apos;y publier pour recevoir des avis.
          </p>
        )}
      </div>
    </ListViewerProvider>
  );
}

/** Un avis ou une réponse. Les messages de l'auteur de la liste sont signalés. */
function Message({ comment: c, shareId }: { comment: ListComment; shareId: string }) {
  return (
    <article
      className={cn(
        "space-y-2 rounded-xl border p-4",
        c.author.listAuthor && "border-foreground/30 bg-muted/40",
      )}
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
        <Author person={c.author} />
        <span className="text-muted-foreground">{formatDate(c.createdAt)}</span>
        {c.watch && (
          <span className="text-muted-foreground">
            à propos de{" "}
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

function Author({ person, prefix }: { person: Person; prefix?: string }) {
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
          <span className="font-medium">{person.name}</span>
        </span>
      )}
      {/* L'auteur de la liste est signalé partout dans la discussion. */}
      {person.listAuthor && !prefix && <Badge>{OWNER_LABEL}</Badge>}
      {person.anonymous && !person.listAuthor && (
        <span className="text-xs text-muted-foreground">(anonyme)</span>
      )}
    </span>
  );
}
