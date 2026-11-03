import "./style.css";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { createWatch, type WatchModel } from "./watch";
import { createStudio, type StudioLight } from "./studio";
import { createDiagnostics } from "./diagnostics";
import { renderPixelRatio } from "./render-budget";
import { connectAiguille } from "./navigation";

connectAiguille();
const stage = document.querySelector<HTMLDivElement>("#stage")!;
const status = document.querySelector<HTMLParagraphElement>("#status")!;
const retry = document.querySelector<HTMLButtonElement>("#retry")!;
const reset = document.querySelector<HTMLButtonElement>("#reset")!;
retry.addEventListener("click", () => {
  const url = new URL(location.href);
  if (import.meta.env.DEV && url.searchParams.get("diagnostic") === "no-webgl") {
    url.searchParams.delete("diagnostic");
    location.assign(url.href);
  } else location.reload();
});
function setAvailable(available: boolean, message = "") {
  status.textContent = message;
  retry.hidden = available;
  document.querySelectorAll("fieldset").forEach((field) => {
    field.disabled = !available;
  });
  reset.disabled = !available;
}
const setText = (id: string, text: string) => {
  document.getElementById(id)!.textContent = text;
};

function start() {
  if (import.meta.env.DEV && new URLSearchParams(location.search).get("diagnostic") === "no-webgl")
    throw new Error("Indisponibilité graphique simulée pour vérifier le repli.");
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  renderer.transmissionResolutionScale = 1;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.shadowMap.autoUpdate = false;
  renderer.shadowMap.needsUpdate = true;
  const diagnostics = createDiagnostics(renderer);
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
  let currentLight: StudioLight = "studio";
  let studio = createStudio(renderer);
  scene.environment = studio.use(currentLight);
  scene.environmentIntensity = 1.25;
  const key = new THREE.DirectionalLight(0xfff1df, 1.7);
  key.position.set(-4, 6, 8);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.left = key.shadow.camera.bottom = -5;
  key.shadow.camera.right = key.shadow.camera.top = 5;
  key.shadow.camera.near = 1;
  key.shadow.camera.far = 25;
  key.shadow.normalBias = 0.015;
  key.shadow.bias = -0.0001;
  const fill = new THREE.DirectionalLight(0xe3eaff, 1);
  fill.position.set(5, 1, 4);
  const rim = new THREE.DirectionalLight(0xffffff, 3);
  rim.position.set(-4, 3, -3);
  scene.add(key, fill, rim);
  let currentModel: WatchModel = "metal";
  let watch = createWatch(currentModel, render);
  // Deux modèles au maximum : éviter de reconstruire et recompiler leurs matières à chaque retour.
  const watches = new Map<WatchModel, ReturnType<typeof createWatch>>([[currentModel, watch]]);
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
  let contextLost = false;
  let failed = false;
  let disposed = false;
  let ready = false;
  function render() {
    if (!frame && !document.hidden && !contextLost && !failed && !disposed)
      frame = requestAnimationFrame(() => {
        frame = 0;
        if (document.hidden || contextLost || disposed) return;
        const started = diagnostics?.begin();
        try {
          renderer.render(scene, camera);
          if (!ready) {
            ready = true;
            setAvailable(true);
          }
        } catch (error) {
          console.error(error);
          failed = true;
          controls.enabled = false;
          setAvailable(false, "Le rendu a été interrompu. Vous pouvez relancer la 3D.");
        }
        if (started !== undefined) diagnostics?.end(started);
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
  let lastWidth = 0;
  let lastHeight = 0;
  let lastRatio = 0;
  function resize() {
    const width = stage.clientWidth;
    const height = stage.clientHeight;
    if (!width || !height) return;
    const ratio = renderPixelRatio(window.devicePixelRatio, width, height);
    if (width === lastWidth && height === lastHeight && ratio === lastRatio) return;
    lastWidth = width;
    lastHeight = height;
    lastRatio = ratio;
    renderer.setPixelRatio(ratio);
    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    render();
  }
  const observer = new ResizeObserver(resize);
  observer.observe(stage);
  function visibilityChanged() {
    if (document.hidden) {
      cancelAnimationFrame(frame);
      frame = 0;
    } else render();
  }
  document.addEventListener("visibilitychange", visibilityChanged);
  window.addEventListener("resize", resize);
  window.addEventListener("pageshow", render);
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
      if (model === currentModel) return;
      const replacement = watches.get(model) ?? createWatch(model, render);
      watches.set(model, replacement);
      scene.remove(watch.object);
      watch = replacement;
      currentModel = model;
      renderer.shadowMap.needsUpdate = true;
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
      const name = button.dataset.light as StudioLight;
      currentLight = name;
      select("[data-light]", button);
      scene.environment = studio.use(name);
      key.color.set(name === "warm" ? 0xffce8b : 0xfff1df);
      fill.color.set(name === "warm" ? 0xffe4bd : 0xe3eaff);
      key.intensity = name === "rim" ? 0.5 : 1.7;
      fill.intensity = name === "rim" ? 0.3 : 1;
      rim.intensity = name === "rim" ? 6 : 3;
      scene.environmentIntensity = name === "rim" ? 0.8 : 1.25;
      render();
    }),
  );
  document.querySelectorAll<HTMLButtonElement>("[data-view]").forEach((button) =>
    button.addEventListener("click", () => {
      select("[data-view]", button);
      view(button.dataset.view!);
    }),
  );
  reset.addEventListener("click", () => {
    view("signature");
    document
      .querySelectorAll<HTMLButtonElement>("[data-view]")
      .forEach((button) =>
        button.setAttribute("aria-pressed", String(button.dataset.view === "signature")),
      );
  });
  renderer.domElement.addEventListener("webglcontextlost", (event) => {
    event.preventDefault();
    contextLost = true;
    ready = false;
    controls.enabled = false;
    cancelAnimationFrame(frame);
    frame = 0;
    setAvailable(
      false,
      "L’affichage 3D a été interrompu. La reprise est automatique dès que possible.",
    );
  });
  renderer.domElement.addEventListener("webglcontextrestored", () => {
    contextLost = false;
    failed = false;
    controls.enabled = true;
    // Les textures calculées sur le GPU ont perdu leur contenu avec le contexte.
    studio.dispose();
    studio = createStudio(renderer);
    scene.environment = studio.use(currentLight);
    renderer.shadowMap.needsUpdate = true;
    render();
  });
  window.addEventListener(
    "pagehide",
    (event) => {
      if (event.persisted) return;
      disposed = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      document.removeEventListener("visibilitychange", visibilityChanged);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pageshow", render);
      controls.dispose();
      watches.forEach((model) => model.dispose());
      watches.clear();
      studio.dispose();
      neutral.dispose();
      key.shadow.map?.dispose();
      renderer.dispose();
      diagnostics?.dispose();
    },
    { once: true },
  );
  view("signature");
  resize();
}

try {
  start();
} catch (error) {
  console.error(error);
  setAvailable(
    false,
    "La 3D n’a pas pu démarrer. Vérifiez que WebGL est disponible dans votre navigateur, puis relancez l’affichage.",
  );
}
