import { describe, expect, it, vi } from "vitest";

import { createDomainThrottle, createThrottle } from "./throttle.ts";

describe("createThrottle", () => {
  it("partage le délai entre files d'un même domaine sans bloquer les autres sites", async () => {
    vi.useFakeTimers();
    try {
      const throttle = createDomainThrottle();
      const starts: Record<string, number> = {};
      const jobs = [
        throttle("https://example.com/robots.txt", 4000).then(() => (starts.robots = Date.now())),
        throttle("https://example.com/sitemap.xml", 4000).then(() => (starts.sitemap = Date.now())),
        throttle("https://example.com/en/product", 4000).then(() => (starts.product = Date.now())),
        throttle("https://other.example/robots.txt", 4000).then(() => (starts.other = Date.now())),
      ];
      await vi.runAllTimersAsync();
      await Promise.all(jobs);
      expect(starts.sitemap! - starts.robots!).toBeGreaterThanOrEqual(4000);
      expect(starts.product! - starts.sitemap!).toBeGreaterThanOrEqual(4000);
      expect(starts.other).toBe(starts.robots);
    } finally {
      vi.useRealTimers();
    }
  });
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
