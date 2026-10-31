import "./style.css";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { createWatch, type WatchModel } from "./watch";

const stage = document.querySelector<HTMLDivElement>("#stage")!;
const status = document.querySelector<HTMLParagraphElement>("#status")!;
const setText = (id: string, text: string) => {
  document.getElementById(id)!.textContent = text;
};

function start() {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.35;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  stage.appendChild(renderer.domElement);
  renderer.domElement.setAttribute(
    "aria-label",
    "Montre AV en trois dimensions. Utiliser les boutons de point de vue pour l’examiner au clavier.",
  );
  renderer.domElement.setAttribute("role", "img");
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(37, 1, 0.1, 100);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = false;
  controls.enablePan = false;
  controls.minDistance = 7;
  controls.maxDistance = 22;
  const pmrem = new THREE.PMREMGenerator(renderer);
  // Boîtes à lumière dans un studio noir : les reflets révèlent les arêtes sans blanchir le cadran.
  const room = new THREE.Scene();
  room.background = new THREE.Color(0x080808);
  for (const [x, y, z, width, height] of [
    [-5, 3, 4, 2, 9],
    [6, 1, 2, 1, 7],
    [0, 7, -3, 6, 2],
    [1, 2, 9, 5, 7],
  ]) {
    const panel = new THREE.Mesh(
      new THREE.PlaneGeometry(width, height),
      new THREE.MeshBasicMaterial({
        color: new THREE.Color().setRGB(3, 3, 3),
        side: THREE.DoubleSide,
      }),
    );
    panel.position.set(x!, y!, z!);
    panel.lookAt(0, 0, 0);
    room.add(panel);
  }
  const environment = pmrem.fromScene(room, 0.04);
  scene.environment = environment.texture;
  scene.environmentIntensity = 1.6;
  room.traverse((object) => {
    if (object instanceof THREE.Mesh) {
      object.geometry.dispose();
      object.material.dispose();
    }
  });
  pmrem.dispose();
  const key = new THREE.DirectionalLight(0xfff1d7, 1.5);
  key.position.set(-4, 6, 8);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.left = key.shadow.camera.bottom = -5;
  key.shadow.camera.right = key.shadow.camera.top = 5;
  key.shadow.camera.near = 1;
  key.shadow.camera.far = 25;
  key.shadow.normalBias = 0.015;
  key.shadow.bias = -0.0001;
  const fill = new THREE.DirectionalLight(0xd8e7ff, 0.7);
  fill.position.set(5, 1, 4);
  const rim = new THREE.DirectionalLight(0xffffff, 5);
  rim.position.set(-4, 3, -3);
  scene.add(key, fill, rim);
  let watch = createWatch("metal", render);
  scene.add(watch.object);
  const neutral = new THREE.MeshStandardMaterial({
    color: 0x898b8e,
    roughness: 0.75,
    metalness: 0,
  });
  let inspecting = false;
  function inspectVolumes() {
    scene.overrideMaterial = inspecting ? neutral : null;
    // La glace doit rester masquée pour examiner les pièces en relief sous le verre.
    const crystal = watch.object.getObjectByName("Glace");
    if (crystal) crystal.visible = !inspecting;
    render();
  }
  document.getElementById("volumes")!.addEventListener("click", (event) => {
    inspecting = !inspecting;
    (event.currentTarget as HTMLButtonElement).setAttribute("aria-pressed", String(inspecting));
    inspectVolumes();
  });
  let frame = 0;
  let visible = true;
  function render() {
    if (!frame && visible && !document.hidden)
      frame = requestAnimationFrame(() => {
        frame = 0;
        renderer.render(scene, camera);
      });
  }
  function view(name: string) {
    const views: Record<string, [number, number, number]> = {
      signature: [5.4, 3.1, 13.2],
      front: [0, 0, 14.5],
      side: [13, 2, 5],
      back: [5, 2, -15],
    };
    camera.position.set(...(views[name] ?? views.signature!));
    controls.target.set(0, 0, -0.8);
    controls.update();
    render();
  }
  function resize() {
    renderer.setSize(stage.clientWidth, stage.clientHeight);
    camera.aspect = stage.clientWidth / stage.clientHeight;
    camera.updateProjectionMatrix();
    render();
  }
  const observer = new ResizeObserver(resize);
  observer.observe(stage);
  const intersection = new IntersectionObserver(([entry]) => {
    visible = entry?.isIntersecting ?? true;
    render();
  });
  intersection.observe(stage);
  document.addEventListener("visibilitychange", render);
  controls.addEventListener("change", render);
  controls.addEventListener("start", () =>
    document
      .querySelectorAll("[data-view]")
      .forEach((button) => button.setAttribute("aria-pressed", "false")),
  );
  function select(selector: string, target: HTMLButtonElement) {
    document
      .querySelectorAll(selector)
      .forEach((button) => button.setAttribute("aria-pressed", String(button === target)));
  }
  document.querySelectorAll<HTMLButtonElement>("[data-model]").forEach((button) =>
    button.addEventListener("click", () => {
      const model = button.dataset.model as WatchModel;
      scene.remove(watch.object);
      watch.dispose();
      watch = createWatch(model, render);
      scene.add(watch.object);
      inspectVolumes();
      select("[data-model]", button);
      const metal = model === "metal";
      setText("model-title", metal ? "02 — Obsidienne" : "01 — Éclipse");
      setText(
        "model-description",
        metal
          ? "Une silhouette sculptée, prolongée par un bracelet en métal noir à trois maillons."
          : "Une ligne ronde et élancée, un cadran texturé et la douceur d’un bracelet en cuir noir.",
      );
      setText(
        "case-detail",
        metal ? "Noir brossé · chanfreins polis" : "Noir satiné · lunette polie",
      );
      setText("dial-detail", metal ? "Noir · brossage vertical" : "Noir · grain fin");
      setText("model-label", metal ? "AV / 02" : "AV / 01");
      render();
    }),
  );
  document.querySelectorAll<HTMLButtonElement>("[data-light]").forEach((button) =>
    button.addEventListener("click", () => {
      const name = button.dataset.light;
      select("[data-light]", button);
      key.color.set(name === "warm" ? 0xffce8b : 0xfff1d7);
      fill.color.set(name === "warm" ? 0xffe4bd : 0xd8e7ff);
      key.intensity = name === "rim" ? 0.5 : 1.5;
      fill.intensity = name === "rim" ? 0.2 : 0.7;
      rim.intensity = name === "rim" ? 9 : 5;
      scene.environmentIntensity = name === "rim" ? 0.65 : 1.6;
      render();
    }),
  );
  document.querySelectorAll<HTMLButtonElement>("[data-view]").forEach((button) =>
    button.addEventListener("click", () => {
      select("[data-view]", button);
      view(button.dataset.view!);
    }),
  );
  document.getElementById("reset")!.addEventListener("click", () => {
    view("signature");
    document
      .querySelectorAll<HTMLButtonElement>("[data-view]")
      .forEach((button) =>
        button.setAttribute("aria-pressed", String(button.dataset.view === "signature")),
      );
  });
  renderer.domElement.addEventListener("webglcontextlost", (event) => {
    event.preventDefault();
    status.textContent =
      "L’affichage 3D a été interrompu. Rechargez la page pour reprendre l’étude.";
  });
  window.addEventListener(
    "pagehide",
    (event) => {
      if (event.persisted) return;
      cancelAnimationFrame(frame);
      observer.disconnect();
      intersection.disconnect();
      controls.dispose();
      watch.dispose();
      environment.dispose();
      neutral.dispose();
      key.shadow.map?.dispose();
      renderer.dispose();
    },
    { once: true },
  );
  view("signature");
  resize();
  status.textContent = "";
}

try {
  start();
} catch (error) {
  console.error(error);
  status.textContent =
    "La 3D n’a pas pu démarrer. Vérifiez que WebGL est disponible dans votre navigateur, puis rechargez la page.";
}
