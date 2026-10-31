"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { z } from "zod";

import { authClient } from "@/lib/auth/client";
import { type FavoriteBrand, withFavorite } from "@/lib/catalog/brand-directory";

const ENDPOINT = "/api/marques/favoris";

const favoritesResponse = z.object({
  favorites: z.array(z.object({ slug: z.string(), name: z.string() })).nullable(),
});

interface FavoriteBrands {
  favorites: FavoriteBrand[];
  /** Compte approuvé : lui seul peut épingler une marque. */
  canPin: boolean;
  toggle: (brand: FavoriteBrand) => void;
}

const Context = createContext<FavoriteBrands>({
  favorites: [],
  canPin: false,
  toggle: () => {},
});

/**
 * Marques épinglées, partagées entre l'en-tête et les pages. Lues côté navigateur, comme la
 * session : les pages restent statiques et le compte n'entre jamais dans le HTML serveur.
 */
export function BrandFavoritesProvider({
  enabled,
  children,
}: {
  enabled: boolean;
  children: React.ReactNode;
}) {
  const { data } = authClient.useSession();
  const userId = enabled ? (data?.user.id ?? null) : null;
  const [state, setState] = useState<{ userId: string; favorites: FavoriteBrand[] } | null>(null);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    fetch(ENDPOINT)
      .then((response) => (response.ok ? response.json() : null))
      .then((body: unknown) => {
        const parsed = favoritesResponse.safeParse(body);
        if (!cancelled && parsed.success && parsed.data.favorites) {
          setState({ userId, favorites: parsed.data.favorites });
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [userId]);

  // Après une déconnexion ou un changement de compte, l'ancienne liste ne s'affiche plus.
  const current = state?.userId === userId ? state : null;

  const toggle = (brand: FavoriteBrand) => {
    if (!current) return;
    const favorite = !current.favorites.some((f) => f.slug === brand.slug);
    const apply = (on: boolean) =>
      setState((s) => s && { ...s, favorites: withFavorite(s.favorites, brand, on) });
    // Affichage immédiat ; un refus du serveur rétablit l'état précédent.
    apply(favorite);
    fetch(ENDPOINT, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ brand: brand.slug, favorite }),
    })
      .then((response) => {
        if (!response.ok) apply(!favorite);
      })
      .catch(() => apply(!favorite));
  };

  return (
    <Context.Provider
      value={{ favorites: current?.favorites ?? [], canPin: current !== null, toggle }}
    >
      {children}
    </Context.Provider>
  );
}

export const useBrandFavorites = () => useContext(Context);
