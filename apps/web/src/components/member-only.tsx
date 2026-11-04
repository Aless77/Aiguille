import { headers } from "next/headers";
import { Suspense } from "react";

import { CATALOG_ACCESS_HEADER } from "@/lib/auth/catalog-access";

async function Gate({
  children,
  otherwise,
}: {
  children: React.ReactNode;
  otherwise: React.ReactNode;
}) {
  return (await headers()).get(CATALOG_ACCESS_HEADER) === "1" ? children : otherwise;
}

/**
 * Contenu réservé aux visiteurs qui ont accès au catalogue (marqueur du proxy). Pour les autres,
 * il n'est jamais rendu : absent du HTML, rien à deviner en lisant la page. Lu à chaque requête,
 * sous Suspense : le reste de la page reste en cache.
 */
export function MemberOnly({
  children,
  otherwise = null,
}: {
  children: React.ReactNode;
  otherwise?: React.ReactNode;
}) {
  return (
    <Suspense fallback={otherwise}>
      <Gate otherwise={otherwise}>{children}</Gate>
    </Suspense>
  );
}
