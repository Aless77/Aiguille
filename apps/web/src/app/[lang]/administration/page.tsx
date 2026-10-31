import { accessRequests, getDb, users } from "@aiguille/db";
import { desc, eq } from "drizzle-orm";
import { cookies, headers } from "next/headers";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { Button } from "@/components/ui/button";
import { ADMIN_COOKIE, validAdminToken } from "@/lib/auth/admin-token";
import { ADMIN_ENTRY_HEADER } from "@/lib/auth/admin-path";
import { adminLogin, adminLogout, reviewAccessRequest } from "@/lib/auth/access-actions";
import { getDictionary } from "@/lib/i18n/server";
import { Link } from "@/lib/i18n/client";

export const instant = false;

export async function generateMetadata() {
  const { dict } = await getDictionary();
  // Ne pas sérialiser l'adresse privée dans les métadonnées de la route interne.
  return {
    title: dict.access.admin,
    description: dict.access.adminIntro,
    robots: { index: false, follow: false },
  };
}

export default function AdminPage(props: PageProps<"/[lang]/administration">) {
  return (
    <Suspense>
      <AdminContent {...props} />
    </Suspense>
  );
}

async function AdminContent({ searchParams }: PageProps<"/[lang]/administration">) {
  if ((await headers()).get(ADMIN_ENTRY_HEADER) !== "1") notFound();
  const { dict, f, locale } = await getDictionary();
  const t = dict.access;
  const params = await searchParams;
  const admin = validAdminToken((await cookies()).get(ADMIN_COOKIE)?.value);
  if (!admin)
    return (
      <main className="mx-auto max-w-sm space-y-6 py-8">
        <h1 className="text-3xl font-semibold">{t.admin}</h1>
        <p className="text-muted-foreground">{t.adminIntro}</p>
        {params.configuration && (
          <p role="alert" className="text-destructive">
            {t.configurationError}
          </p>
        )}
        {params.erreur && (
          <p role="alert" className="text-destructive">
            {t.error}
          </p>
        )}
        <form action={adminLogin.bind(null, locale)} className="space-y-4">
          <label className="block space-y-2">
            <span>{t.username}</span>
            <input
              name="username"
              required
              maxLength={200}
              autoComplete="username"
              className="w-full rounded-lg border bg-background p-3"
            />
          </label>
          <label className="block space-y-2">
            <span>{t.password}</span>
            <input
              name="password"
              type="password"
              required
              maxLength={1024}
              autoComplete="current-password"
              className="w-full rounded-lg border bg-background p-3"
            />
          </label>
          <Button type="submit">{t.login}</Button>
        </form>
      </main>
    );
  const requests = await getDb()
    .select({ request: accessRequests, name: users.name, email: users.email })
    .from(accessRequests)
    .innerJoin(users, eq(users.id, accessRequests.userId))
    .orderBy(desc(accessRequests.createdAt));
  return (
    <main className="space-y-6">
      <h1 className="text-3xl font-semibold">{t.admin}</h1>
      <div className="flex flex-wrap items-center gap-4">
        <Link className="underline" href="/">
          {t.enter}
        </Link>
        <form action={adminLogout.bind(null, locale)}>
          <Button variant="outline" type="submit">
            {t.logout}
          </Button>
        </form>
      </div>
      {!requests.length && <p>{t.empty}</p>}
      {requests.map(({ request, name, email }) => (
        <article key={request.userId} className="space-y-4 rounded-xl border p-6">
          <div>
            <h2 className="text-lg font-semibold">{name}</h2>
            <p className="text-sm break-all text-muted-foreground">{email}</p>
            <p className="text-sm">
              {f.date(request.createdAt)} ·{" "}
              {request.status === "pending"
                ? t.pendingLabel
                : request.status === "approved"
                  ? t.approvedLabel
                  : t.rejectedLabel}
            </p>
          </div>
          <dl className="space-y-3">
            {(
              [
                [t.motivation, request.motivation],
                [t.origin, request.origin],
                [t.brands, request.interestedBrands],
              ] as const
            ).map(([label, value]) => (
              <div key={label}>
                <dt className="font-medium">{label}</dt>
                <dd className="break-words whitespace-pre-wrap text-muted-foreground">{value}</dd>
              </div>
            ))}
          </dl>
          <form action={reviewAccessRequest.bind(null, locale)} className="flex flex-wrap gap-3">
            <input type="hidden" name="userId" value={request.userId} />
            <Button
              type="submit"
              name="status"
              value="approved"
              disabled={request.status === "approved"}
            >
              {t.approve}
            </Button>
            <Button
              type="submit"
              variant="outline"
              name="status"
              value="rejected"
              disabled={request.status === "rejected"}
            >
              {t.reject}
            </Button>
          </form>
        </article>
      ))}
    </main>
  );
}
