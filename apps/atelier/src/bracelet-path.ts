/** Courbe du bracelet dans le plan du poignet ; unités d'étude, environ 10 mm. */
export function braceletFrame(angle: number) {
  const dy = 3.7 * Math.cos(angle);
  const dz = -1.93 * Math.sin(angle);
  const speed = Math.hypot(dy, dz);
  return {
    y: 3.7 * Math.sin(angle),
    z: -1.65 + 1.93 * Math.cos(angle),
    rotation: Math.atan2(dz, dy),
    normalY: -dz / speed,
    normalZ: dy / speed,
  };
}

/** Échantillonnage en longueur d'arc : un pas constant malgré la courbure elliptique. */
export function braceletLayout(start: number, end: number, targetPitch: number) {
  if (!Number.isFinite(start + end + targetPitch) || end <= start || targetPitch <= 0)
    throw new Error("Intervalle de bracelet invalide");
  const steps = 2048;
  const distances = [0];
  let previous = braceletFrame(start);
  for (let i = 1; i <= steps; i++) {
    const current = braceletFrame(start + ((end - start) * i) / steps);
    distances.push(distances[i - 1]! + Math.hypot(current.y - previous.y, current.z - previous.z));
    previous = current;
  }
  const length = distances[steps]!;
  const count = Math.max(1, Math.round(length / targetPitch));
  function angleAt(distance: number) {
    const clamped = Math.max(0, Math.min(length, distance));
    let low = 0;
    let high = steps;
    while (low + 1 < high) {
      const mid = (low + high) >> 1;
      if (distances[mid]! < clamped) low = mid;
      else high = mid;
    }
    const fraction = (clamped - distances[low]!) / (distances[high]! - distances[low]!);
    return start + ((end - start) * (low + fraction)) / steps;
  }
  return { length, count, pitch: length / count, angleAt };
}
