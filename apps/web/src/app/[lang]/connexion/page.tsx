import { Link } from "@/lib/i18n/client";
import { Suspense } from "react";

import { SignInButtons } from "@/components/sign-in-buttons";
import { configuredProviders, safeReturnPath, type AuthProviderId } from "@/lib/auth/providers";
import { pageMetadata } from "@/lib/seo/metadata";
import { siteConfig } from "@/lib/site";

export const metadata = pageMetadata({
  title: "Connexion",
  description: `Connectez-vous à ${siteConfig.name} avec Google ou GitHub pour donner votre avis sur une montre.`,
  path: "/connexion",
  index: false,
});

export default function SignInPage({ searchParams }: PageProps<"/[lang]/connexion">) {
  return (
    <div className="mx-auto max-w-sm space-y-6 py-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Connexion</h1>
        <p className="text-muted-foreground">
          Un compte sert uniquement à donner votre avis sur les montres : un avis par montre et par
          personne. Aucun mot de passe, aucune publicité, aucun e-mail envoyé.
        </p>
      </div>
      <Suspense>
        <SignInOptions searchParams={searchParams} />
      </Suspense>
      <p className="text-sm text-muted-foreground">
        Nous conservons seulement votre nom, votre adresse e-mail et votre avatar, transmis par le
        service choisi, et vous pouvez supprimer votre compte à tout moment. Voir les{" "}
        <Link href="/confidentialite" className="underline">
          règles de confidentialité
        </Link>
        .
      </p>
    </div>
  );
}

async function SignInOptions({
  searchParams,
}: Pick<PageProps<"/[lang]/connexion">, "searchParams">) {
  const params = await searchParams;
  const providers = Object.keys(configuredProviders()) as AuthProviderId[];
  return (
    <>
      {params.erreur ? (
        <p role="alert" className="rounded-lg border border-destructive/40 p-3 text-sm">
          La connexion a échoué ou a été annulée. Vous pouvez réessayer.
        </p>
      ) : null}
      {providers.length > 0 ? (
        <SignInButtons providers={providers} returnTo={safeReturnPath(params.retour)} />
      ) : (
        <p className="rounded-lg border p-3 text-sm text-muted-foreground">
          La connexion n&apos;est pas encore disponible.
        </p>
      )}
    </>
  );
}
