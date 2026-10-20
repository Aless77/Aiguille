import Link from "next/link";

import { AccountPanel } from "@/components/account-panel";
import { pageMetadata } from "@/lib/seo/metadata";

export const metadata = pageMetadata({
  title: "Mon compte",
  description: "Données conservées pour votre compte, déconnexion et suppression du compte.",
  path: "/compte",
  index: false,
});

export default function AccountPage() {
  return (
    <div className="mx-auto max-w-xl space-y-6 py-8">
      <h1 className="text-3xl font-semibold tracking-tight">Mon compte</h1>
      <AccountPanel />
      <p className="text-sm text-muted-foreground">
        Détails sur l&apos;usage de ces données :{" "}
        <Link href="/confidentialite" className="underline underline-offset-4">
          règles de confidentialité
        </Link>
        .
      </p>
    </div>
  );
}
