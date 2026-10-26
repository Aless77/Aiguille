"use client";

import { Check, Link2, Trash2 } from "lucide-react";
import { Link, useLocale, useLocalePath } from "@/lib/i18n/client";
import { format } from "@/lib/i18n/dictionary";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth/client";

import { TITLE_MAX, type Visibility, VISIBILITIES } from "@/lib/wishlists/input";

export interface OwnList {
  shareId: string;
  title: string;
  visibility: Visibility;
  anonymous: boolean;
  updatedAt: string;
  watchCount: number;
  contains: boolean;
}

/** Listes du compte connecté ; avec une montre, indique celles qui la contiennent déjà. */
export async function fetchOwnLists(watchId?: number): Promise<OwnList[]> {
  const data = (await fetch(watchId ? `/api/listes?montre=${watchId}` : "/api/listes").then((r) =>
    r.json(),
  )) as { lists: OwnList[] | null };
  return data.lists ?? [];
}

/** Listes du compte connecté, lues côté navigateur (page /listes, jamais en cache). */
export function MyLists() {
  const { data: session, isPending } = authClient.useSession();
  const { dict, f } = useLocale();
  const t = dict.community.lists;
  const loading = dict.community.misc.loading;
  const localize = useLocalePath();
  const [lists, setLists] = useState<OwnList[] | null>(null);
  const [title, setTitle] = useState("");
  const [visibility, setVisibility] = useState<Visibility>("private");
  const [anonymous, setAnonymous] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const userId = session?.user.id;

  const load = useCallback(() => fetchOwnLists().then(setLists), []);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    void fetchOwnLists().then((l) => !cancelled && setLists(l));
    return () => {
      cancelled = true;
    };
  }, [userId]);

  if (isPending) return <p className="text-muted-foreground">{loading}</p>;
  if (!session) {
    return (
      <p className="rounded-xl border p-4">
        <Link
          href="/connexion?retour=%2Flistes"
          rel="nofollow"
          className="font-medium underline underline-offset-4"
        >
          {t.signInToCreate}
        </Link>{" "}
        {t.signInToCreateEnd}
      </p>
    );
  }

  const request = async (url: string, method: string, body?: unknown) => {
    setError(null);
    const response = await fetch(url, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!response.ok) {
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      setError(data.error ?? dict.community.misc.genericError);
    }
    await load();
    return response.ok;
  };

  return (
    <div className="space-y-6">
      <form
        className="flex flex-wrap items-end gap-3 rounded-xl border p-4"
        onSubmit={async (e) => {
          e.preventDefault();
          if (await request("/api/listes", "POST", { title, visibility, anonymous })) setTitle("");
        }}
      >
        <label className="min-w-56 flex-1 space-y-1 text-sm">
          <span className="font-medium">{t.newList}</span>
          <input
            required
            value={title}
            maxLength={TITLE_MAX}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t.newListPlaceholder}
            className="w-full rounded-md border bg-background px-3 py-2"
          />
        </label>
        <label className="space-y-1 text-sm">
          <span className="font-medium">{t.visibilityLabel}</span>
          <select
            value={visibility}
            onChange={(e) => setVisibility(e.target.value as Visibility)}
            className="block rounded-md border bg-background px-2 py-2"
          >
            {VISIBILITIES.map((v) => (
              <option key={v} value={v}>
                {t.visibility[v].label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 pb-2 text-sm">
          <input
            type="checkbox"
            checked={anonymous}
            onChange={(e) => setAnonymous(e.target.checked)}
          />
          {t.anonymous}
        </label>
        <Button type="submit">{t.create}</Button>
        <p className="w-full text-xs text-muted-foreground">
          {t.visibility[visibility].help}
          {anonymous && t.anonymousHelp}
        </p>
      </form>

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      {lists === null ? (
        <p className="text-muted-foreground">{loading}</p>
      ) : lists.length === 0 ? (
        <p className="text-muted-foreground">{t.empty}</p>
      ) : (
        <ul className="divide-y rounded-xl border">
          {lists.map((l) => (
            <li key={l.shareId} className="flex flex-wrap items-center gap-3 p-4">
              <div className="min-w-48 flex-1">
                <Link
                  href={`/listes/${l.shareId}`}
                  className="font-medium underline-offset-4 hover:underline"
                >
                  {l.title}
                </Link>
                <p className="text-sm text-muted-foreground">
                  {f.plural(t.watches, l.watchCount)}
                  {format(t.updatedOn, { date: f.date(l.updatedAt) })}
                </p>
              </div>
              <select
                aria-label={format(t.visibilityOf, { title: l.title })}
                value={l.visibility}
                onChange={(e) =>
                  void request(`/api/listes/${l.shareId}`, "PATCH", { visibility: e.target.value })
                }
                className="rounded-md border bg-background px-2 py-1 text-sm"
              >
                {VISIBILITIES.map((v) => (
                  <option key={v} value={v}>
                    {t.visibility[v].label}
                  </option>
                ))}
              </select>
              <label className="flex items-center gap-1 text-sm">
                <input
                  type="checkbox"
                  checked={l.anonymous}
                  aria-label={format(t.anonymousOf, { title: l.title })}
                  onChange={(e) =>
                    void request(`/api/listes/${l.shareId}`, "PATCH", {
                      anonymous: e.target.checked,
                    })
                  }
                />
                {t.anonymous}
              </label>
              {l.visibility !== "private" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    await navigator.clipboard.writeText(
                      `${window.location.origin}${localize(`/listes/${l.shareId}`)}`,
                    );
                    setCopied(l.shareId);
                    setTimeout(() => setCopied(null), 2000);
                  }}
                >
                  {copied === l.shareId ? <Check aria-hidden /> : <Link2 aria-hidden />}
                  {copied === l.shareId ? t.copied : t.copy}
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                aria-label={format(t.deleteOf, { title: l.title })}
                onClick={() => {
                  if (window.confirm(format(t.confirmDelete, { title: l.title }))) {
                    void request(`/api/listes/${l.shareId}`, "DELETE");
                  }
                }}
              >
                <Trash2 aria-hidden />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
