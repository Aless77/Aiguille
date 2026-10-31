import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { createLeatherStrap } from "./leather";
import { createMetalBracelet } from "./metal";

export type WatchModel = "metal" | "leather";

// Unité de travail : environ 10 mm. Les dimensions restent des intentions de design.
export function createWatch(model: WatchModel, invalidate: () => void = () => {}) {
  const watch = new THREE.Group();
  const textures: THREE.Texture[] = [];
  const black = new THREE.MeshStandardMaterial({ color: 0x202326, metalness: 1, roughness: 0.32 });
  const polished = new THREE.MeshStandardMaterial({
    color: 0x333638,
    metalness: 1,
    roughness: 0.13,
  });
  const gold = new THREE.MeshStandardMaterial({ color: 0xc6a16a, metalness: 0.8, roughness: 0.28 });
  const goldEdge = new THREE.MeshStandardMaterial({
    color: 0xe6c78f,
    metalness: 0.85,
    roughness: 0.19,
  });
  const back = new THREE.MeshStandardMaterial({ color: 0x151819, metalness: 0.9, roughness: 0.45 });

  function texture(kind: "dial" | "leather") {
    const size = 512;
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext("2d")!;
    // Bruit déterministe : le grain ne change pas au changement de modèle.
    let seed = 38;
    const random = () => {
      seed = (seed * 16807) % 2147483647;
      return seed / 2147483647;
    };
    const image = ctx.createImageData(size, size);
    for (let x = 0; x < size; x++) {
      const stripe = random();
      for (let y = 0; y < size; y++) {
        const value =
          kind === "dial" && model === "metal"
            ? 90 + stripe * 80 + random() * 12
            : 80 + random() * 90;
        const i = (y * size + x) * 4;
        image.data[i] = image.data[i + 1] = image.data[i + 2] = value;
        image.data[i + 3] = 255;
      }
    }
    ctx.putImageData(image, 0, 0);
    const map = new THREE.CanvasTexture(canvas);
    map.wrapS = map.wrapT = THREE.RepeatWrapping;
    textures.push(map);
    return map;
  }

  function mesh(
    geometry: THREE.BufferGeometry,
    material: THREE.Material,
    x = 0,
    y = 0,
    z = 0,
    parent: THREE.Object3D = watch,
  ) {
    const item = new THREE.Mesh(geometry, material);
    item.position.set(x, y, z);
    parent.add(item);
    return item;
  }
  function box(
    w: number,
    h: number,
    d: number,
    material: THREE.Material,
    x: number,
    y: number,
    z: number,
    radius = 0.04,
    parent = watch,
  ) {
    return mesh(new RoundedBoxGeometry(w, h, d, 3, radius), material, x, y, z, parent);
  }
  function disk(radius: number, depth: number, z: number, material: THREE.Material) {
    const item = mesh(new THREE.CylinderGeometry(radius, radius, depth, 128), material, 0, 0, z);
    item.rotation.x = Math.PI / 2;
    return item;
  }
  function ring(radius: number, width: number, z: number, material: THREE.Material) {
    return mesh(new THREE.TorusGeometry(radius, width, 12, 160), material, 0, 0, z);
  }

  // Carrure et lunette tournées : plusieurs biseaux donnent un reflet propre aux arêtes.
  const profile = [
    new THREE.Vector2(0, -0.32),
    new THREE.Vector2(1.95, -0.32),
    new THREE.Vector2(2.06, -0.24),
    new THREE.Vector2(2.09, 0.04),
    new THREE.Vector2(2.05, 0.18),
    new THREE.Vector2(1.98, 0.24),
    new THREE.Vector2(0, 0.24),
  ];
  const body = mesh(new THREE.LatheGeometry(profile, 128), black);
  body.rotation.x = Math.PI / 2;
  if (model === "leather") body.scale.y = 0.75;
  if (model === "metal") {
    const shoulders = new THREE.Shape();
    shoulders.moveTo(-1.12, 2.16);
    shoulders.lineTo(1.12, 2.16);
    shoulders.quadraticCurveTo(1.37, 2.06, 1.86, 1.2);
    shoulders.quadraticCurveTo(2.29, 0, 1.86, -1.2);
    shoulders.quadraticCurveTo(1.37, -2.06, 1.12, -2.16);
    shoulders.lineTo(-1.12, -2.16);
    shoulders.quadraticCurveTo(-1.37, -2.06, -1.86, -1.2);
    shoulders.quadraticCurveTo(-2.29, 0, -1.86, 1.2);
    shoulders.quadraticCurveTo(-1.37, 2.06, -1.12, 2.16);
    mesh(
      new THREE.ExtrudeGeometry(shoulders, {
        depth: 0.35,
        bevelEnabled: true,
        bevelThickness: 0.06,
        bevelSize: 0.06,
        bevelSegments: 3,
        curveSegments: 24,
      }),
      black,
      0,
      0,
      -0.27,
    );
  }
  disk(1.94, 0.07, -0.37, back);
  ring(1.91, 0.025, -0.41, polished);
  disk(1.86, 0.12, 0.26, black);
  ring(1.92, 0.085, 0.31, black);
  ring(1.99, 0.018, 0.28, polished);
  ring(1.82, 0.018, 0.36, polished);
  const dialTexture = texture("dial");
  const dialMaterial = new THREE.MeshStandardMaterial({
    color: model === "metal" ? 0x060708 : 0x050606,
    metalness: model === "metal" ? 0.1 : 0,
    roughness: 0.72,
    bumpMap: dialTexture,
    bumpScale: model === "metal" ? 0.003 : 0.008,
  });
  disk(1.8, 0.035, 0.31, dialMaterial);

  // Cornes effilées et plongeantes : le cuir rejoint les barrettes sous le boîtier.
  if (model === "leather")
    for (const side of [-1, 1])
      for (const flank of [-1, 1]) {
        const shape = new THREE.Shape();
        shape.moveTo(0.94, 1.59);
        shape.quadraticCurveTo(1.19, 1.59, 1.29, 1.76);
        shape.lineTo(1.17, 2.37);
        shape.quadraticCurveTo(1.06, 2.45, 0.98, 2.35);
        shape.lineTo(0.9, 1.81);
        shape.closePath();
        const geometry = new THREE.ExtrudeGeometry(shape, {
          depth: 0.2,
          bevelEnabled: true,
          bevelSize: 0.035,
          bevelThickness: 0.035,
          bevelSegments: 3,
          curveSegments: 12,
        });
        const vertices = geometry.getAttribute("position");
        for (let i = 0; i < vertices.count; i++)
          vertices.setZ(
            i,
            vertices.getZ(i) - THREE.MathUtils.smoothstep(vertices.getY(i), 1.65, 2.4) * 0.16,
          );
        geometry.computeVertexNormals();
        const lug = mesh(geometry, black, 0, 0, -0.09);
        lug.scale.set(flank, side, 1);
        const pin = mesh(
          new THREE.CylinderGeometry(0.055, 0.055, 0.1, 20),
          polished,
          flank * 1.17,
          side * 2.27,
          -0.14,
        );
        pin.rotation.z = Math.PI / 2;
      }

  // Couronne moletée et joint, orientés suivant l'axe du remontoir.
  const crown = new THREE.Group();
  crown.position.set(2.16, 0, -0.04);
  watch.add(crown);
  const crownBody = mesh(
    new THREE.CylinderGeometry(0.25, 0.25, 0.34, 64),
    polished,
    0.1,
    0,
    0,
    crown,
  );
  crownBody.rotation.z = Math.PI / 2;
  for (let i = 0; i < 44; i++) {
    const a = (i / 44) * Math.PI * 2;
    const ridge = box(
      0.28,
      0.025,
      0.035,
      black,
      0.1,
      Math.cos(a) * 0.249,
      Math.sin(a) * 0.249,
      0.008,
      crown,
    );
    ridge.rotation.x = a;
  }

  for (let i = 0; i < 60; i++) {
    const a = (i / 60) * Math.PI * 2;
    if (model === "metal") {
      const tick = box(
        0.012,
        i % 5 === 0 ? 0.065 : 0.035,
        0.008,
        gold,
        Math.sin(a) * 1.72,
        Math.cos(a) * 1.72,
        0.35,
        0.003,
      );
      tick.rotation.z = -a;
    }
    if (i % 5 === 0) {
      const marker = box(
        i === 0 ? 0.063 : 0.048,
        i % 15 === 0 ? 0.3 : 0.24,
        0.047,
        gold,
        Math.sin(a) * 1.49,
        Math.cos(a) * 1.49,
        0.37,
        0.009,
      );
      marker.rotation.z = -a;
    }
  }

  function hand(length: number, width: number, angle: number, z: number) {
    const shape = new THREE.Shape();
    shape.moveTo(-width * 0.35, -0.18);
    shape.lineTo(-width, length * 0.35);
    shape.lineTo(0, length);
    shape.lineTo(width, length * 0.35);
    shape.lineTo(width * 0.35, -0.18);
    shape.closePath();
    const item = mesh(
      new THREE.ExtrudeGeometry(shape, {
        depth: 0.022,
        bevelEnabled: true,
        bevelSize: 0.008,
        bevelThickness: 0.008,
        bevelSegments: 2,
      }),
      gold,
      0,
      0,
      z,
    );
    item.rotation.z = angle;
    // Facette supérieure légèrement plus claire, pour accrocher la lumière.
    const facet = new THREE.Shape();
    facet.moveTo(0, -0.15);
    facet.lineTo(0, length);
    facet.lineTo(width, length * 0.35);
    facet.closePath();
    const top = mesh(new THREE.ShapeGeometry(facet), goldEdge, 0, 0, 0.031, item);
    top.name = "Facette de l’aiguille";
  }
  hand(1.05, 0.067, Math.PI / 3, 0.43);
  hand(1.46, 0.048, -Math.PI / 3, 0.48);
  const seconds = new THREE.Group();
  seconds.rotation.z = Math.PI * 0.88;
  seconds.position.z = 0.55;
  watch.add(seconds);
  box(0.013, 1.91, 0.014, gold, 0, 0.64, 0, 0.004, seconds);
  disk(0.112, 0.035, 0.56, gold);
  disk(0.038, 0.038, 0.59, polished);
  // Six vis fraisées distinguent le fond de la carrure.
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const x = Math.sin(a) * 1.75;
    const y = Math.cos(a) * 1.75;
    const screw = mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.012, 20), polished, x, y, -0.415);
    screw.rotation.x = Math.PI / 2;
    const slot = box(0.055, 0.009, 0.008, back, x, y, -0.424, 0.003);
    slot.rotation.z = a + 0.4;
  }

  // Monogramme vectoriel réellement extrudé : deux lettres géométriques, sans texture de logo.
  const logo = new THREE.Group();
  logo.position.set(0, 0.96, 0.36);
  watch.add(logo);
  const stroke = (x1: number, y1: number, x2: number, y2: number) => {
    const item = box(
      0.018,
      Math.hypot(x2 - x1, y2 - y1),
      0.018,
      gold,
      (x1 + x2) / 2,
      (y1 + y2) / 2,
      0,
      0.003,
      logo,
    );
    item.rotation.z = -Math.atan2(x2 - x1, y2 - y1);
  };
  stroke(-0.19, -0.12, -0.07, 0.17);
  stroke(-0.07, 0.17, 0.05, -0.12);
  stroke(-0.145, -0.02, 0.005, -0.02);
  stroke(0.01, 0.15, 0.12, -0.14);
  stroke(0.12, -0.14, 0.23, 0.15);

  const leatherStrap = model === "leather" ? createLeatherStrap(invalidate) : undefined;
  if (leatherStrap) {
    watch.add(leatherStrap.object);
  } else {
    watch.add(createMetalBracelet());
  }
  const crystal = new THREE.MeshPhysicalMaterial({
    color: 0x050607,
    metalness: 0,
    roughness: 0.035,
    transmission: 0,
    thickness: 0.04,
    ior: 1.5,
    transparent: true,
    opacity: 0.06,
    specularIntensity: 0.25,
    depthWrite: false,
  });
  disk(1.805, 0.045, 0.68, crystal).name = "Glace";

  watch.traverse((part) => {
    if (part instanceof THREE.Mesh) {
      part.castShadow = part.name !== "Glace";
      part.receiveShadow = part.name !== "Glace";
    }
  });
  return {
    object: watch,
    dispose() {
      leatherStrap?.dispose();
      const geometries = new Set<THREE.BufferGeometry>();
      const materials = new Set<THREE.Material>([
        black,
        polished,
        gold,
        goldEdge,
        back,
        dialMaterial,

        crystal,
      ]);
      watch.traverse((item) => {
        if (item instanceof THREE.Mesh) {
          geometries.add(item.geometry);
          for (const material of Array.isArray(item.material) ? item.material : [item.material])
            materials.add(material);
        }
      });
      geometries.forEach((item) => item.dispose());
      materials.forEach((item) => item.dispose());
      if (leatherStrap) for (const texture of leatherStrap.textures) texture.dispose();
      textures.forEach((item) => item.dispose());
    },
  };
}
