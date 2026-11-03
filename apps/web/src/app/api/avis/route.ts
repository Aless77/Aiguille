import { getDb, refreshScores, reviews, watches } from "@aiguille/db";
import { and, count, eq, gt, ne } from "drizzle-orm";
import { revalidateTag } from "next/cache";

import { approvedSession } from "@/lib/auth/access";
import { features } from "@/lib/features";
import { DAILY_REVIEW_LIMIT, type OwnReview, reviewInput } from "@/lib/reviews/input";
import { verifyTurnstile } from "@/lib/reviews/turnstile";

/**
 * Avis (lot 5) : lecture, dépôt ou modification, suppression de son propre avis. Connexion
 * obligatoire ; un avis par compte et par montre (index unique en base).
 */

const error = (status: number, message: string) => Response.json({ error: message }, { status });

async function currentUserId(request: Request): Promise<string | null> {
  const session = await approvedSession(request.headers);
  return session?.user.id ?? null;
}

function watchIdFrom(request: Request): number | null {
  const id = Number(new URL(request.url).searchParams.get("montre"));
  return Number.isInteger(id) && id > 0 ? id : null;
}

/** Note et cache à jour après un changement d'avis (les fiches se régénèrent à la visite suivante). */
async function afterChange() {
  await refreshScores(getDb());
  revalidateTag("catalog", "max");
}

/** GET /api/avis?montre=ID : avis de l'utilisateur connecté sur cette montre, ou null. */
export async function GET(request: Request) {
  const watchId = watchIdFrom(request);
  if (!watchId) return error(400, "Montre inconnue");
  const userId = await currentUserId(request);
  if (!userId) return Response.json({ review: null });

  const [row] = await getDb()
    .select()
    .from(reviews)
    .where(and(eq(reviews.watchId, watchId), eq(reviews.userId, userId)));
  const review: OwnReview | null = row
    ? {
        ratings: {
          finishing: row.finishing,
          design: row.design,
          comfort: row.comfort,
          legibility: row.legibility,
          accuracy: row.accuracy,
          value: row.value,
        },
        ownership: row.ownership,
        comment: row.comment,
        updatedAt: row.updatedAt.toISOString(),
      }
    : null;
  return Response.json({ review });
}

/** POST /api/avis : dépose ou remplace l'avis de l'utilisateur sur une montre. */
export async function POST(request: Request) {
  // Avis masqués (FEATURE_REVIEWS) : aucun nouveau dépôt. Lecture et suppression restent possibles.
  if (!features.reviews()) return error(404, "Les avis ne sont pas ouverts pour le moment.");
  const userId = await currentUserId(request);
  if (!userId) return error(401, "Connectez-vous pour donner votre avis.");

  const parsed = reviewInput.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return error(400, parsed.error.issues[0]?.message ?? "Avis incomplet.");
  }
  const input = parsed.data;

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  if (!(await verifyTurnstile(input.turnstileToken, ip))) {
    return error(400, "Vérification anti-robot échouée : rechargez la page et réessayez.");
  }

  const db = getDb();
  const [watch] = await db
    .select({ id: watches.id })
    .from(watches)
    .where(eq(watches.id, input.watchId));
  if (!watch) return error(404, "Montre inconnue.");

  // Anti-abus : nombre d'avis par jour et copier-coller du même texte sur plusieurs montres.
  const since = new Date(Date.now() - 86_400_000);
  const [recent] = await db
    .select({ n: count() })
    .from(reviews)
    .where(and(eq(reviews.userId, userId), gt(reviews.updatedAt, since)));
  if ((recent?.n ?? 0) >= DAILY_REVIEW_LIMIT) {
    return error(429, "Trop d'avis aujourd'hui : réessayez demain.");
  }
  if (input.comment) {
    const [copy] = await db
      .select({ id: reviews.id })
      .from(reviews)
      .where(
        and(
          eq(reviews.userId, userId),
          eq(reviews.comment, input.comment),
          ne(reviews.watchId, input.watchId),
        ),
      )
      .limit(1);
    if (copy)
      return error(409, "Ce commentaire figure déjà sur une autre montre : décrivez celle-ci.");
  }

  const values = {
    ...input.ratings,
    ownership: input.ownership,
    comment: input.comment ?? null,
    updatedAt: new Date(),
  };
  const [saved] = await db
    .insert(reviews)
    .values({ watchId: input.watchId, userId, ...values })
    .onConflictDoUpdate({ target: [reviews.watchId, reviews.userId], set: values })
    .returning({ createdAt: reviews.createdAt, updatedAt: reviews.updatedAt });

  await afterChange();
  return Response.json({
    ok: true,
    updated: saved ? saved.createdAt.getTime() !== saved.updatedAt.getTime() : false,
  });
}

/** DELETE /api/avis?montre=ID : retire l'avis de l'utilisateur sur cette montre. */
export async function DELETE(request: Request) {
  const watchId = watchIdFrom(request);
  if (!watchId) return error(400, "Montre inconnue");
  const userId = await currentUserId(request);
  if (!userId) return error(401, "Connectez-vous.");

  await getDb()
    .delete(reviews)
    .where(and(eq(reviews.watchId, watchId), eq(reviews.userId, userId)));
  await afterChange();
  return Response.json({ ok: true });
}
