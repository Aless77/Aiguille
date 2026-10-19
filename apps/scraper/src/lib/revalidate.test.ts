import { afterEach, describe, expect, it, vi } from "vitest";

import { revalidateSite } from "./revalidate.ts";

describe("revalidateSite", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("appelle la route d'invalidation avec le secret", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await revalidateSite({ SITE_URL: "https://aiguille.test/", REVALIDATE_SECRET: "s3cret" });

    expect(fetchMock).toHaveBeenCalledWith("https://aiguille.test/api/revalidate", {
      method: "POST",
      headers: { authorization: "Bearer s3cret" },
    });
  });

  it("ne fait rien sans configuration", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await revalidateSite({});
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("n'échoue pas si le site ne répond pas", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("réseau")));
    await expect(
      revalidateSite({ SITE_URL: "https://aiguille.test", REVALIDATE_SECRET: "s" }),
    ).resolves.toBeUndefined();
  });
});
