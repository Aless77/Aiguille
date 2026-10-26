import { Suspense } from "react";

import { SignInButtons } from "@/components/sign-in-buttons";
import { configuredProviders, safeReturnPath, type AuthProviderId } from "@/lib/auth/providers";
import { Link } from "@/lib/i18n/client";
import { format } from "@/lib/i18n/dictionary";
import { getDictionary } from "@/lib/i18n/server";
import { localizedMetadata } from "@/lib/seo/localized-metadata";
import { siteConfig } from "@/lib/site";

export async function generateMetadata() {
  const t = (await getDictionary()).dict.community.signIn;
  return localizedMetadata({
    title: t.metaTitle,
    description: format(t.metaDescription, { site: siteConfig.name }),
    path: "/connexion",
    index: false,
  });
}

export default async function SignInPage({ searchParams }: PageProps<"/[lang]/connexion">) {
  const t = (await getDictionary()).dict.community.signIn;
  return (
    <div className="mx-auto max-w-sm space-y-6 py-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">{t.title}</h1>
        <p className="text-muted-foreground">{t.intro}</p>
      </div>
      <Suspense>
        <SignInOptions searchParams={searchParams} />
      </Suspense>
      <p className="text-sm text-muted-foreground">
        {t.privacy}{" "}
        <Link href="/confidentialite" className="underline">
          {t.privacyLink}
        </Link>
        .
      </p>
    </div>
  );
}

async function SignInOptions({
  searchParams,
}: Pick<PageProps<"/[lang]/connexion">, "searchParams">) {
  const [params, { dict }] = await Promise.all([searchParams, getDictionary()]);
  const t = dict.community.signIn;
  const providers = Object.keys(configuredProviders()) as AuthProviderId[];
  return (
    <>
      {params.erreur ? (
        <p role="alert" className="rounded-lg border border-destructive/40 p-3 text-sm">
          {t.error}
        </p>
      ) : null}
      {providers.length > 0 ? (
        <SignInButtons providers={providers} returnTo={safeReturnPath(params.retour)} />
      ) : (
        <p className="rounded-lg border p-3 text-sm text-muted-foreground">{t.unavailable}</p>
      )}
    </>
  );
}
