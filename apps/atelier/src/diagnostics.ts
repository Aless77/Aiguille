import { type WebGLRenderer } from "three";

/** Mesures locales sur demande, absentes du parcours normal et du build de production. */
export function createDiagnostics(renderer: WebGLRenderer) {
  if (!import.meta.env.DEV || !new URLSearchParams(location.search).has("diagnostic")) return;
  let frames = 0;
  const panel = document.createElement("details");
  panel.id = "diagnostics";
  const title = document.createElement("summary");
  title.textContent = "Diagnostics de développement";
  panel.append(title);
  for (const [label, action] of [
    ["Interrompre la 3D", () => renderer.forceContextLoss()],
    ["Restaurer la 3D", () => renderer.forceContextRestore()],
  ] as const) {
    const button = document.createElement("button");
    button.textContent = label;
    button.addEventListener("click", action);
    panel.append(button);
  }
  document.body.append(panel);
  renderer.info.autoReset = false;
  return {
    begin() {
      renderer.info.reset();
      return performance.now();
    },
    end(start: number) {
      console.info(
        "AV diagnostic",
        JSON.stringify({
          frame: ++frames,
          cpuMs: Math.round((performance.now() - start) * 100) / 100,
          calls: renderer.info.render.calls,
          triangles: renderer.info.render.triangles,
          geometries: renderer.info.memory.geometries,
          textures: renderer.info.memory.textures,
          programs: renderer.info.programs?.length,
          model: document.querySelector<HTMLButtonElement>('[data-model][aria-pressed="true"]')
            ?.dataset.model,
        }),
      );
    },
    dispose() {
      panel.remove();
    },
  };
}
