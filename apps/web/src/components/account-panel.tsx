"use client";

import { Link, useLocale, useLocalePath } from "@/lib/i18n/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { CountryField } from "@/components/country-field";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth/client";

type DeleteState = "idle" | "confirm" | "pending" | "stale" | "failed";

/** Contenu de la page « Mon compte » : données conservées, déconnexion, suppression. */
export function AccountPanel() {
  const { data, isPending } = authClient.useSession();
  const router = useRouter();
  const localize = useLocalePath();
  const { dict, f } = useLocale();
  const t = dict.community.account;
  const [state, setState] = useState<DeleteState>("idle");

  if (isPending) return <p className="text-muted-foreground">{dict.community.misc.loading}</p>;

  if (!data) {
    return (
      <p>
        {t.signedOut}{" "}
        <Link
          href={`/connexion?retour=${encodeURIComponent(localize("/compte"))}`}
          className="underline underline-offset-4"
        >
          {t.signIn}
        </Link>
      </p>
    );
  }

  const { user } = data;

  async function deleteAccount() {
    setState("pending");
    const { error } = await authClient.deleteUser({ callbackURL: "/" });
    if (!error) {
      router.push(localize("/"));
      router.refresh();
      return;
    }
    // Session trop ancienne : Better Auth demande une connexion récente avant d'effacer.
    setState(error.code === "SESSION_EXPIRED" ? "stale" : "failed");
  }

  async function reconnect() {
    await authClient.signOut();
    router.push(localize(`/connexion?retour=${encodeURIComponent(localize("/compte"))}`));
  }

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <h2 className="text-xl font-semibold tracking-tight">{t.data}</h2>
        <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
          <dt className="text-muted-foreground">{t.name}</dt>
          <dd>{user.name}</dd>
          <dt className="text-muted-foreground">{t.email}</dt>
          <dd>{user.email}</dd>
          <dt className="text-muted-foreground">{t.createdAt}</dt>
          <dd>{f.date(user.createdAt)}</dd>
        </dl>
        <p className="text-sm text-muted-foreground">{t.dataNote}</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold tracking-tight">{t.country}</h2>
        <CountryField value={user.country} />
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold tracking-tight">{t.delete}</h2>
        <p className="text-sm">{t.deleteText}</p>
        {state === "idle" && (
          <Button variant="destructive" onClick={() => setState("confirm")}>
            {t.delete}
          </Button>
        )}
        {(state === "confirm" || state === "pending") && (
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-medium">{t.confirm}</span>
            <Button variant="destructive" disabled={state === "pending"} onClick={deleteAccount}>
              {state === "pending" ? t.deleting : t.yesDelete}
            </Button>
            <Button variant="ghost" disabled={state === "pending"} onClick={() => setState("idle")}>
              {t.cancel}
            </Button>
          </div>
        )}
        {state === "stale" && (
          <div role="alert" className="space-y-3 rounded-lg border p-3 text-sm">
            <p>{t.stale}</p>
            <Button variant="outline" onClick={reconnect}>
              {t.reconnect}
            </Button>
          </div>
        )}
        {state === "failed" && (
          <p role="alert" className="text-sm text-destructive">
            {t.failed}
          </p>
        )}
      </section>
    </div>
  );
}
