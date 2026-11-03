import { expect, it } from "vitest";
import * as THREE from "three";
import { mergeWatchParts } from "./merge-parts";

it("regroupe les pièces sans déplacer les volumes ni retourner les faces des cornes symétriques", () => {
  const root = new THREE.Group();
  root.position.set(3, 2, -1);
  root.rotation.z = 0.2;
  const material = new THREE.MeshStandardMaterial();
  const parent = new THREE.Group();
  parent.position.y = 2;
  parent.rotation.x = 0.3;
  root.add(parent);
  for (const side of [-1, 1]) {
    const piece = new THREE.Mesh(new THREE.BoxGeometry(1, 2, 0.4), material);
    piece.position.x = side * 2;
    piece.scale.x = side;
    parent.add(piece);
  }
  const before = new THREE.Box3().setFromObject(root);
  mergeWatchParts(root);
  const after = new THREE.Box3().setFromObject(root, true);
  expect(after.min.distanceTo(before.min)).toBeLessThan(0.00001);
  expect(after.max.distanceTo(before.max)).toBeLessThan(0.00001);
  const mesh = root.children.find((part) => part instanceof THREE.Mesh) as THREE.Mesh;
  expect(mesh.geometry.index!.count).toBe(72);
  const positions = mesh.geometry.getAttribute("position");
  const normals = mesh.geometry.getAttribute("normal");
  const index = mesh.geometry.index!;
  for (let i = 0; i < index.count; i += 3) {
    const a = new THREE.Vector3().fromBufferAttribute(positions, index.getX(i));
    const b = new THREE.Vector3().fromBufferAttribute(positions, index.getX(i + 1));
    const c = new THREE.Vector3().fromBufferAttribute(positions, index.getX(i + 2));
    const normal = new THREE.Vector3().fromBufferAttribute(normals, index.getX(i));
    expect(b.sub(a).cross(c.sub(a)).dot(normal)).toBeGreaterThan(0);
  }
  mesh.geometry.dispose();
  material.dispose();
});
