import { Suspense } from "react";
import { headers } from "next/headers";

import { Button } from "@/components/ui/button";
import { getAuth } from "@/lib/auth/server";
import { getAccessRequest } from "@/lib/auth/access";
import { submitAccessRequest } from "@/lib/auth/access-actions";
import { getDictionary } from "@/lib/i18n/server";
import { Link } from "@/lib/i18n/client";
import { localizedMetadata } from "@/lib/seo/localized-metadata";

export const instant = false;

export async function generateMetadata() {
  const { dict } = await getDictionary();
  return localizedMetadata({
    title: dict.access.title,
    description: dict.access.intro,
    path: "/demande-acces",
    index: false,
  });
}

export default function AccessPage(props: PageProps<"/[lang]/demande-acces">) {
  return (
    <Suspense>
      <AccessContent {...props} />
    </Suspense>
  );
}

async function AccessContent({ searchParams }: PageProps<"/[lang]/demande-acces">) {
  const { dict, path, locale } = await getDictionary();
  const t = dict.access;
  // Lire la requête avant d'initialiser Better Auth (horloge et aléatoire internes).
  const requestHeaders = await headers();
  const session = await getAuth().api.getSession({
    headers: requestHeaders,
    query: { disableCookieCache: true },
  });
  const request = session ? await getAccessRequest(session.user.id) : null;
  const params = await searchParams;
  return (
    <main className="mx-auto max-w-xl space-y-6 py-8">
      <h1 className="text-3xl font-semibold tracking-tight">{t.title}</h1>
      <p className="text-muted-foreground">{t.intro}</p>
      {!session ? (
        <Link
          className="underline"
          href={`/connexion?retour=${encodeURIComponent(path("/demande-acces"))}`}
        >
          {t.signIn}
        </Link>
      ) : request ? (
        <div className="space-y-4 rounded-xl border p-6">
          <p role="status">
            {request.status === "approved"
              ? t.approved
              : request.status === "rejected"
                ? t.rejected
                : t.pending}
          </p>
          {request.status === "approved" && (
            <Link className="underline" href="/">
              {t.enter}
            </Link>
          )}
        </div>
      ) : (
        <form action={submitAccessRequest.bind(null, locale)} className="space-y-5">
          {params.erreur && (
            <p role="alert" className="text-destructive">
              {t.error}
            </p>
          )}
          <label className="block space-y-2">
            <span>{t.motivation}</span>
            <textarea
              name="motivation"
              required
              minLength={20}
              maxLength={2000}
              rows={5}
              aria-describedby="motivation-hint"
              className="w-full rounded-lg border bg-background p-3"
            />
            <span id="motivation-hint" className="block text-sm text-muted-foreground">
              {t.motivationHint}
            </span>
          </label>
          <label className="block space-y-2">
            <span>{t.origin}</span>
            <textarea
              name="origin"
              required
              minLength={2}
              maxLength={300}
              rows={2}
              className="w-full rounded-lg border bg-background p-3"
            />
          </label>
          <label className="block space-y-2">
            <span>{t.brands}</span>
            <input
              name="interestedBrands"
              required
              minLength={2}
              maxLength={500}
              className="w-full rounded-lg border bg-background p-3"
            />
          </label>
          <Button type="submit">{t.submit}</Button>
        </form>
      )}
      <p className="text-sm text-muted-foreground">
        {t.privacy}{" "}
        <Link href="/confidentialite" className="underline">
          {dict.community.signIn.privacyLink}
        </Link>
      </p>
      {session && (
        <Link className="block text-sm underline" href="/compte">
          {t.account}
        </Link>
      )}
    </main>
  );
}
