"use client";

import { usePathname } from "next/navigation";

import { type Locale, LOCALE_NAMES, localizePath, splitLocale } from "@/lib/i18n/config";
import { useLocale } from "@/lib/i18n/client";

/** Choix de la langue : même page dans une autre langue (mêmes chemins, préfixe différent). */
export function LanguageSwitcher({ locales, label }: { locales: Locale[]; label: string }) {
  const { locale } = useLocale();
  const { path } = splitLocale(usePathname());
  if (locales.length < 2) return null;

  return (
    <label className="flex items-center text-sm">
      <span className="sr-only">{label}</span>
      <select
        value={locale}
        onChange={(e) => {
          window.location.assign(localizePath(e.target.value as Locale, path));
        }}
        className="h-8 rounded-md border bg-background px-1 text-sm"
      >
        {locales.map((l) => (
          <option key={l} value={l} lang={l}>
            {LOCALE_NAMES[l]}
          </option>
        ))}
      </select>
    </label>
  );
}
