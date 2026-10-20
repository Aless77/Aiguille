"use client";

import { createAuthClient } from "better-auth/react";

/** Client Better Auth côté navigateur : même origine que le site (/api/auth). */
export const authClient = createAuthClient();
