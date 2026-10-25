"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth/client";

type DeleteState = "idle" | "confirm" | "pending" | "stale" | "failed";

/** Contenu de la page « Mon compte » : données conservées, déconnexion, suppression. */
export function AccountPanel() {
  const { data, isPending } = authClient.useSession();
  const router = useRouter();
  const [state, setState] = useState<DeleteState>("idle");

  if (isPending) return <p className="text-muted-foreground">Chargement…</p>;

  if (!data) {
    return (
      <p>
        Vous n&apos;êtes pas connecté.{" "}
        <Link href="/connexion?retour=%2Fcompte" className="underline underline-offset-4">
          Se connecter
        </Link>
      </p>
    );
  }

  const { user } = data;

  async function deleteAccount() {
    setState("pending");
    const { error } = await authClient.deleteUser({ callbackURL: "/" });
    if (!error) {
      router.push("/");
      router.refresh();
      return;
    }
    // Session trop ancienne : Better Auth demande une connexion récente avant d'effacer.
    setState(error.code === "SESSION_EXPIRED" ? "stale" : "failed");
  }

  async function reconnect() {
    await authClient.signOut();
    router.push("/connexion?retour=%2Fcompte");
  }

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <h2 className="text-xl font-semibold tracking-tight">Données conservées</h2>
        <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
          <dt className="text-muted-foreground">Nom</dt>
          <dd>{user.name}</dd>
          <dt className="text-muted-foreground">E-mail</dt>
          <dd>{user.email}</dd>
          <dt className="text-muted-foreground">Compte créé le</dt>
          <dd>{new Date(user.createdAt).toLocaleDateString("fr-FR", { dateStyle: "long" })}</dd>
        </dl>
        <p className="text-sm text-muted-foreground">
          Le nom et la photo viennent du service utilisé pour vous connecter (GitHub ou Google),
          tels qu&apos;ils étaient lors de la création du compte.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold tracking-tight">Supprimer mon compte</h2>
        <p className="text-sm">
          Votre profil, vos sessions, vos avis, vos listes de souhaits et vos commentaires sont
          effacés immédiatement et définitivement.
        </p>
        {state === "idle" && (
          <Button variant="destructive" onClick={() => setState("confirm")}>
            Supprimer mon compte
          </Button>
        )}
        {(state === "confirm" || state === "pending") && (
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-medium">Confirmer la suppression définitive ?</span>
            <Button variant="destructive" disabled={state === "pending"} onClick={deleteAccount}>
              {state === "pending" ? "Suppression…" : "Oui, supprimer"}
            </Button>
            <Button variant="ghost" disabled={state === "pending"} onClick={() => setState("idle")}>
              Annuler
            </Button>
          </div>
        )}
        {state === "stale" && (
          <div role="alert" className="space-y-3 rounded-lg border p-3 text-sm">
            <p>Par sécurité, reconnectez-vous puis revenez ici pour supprimer votre compte.</p>
            <Button variant="outline" onClick={reconnect}>
              Me reconnecter
            </Button>
          </div>
        )}
        {state === "failed" && (
          <p role="alert" className="text-sm text-destructive">
            La suppression a échoué. Réessayez dans un instant.
          </p>
        )}
      </section>
    </div>
  );
}
