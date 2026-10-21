import { describe, expect, it } from "vitest";

import { THEME_INIT_SCRIPT, themeCookie, themeFromCookie } from "./theme";

describe("themeFromCookie", () => {
  it("vaut clair par défaut", () => {
    expect(themeFromCookie("")).toBe("light");
    expect(themeFromCookie("autre=1")).toBe("light");
    expect(themeFromCookie("theme=light")).toBe("light");
  });

  it("reconnaît le thème sombre quelle que soit sa place", () => {
    expect(themeFromCookie("theme=dark")).toBe("dark");
    expect(themeFromCookie("a=1; theme=dark; b=2")).toBe("dark");
  });

  it("ne confond pas un autre cookie", () => {
    expect(themeFromCookie("mytheme=dark")).toBe("light");
    expect(themeFromCookie("theme=darker")).toBe("light");
  });
});

describe("themeCookie", () => {
  it("garde le choix un an sur tout le site", () => {
    expect(themeCookie("dark", true)).toBe(
      "theme=dark; Path=/; Max-Age=31536000; SameSite=Lax; Secure",
    );
    expect(themeCookie("light", false)).not.toContain("Secure");
  });
});

describe("THEME_INIT_SCRIPT", () => {
  it("applique la même règle que themeFromCookie", () => {
    const classes = new Set<string>();
    const run = (cookie: string) => {
      classes.clear();
      const document = {
        cookie,
        documentElement: { classList: { add: (c: string) => classes.add(c) } },
      };
      new Function("document", THEME_INIT_SCRIPT)(document);
      return classes.has("dark");
    };
    expect(run("a=1; theme=dark")).toBe(true);
    expect(run("theme=light")).toBe(false);
    expect(run("mytheme=dark")).toBe(false);
  });
});
