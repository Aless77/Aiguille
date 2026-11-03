import * as THREE from "three";

export type StudioLight = "studio" | "warm" | "rim";

/** Sources réfléchies par les métaux et la glace ; calculées une fois par ambiance. */
export function createStudio(renderer: THREE.WebGLRenderer) {
  const generator = new THREE.PMREMGenerator(renderer);
  const environments = new Map<StudioLight, THREE.WebGLRenderTarget>();
  return {
    use(name: StudioLight) {
      const cached = environments.get(name);
      if (cached) return cached.texture;
      const room = new THREE.Scene();
      room.background = new THREE.Color(0x090a0b);
      const panels = [
        { position: [-5, 4, 5], size: [2.4, 8], power: 4 },
        { position: [6, -1, 3], size: [1.3, 7], power: 3 },
        { position: [0, 6, -3], size: [5, 2], power: 5 },
        { position: [-2, -5, 5], size: [3.5, 1.4], power: 1.5 },
        { position: [-3, -1, 9], size: [2.5, 5], power: 2.2 },
      ];
      for (const [i, source] of panels.entries()) {
        const color = new THREE.Color(name === "warm" ? 0xffdbad : 0xf1f4ff);
        color.multiplyScalar(source.power * (name === "rim" && i !== 2 ? 0.2 : 1));
        const panel = new THREE.Mesh(
          new THREE.PlaneGeometry(source.size[0], source.size[1]),
          new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide }),
        );
        panel.position.set(source.position[0]!, source.position[1]!, source.position[2]!);
        panel.lookAt(0, 0, 0);
        room.add(panel);
      }
      const environment = generator.fromScene(room, 0.025);
      environments.set(name, environment);
      room.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          object.material.dispose();
        }
      });
      return environment.texture;
    },
    dispose() {
      environments.forEach((environment) => environment.dispose());
      generator.dispose();
    },
  };
}
