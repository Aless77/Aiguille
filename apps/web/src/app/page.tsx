import { siteConfig } from "@/lib/site";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center gap-6 px-6 py-24">
      <h1 className="text-4xl font-semibold tracking-tight">{siteConfig.name}</h1>
      <p className="text-lg text-zinc-600 dark:text-zinc-400">{siteConfig.description}</p>
      <p className="text-sm text-zinc-500">Site en construction.</p>
    </main>
  );
}
