import Link from "next/link";

import { Breadcrumbs } from "@/components/breadcrumbs";
import { MyLists } from "@/components/my-lists";
import { pageMetadata } from "@/lib/seo/metadata";

export const metadata = pageMetadata({
  title: "Mes listes de souhaits",
  description:
    "Créez des listes de montres, partagez-les par lien ou publiez-les dans la communauté.",
  path: "/listes",
  index: false,
});

export default function MyListsPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Breadcrumbs crumbs={[{ name: "Mes listes" }]} />
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Mes listes de souhaits</h1>
        <p className="text-muted-foreground">
          Rassemblez les montres qui vous tentent. Gardez une liste pour vous, envoyez son lien à un
          proche (pas besoin de compte pour la voir) ou publiez-la dans la{" "}
          <Link href="/communaute" className="underline underline-offset-4">
            communauté
          </Link>{" "}
          pour recueillir des avis.
        </p>
      </div>
      <MyLists />
    </div>
  );
}
