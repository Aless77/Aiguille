import { describe, expect, it } from "vitest";

import { parseMovement, parseWaterResistance, pick } from "./specs.ts";

describe("parseMovement", () => {
  it("distingue automatique, manuel, quartz et solaire", () => {
    expect(parseMovement("Automatique")).toBe("automatique");
    expect(parseMovement("Mécanique à remontage automatique")).toBe("automatique");
    expect(parseMovement("Mécanique")).toBe("manuel");
    expect(parseMovement("Remontage manuel")).toBe("manuel");
    expect(parseMovement("Quartz")).toBe("quartz");
    expect(parseMovement("Eco-Drive")).toBe("solaire");
    expect(parseMovement("Kinetic")).toBe("autre");
    expect(parseMovement(undefined)).toBeUndefined();
  });
});

describe("parseWaterResistance", () => {
  it("privilégie les mètres", () => {
    expect(parseWaterResistance("jusqu’à 5 bar (50m)")).toBe(50);
    expect(parseWaterResistance("600 bars (6 000 mètres / 20 000 pieds)")).toBe(6000);
    expect(parseWaterResistance("120 bars (1 200 mètres)")).toBe(1200);
    expect(parseWaterResistance("30 bars (300 mètres/1 000 pieds)")).toBe(300);
    expect(parseWaterResistance("Etanche jusqu’à une pression de 10 bar (100 m/330 ft)")).toBe(100);
  });

  it("convertit les bars et atmosphères sinon", () => {
    expect(parseWaterResistance("20 bar")).toBe(200);
    expect(parseWaterResistance("3 ATM")).toBe(30);
    expect(parseWaterResistance("Non étanche")).toBeUndefined();
  });
});

describe("pick", () => {
  it("trouve un libellé sans tenir compte des accents ni de la casse", () => {
    const specs = { "Etanchéité de la boîte": "10 bar", Calibre: "H-50" };
    expect(pick(specs, "étanchéité de la boite")).toBe("10 bar");
    expect(pick(specs, "Inconnu", "calibre")).toBe("H-50");
    expect(pick(specs, "Inconnu")).toBeUndefined();
  });
});
