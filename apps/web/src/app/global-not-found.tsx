import type { Metadata } from "next";

import { THEME_INIT_SCRIPT } from "@/lib/theme";

import "./globals.css";

export const metadata: Metadata = {
  title: "Page introuvable | Aiguille",
  robots: { index: false, follow: true },
};

/**
 * 404 des adresses qui ne correspondent à aucune page. La mise en page racine est sous
 * app/[lang] (langues) : cette page est autonome, sans en-tête ni pied de page.
 */
export default function GlobalNotFound() {
  return (
    <html lang="fr" className="h-full antialiased" suppressHydrationWarning>
      <body className="flex min-h-full flex-col">
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <main className="mx-auto w-full max-w-6xl space-y-4 px-4 py-24 text-center">
          <h1 className="text-3xl font-semibold tracking-tight">Page introuvable</h1>
          <p className="text-muted-foreground">
            Cette montre ou cette page n&apos;existe pas, ou plus à cette adresse.
          </p>
          {/* Lien simple : pas de routeur client hors de la mise en page du site. */}
          <a href="/montres" className="underline underline-offset-4">
            Voir toutes les montres
          </a>
        </main>
      </body>
    </html>
  );
}
