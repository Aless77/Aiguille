"use client";

import { Check, Heart, Plus } from "lucide-react";
import { Link, useLocale } from "@/lib/i18n/client";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { fetchOwnLists, type OwnList } from "@/components/my-lists";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth/client";
import { TITLE_MAX } from "@/lib/wishlists/input";
import { cn } from "@/lib/utils";

/**
 * « Ajouter à une liste » sur une fiche : coche la montre dans ses listes ou en crée une. Lu côté
 * navigateur (la fiche reste statique et en cache).
 */
export function AddToList({ watchId }: { watchId: number }) {
  const { data: session, isPending } = authClient.useSession();
  const { dict, f } = useLocale();
  const t = dict.community.lists;
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [lists, setLists] = useState<OwnList[] | null>(null);
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const panel = useRef<HTMLDivElement>(null);

  const load = () => fetchOwnLists(watchId).then(setLists);
  const userId = session?.user.id;

  // Listes qui contiennent déjà la montre : libellé « Dans 2 listes » dès l'affichage.
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    void fetchOwnLists(watchId).then((l) => !cancelled && setLists(l));
    return () => {
      cancelled = true;
    };
  }, [userId, watchId]);

  // Fermeture au clic extérieur et avec Échap.
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!panel.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (isPending) return null;
  if (!session) {
    return (
      <Link
        href={`/connexion?retour=${encodeURIComponent(pathname)}`}
        rel="nofollow"
        className="inline-flex items-center gap-2 text-sm underline underline-offset-4"
      >
        <Heart className="size-4" aria-hidden />
        {t.addSignIn}
      </Link>
    );
  }

  const inLists = lists?.filter((l) => l.contains).length ?? 0;

  const call = async (url: string, method: string, body?: unknown) => {
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
    <div ref={panel} className="relative">
      <Button
        variant="outline"
        size="sm"
        aria-expanded={open}
        onClick={() => {
          // Rechargé à chaque ouverture : la montre a pu être ajoutée depuis un autre onglet.
          if (!open) void load();
          setOpen(!open);
        }}
      >
        <Heart className={cn(inLists > 0 && "fill-current")} aria-hidden />
        {inLists > 0 ? f.plural(t.inLists, inLists) : t.add}
      </Button>
      {open && (
        <div className="absolute left-0 z-20 mt-2 w-72 space-y-3 rounded-xl border bg-background p-3 shadow-lg">
          {lists === null ? (
            <p className="text-sm text-muted-foreground">{dict.community.misc.loading}</p>
          ) : (
            lists.length > 0 && (
              <ul className="max-h-60 space-y-1 overflow-y-auto">
                {lists.map((l) => (
                  <li key={l.shareId}>
                    <button
                      type="button"
                      aria-pressed={l.contains}
                      className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted"
                      onClick={() =>
                        void (l.contains
                          ? call(`/api/listes/${l.shareId}/montres?montre=${watchId}`, "DELETE")
                          : call(`/api/listes/${l.shareId}/montres`, "POST", { watchId }))
                      }
                    >
                      <span
                        className={cn(
                          "flex size-4 items-center justify-center rounded border",
                          l.contains && "border-foreground bg-foreground text-background",
                        )}
                        aria-hidden
                      >
                        {l.contains && <Check className="size-3" />}
                      </span>
                      <span className="flex-1 truncate">{l.title}</span>
                      <span className="text-xs text-muted-foreground">{l.watchCount}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )
          )}
          <form
            className="flex gap-2"
            onSubmit={async (e) => {
              e.preventDefault();
              if (await call("/api/listes", "POST", { title, watchId })) setTitle("");
            }}
          >
            <input
              required
              value={title}
              maxLength={TITLE_MAX}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t.newList}
              aria-label={t.newListName}
              className="min-w-0 flex-1 rounded-md border bg-background px-2 py-1 text-sm"
            />
            <Button type="submit" size="sm" aria-label={t.createWithWatch}>
              <Plus aria-hidden />
            </Button>
          </form>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Link href="/listes" className="block text-xs underline underline-offset-4">
            {t.manage}
          </Link>
        </div>
      )}
    </div>
  );
}
