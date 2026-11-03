declare const __AIGUILLE_URL__: string | null;

/** L'adresse de publication est validée à la compilation, sans dépendance dans le navigateur. */
export function connectAiguille() {
  const link = document.querySelector<HTMLAnchorElement>("#aiguille-link")!;
  const { hostname, protocol } = window.location;
  const localUrl =
    import.meta.env.DEV && ["localhost", "127.0.0.1"].includes(hostname)
      ? `${protocol}//${hostname}:3000/`
      : null;
  const href = __AIGUILLE_URL__ ?? localUrl;
  if (href) {
    link.href = href;
    link.hidden = false;
  }
}
