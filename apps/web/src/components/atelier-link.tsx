"use client";

import { type ReactNode, useSyncExternalStore } from "react";

const subscribe = () => () => {};
const serverSnapshot = () => null;
function localSnapshot(): string | null {
  if (process.env.NODE_ENV !== "development") return null;
  const { hostname, protocol } = window.location;
  if (!["localhost", "127.0.0.1"].includes(hostname)) return null;
  return `${protocol}//${hostname}:4173/`;
}

/** Navigation complète entre applications ; aucun préchargement du moteur 3D. */
export function AtelierLink({
  enabled,
  href,
  className,
  children,
}: {
  enabled: boolean;
  href: string | null;
  className: string;
  children: ReactNode;
}) {
  const localHref = useSyncExternalStore(subscribe, localSnapshot, serverSnapshot);
  const destination = href ?? localHref;
  if (!enabled || !destination) return null;
  return (
    <a href={destination} className={className} rel="noreferrer">
      {children}
    </a>
  );
}
