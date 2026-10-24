"use client";

import { REVIEW_CRITERIA, type ReviewCriterion } from "@aiguille/db/rating";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth/client";
import { COMMENT_MAX, type OwnReview, reviewInput } from "@/lib/reviews/input";
import { cn } from "@/lib/utils";

const CRITERIA = Object.keys(REVIEW_CRITERIA) as ReviewCriterion[];
const STAR_LABELS = ["", "Très décevant", "Décevant", "Correct", "Bien", "Excellent"];

type Ratings = Partial<Record<ReviewCriterion, number>>;
type Status =
  | { kind: "idle" }
  | { kind: "sending" }
  | { kind: "saved"; updated: boolean }
  | { kind: "deleted" }
  | { kind: "error"; message: string };

/**
 * Formulaire d'avis (lot 5) : connexion requise, un avis par montre, modifiable et supprimable.
 * La session et l'avis existant sont lus côté navigateur : la fiche reste statique et en cache.
 */
export function ReviewForm({
  watchId,
  path,
  turnstileSiteKey,
}: {
  watchId: number;
  path: string;
  turnstileSiteKey: string | null;
}) {
  const { data: session, isPending } = authClient.useSession();
  const router = useRouter();
  const [loaded, setLoaded] = useState(false);
  const [existing, setExisting] = useState<OwnReview | null>(null);
  const [ratings, setRatings] = useState<Ratings>({});
  const [ownership, setOwnership] = useState<"owner" | "tried">("owner");
  const [comment, setComment] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const resetTurnstile = useRef<() => void>(() => {});
  const userId = session?.user.id;

  // Avis déjà déposé par cet utilisateur : formulaire prérempli pour modification.
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    fetch(`/api/avis?montre=${watchId}`)
      .then((r) => r.json() as Promise<{ review: OwnReview | null }>)
      .then(({ review }) => {
        if (cancelled) return;
        setExisting(review);
        if (review) {
          // Un ancien avis peut ne pas noter le design : la case reste à remplir.
          setRatings(
            Object.fromEntries(
              Object.entries(review.ratings).filter(([, v]) => v !== null),
            ) as Ratings,
          );
          setOwnership(review.ownership);
          setComment(review.comment ?? "");
        }
        setLoaded(true);
      })
      .catch(() => !cancelled && setLoaded(true));
    return () => {
      cancelled = true;
    };
  }, [userId, watchId]);

  if (isPending) return <div className="h-24" aria-hidden />;

  if (!session) {
    return (
      <div id="avis" className="scroll-mt-20 space-y-2 rounded-xl border p-4">
        <p className="font-medium">Vous possédez ou avez essayé cette montre ?</p>
        <p className="text-sm text-muted-foreground">
          Donnez votre avis en une minute : il rejoint l&apos;avis de la communauté affiché sur
          cette fiche.
        </p>
        <Link
          href={`/connexion?retour=${encodeURIComponent(`${path}#avis`)}`}
          rel="nofollow"
          className="inline-block text-sm font-medium underline underline-offset-4"
        >
          Se connecter pour donner mon avis
        </Link>
      </div>
    );
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const parsed = reviewInput.safeParse({
      watchId,
      ratings,
      ownership,
      comment,
      turnstileToken: turnstileToken ?? undefined,
    });
    if (!parsed.success) {
      const missing = CRITERIA.filter((c) => !ratings[c]);
      setStatus({
        kind: "error",
        message: missing.length
          ? `Notez aussi : ${missing.map((c) => REVIEW_CRITERIA[c].toLowerCase()).join(", ")}.`
          : (parsed.error.issues[0]?.message ?? "Avis incomplet."),
      });
      return;
    }
    if (turnstileSiteKey && !turnstileToken) {
      setStatus({ kind: "error", message: "Patientez pendant la vérification anti-robot." });
      return;
    }
    setStatus({ kind: "sending" });
    const response = await fetch("/api/avis", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(parsed.data),
    }).catch(() => null);
    const body = (await response?.json().catch(() => null)) as {
      ok?: boolean;
      updated?: boolean;
      error?: string;
    } | null;
    resetTurnstile.current();
    if (!response?.ok || !body?.ok) {
      setStatus({ kind: "error", message: body?.error ?? "Envoi impossible : réessayez." });
      return;
    }
    setExisting({
      ratings: ratings as OwnReview["ratings"],
      ownership,
      comment: comment.trim() || null,
      updatedAt: new Date().toISOString(),
    });
    setStatus({ kind: "saved", updated: Boolean(existing) });
    router.refresh();
  }

  async function remove() {
    setStatus({ kind: "sending" });
    const response = await fetch(`/api/avis?montre=${watchId}`, { method: "DELETE" }).catch(
      () => null,
    );
    if (!response?.ok) {
      setStatus({ kind: "error", message: "Suppression impossible : réessayez." });
      return;
    }
    setExisting(null);
    setRatings({});
    setComment("");
    setStatus({ kind: "deleted" });
    router.refresh();
  }

  const sending = status.kind === "sending";

  return (
    <form
      id="avis"
      onSubmit={submit}
      className="scroll-mt-20 space-y-6 rounded-xl border p-4 sm:p-6"
      aria-busy={!loaded || sending}
    >
      <div className="space-y-1">
        <h3 className="text-xl font-semibold tracking-tight">
          {existing ? "Modifier mon avis" : "Donner mon avis"}
        </h3>
        <p className="text-sm text-muted-foreground">
          Publié avec votre nom ({session.user.name}). Un seul avis par montre, modifiable à tout
          moment.
        </p>
      </div>

      <fieldset className="space-y-3">
        <legend className="mb-1 font-medium">Vos notes, de 1 à 5</legend>
        <p className="text-sm text-muted-foreground">
          Notez-la <strong>par rapport à ce qu&apos;on peut attendre à son prix</strong> : une
          excellente montre à 400 € mérite 5/5, sans la comparer à une montre de luxe.
        </p>
        {CRITERIA.map((c) => (
          <StarRating
            key={c}
            label={REVIEW_CRITERIA[c]}
            value={ratings[c] ?? 0}
            onChange={(v) => setRatings((r) => ({ ...r, [c]: v }))}
          />
        ))}
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="mb-2 font-medium">Vous…</legend>
        {(
          [
            ["owner", "possédez cette montre"],
            ["tried", "l'avez essayée (en boutique, chez un proche…)"],
          ] as const
        ).map(([value, label]) => (
          <label key={value} className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="ownership"
              value={value}
              checked={ownership === value}
              onChange={() => setOwnership(value)}
              className="size-4 accent-foreground"
            />
            {label}
          </label>
        ))}
      </fieldset>

      <div className="space-y-2">
        <label htmlFor={`commentaire-${watchId}`} className="font-medium">
          Commentaire <span className="font-normal text-muted-foreground">(facultatif)</span>
        </label>
        <textarea
          id={`commentaire-${watchId}`}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          maxLength={COMMENT_MAX}
          rows={4}
          placeholder="Ce qui vous plaît, ce qui vous déçoit, au quotidien…"
          className="w-full rounded-lg border bg-background p-3 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        />
        <p className="text-xs text-muted-foreground">
          {comment.length}/{COMMENT_MAX} caractères. Pas de lien ni de donnée personnelle.
        </p>
      </div>

      {turnstileSiteKey && (
        <Turnstile
          siteKey={turnstileSiteKey}
          onToken={setTurnstileToken}
          resetRef={resetTurnstile}
        />
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={sending || !loaded}>
          {sending ? "Envoi…" : existing ? "Mettre à jour mon avis" : "Publier mon avis"}
        </Button>
        {existing && (
          <Button type="button" variant="ghost" disabled={sending} onClick={remove}>
            Supprimer mon avis
          </Button>
        )}
      </div>

      <div aria-live="polite" className="text-sm">
        {status.kind === "saved" && (
          <p className="text-emerald-700 dark:text-emerald-400">
            Merci ! Votre avis est {status.updated ? "mis à jour" : "publié"}. La note de la fiche
            se met à jour dans quelques instants.
          </p>
        )}
        {status.kind === "deleted" && <p>Votre avis a été supprimé.</p>}
        {status.kind === "error" && (
          <p role="alert" className="text-destructive">
            {status.message}
          </p>
        )}
      </div>
    </form>
  );
}

/** Cinq boutons radio « étoiles » accessibles au clavier (flèches) et aux lecteurs d'écran. */
function StarRating({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  const name = useId();
  const [hover, setHover] = useState(0);
  const shown = hover || value;
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
      <span id={`${name}-label`} className="w-44 text-sm">
        {label}
      </span>
      <div
        role="radiogroup"
        aria-labelledby={`${name}-label`}
        className="flex"
        onMouseLeave={() => setHover(0)}
      >
        {[1, 2, 3, 4, 5].map((n) => (
          <label key={n} className="cursor-pointer p-0.5" onMouseEnter={() => setHover(n)}>
            <input
              type="radio"
              name={name}
              value={n}
              checked={value === n}
              onChange={() => onChange(n)}
              className="peer sr-only"
              aria-label={`${n} sur 5 : ${STAR_LABELS[n]}`}
            />
            <svg
              viewBox="0 0 24 24"
              aria-hidden
              className={cn(
                "size-7 rounded-sm transition-colors peer-focus-visible:ring-3 peer-focus-visible:ring-ring/50",
                n <= shown
                  ? "fill-amber-400 text-amber-500"
                  : "fill-transparent text-muted-foreground",
              )}
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z" />
            </svg>
          </label>
        ))}
      </div>
      <span className="text-xs text-muted-foreground">{shown ? STAR_LABELS[shown] : ""}</span>
    </div>
  );
}

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, options: Record<string, unknown>) => string;
      reset: (id?: string) => void;
      remove: (id?: string) => void;
    };
  }
}

const TURNSTILE_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

/** Widget Cloudflare Turnstile, chargé seulement quand le formulaire s'affiche. */
function Turnstile({
  siteKey,
  onToken,
  resetRef,
}: {
  siteKey: string;
  onToken: (token: string | null) => void;
  resetRef: React.RefObject<() => void>;
}) {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let widgetId: string | undefined;
    let cancelled = false;
    const render = () => {
      if (cancelled || !container.current || !window.turnstile) return;
      widgetId = window.turnstile.render(container.current, {
        sitekey: siteKey,
        language: "fr",
        callback: (token: string) => onToken(token),
        "expired-callback": () => onToken(null),
        "error-callback": () => onToken(null),
      });
      resetRef.current = () => {
        onToken(null);
        window.turnstile?.reset(widgetId);
      };
    };
    if (window.turnstile) render();
    else {
      let script = document.querySelector<HTMLScriptElement>(`script[src="${TURNSTILE_SRC}"]`);
      if (!script) {
        script = document.createElement("script");
        script.src = TURNSTILE_SRC;
        script.async = true;
        document.head.appendChild(script);
      }
      script.addEventListener("load", render);
    }
    return () => {
      cancelled = true;
      if (widgetId) window.turnstile?.remove(widgetId);
    };
  }, [siteKey, onToken, resetRef]);

  return <div ref={container} />;
}
