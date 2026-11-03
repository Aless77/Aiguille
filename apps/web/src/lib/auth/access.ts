import "server-only";

import { accessRequests, getDb } from "@aiguille/db";
import { eq } from "drizzle-orm";

import { getAuth } from "./server";

export async function getAccessRequest(userId: string) {
  const [request] = await getDb()
    .select()
    .from(accessRequests)
    .where(eq(accessRequests.userId, userId));
  return request ?? null;
}

/** Relit la session et la décision en base : aucune autorisation mémorisée dans le navigateur. */
export async function approvedSession(headers: Headers) {
  const session = await getAuth().api.getSession({ headers, query: { disableCookieCache: true } });
  if (!session) return null;
  return (await getAccessRequest(session.user.id))?.status === "approved" ? session : null;
}
