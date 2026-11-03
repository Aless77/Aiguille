type Env = Record<string, string | undefined>;

/** Adresse privée définie côté serveur, sans valeur par défaut ni lien public. */
export function getAdminAccessPath(env: Env = process.env): string | null {
  const path = env.ADMIN_ACCESS_PATH;
  return path && /^\/[a-z0-9][a-z0-9-]{15,79}$/.test(path) ? path : null;
}

export const ADMIN_ENTRY_HEADER = "x-aiguille-admin-entry";
