import { describe, expect, it } from "vitest";
import { createCrystalGeometry, createHandGeometry } from "./optics";

describe("pièces optiques de la montre", () => {
  it("place un bombé fermé au-dessus des aiguilles, avec des normales orientées vers l’extérieur", () => {
    const geometry = createCrystalGeometry();
    geometry.computeBoundingBox();
    const bounds = geometry.boundingBox!;
    expect(bounds.min.z).toBeGreaterThan(0.57);
    expect(bounds.max.z - bounds.min.z).toBeGreaterThan(0.1);
    expect(bounds.max.x - bounds.min.x).toBeCloseTo(3.61, 2);
    const position = geometry.getAttribute("position");
    const normal = geometry.getAttribute("normal");
    let top = 0;
    let bottom = 0;
    for (let i = 0; i < position.count; i++) {
      if (position.getZ(i) > bounds.max.z - 0.001) {
        expect(normal.getZ(i)).toBeGreaterThan(0.99);
        top++;
      }
      if (Math.hypot(position.getX(i), position.getY(i)) < 0.001 && position.getZ(i) < 0.6) {
        expect(normal.getZ(i)).toBeLessThan(-0.99);
        bottom++;
      }
    }
    expect(top).toBeGreaterThan(0);
    expect(bottom).toBeGreaterThan(0);
    geometry.dispose();
  });

  it("donne aux deux facettes de l’aiguille des normales différentes et conserve son épaisseur", () => {
    const geometry = createHandGeometry(1.46, 0.048);
    const normal = geometry.getAttribute("normal");
    const topNormals = [];
    for (let i = 0; i < normal.count; i++)
      if (normal.getZ(i) > 0.5) topNormals.push(normal.getX(i));
    expect(Math.min(...topNormals)).toBeLessThan(-0.5);
    expect(Math.max(...topNormals)).toBeGreaterThan(0.5);
    // Chaque arête appartient à deux faces : pas de trou derrière le talon surélevé.
    const position = geometry.getAttribute("position");
    const edges = new Map<string, number>();
    const point = (i: number) =>
      [position.getX(i), position.getY(i), position.getZ(i)].map((v) => v.toFixed(6)).join(",");
    for (let i = 0; i < position.count; i += 3) {
      for (let j = 0; j < 3; j++) {
        const edge = [point(i + j), point(i + ((j + 1) % 3))].sort().join("/");
        edges.set(edge, (edges.get(edge) ?? 0) + 1);
      }
    }
    expect([...edges.values()].every((count) => count === 2)).toBe(true);
    geometry.computeBoundingBox();
    expect(geometry.boundingBox!.max.z - geometry.boundingBox!.min.z).toBeGreaterThan(0.05);
    geometry.dispose();
  });
});
