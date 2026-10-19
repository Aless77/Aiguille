import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const revalidateTag = vi.fn();
vi.mock("next/cache", () => ({ revalidateTag }));

const { POST } = await import("./route");

const call = (authorization?: string) =>
  POST(
    new Request("http://localhost/api/revalidate", {
      method: "POST",
      headers: authorization ? { authorization } : {},
    }),
  );

describe("POST /api/revalidate", () => {
  beforeEach(() => {
    process.env.REVALIDATE_SECRET = "secret-de-test";
    revalidateTag.mockClear();
  });
  afterEach(() => {
    delete process.env.REVALIDATE_SECRET;
  });

  it("invalide le catalogue avec le bon secret", async () => {
    const response = await call("Bearer secret-de-test");
    expect(response.status).toBe(200);
    expect(revalidateTag).toHaveBeenCalledWith("catalog", "max");
  });

  it("refuse un secret absent ou faux", async () => {
    expect((await call()).status).toBe(401);
    expect((await call("Bearer mauvais")).status).toBe(401);
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  it("refuse tout si le secret n'est pas configuré", async () => {
    delete process.env.REVALIDATE_SECRET;
    expect((await call("Bearer ")).status).toBe(401);
  });
});
