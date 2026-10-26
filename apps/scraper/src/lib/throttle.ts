/**
 * Garantit un écart minimal entre deux départs de requête (règle « 1 requête toutes les quelques
 * secondes par domaine »). À appeler juste avant chaque requête, une seule à la fois.
 */
export function createThrottle(minIntervalMs: number, now: () => number = Date.now) {
  let last = Number.NEGATIVE_INFINITY;
  return async function throttle(): Promise<void> {
    const wait = last + minIntervalMs - now();
    if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
    last = now();
  };
}

/** Partage le rythme entre robots, sitemaps, fiches et changements de langue d'un même site. */
export function createDomainThrottle() {
  const domains = new Map<string, { last: number; pending: Promise<void> }>();
  return (url: string, minIntervalMs: number): Promise<void> => {
    const domain = new URL(url).origin;
    const state = domains.get(domain) ?? {
      last: Number.NEGATIVE_INFINITY,
      pending: Promise.resolve(),
    };
    domains.set(domain, state);
    state.pending = state.pending.then(async () => {
      const wait = state.last + minIntervalMs - Date.now();
      if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
      state.last = Date.now();
    });
    return state.pending;
  };
}

export const throttleDomain = createDomainThrottle();
