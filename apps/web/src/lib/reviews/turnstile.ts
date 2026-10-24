type Env = Record<string, string | undefined>;

const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

/**
 * Cloudflare Turnstile (anti-spam du cahier des charges) : actif seulement si les deux clés sont
 * définies. Sans elles (local, CI), le dépôt d'avis reste protégé par la connexion obligatoire.
 */
export function turnstileSiteKey(env: Env = process.env): string | null {
  return env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && env.TURNSTILE_SECRET_KEY
    ? env.NEXT_PUBLIC_TURNSTILE_SITE_KEY
    : null;
}

/** Vérifie le jeton du widget auprès de Cloudflare. Vrai si Turnstile n'est pas configuré. */
export async function verifyTurnstile(
  token: string | undefined,
  ip: string | null,
  env: Env = process.env,
  fetcher: typeof fetch = fetch,
): Promise<boolean> {
  const secret = env.TURNSTILE_SECRET_KEY;
  if (!secret || !env.NEXT_PUBLIC_TURNSTILE_SITE_KEY) return true;
  if (!token) return false;
  const body = new URLSearchParams({ secret, response: token });
  if (ip) body.set("remoteip", ip);
  try {
    const response = await fetcher(VERIFY_URL, { method: "POST", body });
    const result = (await response.json()) as { success?: boolean };
    return result.success === true;
  } catch {
    // Cloudflare injoignable : on refuse plutôt que d'ouvrir la porte au spam.
    return false;
  }
}
