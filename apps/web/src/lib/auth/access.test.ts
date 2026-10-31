import { beforeEach, describe, expect, it, vi } from "vitest";

const getSession = vi.fn();
const where = vi.fn();
vi.mock("server-only", () => ({}));
vi.mock("./server", () => ({ getAuth: () => ({ api: { getSession } }) }));
vi.mock("@aiguille/db", () => ({
  accessRequests: { userId: "user_id" },
  getDb: () => ({ select: () => ({ from: () => ({ where }) }) }),
}));
const { approvedSession } = await import("./access");

describe("autorisation des membres", () => {
  const session = { user: { id: "membre" } };
  beforeEach(() => {
    getSession.mockReset().mockResolvedValue(session);
    where.mockReset();
  });
  it("refuse les visiteurs sans session", async () => {
    getSession.mockResolvedValue(null);
    expect(await approvedSession(new Headers())).toBeNull();
    expect(where).not.toHaveBeenCalled();
  });
  it("refuse les anciens comptes sans demande et les comptes en attente ou refusés", async () => {
    for (const rows of [[], [{ status: "pending" }], [{ status: "rejected" }]]) {
      where.mockResolvedValueOnce(rows);
      expect(await approvedSession(new Headers())).toBeNull();
    }
  });
  it("autorise uniquement la décision approuvée et relit les révocations", async () => {
    where
      .mockResolvedValueOnce([{ status: "approved" }])
      .mockResolvedValueOnce([{ status: "rejected" }]);
    expect(await approvedSession(new Headers())).toBe(session);
    expect(await approvedSession(new Headers())).toBeNull();
    expect(getSession).toHaveBeenCalledWith({
      headers: expect.any(Headers),
      query: { disableCookieCache: true },
    });
  });
});
