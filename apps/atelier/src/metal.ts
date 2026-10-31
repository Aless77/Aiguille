import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { braceletFrame, braceletLayout } from "./bracelet-path";

/** Bracelet à trois maillons, raccords pleins et fermoir déployant fermé. */
export function createMetalBracelet() {
  const group = new THREE.Group();
  group.name = "Bracelet à trois maillons articulés";
  const brushed = new THREE.MeshStandardMaterial({
    color: 0x1d2022,
    metalness: 1,
    roughness: 0.38,
  });
  const bevel = new THREE.MeshStandardMaterial({ color: 0x292c2e, metalness: 1, roughness: 0.2 });
  const centerFinish = new THREE.MeshStandardMaterial({
    color: 0x242729,
    metalness: 1,
    roughness: 0.3,
  });
  const recess = new THREE.MeshStandardMaterial({
    color: 0x050606,
    metalness: 0.6,
    roughness: 0.6,
  });
  const layout = braceletLayout(0.65, Math.PI * 2 - 0.65, 0.34);
  const parts = new Map<THREE.Material, THREE.BufferGeometry[]>();
  function add(geometry: THREE.BufferGeometry, material: THREE.Material, matrix: THREE.Matrix4) {
    const list = parts.get(material) ?? [];
    const normalized = geometry.index ? geometry.toNonIndexed() : geometry;
    if (normalized !== geometry) geometry.dispose();
    normalized.applyMatrix4(matrix);
    list.push(normalized);
    parts.set(material, list);
  }
  function transform(angle: number, x: number, along: number, depth: number) {
    const f = braceletFrame(angle);
    return new THREE.Matrix4()
      .compose(
        new THREE.Vector3(x, f.y, f.z),
        new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), f.rotation),
        new THREE.Vector3(1, 1, 1),
      )
      .multiply(new THREE.Matrix4().makeTranslation(0, along, depth));
  }
  function box(
    angle: number,
    x: number,
    along: number,
    depth: number,
    width: number,
    length: number,
    thickness: number,
    material: THREE.Material,
    radius = 0.025,
  ) {
    add(
      new RoundedBoxGeometry(width, length, thickness, 3, radius),
      material,
      transform(angle, x, along, depth),
    );
  }
  function link(angle: number, x: number, width: number, length: number, material: THREE.Material) {
    // Chanfreins réels, face supérieure plane : les petits filets polis ne sont pas des surcouches.
    const shape = new THREE.Shape();
    const r = 0.035;
    const w = width / 2 - r;
    const h = length / 2 - r;
    shape.moveTo(-w + r, -h);
    shape.lineTo(w - r, -h);
    shape.quadraticCurveTo(w, -h, w, -h + r);
    shape.lineTo(w, h - r);
    shape.quadraticCurveTo(w, h, w - r, h);
    shape.lineTo(-w + r, h);
    shape.quadraticCurveTo(-w, h, -w, h - r);
    shape.lineTo(-w, -h + r);
    shape.quadraticCurveTo(-w, -h, -w + r, -h);
    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth: 0.105,
      bevelEnabled: true,
      bevelThickness: 0.027,
      bevelSize: r,
      bevelSegments: 2,
      curveSegments: 3,
    });
    const matrix = transform(angle, x, 0, -0.0525);
    // Séparer les faces et les chants pour partager les mêmes géométries regroupées.
    const nonIndexed = geometry.index ? geometry.toNonIndexed() : geometry;
    for (const item of nonIndexed.groups) {
      const chunk = new THREE.BufferGeometry();
      for (const name of ["position", "normal", "uv"]) {
        const attribute = nonIndexed.getAttribute(name);
        const values = attribute.array.slice(
          item.start * attribute.itemSize,
          (item.start + item.count) * attribute.itemSize,
        );
        chunk.setAttribute(name, new THREE.BufferAttribute(values, attribute.itemSize));
      }
      add(chunk, item.materialIndex === 0 ? material : bevel, matrix);
    }
    if (nonIndexed !== geometry) nonIndexed.dispose();
    geometry.dispose();
  }
  const halfClasp = 0.94;
  function curvedPlate(
    from: number,
    to: number,
    width: number,
    thickness: number,
    depth: number,
    material: THREE.Material,
  ) {
    const positions: number[] = [];
    const uv: number[] = [];
    const indices: number[] = [];
    const w = width / 2;
    const h = thickness / 2;
    const r = Math.min(0.025, thickness / 4);
    const section = [
      [-w + r, -h],
      [w - r, -h],
      [w, -h + r],
      [w, h - r],
      [w - r, h],
      [-w + r, h],
      [-w, h - r],
      [-w, -h + r],
    ];
    const steps = 40;
    for (let i = 0; i <= steps; i++) {
      const angle = layout.angleAt(THREE.MathUtils.lerp(from, to, i / steps));
      const f = braceletFrame(angle);
      for (let j = 0; j <= 8; j++) {
        const [x, z] = section[j % 8]!;
        positions.push(x!, f.y + f.normalY * (z! + depth), f.z + f.normalZ * (z! + depth));
        uv.push(j / 8, i / steps);
        if (i < steps && j < 8) {
          const a = i * 9 + j;
          const b = a + 9;
          indices.push(a, b, a + 1, a + 1, b, b + 1);
        }
      }
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    add(geometry, material, new THREE.Matrix4());
  }
  for (let i = 0; i < layout.count; i++) {
    const distance = (i + 0.5) * layout.pitch;
    if (Math.abs(distance - layout.length / 2) < halfClasp) continue;
    const angle = layout.angleAt(distance);
    const taper = THREE.MathUtils.smoothstep(Math.min(distance, layout.length - distance), 0, 3.5);
    const width = THREE.MathUtils.lerp(2.08, 1.72, taper);
    for (const side of [-1, 1])
      link(angle, side * width * 0.355, width * 0.29, layout.pitch * 0.9, brushed);
    const centerDistance = distance + layout.pitch * 0.5;
    if (
      Math.abs(centerDistance - layout.length / 2) >= halfClasp &&
      centerDistance < layout.length - 0.06
    )
      link(layout.angleAt(centerDistance), 0, width * 0.39, layout.pitch * 0.91, centerFinish);
    // Axe reliant les maillons, porté sous les faces ; extrémités visibles sur les flancs.
    const pinGeometry = new THREE.CylinderGeometry(0.032, 0.032, width + 0.005, 12);
    pinGeometry.rotateZ(Math.PI / 2);
    add(pinGeometry, recess, transform(angle, 0, layout.pitch * 0.38, -0.04));
    for (const side of [-1, 1]) {
      const head = new THREE.CylinderGeometry(0.038, 0.038, 0.008, 16);
      head.rotateZ(Math.PI / 2);
      add(head, bevel, transform(angle, side * (width / 2 + 0.008), layout.pitch * 0.38, -0.04));
    }
  }
  // Maillons de bout élargis, jointifs avec la carrure et la première articulation.
  for (const end of [0, layout.length]) {
    const angle = layout.angleAt(end);
    const direction = end === 0 ? -1 : 1;
    box(angle, 0, direction * 0.13, -0.01, 2.12, 0.38, 0.22, brushed, 0.045);
    box(angle, 0, -direction * 0.07, 0.085, 0.79, 0.25, 0.05, centerFinish, 0.015);
    for (const side of [-1, 1])
      box(angle, side * 0.43, direction * 0.1, 0.105, 0.018, 0.24, 0.009, recess, 0.004);
  }
  // Coque continue du fermoir : pas de superposition de petites plaques.
  const mid = layout.length / 2;
  curvedPlate(mid - halfClasp, mid + halfClasp, 1.74, 0.16, 0.018, brushed);
  curvedPlate(mid - halfClasp + 0.12, mid + halfClasp - 0.12, 1.23, 0.04, -0.14, bevel);
  const claspAngle = layout.angleAt(mid);
  for (const side of [-1, 1]) {
    const angle = layout.angleAt(mid + side * (halfClasp + 0.1));
    box(angle, 0, 0, -0.01, 0.66, 0.34, 0.12, centerFinish, 0.025);
    const hinge = new THREE.CylinderGeometry(0.045, 0.045, 1.74, 16);
    hinge.rotateZ(Math.PI / 2);
    add(hinge, bevel, transform(angle, 0, -side * 0.09, -0.06));
  }
  for (const side of [-1, 1]) {
    box(claspAngle, side * 0.915, 0, -0.015, 0.12, 0.47, 0.12, bevel, 0.03);
    box(claspAngle, side * 0.925, 0, -0.015, 0.025, 0.26, 0.045, recess, 0.01);
  }
  for (const end of [-1, 1])
    box(
      layout.angleAt(mid + end * (halfClasp - 0.025)),
      0,
      0,
      0.11,
      1.6,
      0.024,
      0.014,
      recess,
      0.005,
    );
  // Regroupement par matière : le nombre de maillons n'ajoute pas autant d'appels de rendu.
  for (const [material, geometries] of parts) {
    const geometry = mergeGeometries(geometries);
    if (!geometry) throw new Error("Assemblage des maillons incompatible");
    group.add(new THREE.Mesh(geometry, material));
    geometries.forEach((item) => item.dispose());
  }
  return group;
}
