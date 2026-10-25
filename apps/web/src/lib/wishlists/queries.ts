import {
  brands,
  collections,
  getDb,
  users,
  watches,
  wishlistComments,
  wishlistItems,
  wishlists,
} from "@aiguille/db";
import { and, asc, count, desc, eq, inArray, sql } from "drizzle-orm";
import { cacheLife, cacheTag, revalidateTag } from "next/cache";

import { cardColumns } from "@/lib/catalog/queries";
import { type WatchCard } from "@/lib/catalog/types";

import { type Visibility } from "./input";
import {
  countComments,
  type Person,
  type PresentedComment,
  presentComments,
  presentOwner,
} from "./present";
import { pseudonym } from "./pseudonym";

/**
 * Lectures des listes de souhaits. Les pages publiques (/listes/…, /communaute) sont en cache
 * par liste ; chaque modification les invalide aussitôt (`expire: 0`) pour que l'auteur et les
 * membres voient leur changement au rechargement.
 */

export const COMMUNITY_TAG = "communaute";
/** Toutes les pages de listes : vidées d'un coup à la suppression d'un compte. */
export const LISTS_TAG = "listes";
export const listTag = (shareId: string) => `liste-${shareId}`;

export function invalidateList(shareId: string) {
  revalidateTag(listTag(shareId), { expire: 0 });
  revalidateTag(COMMUNITY_TAG, { expire: 0 });
}

export type { Person } from "./present";

type ListWatch = Pick<WatchCard, "slug" | "name" | "brandName" | "brandSlug" | "collectionSlug">;
/** Avis ou réponse, déjà anonymisé (present.ts). `watch` : montre visée, null pour la liste. */
export type ListComment = PresentedComment<ListWatch>;

export interface ListDetail {
  id: number;
  shareId: string;
  title: string;
  description: string | null;
  visibility: Visibility;
  anonymous: boolean;
  owner: Person;
  createdAt: Date;
  updatedAt: Date;
  items: (WatchCard & { id: number })[];
  comments: ListComment[];
  commentCount: number;
}

/** Lecture sans cache : routes API (auteur de la liste) et lecture en cache ci-dessous. */
export async function loadList(shareId: string): Promise<ListDetail | null> {
  const db = getDb();
  const [list] = await db
    .select({
      id: wishlists.id,
      shareId: wishlists.shareId,
      title: wishlists.title,
      description: wishlists.description,
      visibility: wishlists.visibility,
      anonymous: wishlists.anonymous,
      createdAt: wishlists.createdAt,
      updatedAt: wishlists.updatedAt,
      userId: wishlists.userId,
      userName: users.name,
      userImage: users.image,
    })
    .from(wishlists)
    .innerJoin(users, eq(users.id, wishlists.userId))
    .where(eq(wishlists.shareId, shareId));
  if (!list) return null;

  const [items, rows] = await Promise.all([
    db
      .select({ ...cardColumns, id: watches.id })
      .from(wishlistItems)
      .innerJoin(watches, eq(watches.id, wishlistItems.watchId))
      .innerJoin(brands, eq(brands.id, watches.brandId))
      .leftJoin(collections, eq(collections.id, watches.collectionId))
      .where(eq(wishlistItems.wishlistId, list.id))
      .orderBy(asc(wishlistItems.addedAt)),
    db
      .select({
        id: wishlistComments.id,
        userId: wishlistComments.userId,
        userName: users.name,
        userImage: users.image,
        anonymous: wishlistComments.anonymous,
        parentId: wishlistComments.parentId,
        body: wishlistComments.body,
        createdAt: wishlistComments.createdAt,
        watchId: wishlistComments.watchId,
      })
      .from(wishlistComments)
      .innerJoin(users, eq(users.id, wishlistComments.userId))
      .where(
        and(eq(wishlistComments.wishlistId, list.id), eq(wishlistComments.status, "published")),
      )
      .orderBy(asc(wishlistComments.createdAt)),
  ]);

  const watchOf = (watchId: number | null): ListWatch | null => {
    // Une montre retirée de la liste : l'avis reste, rattaché à la liste entière.
    const w = items.find((i) => i.id === watchId);
    return w
      ? {
          slug: w.slug,
          name: w.name,
          brandName: w.brandName,
          brandSlug: w.brandSlug,
          collectionSlug: w.collectionSlug,
        }
      : null;
  };
  const comments = presentComments(list, rows, watchOf, (userId) => pseudonym(list.id, userId));

  return {
    id: list.id,
    shareId: list.shareId,
    title: list.title,
    description: list.description,
    visibility: list.visibility,
    anonymous: list.anonymous,
    owner: presentOwner(list),
    createdAt: list.createdAt,
    updatedAt: list.updatedAt,
    items,
    comments,
    commentCount: countComments(comments),
  };
}

/** Liste pour sa page publique (en cache). La page n'affiche le contenu que si elle est publique. */
export async function getList(shareId: string): Promise<ListDetail | null> {
  "use cache";
  cacheLife("hours");
  cacheTag(listTag(shareId), LISTS_TAG);
  return loadList(shareId);
}

export interface CommunityList {
  shareId: string;
  title: string;
  description: string | null;
  owner: Person;
  updatedAt: Date;
  watchCount: number;
  commentCount: number;
  totalCents: number;
  imageUrls: string[];
}

/** Forum : listes publiées dans la communauté, la plus récemment active d'abord. */
export async function getCommunityLists(limit = 60): Promise<CommunityList[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(COMMUNITY_TAG);
  const db = getDb();
  const lists = await db
    .select({
      id: wishlists.id,
      shareId: wishlists.shareId,
      title: wishlists.title,
      description: wishlists.description,
      updatedAt: wishlists.updatedAt,
      userId: wishlists.userId,
      userName: users.name,
      userImage: users.image,
      anonymous: wishlists.anonymous,
      commentCount: sql<number>`(select count(*)::int from wishlist_comments c where c.wishlist_id = ${wishlists.id} and c.status = 'published')`,
    })
    .from(wishlists)
    .innerJoin(users, eq(users.id, wishlists.userId))
    .where(eq(wishlists.visibility, "community"))
    .orderBy(desc(wishlists.updatedAt))
    .limit(limit);
  if (lists.length === 0) return [];

  const items = await db
    .select({
      wishlistId: wishlistItems.wishlistId,
      priceCents: watches.catalogPriceCents,
      imageUrl: sql<string | null>`${watches.imageUrls}->>0`,
    })
    .from(wishlistItems)
    .innerJoin(watches, eq(watches.id, wishlistItems.watchId))
    .where(
      inArray(
        wishlistItems.wishlistId,
        lists.map((l) => l.id),
      ),
    )
    .orderBy(asc(wishlistItems.addedAt));

  return lists.map((l) => {
    const own = items.filter((i) => i.wishlistId === l.id);
    return {
      shareId: l.shareId,
      title: l.title,
      description: l.description,
      owner: presentOwner(l),
      updatedAt: l.updatedAt,
      watchCount: own.length,
      commentCount: l.commentCount,
      totalCents: own.reduce((sum, i) => sum + (i.priceCents ?? 0), 0),
      imageUrls: own.flatMap((i) => i.imageUrl ?? []).slice(0, 4),
    };
  });
}

/** Listes d'un compte (page « Mes listes », bouton d'ajout d'une fiche) : jamais en cache. */
export async function listsOf(userId: string, watchId?: number) {
  const db = getDb();
  const rows = await db
    .select({
      shareId: wishlists.shareId,
      title: wishlists.title,
      visibility: wishlists.visibility,
      anonymous: wishlists.anonymous,
      updatedAt: wishlists.updatedAt,
      watchCount: count(wishlistItems.watchId),
      contains: watchId
        ? sql<boolean>`bool_or(${wishlistItems.watchId} = ${watchId})`
        : sql<boolean>`false`,
    })
    .from(wishlists)
    .leftJoin(wishlistItems, eq(wishlistItems.wishlistId, wishlists.id))
    .where(eq(wishlists.userId, userId))
    .groupBy(wishlists.id)
    .orderBy(desc(wishlists.updatedAt));
  return rows.map((r) => ({ ...r, contains: r.contains === true }));
}

/** Liste appartenant au compte connecté, ou null (inconnue ou d'un autre compte). */
export async function ownedList(shareId: string, userId: string) {
  const [row] = await getDb()
    .select({ id: wishlists.id, visibility: wishlists.visibility, anonymous: wishlists.anonymous })
    .from(wishlists)
    .where(and(eq(wishlists.shareId, shareId), eq(wishlists.userId, userId)));
  return row ?? null;
}

/** Marque la liste comme active (tri du forum). */
export async function touchList(id: number) {
  await getDb().update(wishlists).set({ updatedAt: new Date() }).where(eq(wishlists.id, id));
}
