import { expect, it } from "vitest";
import { renderPixelRatio } from "./render-budget";

it("conserve les détails sur mobile sans dépasser le budget sur un grand écran dense", () => {
  expect(renderPixelRatio(3, 393, 470)).toBe(1.75);
  expect(renderPixelRatio(1, 900, 760)).toBe(1);
  for (const [width, height] of [
    [1440, 1000],
    [3840, 2160],
  ]) {
    const ratio = renderPixelRatio(3, width!, height!);
    expect(width! * height! * ratio ** 2).toBeLessThanOrEqual(1_500_001);
  }
  expect(renderPixelRatio(Number.NaN, 900, 760)).toBe(1);
});
