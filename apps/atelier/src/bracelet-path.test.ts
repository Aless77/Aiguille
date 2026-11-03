import { describe, expect, it } from "vitest";
import { braceletFrame, braceletLayout } from "./bracelet-path";

describe("assemblage du bracelet", () => {
  it("garde un pas régulier au sommet et sur les flancs de l'ellipse", () => {
    const layout = braceletLayout(0.65, Math.PI * 2 - 0.65, 0.34);
    const distances = Array.from({ length: layout.count }, (_, i) => {
      const a = braceletFrame(layout.angleAt(i * layout.pitch));
      const b = braceletFrame(layout.angleAt((i + 1) * layout.pitch));
      return Math.hypot(a.y - b.y, a.z - b.z);
    });
    expect(Math.max(...distances) - Math.min(...distances)).toBeLessThan(0.003);
    expect(Math.min(...distances)).toBeGreaterThan(0.32);
  });

  it("conserve les deux extrémités entre les cornes et leur symétrie", () => {
    const start = 0.65;
    const end = Math.PI * 2 - start;
    const layout = braceletLayout(start, end, 0.34);
    expect(layout.angleAt(0)).toBeCloseTo(start, 10);
    expect(layout.angleAt(layout.length)).toBeCloseTo(end, 10);
    const top = braceletFrame(layout.angleAt(0));
    const bottom = braceletFrame(layout.angleAt(layout.length));
    expect(top.y).toBeCloseTo(-bottom.y, 10);
    expect(top.z).toBeCloseTo(bottom.z, 10);
    expect(Math.hypot(top.normalY, top.normalZ)).toBeCloseTo(1, 10);
  });

  it("refuse un pas nul ou un intervalle inversé", () => {
    expect(() => braceletLayout(1, 2, 0)).toThrow();
    expect(() => braceletLayout(2, 1, 0.3)).toThrow();
    expect(() => braceletLayout(0, Infinity, 0.3)).toThrow();
  });
});
