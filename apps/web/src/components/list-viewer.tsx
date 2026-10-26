"use client";

import { Check, Link2, Reply, Share2, Trash2 } from "lucide-react";
import { Link, useLocale, useLocalePath } from "@/lib/i18n/client";
import { format } from "@/lib/i18n/dictionary";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

import { Turnstile } from "@/components/turnstile";
import { Button } from "@/components/ui/button";
import { WatchGrid } from "@/components/watch-card";
import { authClient } from "@/lib/auth/client";
import { type WatchCard } from "@/lib/catalog/types";
import { COMMENT_MAX, type Visibility, VISIBILITIES } from "@/lib/wishlists/input";

/**
 * Parties interactives d'une liste partagée (/listes/…). La page est rendue côté serveur et en
 * cache ; les droits du visiteur (auteur de la liste, auteur d'un avis) sont lus ici, côté
 * navigateur, en un seul appel à /api/listes/{id}.
 */

interface Viewer {
  owner: boolean;
  ownCommentIds: number[];
  /** Choix anonyme proposé par défaut : celui de son dernier message ici (null : aucun). */
  anonymity: boolean | null;
  list: { title: string; anonymous: boolean; items: WatchCard[] } | null;
  loaded: boolean;
  /** Relit les droits après une modification (avis publié, liste changée). */
  reload: () => void;
}

type ViewerData = Omit<Viewer, "loaded" | "reload">;

const ViewerContext = createContext<Viewer>({
  owner: false,
  ownCommentIds: [],
  anonymity: null,
  list: null,
  loaded: false,
  reload: () => {},
});

export function ListViewerProvider({
  shareId,
  children,
}: {
  shareId: string;
  children: React.ReactNode;
}) {
  const { data: session, isPending } = authClient.useSession();
  // Droits lus pour un compte donné : changer de compte relance la lecture.
  const [fetched, setFetched] = useState<{ userId: string; data: ViewerData } | null>(null);
  const [version, setVersion] = useState(0);
  const reload = useCallback(() => setVersion((v) => v + 1), []);
  const userId = session?.user.id;

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    const done = (data: ViewerData) => !cancelled && setFetched({ userId, data });
    fetch(`/api/listes/${shareId}`)
      .then((r) => r.json() as Promise<ViewerData>)
      .then(done)
      .catch(() => done({ owner: false, ownCommentIds: [], anonymity: null, list: null }));
    return () => {
      cancelled = true;
    };
  }, [shareId, userId, version]);

  const viewer: Viewer =
    userId && fetched?.userId === userId
      ? { ...fetched.data, loaded: true, reload }
      : {
          owner: false,
          ownCommentIds: [],
          anonymity: null,
          list: null,
          loaded: !isPending && !userId,
          reload,
        };

  return <ViewerContext.Provider value={viewer}>{children}</ViewerContext.Provider>;
}

const useViewer = () => useContext(ViewerContext);

async function send(
  url: string,
  method: string,
  body?: unknown,
  fallback = "Une erreur est survenue, réessayez.",
): Promise<string | null> {
  const response = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (response.ok) return null;
  const data = (await response.json().catch(() => ({}))) as { error?: string };
  return data.error ?? fallback;
}

/** Copie le lien de la liste (ou ouvre le partage natif sur mobile). */
export function ShareListButton({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);
  const t = useLocale().dict.community.lists;
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={async () => {
        const url = window.location.href.split("#")[0]!;
        if (navigator.share) {
          await navigator.share({ title, url }).catch(() => {});
          return;
        }
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
    >
      {copied ? <Check aria-hidden /> : <Share2 aria-hidden />}
      {copied ? t.copied : t.share}
    </Button>
  );
}

/** Réglages de l'auteur : visibilité, anonymat et suppression de la liste. */
export function ListOwnerBar({
  shareId,
  visibility,
  anonymous,
}: {
  shareId: string;
  visibility: Visibility;
  anonymous: boolean;
}) {
  const { owner, reload } = useViewer();
  const router = useRouter();
  const localize = useLocalePath();
  const t = useLocale().dict.community.lists;
  const [error, setError] = useState<string | null>(null);
  if (!owner) return null;

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border bg-muted/40 p-3 text-sm">
      <span className="font-medium">{t.yourList}</span>
      <label className="flex items-center gap-2">
        <span className="text-muted-foreground">{t.visibilityLabel}</span>
        <select
          className="rounded-md border bg-background px-2 py-1"
          defaultValue={visibility}
          onChange={async (e) => {
            setError(await send(`/api/listes/${shareId}`, "PATCH", { visibility: e.target.value }));
            router.refresh();
          }}
        >
          {VISIBILITIES.map((v) => (
            <option key={v} value={v}>
              {t.visibility[v].label}
            </option>
          ))}
        </select>
      </label>
      <label className="flex items-center gap-2" title={t.anonymityHelp}>
        <input
          type="checkbox"
          defaultChecked={anonymous}
          onChange={async (e) => {
            setError(
              await send(`/api/listes/${shareId}`, "PATCH", { anonymous: e.target.checked }),
            );
            router.refresh();
            reload();
          }}
        />
        {t.publishAnonymously}
      </label>
      <Link href="/listes" className="underline underline-offset-4">
        {t.allMyLists}
      </Link>
      <Button
        variant="ghost"
        size="sm"
        className="ml-auto text-destructive"
        onClick={async () => {
          if (!window.confirm(t.confirmDeleteThis)) return;
          const failed = await send(`/api/listes/${shareId}`, "DELETE");
          if (failed) setError(failed);
          else router.push(localize("/listes"));
        }}
      >
        <Trash2 aria-hidden />
        {t.deleteList}
      </Button>
      {error && <p className="w-full text-destructive">{error}</p>}
    </div>
  );
}

/** Retirer une montre de la liste (auteur seulement). */
export function RemoveFromListButton({ shareId, watchId }: { shareId: string; watchId: number }) {
  const { owner } = useViewer();
  const t = useLocale().dict.community.lists;
  const router = useRouter();
  if (!owner) return null;
  return (
    <Button
      variant="ghost"
      size="sm"
      className="text-muted-foreground"
      onClick={async () => {
        await send(`/api/listes/${shareId}/montres?montre=${watchId}`, "DELETE");
        router.refresh();
      }}
    >
      <Trash2 aria-hidden />
      {t.remove}
    </Button>
  );
}

/** Supprimer son avis, ou masquer un avis reçu sur sa liste. */
export function DeleteCommentButton({
  shareId,
  commentId,
}: {
  shareId: string;
  commentId: number;
}) {
  const { owner, ownCommentIds, reload } = useViewer();
  const router = useRouter();
  const own = ownCommentIds.includes(commentId);
  const t = useLocale().dict.community.lists;
  if (!own && !owner) return null;
  return (
    <button
      type="button"
      className="text-xs text-muted-foreground underline underline-offset-4"
      onClick={async () => {
        if (!window.confirm(own ? t.confirmDeleteOwn : t.confirmHide)) return;
        await send(`/api/listes/${shareId}/commentaires?id=${commentId}`, "DELETE");
        router.refresh();
        reload();
      }}
    >
      {own ? t.deleteComment : t.hideComment}
    </button>
  );
}

/** « Répondre » sous un avis : ouvre un formulaire de réponse sur place. */
export function ReplyButton({
  shareId,
  parentId,
  authorName,
  turnstileSiteKey,
}: {
  shareId: string;
  parentId: number;
  authorName: string;
  turnstileSiteKey: string | null;
}) {
  const [open, setOpen] = useState(false);
  const t = useLocale().dict.community.lists;
  return (
    <div className="space-y-2">
      {!open && (
        <button
          type="button"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground underline underline-offset-4"
          onClick={() => setOpen(true)}
        >
          <Reply className="size-3.5" aria-hidden />
          {t.reply}
        </button>
      )}
      {open && (
        <ListCommentForm
          shareId={shareId}
          watches={[]}
          turnstileSiteKey={turnstileSiteKey}
          parent={{ id: parentId, authorName }}
          onDone={() => setOpen(false)}
        />
      )}
    </div>
  );
}

/** Case « anonyme », proposée à chaque avis et à chaque réponse. */
function AnonymityChoice({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (anonymous: boolean) => void;
}) {
  const { owner, list } = useViewer();
  const t = useLocale().dict.community.lists;
  if (owner && list?.anonymous) {
    return <p className="text-xs text-muted-foreground">{t.anonymousListNote}</p>;
  }
  return (
    <label className="flex items-start gap-2 text-sm" title={t.anonymityHelp}>
      <input
        type="checkbox"
        className="mt-1"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span>
        {owner ? t.writeWithoutName : t.writeAnonymously}
        <span className="block text-xs text-muted-foreground">
          {owner ? t.ownerAnonymousHelp : t.anonymousPseudonymHelp}
        </span>
      </span>
    </label>
  );
}

/** Formulaire d'avis (ou de réponse) sur une liste publiée dans la communauté. */
export function ListCommentForm({
  shareId,
  watches,
  turnstileSiteKey,
  parent,
  onDone,
}: {
  shareId: string;
  watches: { id: number; label: string }[];
  turnstileSiteKey: string | null;
  /** Réponse à un avis. */
  parent?: { id: number; authorName: string };
  onDone?: () => void;
}) {
  const { reload, anonymity } = useViewer();
  const { dict } = useLocale();
  const t = dict.community.lists;
  const { data: session, isPending } = authClient.useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [body, setBody] = useState("");
  // null : pas encore touché, on propose le choix de son dernier message sur cette liste.
  const [anonymousChoice, setAnonymous] = useState<boolean | null>(null);
  const anonymous = anonymousChoice ?? anonymity ?? false;
  const [watchId, setWatchId] = useState("");
  const [status, setStatus] = useState<
    { kind: "idle" | "sending" | "sent" } | { kind: "error"; message: string }
  >({ kind: "idle" });
  const [token, setToken] = useState<string | null>(null);
  const resetTurnstile = useRef<() => void>(() => {});
  const onToken = useCallback((t: string | null) => setToken(t), []);

  if (isPending) return null;
  if (!session) {
    return (
      <p className="text-sm">
        <Link
          href={`/connexion?retour=${encodeURIComponent(pathname)}`}
          rel="nofollow"
          className="font-medium underline underline-offset-4"
        >
          {t.signInToCreate}
        </Link>{" "}
        {parent ? t.signInToReply : t.signInToComment}
      </p>
    );
  }

  return (
    <form
      className={
        parent ? "space-y-3 rounded-lg border bg-muted/30 p-3" : "space-y-3 rounded-xl border p-4"
      }
      onSubmit={async (e) => {
        e.preventDefault();
        if (turnstileSiteKey && !token) {
          setStatus({ kind: "error", message: t.validateCaptcha });
          return;
        }
        setStatus({ kind: "sending" });
        const failed = await send(`/api/listes/${shareId}/commentaires`, "POST", {
          body,
          watchId: watchId ? Number(watchId) : null,
          parentId: parent?.id ?? null,
          anonymous,
          turnstileToken: token ?? undefined,
        });
        resetTurnstile.current();
        if (failed) {
          setStatus({ kind: "error", message: failed });
          return;
        }
        setBody("");
        setWatchId("");
        setAnonymous(null);
        setStatus({ kind: "sent" });
        router.refresh();
        reload();
        onDone?.();
      }}
    >
      <label className="block space-y-1 text-sm">
        <span className="font-medium">
          {parent ? format(t.replyTo, { name: parent.authorName }) : t.yourReview}
        </span>
        <textarea
          required
          value={body}
          onChange={(e) => setBody(e.target.value)}
          maxLength={COMMENT_MAX}
          rows={parent ? 3 : 4}
          placeholder={parent ? t.replyPlaceholder : t.commentPlaceholder}
          className="w-full rounded-md border bg-background p-2"
        />
      </label>
      <AnonymityChoice checked={anonymous} onChange={setAnonymous} />
      {watches.length > 0 && (
        <label className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-muted-foreground">{t.about}</span>
          <select
            value={watchId}
            onChange={(e) => setWatchId(e.target.value)}
            className="rounded-md border bg-background px-2 py-1"
          >
            <option value="">{t.wholeList}</option>
            {watches.map((w) => (
              <option key={w.id} value={w.id}>
                {w.label}
              </option>
            ))}
          </select>
        </label>
      )}
      {turnstileSiteKey && (
        <Turnstile siteKey={turnstileSiteKey} onToken={onToken} resetRef={resetTurnstile} />
      )}
      <div className="flex items-center gap-3">
        <Button type="submit" size={parent ? "sm" : "default"} disabled={status.kind === "sending"}>
          {parent ? t.reply : t.publish}
        </Button>
        {parent && (
          <Button type="button" variant="ghost" size="sm" onClick={onDone}>
            {t.cancel}
          </Button>
        )}
        <p role="status" className="text-sm">
          {status.kind === "sent" && t.sent}
          {status.kind === "error" && <span className="text-destructive">{status.message}</span>}
        </p>
      </div>
      <p className="text-xs text-muted-foreground">{t.publicNote}</p>
    </form>
  );
}

/** Liste privée : visible par son auteur seulement, lue côté navigateur. */
export function PrivateListContent({ shareId }: { shareId: string }) {
  const { owner, list, loaded } = useViewer();
  const { dict } = useLocale();
  const t = dict.community.lists;
  if (!loaded)
    return <p className="text-sm text-muted-foreground">{dict.community.misc.loading}</p>;
  if (!owner || !list) {
    return <p className="rounded-xl border p-4">{t.privateOnly}</p>;
  }
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-semibold tracking-tight">{list.title}</h1>
      <ListOwnerBar shareId={shareId} visibility="private" anonymous={list.anonymous} />
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link2 className="size-4" aria-hidden />
        {t.privateHint}
      </p>
      {list.items.length > 0 ? (
        <WatchGrid watches={list.items} />
      ) : (
        <p className="text-muted-foreground">{t.noWatchYet}</p>
      )}
    </div>
  );
}
