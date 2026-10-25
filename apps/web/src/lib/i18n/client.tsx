"use client";

import NextLink from "next/link";
import { type ComponentProps, createContext, useContext } from "react";

import { DEFAULT_LOCALE, type Locale, localizePath } from "./config";
import { type Dictionary } from "./dictionary";

interface LocaleContext {
  locale: Locale;
  t: Dictionary["client"];
}

const Context = createContext<LocaleContext | null>(null);

/** Langue et textes des composants navigateur, fournis par la mise en page racine. */
export function LocaleProvider({
  children,
  ...value
}: LocaleContext & { children: React.ReactNode }) {
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useLocale(): LocaleContext {
  const value = useContext(Context);
  if (!value) throw new Error("useLocale hors de LocaleProvider");
  return value;
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
