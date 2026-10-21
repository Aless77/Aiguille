"use client";

import { useEffect, useState } from "react";

import { PROVIDER_ICONS } from "@/components/provider-icons";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth/client";
import { AUTH_PROVIDERS, type AuthProviderId } from "@/lib/auth/providers";

/** Boutons de connexion : redirigent vers le fournisseur, qui renvoie ensuite vers `returnTo`. */
export function SignInButtons({
  providers,
  returnTo,
}: {
  providers: AuthProviderId[];
  returnTo: string;
}) {
  const [pending, setPending] = useState<AuthProviderId | null>(null);
  const [failed, setFailed] = useState(false);

  // En local, le site est déclaré sur « localhost » (URL de rappel OAuth, origine de confiance) :
  // ouvert par 127.0.0.1, la connexion serait refusée. On bascule sur la même page en localhost.
  useEffect(() => {
    if (window.location.hostname !== "127.0.0.1") return;
    const url = new URL(window.location.href);
    url.hostname = "localhost";
    window.location.replace(url);
  }, []);

  async function signIn(provider: AuthProviderId) {
    setPending(provider);
    setFailed(false);
    const { error } = await authClient.signIn.social({
      provider,
      callbackURL: returnTo,
      errorCallbackURL: "/connexion?erreur=1",
    });
    // En cas de succès, le navigateur part chez le fournisseur : on ne revient ici qu'en erreur.
    if (error) {
      setPending(null);
      setFailed(true);
    }
  }

  return (
    <div className="space-y-3">
      {providers.map((id) => {
        const Icon = PROVIDER_ICONS[id];
        return (
          <Button
            key={id}
            variant="outline"
            size="lg"
            className="h-11 w-full gap-3 text-base"
            disabled={pending !== null}
            onClick={() => signIn(id)}
          >
            <Icon className="size-5" />
            {pending === id ? "Redirection…" : `Continuer avec ${AUTH_PROVIDERS[id].name}`}
          </Button>
        );
      })}
      {failed && (
        <p role="alert" className="text-sm text-destructive">
          La connexion n&apos;a pas pu démarrer. Réessayez dans un instant.
        </p>
      )}
    </div>
  );
}
