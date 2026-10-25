import { getDb, wishlistComments, wishlists } from "@aiguille/db";
import { and, desc, eq } from "drizzle-orm";

import { apiError, currentUserId, jsonBody, shareIdFrom } from "@/lib/wishlists/api";
import { updateListInput } from "@/lib/wishlists/input";
import { invalidateList, loadList, ownedList } from "@/lib/wishlists/queries";

/**
 * Une liste, vue par le compte connecté.
 * GET : droits du visiteur (auteur, avis qu'il peut retirer, anonymat fixé) et, pour l'auteur, la liste même
 * privée. PATCH : nom, description, visibilité (auteur). DELETE : suppression (auteur).
 */

type Context = RouteContext<"/api/listes/[liste]">;

export async function GET(request: Request, { params }: Context) {
  const shareId = shareIdFrom((await params).liste);
  if (!shareId) return apiError(404, "Liste introuvable.");
  const userId = await currentUserId(request);
  if (!userId) {
    return Response.json({ owner: false, ownCommentIds: [], anonymity: null, list: null });
  }

  const owned = await ownedList(shareId, userId);
  const own = await getDb()
    .select({ id: wishlistComments.id, anonymous: wishlistComments.anonymous })
    .from(wishlistComments)
    .innerJoin(wishlists, eq(wishlists.id, wishlistComments.wishlistId))
    .where(and(eq(wishlists.shareId, shareId), eq(wishlistComments.userId, userId)))
    .orderBy(desc(wishlistComments.createdAt));
  return Response.json({
    owner: owned !== null,
    ownCommentIds: own.map((c) => c.id),
    // Choix proposé par défaut : celui de son dernier message sur cette liste (ou la liste anonyme
    // pour son auteur). Le visiteur peut le changer à chaque message.
    anonymity: owned?.anonymous ? true : (own[0]?.anonymous ?? null),
    list: owned ? await loadList(shareId) : null,
  });
}

export async function PATCH(request: Request, { params }: Context) {
  const shareId = shareIdFrom((await params).liste);
  if (!shareId) return apiError(404, "Liste introuvable.");
  const userId = await currentUserId(request);
  if (!userId) return apiError(401, "Connectez-vous.");
  const owned = await ownedList(shareId, userId);
  if (!owned) return apiError(404, "Liste introuvable.");

  const parsed = updateListInput.safeParse(await jsonBody(request));
  if (!parsed.success)
    return apiError(400, parsed.error.issues[0]?.message ?? "Modification invalide.");
  await getDb()
    .update(wishlists)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(wishlists.id, owned.id));
  invalidateList(shareId);
  return Response.json({ ok: true });
}

export async function DELETE(request: Request, { params }: Context) {
  const shareId = shareIdFrom((await params).liste);
  if (!shareId) return apiError(404, "Liste introuvable.");
  const userId = await currentUserId(request);
  if (!userId) return apiError(401, "Connectez-vous.");
  const owned = await ownedList(shareId, userId);
  if (!owned) return apiError(404, "Liste introuvable.");

  // Montres et avis de la liste partent avec elle (suppression en cascade).
  await getDb().delete(wishlists).where(eq(wishlists.id, owned.id));
  invalidateList(shareId);
  return Response.json({ ok: true });
}
