"use client";

import { Moon, Sun } from "lucide-react";

import { setTheme, useIsDarkTheme } from "@/components/use-theme";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/lib/i18n/client";

/** Bascule clair / sombre de l'en-tête ; le choix est retenu dans un cookie (lib/theme.ts). */
export function ThemeToggle() {
  const dark = useIsDarkTheme();
  const t = useLocale().dict.community.misc;
  const label = dark ? t.themeLight : t.themeDark;

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label={label}
      title={label}
      onClick={() => setTheme(dark ? "light" : "dark")}
    >
      {dark ? <Sun /> : <Moon />}
    </Button>
  );
}
