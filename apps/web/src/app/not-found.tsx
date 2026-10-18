import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="space-y-4 py-16 text-center">
      <h1 className="text-3xl font-semibold tracking-tight">Page introuvable</h1>
      <p className="text-muted-foreground">
        Cette montre ou cette page n&apos;existe pas, ou plus à cette adresse.
      </p>
      <Link href="/montres" className={buttonVariants()}>
        Voir toutes les montres
      </Link>
    </div>
  );
}
