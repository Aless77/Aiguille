/**
 * Thème clair par défaut ; le thème sombre est un choix du visiteur, gardé un an dans le cookie
 * `theme`. Le serveur ne lit jamais ce cookie (les pages restent statiques et en cache) : un petit
 * script, exécuté avant l'affichage, pose la classe `dark` sur <html>.
 */
export type Theme = "light" | "dark";

export const THEME_COOKIE = "theme";
const ONE_YEAR_SECS = 60 * 60 * 24 * 365;

/** Lit le thème dans l'en-tête Cookie du navigateur (`document.cookie`). */
export function themeFromCookie(cookie: string): Theme {
  return new RegExp(`(?:^|;\\s*)${THEME_COOKIE}=dark(?:;|$)`).test(cookie) ? "dark" : "light";
}

/** Valeur à écrire dans `document.cookie` pour retenir le thème. */
export function themeCookie(theme: Theme, secure: boolean): string {
  return `${THEME_COOKIE}=${theme}; Path=/; Max-Age=${ONE_YEAR_SECS}; SameSite=Lax${secure ? "; Secure" : ""}`;
}

/** Script inline du layout racine : même règle que themeFromCookie, sans dépendance. */
export const THEME_INIT_SCRIPT = `try{if(/(?:^|;\\s*)${THEME_COOKIE}=dark(?:;|$)/.test(document.cookie))document.documentElement.classList.add("dark")}catch(e){}`;
