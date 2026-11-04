import { Link } from "@/lib/i18n/client";

import { buttonVariants } from "@/components/ui/button";
import { getDictionary } from "@/lib/i18n/server";

export default async function NotFound() {
  const { dict } = await getDictionary();
  const t = dict.pages.notFound;
  return (
    <div className="space-y-4 py-16 text-center">
      <h1 className="text-3xl font-semibold tracking-tight">{t.title}</h1>
      <p className="text-muted-foreground">{t.description}</p>
      {/* Accueil : le catalogue pour un membre, la demande d'accès pour les autres (proxy). */}
      <Link href="/" className={buttonVariants()}>
        {t.browse}
      </Link>
    </div>
  );
}
