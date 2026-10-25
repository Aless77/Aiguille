"use client";

import NextLink from "next/link";
import { type ComponentProps, createContext, useContext, useMemo } from "react";

import { DEFAULT_LOCALE, type Locale, localizePath } from "./config";
import { type Dictionary } from "./dictionary";
import { formatters, type Formatters } from "./format";

interface LocaleContext {
  locale: Locale;
  dict: Dictionary;
}

const Context = createContext<LocaleContext | null>(null);

/** Langue et textes des composants navigateur, fournis par la mise en page racine. */
export function LocaleProvider({
  children,
  ...value
}: LocaleContext & { children: React.ReactNode }) {
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

/**
 * Langue, dictionnaire complet (`dict`), textes des composants navigateur (`t`, raccourci de
 * `dict.client`) et formats de la langue (`f`).
 */
export function useLocale(): LocaleContext & { t: Dictionary["client"]; f: Formatters } {
  const value = useContext(Context);
  if (!value) throw new Error("useLocale hors de LocaleProvider");
  const f = useMemo(() => formatters(value.locale), [value.locale]);
  return { ...value, t: value.dict.client, f };
}

/** Préfixe un chemin interne par la langue courante (« /montres » → « /en/montres »). */
export function useLocalePath(): (path: string) => string {
  const locale = useContext(Context)?.locale ?? DEFAULT_LOCALE;
  return (path) => localizePath(locale, path);
}

/**
 * next/link qui garde la langue : les liens internes s'écrivent sans préfixe (« /montres ») et
 * pointent vers la version de la langue affichée.
 */
export function Link({ href, ...props }: ComponentProps<typeof NextLink>) {
  const localize = useLocalePath();
  return <NextLink href={typeof href === "string" ? localize(href) : href} {...props} />;
}
