import { z } from "zod";

/** Adresse choisie pour l'atelier ; aucune destination implicite en production. */
export function getAtelierUrl(
  env: Record<string, string | undefined> = process.env,
): string | null {
  const result = z.url().safeParse(env.ATELIER_URL);
  if (!result.success) return null;
  const url = new URL(result.data);
  if (url.username || url.password) return null;
  if (env.NODE_ENV === "development" && url.protocol === "http:") return url.href;
  if (url.protocol !== "https:" || ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname))
    return null;
  return url.href;
}
