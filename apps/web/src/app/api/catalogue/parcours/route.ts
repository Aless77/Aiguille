import { z } from "zod";

import { browseFilter } from "@/lib/catalog/browse-filter";
import { getWatchCards } from "@/lib/catalog/queries";
import { loadCatalogParams } from "@/lib/catalog/search-params";
import { type TrailPage } from "@/lib/catalog/trail";
import { PAGE_SIZE, watchPath } from "@/lib/catalog/types";

/** « /montres », « /montres/tissot » ou « /montres/tissot/prx » : périmètre de la liste. */
const listPath = z.string().regex(/^\/montres(?:\/[a-z0-9-]+){0,2}$/);

/**
 * Page de résultats d'une liste filtrée, en chemins de fiches : Précédent et Suivant la lisent
 * quand le visiteur passe d'une page de résultats à l'autre depuis une fiche.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const list = listPath.safeParse(searchParams.get("liste"));
  if (!list.success) return Response.json({ error: "Liste inconnue." }, { status: 400 });

  const [, , brandSlug, collectionSlug] = list.data.split("/");
  const filter = browseFilter(loadCatalogParams(searchParams), { brandSlug, collectionSlug });
  const { items, total, page } = await getWatchCards(filter);
  const body: TrailPage = {
    paths: items.map(watchPath),
    total,
    offset: (page - 1) * PAGE_SIZE,
  };
  return Response.json(body);
}
