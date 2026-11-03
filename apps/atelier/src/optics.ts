import * as THREE from "three";

export function createCrystalMaterial() {
  const material = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0,
    roughness: 0,
    transmission: 1,
    thickness: 0.09,
    ior: 1.5,
    specularIntensity: 0.12,
    envMapIntensity: 0.06,
  });
  // Three 0.180 applique aussi le flou de rugosité aux normales du bombé.
  // Une glace polie utilise ici le niveau net du tampon de réfraction ; le reflet reste physique.
  material.onBeforeCompile = (shader) => {
    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <transmission_pars_fragment>",
      THREE.ShaderChunk.transmission_pars_fragment.replace(
        "return textureBicubic( transmissionSamplerMap, fragCoord.xy, lod );",
        "return textureLod( transmissionSamplerMap, fragCoord.xy, 0.0 );",
      ),
    );
  };
  material.customProgramCacheKey = () => "av-crystal-clear-r180";
  return material;
}

/** Glace fermée : dessous plan, chant arrondi et bombé très faible sur le dessus. */
export function createCrystalGeometry() {
  const profile = [new THREE.Vector2(0, 0.595), new THREE.Vector2(1.79, 0.595)];
  profile.push(new THREE.Vector2(1.805, 0.608), new THREE.Vector2(1.805, 0.637));
  for (let i = 0; i <= 32; i++) {
    const radius = 1.795 * (1 - i / 32);
    const z = 0.645 + 0.065 * (1 - (radius / 1.795) ** 2);
    profile.push(new THREE.Vector2(radius, z));
  }
  const geometry = new THREE.LatheGeometry(profile, 160);
  // L'axe de révolution Y devient l'axe Z de la montre.
  geometry.rotateX(Math.PI / 2);
  return geometry;
}

/** Deux pans inclinés partagent une arête : le reflet change réellement avec le point de vue. */
export function createHandGeometry(length: number, width: number) {
  const outline = [
    [-width * 0.35, -0.18, 0.016],
    [-width, length * 0.35, 0.016],
    [0, length, 0.016],
    [width, length * 0.35, 0.016],
    [width * 0.35, -0.18, 0.016],
  ] as const;
  const ridge = [0, length * 0.35, 0.052];
  const tail = [0, -0.18, 0.034];
  const positions: number[] = [];
  const triangle = (a: readonly number[], b: readonly number[], c: readonly number[]) => {
    positions.push(...a, ...b, ...c);
  };
  const [a, b, c, d, e] = outline;
  triangle(a, ridge, b);
  triangle(a, tail, ridge);
  triangle(b, ridge, c);
  triangle(ridge, d, c);
  triangle(ridge, e, d);
  triangle(tail, e, ridge);
  triangle(e, tail, a);
  for (let i = 0; i < outline.length; i++) {
    const p = outline[i]!;
    const q = outline[(i + 1) % outline.length]!;
    const lowerP = [p[0], p[1], -0.008];
    const lowerQ = [q[0], q[1], -0.008];
    triangle(p, q, lowerP);
    triangle(q, lowerQ, lowerP);
    triangle([0, length * 0.35, -0.008], lowerP, lowerQ);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.computeVertexNormals();
  return geometry;
}
