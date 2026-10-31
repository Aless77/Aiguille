import { describe, expect, it } from "vitest";

import { getAdminAccessPath } from "./admin-path";

describe("adresse privée de l'administration", () => {
  it("exige une adresse configurée et ne fournit aucun chemin par défaut", () => {
    expect(getAdminAccessPath({})).toBeNull();
    expect(getAdminAccessPath({ ADMIN_ACCESS_PATH: "/gestion-acces-personnelle" })).toBe(
      "/gestion-acces-personnelle",
    );
  });
  it("refuse les URL externes, les routes courantes et les caractères spéciaux", () => {
    for (const path of [
      "/administration",
      "https://autre.test",
      "//gestion-acces-personnelle",
      "/gestion/acces-personnelle",
      "/gestion-acces-personnelle?cle=1",
    ]) {
      expect(getAdminAccessPath({ ADMIN_ACCESS_PATH: path })).toBeNull();
    }
  });
});
