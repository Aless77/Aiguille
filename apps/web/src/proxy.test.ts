import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const approvedSession = vi.fn();
const validAdminToken = vi.fn();
vi.mock("@/lib/auth/access", () => ({ approvedSession }));
vi.mock("@/lib/auth/admin-token", () => ({ ADMIN_COOKIE: "aiguille-admin", validAdminToken }));
const { proxy } = await import("./proxy");
const visit = (path: string) => proxy(new NextRequest(`http://localhost:3000${path}`));

describe("accès au site privé", () => {
  beforeEach(() => {
    approvedSession.mockReset().mockResolvedValue(null);
    validAdminToken.mockReset().mockReturnValue(false);
    vi.stubEnv("LANGUAGES", "fr,en,de");
    vi.stubEnv("ADMIN_ACCESS_PATH", "/gestion-acces-test-confidentiel");
  });
  afterEach(() => vi.unstubAllEnvs());
  it("bloque le catalogue, les listes partagées, les pages de données et les images dynamiques", async () => {
    for (const path of [
      "/",
      "/montres",
      "/listes/partage",
      "/prix-en-europe",
      "/opengraph-image",
      "/montres/reference.123",
      "/en/montres",
    ]) {
      const response = await visit(path);
      expect(response.status).toBe(307);
      expect(response.headers.get("location")).toContain("/demande-acces");
    }
  });
  it("refuse aussi les API sans compte approuvé", async () => {
    expect((await visit("/api/avis?montre=1")).status).toBe(403);
    expect((await visit("/api/listes/123")).status).toBe(403);
  });
  it("conserve les parcours de demande, connexion, compte et confidentialité accessibles", async () => {
    for (const path of [
      "/connexion",
      "/demande-acces",
      "/gestion-acces-test-confidentiel",
      "/confidentialite",
      "/compte",
      "/en/demande-acces",
      "/api/auth/get-session",
      "/api/revalidate",
      "/robots.txt",
      "/sitemap.xml",
    ]) {
      expect((await visit(path)).status).toBe(200);
    }
    expect(approvedSession).not.toHaveBeenCalled();
  });
  it("masque l'ancienne adresse et ne propose aucune redirection vers l'adresse privée", async () => {
    for (const path of ["/administration", "/fr/administration", "/en/administration"]) {
      const response = await visit(path);
      expect(response.status).toBe(404);
      expect(response.headers.get("location")).toBeNull();
    }
  });
  it("réécrit uniquement l'adresse configurée et refuse les marqueurs forgés", async () => {
    const response = await visit("/gestion-acces-test-confidentiel");
    expect(response.headers.get("x-middleware-rewrite")).toContain("/fr/administration");
    expect(response.headers.get("x-middleware-request-x-aiguille-admin-entry")).toBe("1");
    const forged = await proxy(
      new NextRequest("http://localhost:3000/connexion", {
        headers: { "x-aiguille-admin-entry": "1" },
      }),
    );
    expect(forged.headers.get("x-middleware-request-x-aiguille-admin-entry")).toBeNull();
    vi.stubEnv("ADMIN_ACCESS_PATH", "");
    expect((await visit("/gestion-acces-test-confidentiel")).status).toBe(307);
  });
  it("autorise un membre approuvé et vérifie à nouveau chaque requête", async () => {
    approvedSession.mockResolvedValueOnce({ user: { id: "membre" } });
    expect((await visit("/montres")).headers.get("x-middleware-rewrite")).toContain("/fr/montres");
    expect((await visit("/montres")).status).toBe(307);
  });
  it("autorise l'administrateur et conserve la redirection canonique française", async () => {
    validAdminToken.mockReturnValue(true);
    expect((await visit("/montres")).status).toBe(200);
    expect((await visit("/fr/montres")).status).toBe(308);
    expect(approvedSession).not.toHaveBeenCalled();
  });
});
