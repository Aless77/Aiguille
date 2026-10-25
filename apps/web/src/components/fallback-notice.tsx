"use client";

import { Languages, X } from "lucide-react";
import { useState } from "react";

import { useLocale } from "@/lib/i18n/client";

/**
 * Petit avertissement quand une partie de la page n'existe pas dans la langue choisie et
 * s'affiche en anglais (textes du site ou fiche non publiée par la marque). Refermable.
 */
export function FallbackNotice({ messages }: { messages: string[] }) {
  const { t } = useLocale();
  const [open, setOpen] = useState(true);
  if (!open || messages.length === 0) return null;

  return (
    <div
      role="status"
      className="fixed top-16 right-4 z-40 flex max-w-sm gap-3 rounded-xl border bg-background p-4 text-sm shadow-lg"
    >
      <Languages className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
      <div className="space-y-1">
        {messages.map((m) => (
          <p key={m}>{m}</p>
        ))}
      </div>
      <button
        type="button"
        onClick={() => setOpen(false)}
        className="-m-1 self-start rounded p-1 text-muted-foreground hover:text-foreground"
        aria-label={t.close}
      >
        <X className="size-4" aria-hidden />
      </button>
    </div>
  );
}
