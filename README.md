# travel-audio-guide-nextjs

[![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=nextdotjs&logoColor=white)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Architecture](https://img.shields.io/badge/Architecture-Page--Scoped%20FSD-4CAF50)](#project-structure)
[![State](https://img.shields.io/badge/Server%20State-TanStack%20Query-FF4154?logo=reactquery&logoColor=white)](https://tanstack.com/query)
[![Validation](https://img.shields.io/badge/Validation-Zod-3E67B1)](https://zod.dev)
[![Testing](https://img.shields.io/badge/Testing-Jest%20%2B%20Testing%20Library-C21325?logo=jest&logoColor=white)](#testing)
[![Storage](https://img.shields.io/badge/Storage-localStorage-7952B3)](#local-data-storage)

---

## Introduction

travel-audio-guide-nextjs is a local-first CMS built with Next.js (App Router), TypeScript, TanStack Query, React Hook Form, and Zod.

The public website and the administration interface live inside a single Next.js project. Routing is handled entirely by the App Router's file-system conventions instead of a client-side router.

The project uses a page-scoped Feature-Sliced Design approach: a small, practical layer set (`app`, `features`, `widgets`, `shared`) rather than a full multi-layer FSD tree.

This project is for architectural practice, CMS prototyping, and technical demonstration.

---

## Related Backend

This project is designed to eventually connect to a Go API backend for article persistence:

- travel-audio-guide-go (planned, not yet built)

The planned backend stack: Go, chi, PostgreSQL, pgxpool, sqlc, JWT authentication, Docker.

Until then, article data lives in the browser through `localStorage`, isolated behind a Repository abstraction (`ArticleRepository`) so the storage layer can be swapped for the Go API later without rewriting the feature components. See `MIGRATION.md` for the concrete swap-in steps.

---

## Preview

<p align="left">
  <img src="" width="160"/>
  <img src="" width="160"/>
</p>

---

## Features

### Article Management

- Create, edit, delete, and duplicate articles
- Save articles as drafts or publish them
- Automatically track creation, update, and publication timestamps
- Display clear draft and published status indicators

### Content Editing

- Edit article title, author, excerpt, tags, and body content
- Write article content in Markdown with a live preview while editing
- Automatically generate a URL-friendly slug from the title, with manual override
- Validate slug uniqueness before saving
- Sanitize generated HTML with DOMPurify before rendering
- Validate all fields with Zod and React Hook Form

### SEO Metadata

- Configure a custom SEO title and description per article
- Fall back to the article title and excerpt when custom SEO fields are empty
- Keep SEO fields in the article data model, ready for `generateMetadata()` once articles are served from the Go API

### Article Discovery

- Search articles by title, author, slug, excerpt, or tags
- Filter articles by draft or published status
- Display public URLs for published articles

### Preview and Publishing

- Preview draft or published content from the administration interface at `/admin/articles/:articleId/preview`
- Publish articles to a real public Next.js route at `/articles/:slug`, with an index at `/articles`
- Prevent unpublished articles from being reachable through public routes

### Import and Export

- Export all local CMS data as a JSON backup
- Import article data from a JSON file, validated with Zod
- Reject malformed records, duplicate IDs, and duplicate slugs
- Refresh TanStack Query caches after importing data

### Local Data Storage

Article data is currently stored in browser `localStorage`, isolated behind the `ArticleRepository` abstraction. This provides fast local prototyping, persistence after refresh, no backend setup requirement, simple import/export, and a realistic asynchronous repository interface (all methods return Promises, mirroring a future remote API).

Current limitations:

- Data is isolated to one browser and device — there is no multi-user sync
- There is no authentication, revision history, or server-side access control
- Public pages (`/articles`, `/articles/:slug`) are Client Components — there is no server-side rendering of article content yet, and no real `generateMetadata()`-driven SEO
- Browser storage can be cleared by the user, and there is no reliable production backup

These are resolved once the Go API + PostgreSQL backend lands — see `MIGRATION.md`.

### User Experience

- Responsive administration layout with sidebar navigation
- Cross-tab sync: editing an article in one browser tab refreshes other open tabs (via the native `storage` event)
- Empty, loading, and error states
- Route-level `error.tsx` / `not-found.tsx` fallbacks
- Save-state feedback and delete confirmation

### Architecture

- App Router file-system routing — every route is a folder under `src/app` with a `page.tsx`; there is no client-side router library
- Repository abstraction (`ArticleRepository`) isolating `localStorage` from feature components
- TanStack Query for cache and mutation state, with structured query keys per list/detail view
- React Hook Form + Zod for form state and validation
- Safe Markdown rendering via `marked` + DOMPurify

---

## Tech Stack

- **Next.js (App Router)** — file-system routing, layouts, Server/Client Component boundaries for both the public site and the admin CMS.
- **React** — component model for both surfaces.
- **TypeScript** — static types across routes, schemas, repository, forms, query options, and UI.
- **TanStack Query** — cache and async state management for article lists, details, and mutations.
- **React Hook Form** — editor form state with minimal re-renders.
- **Zod** — runtime validation for form data, stored records, and imported JSON backups.
- **Marked** — Markdown → HTML.
- **DOMPurify** — sanitizes Markdown-generated HTML before rendering.
- **Sass** — global stylesheet.
- **Jest + Testing Library** — repository, schema, and utility tests, wired through `next/jest`.
- **ESLint (flat config, `eslint-config-next`)** / **Prettier** — linting and formatting.

---

## Environment

- Node.js: `20.9` or later (Next.js 16 minimum requirement)
- npm: bundled with Node.js
- Next.js: `16.x` (App Router)

---

## Local Development

```bash
npm install
npm run dev
```

Open:

```text
http://localhost:30401
```

- Admin: `http://localhost:30401/admin/articles`
- Public: `http://localhost:30401/articles`

`npm run dev` runs a `predev` step (`kill-port 30401`) first, so a leftover process from a previous session won't block the port with `EADDRINUSE`.

### Useful Commands

```bash
npm run dev         # kills anything on port 30401 first (predev), then starts Next.js dev server
npm run build       # production build (.next/)
npm run start        # run the production build (requires `build` first)
npm run typecheck   # tsc --noEmit
npm run lint         # eslint .
npm run format       # prettier --write .
npm test             # jest --runInBand
npm run test:watch  # jest --watch
```

### Testing

Automated tests currently cover:

- `slugify` — English/Chinese normalization, unsupported-character stripping
- `tags` — trimming and de-duplication

Schema and repository-level tests still need to be ported over to the new structure.

---

## Credits

This project is inspired by the architectural ideas demonstrated in `realworld-react-fsd`, migrated from an earlier React Router + Webpack SPA to Next.js App Router.

---

## Notes

Image resources are for learning purposes only. Please do not use them for commercial purposes.

If there is any infringement, please contact me for removal. Thank you.

---

## License

This repository is intended for learning and demonstration purposes. Before publishing it as an open-source or commercial project, add an appropriate license and confirm the usage rights of all third-party assets, icons, fonts, and dependencies.

---

## Project Structure

> This is a high-level overview, not an exhaustive file listing.

```text
src/
├─ app/                              # Next.js App Router — routing only
│  ├─ layout.tsx
│  ├─ providers.tsx
│  ├─ page.tsx
│  ├─ globals.scss
│  ├─ not-found.tsx
│  ├─ error.tsx
│  ├─ admin/
│  │  ├─ layout.tsx
│  │  └─ articles/
│  │     ├─ page.tsx
│  │     ├─ new/page.tsx
│  │     └─ [articleId]/
│  │        ├─ edit/page.tsx
│  │        └─ preview/page.tsx
│  └─ articles/
│     ├─ page.tsx
│     └─ [slug]/page.tsx
│
├─ features/
│  ├─ article-list/ui/article-list-page.tsx
│  ├─ article-editor/ui/article-editor-page.tsx
│  ├─ article-preview/ui/article-preview-page.tsx
│  ├─ public-article-list/ui/public-article-list-page.tsx
│  └─ public-article/ui/public-article-page.tsx
│
├─ widgets/
│  └─ admin-shell/admin-shell.tsx
│
├─ shared/
│  ├─ api/
│  │  ├─ article.mapper.ts
│  │  ├─ article.queries.ts
│  │  ├─ article.repository.ts
│  │  └─ article.schema.ts
│  ├─ lib/
│  │  ├─ format-date.ts
│  │  ├─ markdown.ts
│  │  ├─ query-client.ts
│  │  ├─ slugify.ts
│  │  └─ tags.ts
│  └─ ui/
│     ├─ page-header.tsx
│     └─ status-badge.tsx
│
└─ test/
   └─ setup.ts
```