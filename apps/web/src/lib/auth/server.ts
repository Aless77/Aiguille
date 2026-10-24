import { accounts, getDb, refreshScores, sessions, users, verifications } from "@aiguille/db";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { revalidateTag } from "next/cache";

import { getSiteUrl } from "@/lib/site";

import { configuredProviders } from "./providers";

function createAuth() {
  return betterAuth({
    appName: "Aiguille",
    baseURL: getSiteUrl(),
    // BETTER_AUTH_SECRET : signe les cookies de session (obligatoire en production).
    secret: process.env.BETTER_AUTH_SECRET,
    database: drizzleAdapter(getDb(), {
      provider: "pg",
      usePlural: true,
      schema: { users, sessions, accounts, verifications },
    }),
    // Connexion Google et GitHub uniquement (docs/decisions.md) : ni mot de passe ni e-mail envoyé.
    socialProviders: configuredProviders(),
    // Suppression du compte en libre-service (page /compte, droit à l'effacement du RGPD).
    // Better Auth l'exige sur une session récente (moins d'un jour) ; sinon, se reconnecter.
    // Ses avis partent avec le compte (suppression en cascade) : notes recalculées.
    user: {
      deleteUser: {
        enabled: true,
        afterDelete: async () => {
          await refreshScores(getDb());
          revalidateTag("catalog", "max");
        },
      },
    },
    session: {
      expiresIn: 60 * 60 * 24 * 30,
      // Lecture de session sans requête en base pendant 5 minutes (cookie signé).
      cookieCache: { enabled: true, maxAge: 5 * 60 },
    },
    telemetry: { enabled: false },
  });
}

let auth: ReturnType<typeof createAuth> | undefined;

/**
 * Instance Better Auth créée à la première requête : le build Next.js n'a besoin ni de la base
 * ni des secrets.
 */
export function getAuth() {
  auth ??= createAuth();
  return auth;
}
