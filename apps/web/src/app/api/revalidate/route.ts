import { timingSafeEqual } from "node:crypto";

import { revalidateTag } from "next/cache";

/** Comparaison en temps constant : ne révèle pas le secret par la durée de la réponse. */
function isAuthorized(header: string | null, secret: string | undefined): boolean {
  if (!secret || !header) return false;
  const expected = Buffer.from(`Bearer ${secret}`);
  const received = Buffer.from(header);
  return expected.length === received.length && timingSafeEqual(expected, received);
}

/**
 * Appelé par le scraper après chaque collecte (lot 3) : marque les données du catalogue comme
 * périmées. Les pages se régénèrent à leur prochaine visite, sans redéploiement.
 * Secret partagé : REVALIDATE_SECRET (Vercel + GitHub Actions).
 */
export async function POST(request: Request) {
  if (!isAuthorized(request.headers.get("authorization"), process.env.REVALIDATE_SECRET)) {
    return Response.json({ revalidated: false }, { status: 401 });
  }
  revalidateTag("catalog", "max");
  return Response.json({ revalidated: true, at: new Date().toISOString() });
}
