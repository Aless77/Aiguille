import { getDb, watches, wishlistItems, wishlists } from "@aiguille/db";
import { eq, sql } from "drizzle-orm";

import { apiError, communityClosed, currentUserId, jsonBody } from "@/lib/wishlists/api";
import { createListInput, LISTS_PER_USER, newShareId, SITE_MAX_LISTS } from "@/lib/wishlists/input";
import { invalidateList, listsOf } from "@/lib/wishlists/queries";

/**
 * Listes de souhaits du compte connecté.
 * GET /api/listes?montre=ID : ses listes, et si chacune contient déjà cette montre.
 * POST /api/listes : crée une liste (avec, en option, une première montre).
 */

export async function GET(request: Request) {
  const userId = await currentUserId(request);
  if (!userId) return Response.json({ lists: null });
  const watchId = Number(new URL(request.url).searchParams.get("montre"));
  const lists = await listsOf(
    userId,
    Number.isInteger(watchId) && watchId > 0 ? watchId : undefined,
  );
  return Response.json({ lists });
}

export async function POST(request: Request) {
  const closed = communityClosed();
  if (closed) return closed;
  const userId = await currentUserId(request);
  if (!userId) return apiError(401, "Connectez-vous pour créer une liste.");

  const parsed = createListInput.safeParse(await jsonBody(request));
  if (!parsed.success) return apiError(400, parsed.error.issues[0]?.message ?? "Liste incomplète.");
  const input = parsed.data;

  const db = getDb();
  const [owned] = await db
    .select({
      mine: sql<number>`count(*) filter (where ${wishlists.userId} = ${userId})::int`,
      site: sql<number>`count(*)::int`,
    })
    .from(wishlists);
  // Plafond du site (stockage limité : docs/decisions.md).
  if ((owned?.site ?? 0) >= SITE_MAX_LISTS) {
    return apiError(503, "La communauté a atteint sa capacité : création de listes suspendue.");
  }
  if ((owned?.mine ?? 0) >= LISTS_PER_USER) {
    return apiError(
      429,
      `${LISTS_PER_USER} listes au plus : supprimez-en une pour en créer une autre.`,
    );
  }
  if (input.watchId) {
    const [watch] = await db
      .select({ id: watches.id })
      .from(watches)
      .where(eq(watches.id, input.watchId));
    if (!watch) return apiError(404, "Montre inconnue.");
  }

  const shareId = newShareId();
  const [list] = await db
    .insert(wishlists)
    .values({
      shareId,
      userId,
      title: input.title,
      description: input.description ?? null,
      visibility: input.visibility,
      anonymous: input.anonymous,
    })
    .returning({ id: wishlists.id });
  if (list && input.watchId) {
    await db.insert(wishlistItems).values({ wishlistId: list.id, watchId: input.watchId });
  }
  invalidateList(shareId);
  return Response.json({ shareId }, { status: 201 });
}
