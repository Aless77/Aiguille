import { getDb, watches, wishlistItems } from "@aiguille/db";
import { and, eq, sql } from "drizzle-orm";

import {
  apiError,
  communityClosed,
  currentUserId,
  jsonBody,
  shareIdFrom,
} from "@/lib/wishlists/api";
import { itemInput, SITE_MAX_ITEMS, WATCHES_PER_LIST } from "@/lib/wishlists/input";
import { invalidateList, ownedList, touchList } from "@/lib/wishlists/queries";

/**
 * Montres d'une liste (auteur seulement).
 * POST { watchId } : ajoute la montre. DELETE ?montre=ID : la retire.
 */

type Context = RouteContext<"/api/listes/[liste]/montres">;

async function ownedFrom(request: Request, params: Context["params"]) {
  const shareId = shareIdFrom((await params).liste);
  const userId = await currentUserId(request);
  if (!userId) return { error: apiError(401, "Connectez-vous.") } as const;
  const owned = shareId ? await ownedList(shareId, userId) : null;
  if (!shareId || !owned) return { error: apiError(404, "Liste introuvable.") } as const;
  return { shareId, owned } as const;
}

export async function POST(request: Request, { params }: Context) {
  const closed = communityClosed();
  if (closed) return closed;
  const target = await ownedFrom(request, params);
  if ("error" in target) return target.error;
  const parsed = itemInput.safeParse(await jsonBody(request));
  if (!parsed.success) return apiError(400, "Montre inconnue.");

  const db = getDb();
  const [watch] = await db
    .select({ id: watches.id })
    .from(watches)
    .where(eq(watches.id, parsed.data.watchId));
  if (!watch) return apiError(404, "Montre inconnue.");
  const [items] = await db
    .select({
      onList: sql<number>`count(*) filter (where ${wishlistItems.wishlistId} = ${target.owned.id})::int`,
      site: sql<number>`count(*)::int`,
    })
    .from(wishlistItems);
  if ((items?.onList ?? 0) >= WATCHES_PER_LIST) {
    return apiError(429, `${WATCHES_PER_LIST} montres au plus par liste.`);
  }
  // Plafond du site (stockage limité : docs/decisions.md).
  if ((items?.site ?? 0) >= SITE_MAX_ITEMS) {
    return apiError(503, "Les listes ont atteint leur capacité : ajout suspendu.");
  }

  await db
    .insert(wishlistItems)
    .values({ wishlistId: target.owned.id, watchId: watch.id })
    .onConflictDoNothing();
  await touchList(target.owned.id);
  invalidateList(target.shareId);
  return Response.json({ ok: true });
}

export async function DELETE(request: Request, { params }: Context) {
  const target = await ownedFrom(request, params);
  if ("error" in target) return target.error;
  const watchId = Number(new URL(request.url).searchParams.get("montre"));
  if (!Number.isInteger(watchId) || watchId <= 0) return apiError(400, "Montre inconnue.");

  await getDb()
    .delete(wishlistItems)
    .where(and(eq(wishlistItems.wishlistId, target.owned.id), eq(wishlistItems.watchId, watchId)));
  await touchList(target.owned.id);
  invalidateList(target.shareId);
  return Response.json({ ok: true });
}
