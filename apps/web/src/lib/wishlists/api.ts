import { approvedSession } from "@/lib/auth/access";
import { features } from "@/lib/features";

import { SHARE_ID_PATTERN } from "./input";

/** Outils communs aux routes /api/listes (même conventions que /api/avis). */

export const apiError = (status: number, message: string) =>
  Response.json({ error: message }, { status });

export async function currentUserId(request: Request): Promise<string | null> {
  const session = await approvedSession(request.headers);
  return session?.user.id ?? null;
}

export function clientIp(request: Request): string | null {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
}

/** Identifiant de liste valide dans l'URL, ou null (évite toute requête sur une valeur farfelue). */
export function shareIdFrom(value: string): string | null {
  return SHARE_ID_PATTERN.test(value) ? value : null;
}

/** Communauté masquée (FEATURE_COMMUNITY=false) : plus de création ni d'avis. */
export function communityClosed(): Response | null {
  return features.community()
    ? null
    : apiError(404, "Les listes de souhaits ne sont pas ouvertes pour le moment.");
}

/** Corps JSON d'une requête, ou null s'il est illisible. */
export async function jsonBody(request: Request): Promise<unknown> {
  return request.json().catch(() => null);
}
