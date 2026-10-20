import { getAuth } from "@/lib/auth/server";

/** Routes Better Auth : connexion OAuth, rappel du fournisseur, session, déconnexion. */
export async function GET(request: Request) {
  return getAuth().handler(request);
}

export async function POST(request: Request) {
  return getAuth().handler(request);
}
