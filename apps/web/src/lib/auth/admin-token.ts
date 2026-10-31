import { createHmac, timingSafeEqual } from "node:crypto";

export const ADMIN_COOKIE = "aiguille-admin";
export const ADMIN_SESSION_SECONDS = 60 * 60 * 8;
type Env = Record<string, string | undefined>;

function signingKey(env: Env): string | null {
  const minimumPasswordLength = env.NODE_ENV === "development" && !env.VERCEL ? 1 : 16;
  if (
    !env.ADMIN_USERNAME ||
    !env.ADMIN_PASSWORD ||
    env.ADMIN_PASSWORD.length < minimumPasswordLength ||
    !env.BETTER_AUTH_SECRET ||
    env.BETTER_AUTH_SECRET.length < 32
  )
    return null;
  // Changer les identifiants révoque immédiatement toutes les sessions administrateur.
  return createHmac("sha256", env.BETTER_AUTH_SECRET)
    .update(JSON.stringify([env.ADMIN_USERNAME, env.ADMIN_PASSWORD]))
    .digest("hex");
}

export function equalSecret(left: string, right: string): boolean {
  const digest = (value: string) => createHmac("sha256", "aiguille-compare").update(value).digest();
  return timingSafeEqual(digest(left), digest(right));
}

export function createAdminToken(env: Env = process.env, now = Date.now()): string | null {
  const key = signingKey(env);
  if (!key) return null;
  const expires = String(Math.floor(now / 1000) + ADMIN_SESSION_SECONDS);
  return `${expires}.${createHmac("sha256", key).update(expires).digest("hex")}`;
}

export function validAdminToken(
  token: string | undefined,
  env: Env = process.env,
  now = Date.now(),
): boolean {
  const key = signingKey(env);
  if (!key || !token || !/^\d{10}\.[a-f0-9]{64}$/.test(token)) return false;
  const [expires, signature] = token.split(".");
  const remaining = Number(expires) - Math.floor(now / 1000);
  return (
    remaining > 0 &&
    remaining <= ADMIN_SESSION_SECONDS &&
    equalSecret(signature!, createHmac("sha256", key).update(expires!).digest("hex"))
  );
}
