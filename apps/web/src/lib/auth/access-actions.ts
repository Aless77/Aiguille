"use server";

import { accessRequests, adminLoginAttempts, getDb } from "@aiguille/db";
import { eq, sql } from "drizzle-orm";
import { cookies, headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { DEFAULT_LOCALE, enabledLocales, isLocale, localizePath } from "@/lib/i18n/config";
import { getSiteUrl } from "@/lib/site";
import { getAuth } from "./server";
import { accessRequestInput, adminLoginInput } from "./access-input";
import { ADMIN_ENTRY_HEADER, getAdminAccessPath } from "./admin-path";
import {
  ADMIN_COOKIE,
  ADMIN_SESSION_SECONDS,
  createAdminToken,
  equalSecret,
  validAdminToken,
} from "./admin-token";

// Les paramètres racines ne sont pas disponibles dans une action : langue liée au formulaire,
// revalidée ici comme toute donnée venant du navigateur.
function actionPath(locale: string) {
  const lang = isLocale(locale) && enabledLocales().includes(locale) ? locale : DEFAULT_LOCALE;
  return (path: string) => localizePath(lang, path);
}

async function adminActionPath(locale: string) {
  const entry = getAdminAccessPath();
  if (!entry || (await headers()).get(ADMIN_ENTRY_HEADER) !== "1") notFound();
  return actionPath(locale)(entry);
}

export async function submitAccessRequest(locale: string, data: FormData) {
  const path = actionPath(locale);
  const session = await getAuth().api.getSession({
    headers: await headers(),
    query: { disableCookieCache: true },
  });
  if (!session) redirect(path("/connexion"));
  const parsed = accessRequestInput.safeParse(Object.fromEntries(data));
  if (!parsed.success) redirect(path("/demande-acces?erreur=1"));
  // Une demande par compte ; une décision ne peut pas être écrasée par un nouveau formulaire.
  await getDb()
    .insert(accessRequests)
    .values({ userId: session.user.id, ...parsed.data })
    .onConflictDoNothing();
  revalidatePath(path("/demande-acces"));
  redirect(path("/demande-acces"));
}

export async function adminLogin(locale: string, data: FormData) {
  const entry = await adminActionPath(locale);
  const parsed = adminLoginInput.safeParse(Object.fromEntries(data));
  const token = createAdminToken();
  if (!token) redirect(`${entry}?configuration=1`);
  // Limite globale persistante : ne dépend pas d'un en-tête IP falsifiable et fonctionne sur Vercel.
  const [limit] = await getDb()
    .insert(adminLoginAttempts)
    .values({ key: "admin", attempts: 1, expiresAt: new Date(Date.now() + 15 * 60_000) })
    .onConflictDoUpdate({
      target: adminLoginAttempts.key,
      set: {
        attempts: sql`case when ${adminLoginAttempts.expiresAt} <= now() then 1 else ${adminLoginAttempts.attempts} + 1 end`,
        expiresAt: sql`case when ${adminLoginAttempts.expiresAt} <= now() then now() + interval '15 minutes' else ${adminLoginAttempts.expiresAt} end`,
      },
    })
    .returning();
  if (
    !parsed.success ||
    !limit ||
    limit.attempts > 10 ||
    !equalSecret(parsed.data.username, process.env.ADMIN_USERNAME ?? "") ||
    !equalSecret(parsed.data.password, process.env.ADMIN_PASSWORD ?? "")
  )
    redirect(`${entry}?erreur=1`);
  await getDb().delete(adminLoginAttempts).where(eq(adminLoginAttempts.key, "admin"));
  (await cookies()).set(ADMIN_COOKIE, token, {
    httpOnly: true,
    // HTTPS en production ; les builds de test locaux sont servis en HTTP dans Docker.
    secure: new URL(getSiteUrl()).protocol === "https:",
    sameSite: "strict",
    path: "/",
    maxAge: ADMIN_SESSION_SECONDS,
  });
  redirect(entry);
}

export async function adminLogout(locale: string) {
  const entry = await adminActionPath(locale);
  (await cookies()).delete(ADMIN_COOKIE);
  redirect(entry);
}

export async function reviewAccessRequest(locale: string, data: FormData) {
  const entry = await adminActionPath(locale);
  if (!validAdminToken((await cookies()).get(ADMIN_COOKIE)?.value)) redirect(entry);
  const input = z
    .object({ userId: z.string().min(1).max(200), status: z.enum(["approved", "rejected"]) })
    .safeParse(Object.fromEntries(data));
  if (!input.success) redirect(`${entry}?erreur=1`);
  await getDb()
    .update(accessRequests)
    .set({ status: input.data.status, reviewedAt: new Date() })
    .where(eq(accessRequests.userId, input.data.userId));
  revalidatePath(entry);
  redirect(entry);
}
