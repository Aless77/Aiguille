"use client";

import { Moon, Sun } from "lucide-react";

import { setTheme, useIsDarkTheme } from "@/components/use-theme";
import { Button } from "@/components/ui/button";

/** Bascule clair / sombre de l'en-tête ; le choix est retenu dans un cookie (lib/theme.ts). */
export function ThemeToggle() {
  const dark = useIsDarkTheme();
  const label = dark ? "Passer au thème clair" : "Passer au thème sombre";

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
