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
