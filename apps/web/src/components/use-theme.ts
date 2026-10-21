"use client";

import { useSyncExternalStore } from "react";

import { type Theme, themeCookie } from "@/lib/theme";

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  return () => observer.disconnect();
}

const isDark = () => document.documentElement.classList.contains("dark");

/**
 * Thème affiché (classe `dark` de <html>). Cartes et graphiques s'en servent pour leurs couleurs
 * et se redessinent quand le visiteur change de thème. Côté serveur : clair.
 */
export function useIsDarkTheme(): boolean {
  return useSyncExternalStore(subscribe, isDark, () => false);
}

/** Applique un thème et le retient dans le cookie `theme`. */
export function setTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
  document.cookie = themeCookie(theme, window.location.protocol === "https:");
}
