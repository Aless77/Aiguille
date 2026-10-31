import { expect, it } from "vitest";
import * as THREE from "three";
import { createMetalBracelet } from "./metal";

it("assemble les trois rangs et le fermoir sans perdre de pièce au regroupement", () => {
  const bracelet = createMetalBracelet();
  const bounds = new THREE.Box3().setFromObject(bracelet);
  const size = bounds.getSize(new THREE.Vector3());
  expect(size.x).toBeGreaterThan(2.1);
  expect(size.y).toBeGreaterThan(7.2);
  expect(size.z).toBeGreaterThan(3.5);
  expect(bracelet.children).toHaveLength(4);
  bracelet.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    for (const name of ["position", "normal"]) {
      const values = object.geometry.getAttribute(name).array;
      expect([...values].every(Number.isFinite)).toBe(true);
    }
    object.geometry.dispose();
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    materials.forEach((material: THREE.Material) => material.dispose());
  });
});
