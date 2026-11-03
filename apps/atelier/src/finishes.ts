import * as THREE from "three";

/** Microrelief déterministe ; les cartes décrivent la surface, jamais son éclairage. */
export function createSurfaceMaps(kind: "brushed" | "grain") {
  const size = 512;
  const height = new Uint8Array(size * size * 4);
  const roughness = new Uint8Array(height.length);
  let seed = 38;
  const random = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  let previous = random();
  let next = random();
  for (let x = 0; x < size; x++) {
    if (x % 6 === 0) {
      previous = next;
      next = random();
    }
    const blend = THREE.MathUtils.smoothstep((x % 6) / 6, 0, 1);
    const strand = (THREE.MathUtils.lerp(previous, next, blend) * 0.75 + random() * 0.25) * 42;
    for (let y = 0; y < size; y++) {
      const value = kind === "brushed" ? 108 + strand + random() * 5 : 108 + random() * 40;
      const i = (y * size + x) * 4;
      height[i] = height[i + 1] = height[i + 2] = value;
      roughness[i] = roughness[i + 1] = roughness[i + 2] = 205 + (value - 128) * 0.65;
      height[i + 3] = roughness[i + 3] = 255;
    }
  }
  const map = (data: Uint8Array) => {
    const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.generateMipmaps = true;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.anisotropy = 4;
    texture.needsUpdate = true;
    return texture;
  };
  return { bump: map(height), roughness: map(roughness) };
}
