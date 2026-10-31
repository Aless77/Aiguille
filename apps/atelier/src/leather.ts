import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { braceletFrame } from "./bracelet-path";

/** Deux brins bombés, cousus et doublés, assemblés autour du poignet. */
export function createLeatherStrap(invalidate: () => void) {
  const group = new THREE.Group();
  group.name = "Bracelet en cuir cousu";
  const textures: THREE.Texture[] = [];
  let disposed = false;
  const surface = new THREE.MeshPhysicalMaterial({
    color: 0x070809,
    roughness: 0.88,
    metalness: 0,
    bumpScale: 0.052,
    specularIntensity: 0.35,
  });
  const lining = new THREE.MeshStandardMaterial({ color: 0x171613, roughness: 0.98 });
  const edge = new THREE.MeshStandardMaterial({ color: 0x080808, roughness: 0.7 });
  const thread = new THREE.MeshStandardMaterial({ color: 0x49443b, roughness: 0.94 });
  const stitchWell = new THREE.MeshStandardMaterial({ color: 0x020202, roughness: 1 });
  const buckle = new THREE.MeshStandardMaterial({ color: 0x25292b, metalness: 1, roughness: 0.25 });
  const grain = new THREE.TextureLoader().load(
    new URL("./assets/black-calfskin.webp", import.meta.url).href,
    () => {
      if (disposed) return;
      // Le scan sert au relief. La rugosité reste élevée, même au fond des pores.
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = 512;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(grain.image, 0, 0, 512, 512);
      const pixels = ctx.getImageData(0, 0, 512, 512);
      const heights = new Uint8ClampedArray(pixels.data);
      const normalPixels = ctx.createImageData(512, 512);
      for (let y = 0; y < 512; y++)
        for (let x = 0; x < 512; x++) {
          const height = (u: number, v: number) =>
            heights[(((v + 512) % 512) * 512 + ((u + 512) % 512)) * 4]! / 255;
          const normal = new THREE.Vector3(
            (height(x - 1, y) - height(x + 1, y)) * 3,
            (height(x, y + 1) - height(x, y - 1)) * 3,
            1,
          ).normalize();
          const i = (y * 512 + x) * 4;
          normalPixels.data[i] = (normal.x * 0.5 + 0.5) * 255;
          normalPixels.data[i + 1] = (normal.y * 0.5 + 0.5) * 255;
          normalPixels.data[i + 2] = (normal.z * 0.5 + 0.5) * 255;
          normalPixels.data[i + 3] = 255;
        }
      const normalCanvas = document.createElement("canvas");
      normalCanvas.width = normalCanvas.height = 512;
      normalCanvas.getContext("2d")!.putImageData(normalPixels, 0, 0);
      const normalMap = new THREE.CanvasTexture(normalCanvas);
      normalMap.wrapS = normalMap.wrapT = THREE.RepeatWrapping;
      normalMap.anisotropy = 8;
      textures.push(normalMap);
      surface.normalMap = normalMap;
      surface.normalScale.set(0.8, 0.8);
      surface.bumpMap = null;
      for (let i = 0; i < pixels.data.length; i += 4) {
        const value = 205 + pixels.data[i]! * 0.18;
        pixels.data[i] = pixels.data[i + 1] = pixels.data[i + 2] = value;
      }
      ctx.putImageData(pixels, 0, 0);
      const roughness = new THREE.CanvasTexture(canvas);
      roughness.wrapS = roughness.wrapT = THREE.RepeatWrapping;
      roughness.anisotropy = 8;
      textures.push(roughness);
      surface.roughnessMap = roughness;
      surface.needsUpdate = true;
      invalidate();
    },
    undefined,
    () => {
      console.warn("Texture du cuir indisponible : matière mate conservée.");
      invalidate();
    },
  );
  grain.wrapS = grain.wrapT = THREE.RepeatWrapping;
  grain.anisotropy = 8;
  textures.push(grain);
  surface.bumpMap = grain;
  lining.bumpMap = grain;
  lining.bumpScale = 0.012;

  function frame(t: number) {
    const f = braceletFrame(t);
    const tangent = new THREE.Vector3(0, Math.cos(f.rotation), Math.sin(f.rotation));
    const normal = new THREE.Vector3(0, f.normalY, f.normalZ);
    const center = new THREE.Vector3(0, f.y, f.z);
    return { tangent, normal, center };
  }
  function point(t: number, x: number, depth: number) {
    const { center, normal } = frame(t);
    return center.addScaledVector(normal, depth).add(new THREE.Vector3(x, 0, 0));
  }
  function width(s: number, tip: boolean) {
    const half = 0.99 - Math.min(s * 1.4, 1) * 0.16;
    if (tip && s > 0.94) return half * Math.sqrt(Math.max(0.0001, 1 - ((s - 0.94) / 0.06) ** 2));
    return half;
  }
  function outerHeight(x: number, half: number) {
    return 0.203 * Math.pow(Math.max(0, 1 - (x / half) ** 2), 0.45);
  }
  function tube(points: THREE.Vector3[], radius: number, material: THREE.Material) {
    const curve = new THREE.CatmullRomCurve3(points);
    const geometries = details.get(material) ?? [];
    geometries.push(
      new THREE.TubeGeometry(curve, Math.max(4, points.length * 2), radius, 5, false),
    );
    details.set(material, geometries);
  }
  const details = new Map<THREE.Material, THREE.BufferGeometry[]>();
  function band(start: number, end: number, tip: boolean) {
    const halfWidth = (s: number) => width(tip ? s : 1 - s, tip);
    const surfacePoint = (t: number, x: number, depth: number) =>
      point(t, x, depth + (tip ? THREE.MathUtils.smoothstep(t, 2.6, 2.9) * 0.24 : 0));
    const steps = 220;
    const sides = 32;
    const positions: number[] = [];
    const uv: number[] = [];
    const indices: number[] = [];
    const inside: number[] = [];
    const geometry = new THREE.BufferGeometry();
    let length = 0;
    let previous = frame(start).center;
    for (let i = 0; i <= steps; i++) {
      const s = i / steps;
      const t = THREE.MathUtils.lerp(start, end, s);
      const half = halfWidth(s);
      const current = frame(t).center;
      length += current.distanceTo(previous);
      previous = current;
      for (let j = 0; j <= sides; j++) {
        const angle = (j / sides) * Math.PI * 2;
        const x = Math.cos(angle) * half;
        const depth = Math.sin(angle) >= 0 ? outerHeight(x, half) : Math.sin(angle) * 0.085;
        const p = surfacePoint(t, x, depth);
        positions.push(p.x, p.y, p.z);
        uv.push((x + 1) * 0.35, length * 0.35);
        if (i < steps && j < sides) {
          const a = i * (sides + 1) + j;
          const b = a + sides + 1;
          const target = j < sides / 2 ? indices : inside;
          target.push(a, b, a + 1, a + 1, b, b + 1);
        }
      }
    }
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
    geometry.addGroup(0, indices.length, 0);
    geometry.addGroup(indices.length, inside.length, 1);
    geometry.setIndex([...indices, ...inside]);
    geometry.computeVertexNormals();
    group.add(new THREE.Mesh(geometry, [surface, lining]));
    // Fermer les tranches des deux brins, y compris au départ entre les cornes.
    for (const [step, t] of [
      [0, start],
      [steps, end],
    ]) {
      const vertices: number[] = [];
      const faces: number[] = [];
      const center = surfacePoint(t!, 0, 0.04);
      vertices.push(center.x, center.y, center.z);
      for (let j = 0; j < sides; j++) {
        const index = (step! * (sides + 1) + j) * 3;
        vertices.push(positions[index]!, positions[index + 1]!, positions[index + 2]!);
        const a = j + 1;
        const b = ((j + 1) % sides) + 1;
        faces.push(...(step === 0 ? [0, a, b] : [0, b, a]));
      }
      const cap = new THREE.BufferGeometry();
      cap.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
      cap.setIndex(faces);
      cap.computeVertexNormals();
      group.add(new THREE.Mesh(cap, edge));
    }
    // Tranches teintées, rainure de couture et fil arrondi à chaque point.
    for (const side of [-1, 1]) {
      const edgePoints: THREE.Vector3[] = [];
      const groovePoints: THREE.Vector3[] = [];
      for (let i = 0; i <= 120; i++) {
        const s = i / 120;
        const t = THREE.MathUtils.lerp(start, end, s);
        const half = halfWidth(s);
        edgePoints.push(surfacePoint(t, half * side, 0.025));
        if (!tip || s < 0.94) {
          const x = (half - 0.115) * side;
          groovePoints.push(surfacePoint(t, x, outerHeight(x, half) + 0.001));
        }
      }
      tube(edgePoints, 0.023, edge);
      tube(groovePoints, 0.013, stitchWell);
      const stitchCount = Math.round(length / 0.19);
      for (let i = 1; i < stitchCount - 2; i++) {
        const s = i / stitchCount;
        if (tip && s > 0.94) continue;
        const points: THREE.Vector3[] = [];
        for (let k = 0; k <= 4; k++) {
          const u = s + ((k / 4) * 0.68) / stitchCount;
          const t = THREE.MathUtils.lerp(start, end, u);
          const half = halfWidth(u);
          const x = (half - 0.115) * side + (k / 4 - 0.5) * 0.024;
          points.push(
            surfacePoint(t, x, outerHeight(x, half) + Math.sin((k / 4) * Math.PI) * 0.012 + 0.004),
          );
        }
        tube(points, 0.008, thread);
      }
    }
  }
  // Deux brins distincts : le long passe sous la boucle et se termine par une pointe arrondie.
  band(0.56, Math.PI + 0.3, true);
  band(Math.PI - 0.42, Math.PI * 2 - 0.56, false);
  // Les points de couture sont regroupés par matière pour limiter les appels de rendu.
  for (const [material, geometries] of details) {
    const merged = mergeGeometries(geometries);
    if (merged) group.add(new THREE.Mesh(merged, material));
    geometries.forEach((geometry) => geometry.dispose());
  }

  function hardware(t: number) {
    const local = new THREE.Group();
    const { center, tangent } = frame(t);
    local.position.copy(center);
    local.rotation.x = Math.atan2(tangent.z, tangent.y);
    group.add(local);
    return local;
  }
  const clasp = hardware(Math.PI - 0.12);
  clasp.translateZ(0.24);
  const outer = new THREE.Shape();
  outer.moveTo(-1.01, -0.38);
  outer.lineTo(1.01, -0.38);
  outer.lineTo(1.01, 0.38);
  outer.lineTo(-1.01, 0.38);
  outer.closePath();
  const hole = new THREE.Path();
  hole.moveTo(-0.84, -0.24);
  hole.lineTo(-0.84, 0.24);
  hole.lineTo(0.84, 0.24);
  hole.lineTo(0.84, -0.24);
  hole.closePath();
  outer.holes.push(hole);
  const buckleMesh = new THREE.Mesh(
    new THREE.ExtrudeGeometry(outer, {
      depth: 0.07,
      bevelEnabled: true,
      bevelSize: 0.035,
      bevelThickness: 0.025,
      bevelSegments: 3,
    }),
    buckle,
  );
  buckleMesh.position.z = 0.2;
  clasp.add(buckleMesh);
  const pin = new THREE.Mesh(new RoundedBoxGeometry(0.065, 0.67, 0.06, 3, 0.025), buckle);
  pin.position.set(0, 0.01, 0.31);
  clasp.add(pin);
  // Passants en cuir, ouverts au centre : ils entourent réellement les brins.
  for (const t of [Math.PI + 0.04, Math.PI + 0.22]) {
    const keeper = hardware(t);
    keeper.translateZ(0.2);
    for (const x of [-0.9, 0.9]) {
      const wall = new THREE.Mesh(new RoundedBoxGeometry(0.1, 0.18, 0.37, 3, 0.025), edge);
      wall.position.set(x, 0, 0.13);
      keeper.add(wall);
    }
    const bridge = new THREE.Mesh(new RoundedBoxGeometry(1.82, 0.18, 0.08, 3, 0.025), surface);
    bridge.position.z = 0.31;
    keeper.add(bridge);
  }
  return {
    object: group,
    textures,
    dispose() {
      disposed = true;
    },
  };
}
