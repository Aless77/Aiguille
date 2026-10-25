import { getDb, wishlistComments, wishlistItems, wishlists } from "@aiguille/db";
import { and, eq, sql } from "drizzle-orm";

import { verifyTurnstile } from "@/lib/reviews/turnstile";
import {
  apiError,
  clientIp,
  communityClosed,
  currentUserId,
  jsonBody,
  shareIdFrom,
} from "@/lib/wishlists/api";
import { commentInput, commentLimit } from "@/lib/wishlists/input";
import { invalidateList, touchList } from "@/lib/wishlists/queries";

/**
 * Avis de la communauté sur une liste publiée (forum).
 * POST : dépose un avis ou une réponse (connexion requise, liste publiée dans la communauté),
 * signé ou sous pseudonyme.
 * DELETE ?id=ID : son auteur le supprime ; l'auteur de la liste le masque.
 */

type Context = RouteContext<"/api/listes/[liste]/commentaires">;

async function listFrom(params: Context["params"]) {
  const shareId = shareIdFrom((await params).liste);
  if (!shareId) return null;
  const [list] = await getDb()
    .select({
      id: wishlists.id,
      userId: wishlists.userId,
      visibility: wishlists.visibility,
      anonymous: wishlists.anonymous,
    })
    .from(wishlists)
    .where(eq(wishlists.shareId, shareId));
  return list ? { ...list, shareId } : null;
}

export async function POST(request: Request, { params }: Context) {
  const closed = communityClosed();
  if (closed) return closed;
  const userId = await currentUserId(request);
  if (!userId) return apiError(401, "Connectez-vous pour donner votre avis.");
  const list = await listFrom(params);
  // Avis ouverts seulement sur les listes publiées dans la communauté.
  if (!list || list.visibility !== "community") return apiError(404, "Liste introuvable.");

  const parsed = commentInput.safeParse(await jsonBody(request));
  if (!parsed.success) return apiError(400, parsed.error.issues[0]?.message ?? "Avis incomplet.");
  const input = parsed.data;
  if (!(await verifyTurnstile(input.turnstileToken, clientIp(request)))) {
    return apiError(400, "Vérification anti-robot échouée : rechargez la page et réessayez.");
  }

  const db = getDb();
  // Plafonds par compte, par liste et pour le site (stockage limité : docs/decisions.md).
  // En texte ISO : le pilote ne convertit pas un Date passé dans du SQL brut.
  const since = new Date(Date.now() - 86_400_000).toISOString();
  const [counts] = await db
    .select({
      userToday: sql<number>`count(*) filter (where ${wishlistComments.userId} = ${userId} and ${wishlistComments.createdAt} > ${since}::timestamptz)::int`,
      userTotal: sql<number>`count(*) filter (where ${wishlistComments.userId} = ${userId})::int`,
      userOnList: sql<number>`count(*) filter (where ${wishlistComments.userId} = ${userId} and ${wishlistComments.wishlistId} = ${list.id})::int`,
      onList: sql<number>`count(*) filter (where ${wishlistComments.wishlistId} = ${list.id} and ${wishlistComments.status} = 'published')::int`,
      site: sql<number>`count(*)::int`,
    })
    .from(wishlistComments);
  const refused = counts ? commentLimit(counts) : null;
  if (refused) return apiError(429, refused);
  if (input.watchId) {
    const [item] = await db
      .select({ watchId: wishlistItems.watchId })
      .from(wishlistItems)
      .where(and(eq(wishlistItems.wishlistId, list.id), eq(wishlistItems.watchId, input.watchId)));
    if (!item) return apiError(400, "Cette montre ne fait pas partie de la liste.");
  }

  // Réponse : rattachée à l'avis de premier niveau (un seul niveau de discussion).
  let parentId: number | null = null;
  if (input.parentId) {
    const [parent] = await db
      .select({ id: wishlistComments.id, parentId: wishlistComments.parentId })
      .from(wishlistComments)
      .where(
        and(
          eq(wishlistComments.id, input.parentId),
          eq(wishlistComments.wishlistId, list.id),
          eq(wishlistComments.status, "published"),
        ),
      );
    if (!parent) return apiError(404, "Cet avis n'existe plus.");
    parentId = parent.parentId ?? parent.id;
  }

  // Anonymat choisi à chaque message. Sur une liste anonyme, son auteur reste toujours anonyme.
  const anonymous = input.anonymous || (list.userId === userId && list.anonymous);

  await db.insert(wishlistComments).values({
    wishlistId: list.id,
    userId,
    parentId,
    // Une réponse porte sur l'avis, pas sur une montre.
    watchId: parentId ? null : (input.watchId ?? null),
    body: input.body,
    anonymous,
  });
  await touchList(list.id);
  invalidateList(list.shareId);
  return Response.json({ ok: true }, { status: 201 });
}

export async function DELETE(request: Request, { params }: Context) {
  const userId = await currentUserId(request);
  if (!userId) return apiError(401, "Connectez-vous.");
  const list = await listFrom(params);
  if (!list) return apiError(404, "Liste introuvable.");
  const id = Number(new URL(request.url).searchParams.get("id"));
  if (!Number.isInteger(id) || id <= 0) return apiError(400, "Avis inconnu.");

  const db = getDb();
  const [comment] = await db
    .select({ userId: wishlistComments.userId })
    .from(wishlistComments)
    .where(and(eq(wishlistComments.id, id), eq(wishlistComments.wishlistId, list.id)));
  if (!comment) return apiError(404, "Avis introuvable.");

  if (comment.userId === userId) {
    // Les réponses des autres membres restent : elles remontent au premier niveau.
    await db
      .update(wishlistComments)
      .set({ parentId: null })
      .where(eq(wishlistComments.parentId, id));
    await db.delete(wishlistComments).where(eq(wishlistComments.id, id));
  } else if (list.userId === userId) {
    // L'auteur de la liste modère les avis reçus : masqués, pas effacés.
    await db.update(wishlistComments).set({ status: "hidden" }).where(eq(wishlistComments.id, id));
  } else {
    return apiError(403, "Vous ne pouvez retirer que vos propres avis.");
  }
  invalidateList(list.shareId);
  return Response.json({ ok: true });
}
