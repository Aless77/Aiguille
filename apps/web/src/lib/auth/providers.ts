type Env = Record<string, string | undefined>;

export const AUTH_PROVIDERS = {
  google: { name: "Google", idVar: "GOOGLE_CLIENT_ID", secretVar: "GOOGLE_CLIENT_SECRET" },
  github: { name: "GitHub", idVar: "GITHUB_CLIENT_ID", secretVar: "GITHUB_CLIENT_SECRET" },
} as const;

export type AuthProviderId = keyof typeof AUTH_PROVIDERS;

export interface ProviderCredentials {
  clientId: string;
  clientSecret: string;
}

/**
 * Fournisseurs de connexion configurés (identifiant et secret présents). Un fournisseur sans
 * variables est simplement masqué : le site fonctionne en local et en CI sans compte OAuth.
 */
export function configuredProviders(
  env: Env = process.env,
): Partial<Record<AuthProviderId, ProviderCredentials>> {
  const result: Partial<Record<AuthProviderId, ProviderCredentials>> = {};
  for (const [id, p] of Object.entries(AUTH_PROVIDERS) as [
    AuthProviderId,
    (typeof AUTH_PROVIDERS)[AuthProviderId],
  ][]) {
    const clientId = env[p.idVar];
    const clientSecret = env[p.secretVar];
    if (clientId && clientSecret) result[id] = { clientId, clientSecret };
  }
  return result;
}

/**
 * Chemin de retour après connexion, limité au site lui-même : refuse les URL absolues et
 * « //autre-site » (redirection ouverte).
 */
export function safeReturnPath(value: string | string[] | undefined): string {
  const path = Array.isArray(value) ? value[0] : value;
  if (!path || !path.startsWith("/") || path.startsWith("//") || path.includes("\\")) return "/";
  return path;
}
