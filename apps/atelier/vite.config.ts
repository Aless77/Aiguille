import { defineConfig, loadEnv } from "vite";
import { z } from "zod";

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), "VITE_");
  const configured = process.env.VITE_AIGUILLE_URL || env.VITE_AIGUILLE_URL;
  let returnUrl: string | null = null;
  if (configured) {
    const url = new URL(z.url().parse(configured));
    const local = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
    if (
      url.username ||
      url.password ||
      !(url.protocol === "https:" || (command === "serve" && url.protocol === "http:")) ||
      (command === "build" && local)
    ) {
      throw new Error(
        "VITE_AIGUILLE_URL doit désigner une adresse HTTPS sans identifiants en production.",
      );
    }
    returnUrl = url.href;
  }
  return {
    define: { __AIGUILLE_URL__: JSON.stringify(returnUrl) },
    server: { watch: { usePolling: true, interval: 1000 } },
  };
});
