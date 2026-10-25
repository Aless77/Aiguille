"use client";

import { countryOptions, UNDISCLOSED_COUNTRY } from "@aiguille/db/countries";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth/client";
import { useLocale } from "@/lib/i18n/client";

/**
 * Choix du pays de provenance : une liste de pays, jamais d'adresse. Enregistré sur le compte
 * (Better Auth, champ additionnel validé côté serveur).
 */
export function CountryField({
  value,
  onSaved,
  compact = false,
}: {
  value: string | null | undefined;
  onSaved?: () => void;
  compact?: boolean;
}) {
  const { locale, t: all } = useLocale();
  const t = all.country;
  const options = useMemo(() => countryOptions(locale), [locale]);
  const [country, setCountry] = useState(value && value !== UNDISCLOSED_COUNTRY ? value : "");
  const [state, setState] = useState<"idle" | "saving" | "saved" | "failed">("idle");

  async function save(next: string) {
    setState("saving");
    const { error } = await authClient.updateUser({ country: next });
    setState(error ? "failed" : "saved");
    if (!error) onSaved?.();
  }

  return (
    <form
      className="space-y-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (country) void save(country);
      }}
    >
      <label htmlFor="pays" className={compact ? "sr-only" : "text-sm font-medium"}>
        {t.label}
      </label>
      <div className="flex flex-wrap gap-2">
        <select
          id="pays"
          value={country}
          onChange={(e) => {
            setCountry(e.target.value);
            setState("idle");
          }}
          className="h-9 min-w-0 flex-1 rounded-md border bg-background px-2 text-sm"
        >
          <option value="">{t.placeholder}</option>
          {options.map((o) => (
            <option key={o.code} value={o.code}>
              {o.name}
            </option>
          ))}
        </select>
        <Button type="submit" size="sm" disabled={!country || state === "saving"}>
          {t.save}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          disabled={state === "saving"}
          onClick={() => {
            setCountry("");
            void save(UNDISCLOSED_COUNTRY);
          }}
        >
          {t.skip}
        </Button>
      </div>
      <p role="status" className="text-xs text-muted-foreground">
        {state === "saved" ? t.saved : state === "failed" ? t.failed : t.hint}
      </p>
    </form>
  );
}

/**
 * Demande du pays juste après la création du compte (connexion GitHub ou Google, sans
 * formulaire d'inscription) : affichée une seule fois, tant que le pays n'est pas renseigné.
 */
export function CountryPrompt() {
  const { data, refetch } = authClient.useSession();
  const { t } = useLocale();
  const [dismissed, setDismissed] = useState(false);
  if (!data || data.user.country != null || dismissed) return null;

  return (
    <aside
      aria-label={t.country.label}
      className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-md space-y-2 rounded-xl border bg-background p-4 shadow-lg"
    >
      <p className="text-sm font-medium">{t.country.welcome}</p>
      <CountryField
        value={null}
        compact
        onSaved={() => {
          setDismissed(true);
          void refetch();
        }}
      />
    </aside>
  );
}
