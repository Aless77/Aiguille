import { LocaleProvider } from "@/lib/i18n/client";
import { getDictionary } from "@/lib/i18n/server";

/**
 * Pages du catalogue (servies aux seuls visiteurs approuvés, voir proxy.ts) : dictionnaire complet
 * pour leurs composants interactifs. Les pages ouvertes n'en reçoivent qu'une petite partie.
 */
export default async function CatalogueLayout({ children }: LayoutProps<"/[lang]">) {
  const { dict, locale } = await getDictionary();
  return (
    <LocaleProvider locale={locale} dict={dict}>
      {children}
    </LocaleProvider>
  );
}
