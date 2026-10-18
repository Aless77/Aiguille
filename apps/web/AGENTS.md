# apps/web – site Next.js

Règles générales du projet : [../../AGENTS.md](../../AGENTS.md). Checklist SEO de chaque page :
[../../docs/seo/checklist.md](../../docs/seo/checklist.md).

- `src/lib/site.ts` : nom, description, URL absolue (`absoluteUrl`) et garde-fou `isIndexable()`.
- `src/lib/seo/json-ld.tsx` : composant `JsonLd` et générateurs schema.org typés (`schema-dts`).
- `src/app/robots.ts`, `sitemap.ts`, `manifest.ts` : fichiers de métadonnées Next.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
