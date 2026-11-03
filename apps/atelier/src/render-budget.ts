/** Budget commun aux deux passes couleur ; la densité reste fine sur petit écran. */
export function renderPixelRatio(deviceRatio: number, width: number, height: number) {
  const ratio = Number.isFinite(deviceRatio) && deviceRatio > 0 ? deviceRatio : 1;
  const area = Math.max(1, width * height);
  return Math.min(ratio, 1.75, Math.sqrt(1_500_000 / area));
}
