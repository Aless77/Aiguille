import { brandFavorites, brands, getDb } from "@aiguille/db";
import { and, asc, eq } from "drizzle-orm";
import { z } from "zod";

import { features } from "@/lib/features";
import { apiError, currentUserId, jsonBody } from "@/lib/wishlists/api";

/**
 * Marques épinglées du compte connecté.
 * GET /api/marques/favoris : ses marques, ou null sans compte approuvé.
 * PUT /api/marques/favoris : épingle ou retire une marque. Le nombre de marques borne la table.
 */

const favoriteInput = z.object({
  brand: z.string().regex(/^[a-z0-9-]+$/),
  favorite: z.boolean(),
});

export async function GET(request: Request) {
  const userId = features.accounts() ? await currentUserId(request) : null;
  if (!userId) return Response.json({ favorites: null });
  const favorites = await getDb()
    .select({ slug: brands.slug, name: brands.name })
    .from(brandFavorites)
    .innerJoin(brands, eq(brands.id, brandFavorites.brandId))
    .where(eq(brandFavorites.userId, userId))
    .orderBy(asc(brandFavorites.addedAt), asc(brands.name));
  return Response.json({ favorites });
}

export async function PUT(request: Request) {
  if (!features.accounts()) return apiError(404, "Les comptes ne sont pas ouverts pour le moment.");
  const userId = await currentUserId(request);
  if (!userId) return apiError(401, "Connectez-vous pour épingler une marque.");

  const parsed = favoriteInput.safeParse(await jsonBody(request));
  if (!parsed.success) return apiError(400, "Marque invalide.");

  const db = getDb();
  const [brand] = await db
    .select({ id: brands.id })
    .from(brands)
    .where(eq(brands.slug, parsed.data.brand));
  if (!brand) return apiError(404, "Marque inconnue.");

  if (parsed.data.favorite) {
    await db.insert(brandFavorites).values({ userId, brandId: brand.id }).onConflictDoNothing();
  } else {
    await db
      .delete(brandFavorites)
      .where(and(eq(brandFavorites.userId, userId), eq(brandFavorites.brandId, brand.id)));
  }
  return new Response(null, { status: 204 });
}
