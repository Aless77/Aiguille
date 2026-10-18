import { describe, expect, it, vi } from "vitest";

import { createThrottle } from "./throttle.ts";

describe("createThrottle", () => {
  it("espace les départs d'au moins l'intervalle demandé", async () => {
    vi.useFakeTimers();
    const throttle = createThrottle(4000);
    const starts: number[] = [];

    for (let i = 0; i < 3; i++) {
      const done = throttle().then(() => starts.push(Date.now()));
      await vi.runAllTimersAsync();
      await done;
    }

    expect(starts[1]! - starts[0]!).toBeGreaterThanOrEqual(4000);
    expect(starts[2]! - starts[1]!).toBeGreaterThanOrEqual(4000);
    vi.useRealTimers();
  });

  it("ne fait pas attendre la première requête", async () => {
    const throttle = createThrottle(60_000);
    const t0 = Date.now();
    await throttle();
    expect(Date.now() - t0).toBeLessThan(50);
  });
});
