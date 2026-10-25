"use client";

import { inferAdditionalFields } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

/** Client Better Auth côté navigateur : même origine que le site (/api/auth). */
export const authClient = createAuthClient({
  // Même déclaration que user.additionalFields côté serveur (lib/auth/server.ts).
  plugins: [inferAdditionalFields({ user: { country: { type: "string", required: false } } })],
});
