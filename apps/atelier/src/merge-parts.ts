import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

/** Pièces fixes d'un même boîtier : conserver le relief avec moins d'appels de dessin. */
export function mergeWatchParts(root: THREE.Group) {
  root.updateWorldMatrix(true, true);
  const inverse = root.matrixWorld.clone().invert();
  const sources: THREE.Mesh<THREE.BufferGeometry, THREE.Material>[] = [];
  const groups = new Map<THREE.Material, THREE.BufferGeometry[]>();
  root.traverse((object) => {
    if (!(object instanceof THREE.Mesh) || Array.isArray(object.material)) return;
    sources.push(object);
    const geometry = object.geometry.clone();
    const matrix = new THREE.Matrix4().multiplyMatrices(inverse, object.matrixWorld);
    const count = geometry.getAttribute("position").count;
    if (!geometry.getAttribute("uv"))
      geometry.setAttribute("uv", new THREE.Float32BufferAttribute(new Float32Array(count * 2), 2));
    if (!geometry.index) geometry.setIndex(Array.from({ length: count }, (_, i) => i));
    // Une corne réfléchie a une orientation inverse : corriger aussi l'ordre des sommets.
    if (matrix.determinant() < 0) {
      const index = geometry.index!;
      for (let i = 0; i < index.count; i += 3) {
        const first = index.getX(i);
        index.setX(i, index.getX(i + 1));
        index.setX(i + 1, first);
      }
    }
    geometry.applyMatrix4(matrix);
    const parts = groups.get(object.material) ?? [];
    parts.push(geometry);
    groups.set(object.material, parts);
  });
  const merged: THREE.Mesh[] = [];
  for (const [material, parts] of groups) {
    const geometry = mergeGeometries(parts);
    parts.forEach((part) => part.dispose());
    if (!geometry) throw new Error("Regroupement des pièces du boîtier incompatible");
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = "Pièces fixes regroupées par matière";
    merged.push(mesh);
  }
  const originals = new Set(sources.map((source) => source.geometry));
  sources.forEach((source) => source.removeFromParent());
  originals.forEach((geometry) => geometry.dispose());
  root.add(...merged);
}
