import { describe, expect, it } from "vitest";

import { turnstileSiteKey, verifyTurnstile } from "./turnstile";

const env = { NEXT_PUBLIC_TURNSTILE_SITE_KEY: "site", TURNSTILE_SECRET_KEY: "secret" };
const answer = (success: boolean) => (async () => Response.json({ success })) as typeof fetch;

describe("Turnstile", () => {
  it("est inactif sans ses deux clés", async () => {
    expect(turnstileSiteKey({ NEXT_PUBLIC_TURNSTILE_SITE_KEY: "site" })).toBeNull();
    expect(await verifyTurnstile(undefined, null, {})).toBe(true);
  });

  it("exige un jeton valide quand il est configuré", async () => {
    expect(turnstileSiteKey(env)).toBe("site");
    expect(await verifyTurnstile(undefined, null, env, answer(true))).toBe(false);
    expect(await verifyTurnstile("jeton", "1.2.3.4", env, answer(true))).toBe(true);
    expect(await verifyTurnstile("jeton", null, env, answer(false))).toBe(false);
  });

  it("refuse si Cloudflare ne répond pas", async () => {
    const down = (async () => {
      throw new Error("réseau");
    }) as typeof fetch;
    expect(await verifyTurnstile("jeton", null, env, down)).toBe(false);
  });
});
