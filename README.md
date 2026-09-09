# travel-audio-guide-nextjs

[![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=nextdotjs&logoColor=white)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Architecture](https://img.shields.io/badge/Architecture-Page--Scoped%20FSD-4CAF50)](#project-structure)
[![State](https://img.shields.io/badge/Server%20State-TanStack%20Query-FF4154?logo=reactquery&logoColor=white)](https://tanstack.com/query)
[![Validation](https://img.shields.io/badge/Validation-Zod-3E67B1)](https://zod.dev)
[![Testing](https://img.shields.io/badge/Testing-Jest%20%2B%20Testing%20Library-C21325?logo=jest&logoColor=white)](#testing)
[![Articles Storage](https://img.shields.io/badge/Articles-Server%20JSON%20API-2E8B57)](#data-storage)
[![Products Storage](https://img.shields.io/badge/Products-Server%20JSON%20API-2E8B57)](#data-storage)
[![CI](https://github.com/tenSunFree/travel-audio-guide-nextjs/actions/workflows/ci.yml/badge.svg)](https://github.com/tenSunFree/travel-audio-guide-nextjs/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/tenSunFree/travel-audio-guide-nextjs/graph/badge.svg)](https://codecov.io/gh/tenSunFree/travel-audio-guide-nextjs)
[![CodeRabbit Reviews](https://img.shields.io/badge/Code%20Review-CodeRabbit-FF6B35)](https://coderabbit.ai)

---

## Introduction

`travel-audio-guide-nextjs` is a travel content and product catalog prototype built with Next.js App
Router, React, TypeScript, TanStack Query, React Hook Form, and Zod.

While the planned Go/PostgreSQL backend is still in development, both domains use the same
server-side persistence pattern:

- **Article data** is persisted through Next.js API routes (`/api/articles`) to a JSON file store (
  `data/articles.json`).
- **Product data** is persisted through Next.js API routes (`/api/products`) to a JSON file store (
  `data/products.json`).

The project contains two primary domains:

- **Article CMS** — create, edit, preview, and publish travel-related articles.
- **Travel Item Management** — create, edit, and publish travel-related products to a public
  storefront-style listing page.

The public website and administration interface live inside a single Next.js project. Active
application routing is handled through the App Router's file-system conventions under `src/app`.

The project follows a page-scoped Feature-Sliced Design approach with a compact and practical layer
set:

- `app`
- `features`
- `widgets`
- `shared`

This repository is intended for architectural practice, CMS prototyping, travel-platform
development, and technical demonstration.

---

## Related Backend

This project is designed to eventually connect to the `travel-audio-guide-go` backend for persistent
article and product data.

Planned backend stack:

- Go
- chi
- PostgreSQL
- pgxpool
- sqlc
- JWT authentication
- Docker

Until backend integration is completed:

- **Article data** is stored server-side as a JSON file (`data/articles.json`) and served through
  internal Next.js API routes (`/api/articles`).
- **Product data** is stored server-side as a JSON file (`data/products.json`) and served through
  internal Next.js API routes (`/api/products`).

Storage access is isolated behind repository abstractions:

- `ArticleRepository`
- `ProductRepository`

This separation allows the current server-side JSON file implementations for both domains to be
replaced with Go API clients later without rewriting the feature components.

Public article and product pages are currently client-rendered. Because both datasets already live
on the server, converting them to Server Components is a smaller step once the Go API is connected.

---

## Preview

<p align="left">
  <img src="https://i.postimg.cc/yxSQSMC5/2026-08-04-221719.png" height="200"/>
  <img src="https://i.postimg.cc/LXWQ5HG2/2026-08-04-191219.png" height="200"/>
</p>

---

## Features

### Article Management

- Create, edit, delete, and duplicate articles.
- Save articles as drafts or publish them.
- Automatically track creation, update, and publication timestamps.
- Display draft and published status indicators.
- Search articles by title, author, slug, excerpt, or tags.
- Filter articles by draft or published status.
- Export article data as JSON.
- Import article data from a JSON backup.
- Persist article data on the server so it is shared across devices and browsers, instead of being
  tied to a single browser's `localStorage`.

### Article Content Editing

- Edit article title, author, excerpt, tags, and body content.
- Write article content in Markdown.
- Display a live preview while editing.
- Automatically generate a URL-friendly slug from the title.
- Allow manual slug override.
- Validate slug uniqueness before saving (client and server).
- Validate form values with Zod and React Hook Form.
- Convert Markdown to HTML with `marked`.
- Sanitize generated HTML with DOMPurify before rendering.

### Article SEO Metadata

- Configure a custom SEO title and description per article.
- Fall back to the article title and excerpt when custom SEO fields are empty.
- Keep SEO fields in the article data model for future `generateMetadata()` integration.

### Article Preview and Publishing

- Preview draft or published content at `/admin/articles/[articleId]/preview`.
- Publish articles to `/articles/[slug]`.
- Browse published articles at `/articles`.
- Prevent draft articles from being returned by public repository queries.
- Open published article pages directly from the administration interface.

### Travel Item Management

- Create, edit, and delete travel-related products.
- Save products as drafts or publish them.
- Configure product name, slug, image, description, category, and price range.
- Upload a product image directly, or paste an image URL.
- Mark selected products as featured for priority display.
- Automatically track creation and update timestamps.
- Search products by name, slug, category, or description.
- Filter products by draft or published status.
- Display product category, price range, status, update time, and featured state in the
  administration table.
- Open the public travel-item page directly from the administration interface.
- Persist product data on the server so it is shared across devices and browsers.

### Product Image Upload

- Upload a product image directly from the editor, or paste an image URL.
- Automatically resize uploaded images client-side (longest edge capped at 1000px).
- Automatically compress uploaded images to JPEG (quality 0.82) before storing.
- Fill transparent PNG backgrounds with white before conversion, since JPEG has no alpha channel.
- Reject SVG uploads and images with unusable dimensions.
- Store the resulting image as a `data:image/jpeg;...` URL alongside the rest of the product record.
- Clear a previous upload error as soon as the user edits the image URL field, so stale error
  messages don't linger after switching from an upload attempt to a pasted URL.

### Product Validation

- Require a product name between 2 and 100 characters.
- Require a URL slug between 2 and 120 characters.
- Restrict slugs to lowercase letters, numbers, and hyphens.
- Reject duplicate product slugs, both on the client and on the server.
- Require a valid image (uploaded image or a valid image URL).
- Limit product descriptions to 300 characters.
- Prevent negative prices.
- Require the maximum price to be greater than or equal to the minimum price.
- Leave price inputs empty by default instead of defaulting to `0`, so the user is required to enter
  a value explicitly.
- Validate all product forms and stored records with Zod, both on the client (form submission) and
  on the server (API routes).

### Public Travel Item Page

- Display published products at `/travel-items`.
- Automatically reflect products published from the administration interface.
- Seed the server with example products on first use.
- Search products by name, description, or category.
- Filter products by available category.
- Sort products by featured priority.
- Sort products by price from low to high or high to low.
- Display responsive product cards with image, category, name, description, and price range.
- Display inquiry-cart and favorite controls as presentational UI.
- Hide draft products from the public page.
- Show an empty state with a link to create a product when no products match.

> The cart, favorites, authentication, language switcher, currency switcher, and individual
> product-detail pages are currently presentation placeholders and are not complete commerce
> features.

### Import and Export

Article data supports JSON import and export:

- Export all article data as a JSON backup.
- Import article data from a JSON file.
- Validate imported records with Zod.
- Reject malformed records and duplicate slugs or ids.
- Refresh TanStack Query caches after importing data.

Product import and export have not yet been implemented as an administration feature.

### Data Storage

Article and product data both use the same server-side JSON file strategy.

**Articles** are stored at `data/articles.json`, accessed through `/api/articles` and
`/api/articles/[articleId]`, and isolated behind the `ArticleRepository` abstraction. The server
store lives in `article.store.server.ts`.

**Products** are stored at `data/products.json`, accessed through `/api/products` and
`/api/products/[productId]`, and isolated behind the `ProductRepository` abstraction. The server
store lives in `product.store.server.ts`.

For both domains:

- Writes are serialized within a single Node.js process.
- Writes are atomic (write to a temp file, then rename) to avoid partial or corrupted data on crash.
- `data/` is excluded from version control via `.gitignore`; data is local to whichever machine or
  environment is running the server.

This approach provides:

- Fast prototyping without a database.
- Persistence after page refresh.
- Shared data across devices and browsers on the same server.
- A realistic asynchronous repository interface for both domains.
- Clear separation between UI features and storage implementations.
- A straightforward migration path toward the future Go API for both domains.

Current limitations (both domains):

- Suitable for a single-instance development environment only; the in-process write queue does not
  protect against concurrent writes across multiple server processes or instances.
- Storage is ephemeral on common serverless hosts (for example Cloud Run); redeploying or recycling
  an instance can delete JSON files under `data/` unless they are mounted on durable storage.
- Access control is a single shared `ADMIN_TOKEN` session cookie checked in middleware (see
  [Administration Authentication](#administration-authentication)), not per-user authentication or
  role-based access control.
- There is no revision history.
- There is no production-grade backup strategy.
- Product images are embedded as base64 data URLs directly in `data/products.json` rather than
  stored in dedicated object storage, which increases file size over time.
- Product image availability (for pasted URLs) depends on external hosts remaining online.

These limitations are expected to be addressed after the Go API and PostgreSQL persistence layer are
connected.

### Cross-Tab and Cross-Device Synchronization

Articles and products use the same synchronization strategy:

- Admin lists and public lists poll the API every 30 seconds (paused while the browser tab is in the
  background).
- Queries refetch when the window regains focus.
- Mutations performed in the current tab invalidate their own query caches directly.

Because both datasets live on the server, changes made from another device or browser on the same
development server appear without relying on `localStorage` or the browser `storage` event.

### User Experience

- Responsive administration layout with sidebar navigation.
- Separate administration sections for articles and products.
- Direct links from the administration interface to public pages.
- Search and status filters in administration lists.
- Public product search, category filtering, and sorting.
- Empty, loading, success, and error states.
- Route-level `error.tsx` and `not-found.tsx` fallbacks.
- Save-state feedback, including a warning when there are unsaved changes.
- Delete confirmation.
- Live article and product previews while editing.

### Architecture

- Next.js App Router file-system routing for active application routes.
- Page-scoped Feature-Sliced Design.
- Separate feature modules for article and product domains.
- Repository abstractions isolating the server-side JSON stores from feature components.
- `ArticleRepository` for article persistence, calling internal API routes.
- `ProductRepository` for product persistence, calling internal API routes.
- Server-only stores (`article.store.server.ts`, `product.store.server.ts`) performing serialized,
  atomic reads and writes to JSON files under `data/`.
- `src/middleware.ts` guarding admin pages and write-capable API routes with a shared-secret session
  cookie (see [Administration Authentication](#administration-authentication)).
- TanStack Query for asynchronous state, caching, mutations, invalidation, and polling.
- Structured query keys for article and product list/detail views.
- React Hook Form for editor form state.
- Zod for form, persisted-record, and import validation, on both the client and the server.
- Shared UI components for page headers and status badges.
- Safe Markdown rendering through `marked` and DOMPurify.

---

## Tech Stack

- **Next.js 16 (App Router)** — file-system routing, layouts, Server/Client Component boundaries,
  and Route Handlers for the article and product APIs.
- **React 19** — component model for the public site and administration interface.
- **TypeScript 5** — static types across routes, schemas, repositories, forms, query options, and
  UI.
- **TanStack Query 5** — cache and asynchronous state management for article and product lists,
  details, and mutations.
- **React Hook Form** — article and product editor form state with minimal re-renders.
- **Zod 4** — runtime validation for forms, stored records, and imported article data.
- **Marked** — Markdown-to-HTML conversion.
- **DOMPurify** — sanitization of Markdown-generated HTML.
- **Lucide React** — administration and storefront icons.
- **Sass** — global styling and responsive layouts.
- **Jest 30 + Testing Library** — utility and component test foundation through `next/jest`.
- **ESLint 9** — flat configuration with `eslint-config-next`, run directly via the ESLint CLI (
  Next.js 16 removed the `next lint` command).
- **Prettier 3** — source formatting.
- **GitHub Actions** — CI running format, lint, typecheck, test coverage, and build on every
  qualifying push and pull request, with actions pinned to commit SHAs.
- **Codecov** — test coverage reporting.
- **lint-staged** — runs Prettier and ESLint against staged content only in the pre-commit hook, so
  checks match exactly what is about to be committed.
- **Gitleaks (optional)** — local secret scanning in the pre-commit hook, with a lightweight regex
  fallback when not installed.

---

## Environment

- Node.js: `20.9` or later.
- npm: bundled with Node.js.
- Next.js: `16.x`.
- React: `19.x`.

### Local Environment Variables

Copy `.env.example` to `.env.local` and fill in values as needed. `.env.local` is excluded by
`.gitignore` and should not be committed.

```text
ADMIN_TOKEN=
DEV_ALLOWED_ORIGINS=192.168.0.49
```

`ADMIN_TOKEN` is a shared secret that protects the administration interface and any write-capable
article/product API request. It is required — `npm run dev` will start without it, but admin login
attempts fail with a 500 until it is set. See
[Administration Authentication](#administration-authentication) for how it is used.

`DEV_ALLOWED_ORIGINS` is a comma-separated list of hostnames or LAN IP addresses. It is read by
`next.config.mjs` and passed to Next.js's `allowedDevOrigins` option, allowing devices on the same
network (for example, a phone on the same Wi-Fi) to reach the development server without
cross-origin warnings. This variable is optional; leave it unset if you only develop against
`localhost`.

`npm run dev` binds the development server to `0.0.0.0`, making it reachable from other devices on
the local network. Admin pages and write-capable API routes still require the `ADMIN_TOKEN` session
described above, so LAN reachability alone does not expose them — but a shared secret compared over
plain HTTP is still only appropriate for a trusted local network, not the public internet.

---

## Local Development

Install dependencies:

```bash
npm install
```

Configure the recommended Git hooks (optional but recommended):

```bash
npm run hooks:install
```

This points Git at the version-controlled hooks in `scripts/hooks/` via `core.hooksPath`, so they
run automatically without copying files into `.git/hooks/`. See [Git Hooks](#git-hooks) for what
each hook checks.

Start the development server:

```bash
npm run dev
```

Open:

```text
http://localhost:30401
```

`npm run dev` runs the `predev` script first. The script uses `kill-port 30401` to stop a leftover
process before starting the Next.js development server, preventing an `EADDRINUSE` error.

### Administration Pages

```text
http://localhost:30401/admin/articles
http://localhost:30401/admin/articles/new
http://localhost:30401/admin/products
http://localhost:30401/admin/products/new
```

These require signing in at `/admin/login` with the `ADMIN_TOKEN` value first — see
[Administration Authentication](#administration-authentication).

### Public Pages

```text
http://localhost:30401/articles
http://localhost:30401/travel-items
```

---

## Administration Authentication

The administration interface and any request that mutates data or lists non-published
articles/products are protected by `src/middleware.ts`, using a single shared `ADMIN_TOKEN` stored
in an httpOnly session cookie:

- Visiting an `/admin/*` page without a valid session redirects to `/admin/login?next=<path>`.
- `POST /api/admin/login` compares the submitted token against `ADMIN_TOKEN` and, on success, sets
  an httpOnly `admin_session` cookie (`sameSite=lax`, `secure` in production, 8-hour expiry).
- `DELETE /api/admin/login` clears the cookie (sign-out).
- Requests to `/api/articles/*` and `/api/products/*` require a valid session **except** for
  `GET ?status=published` and `GET ?slug=...`, which stay public so the storefront and public
  article pages keep working without authentication.
- Unauthenticated requests to a protected API route receive `401`; unauthenticated requests to a
  protected admin page are redirected to `/admin/login`.

This is a **Phase 1.5 stopgap** suitable for a single trusted administrator on a local or private
network — it is not per-user authentication and has no roles, audit log, or token rotation. It is
expected to be replaced by real session/user authentication once the Go API and PostgreSQL are
connected (see [Future Development](#future-development)).

---

## Main Routes

| Route                                 | Description                    |
| ------------------------------------- | ------------------------------ |
| `/`                                   | Redirects to `/admin/articles` |
| `/admin/login`                        | Administration login           |
| `/admin/articles`                     | Article administration list    |
| `/admin/articles/new`                 | Create a new article           |
| `/admin/articles/[articleId]/edit`    | Edit an article                |
| `/admin/articles/[articleId]/preview` | Preview an article             |
| `/articles`                           | Public published-article index |
| `/articles/[slug]`                    | Public article page            |
| `/admin/products`                     | Product administration list    |
| `/admin/products/new`                 | Create a new travel item       |
| `/admin/products/[productId]/edit`    | Edit a travel item             |
| `/travel-items`                       | Public travel-item listing     |

The product slug is currently reserved for a future product-detail route. There is no
`/travel-items/[slug]` page yet.

### API Routes

| Route                       | Method   | Description                                                                                                                                |
| --------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `/api/admin/login`          | `POST`   | Log in with `ADMIN_TOKEN`; sets the `admin_session` cookie on success                                                                      |
| `/api/admin/login`          | `DELETE` | Clear the `admin_session` cookie (sign-out)                                                                                                |
| `/api/articles`             | `GET`    | List all articles (requires a session), or published-only with `?status=published`; `?slug=` for a published article by slug (both public) |
| `/api/articles`             | `POST`   | Create an article; `?action=duplicate` or `?action=import` for special actions (requires a session)                                        |
| `/api/articles/[articleId]` | `GET`    | Get a single article by id (requires a session)                                                                                            |
| `/api/articles/[articleId]` | `PUT`    | Update an article (requires a session)                                                                                                     |
| `/api/articles/[articleId]` | `DELETE` | Delete an article (requires a session)                                                                                                     |
| `/api/products`             | `GET`    | List all products (requires a session), or published-only with `?status=published` (public)                                                |
| `/api/products`             | `POST`   | Create a product (requires a session)                                                                                                      |
| `/api/products/[productId]` | `GET`    | Get a single product by id (requires a session)                                                                                            |
| `/api/products/[productId]` | `PUT`    | Update a product (requires a session)                                                                                                      |
| `/api/products/[productId]` | `DELETE` | Delete a product (requires a session)                                                                                                      |

All article and product routes read from and write to JSON files under `data/` on the server and are
validated with Zod. "Requires a session" means the `admin_session` cookie described in
[Administration Authentication](#administration-authentication); requests without it receive `401`.

---

## Useful Commands

```bash
npm run dev            # Stop port 30401 first, then start the development server
npm run build          # Create a production build in .next/
npm run start          # Run the production build on port 30401
npm run typecheck      # Run TypeScript checking without emitting files
npm run lint           # Run ESLint directly (next lint was removed in Next.js 16)
npm run format         # Format the project with Prettier
npm run format:check   # Check formatting without writing changes (used in CI)
npm test               # Run Jest serially
npm run test:watch     # Run Jest in watch mode
npm run test:coverage  # Run Jest serially with coverage collection
npm run ci             # Run format:check, lint, typecheck, test:coverage, and build in sequence
npm run hooks:install  # Configure pre-commit and pre-push Git hooks
```

---

## Testing

The project has unit, integration, and component test coverage across the schema/store/repository
layer, all API route handlers, and the two most complex editor pages.

### Unit tests

- `slugify` — English and Chinese normalization and unsupported-character stripping.
- `tags` — trimming and de-duplication.
- `format-date` — placeholder fallback for null/empty/invalid input, valid ISO formatting.
- `markdown` (`renderMarkdown`) — DOMPurify sanitization of `marked`'s output (script tags, inline
  event handlers), safe-HTML passthrough. `marked` itself is mocked, since it ships ESM-only and
  can't be transformed through `next/jest`'s default `transformIgnorePatterns`.
- `image-file-to-data-url` — MIME/SVG rejection, resize + aspect-ratio preservation, JPEG
  compression quality, canvas/FileReader failure paths. `FileReader`, `Image`, and `HTMLCanvasElement`
  are faked, since jsdom doesn't implement real image decoding.
- `article.schema` / `product.schema` — required fields, length limits, slug regex, status/category
  enums, `minPrice`/`maxPrice` cross-field validation, trimming behavior.
- `article.mapper` — tag parsing/dedup, SEO title/description fallback to title/excerpt, round-trip
  conversion.

### Store and repository tests

- `articleStore` / `productStore` — full CRUD (`list`, `listPublished`, `getById`, `create`,
  `update`, `remove`, plus `duplicate` and `replaceAll` for articles), slug-conflict rejection,
  atomic write-then-rename behavior, ENOENT seeding, malformed-JSON and schema-violation error
  paths. The filesystem (`node:fs/promises`) is mocked.
- `articleRepository` / `productRepository` — every method (`list`, `listPublished`, `getById`,
  `create`, `update`, `duplicate`, `remove`, `exportJson`, `importJson` for articles), URL encoding
  of ids/slugs, 404-to-null handling, server error message surfacing, and fallback error messages
  when the error response body itself isn't parseable. `fetch` is mocked.

### API route tests

- `middleware` — session-cookie authorization, public read-path allowlisting (`?status=published`,
  `?slug=`), admin-page redirects, and 401 responses for unauthenticated API requests (articles and
  products).
- `/api/admin/login` — missing/incorrect token, missing `ADMIN_TOKEN` server config, cookie flags
  (`httpOnly`, `sameSite`, `secure` in production only), sign-out.
- `/api/articles`, `/api/articles/[articleId]`, `/api/products`, `/api/products/[productId]` —
  success paths, validation (400), not-found (404), slug conflicts (409), and unexpected-error (500)
  paths for every handler. The store layer is mocked; `Request`/`Response` come from Node's native
  Fetch API, so these run under `@jest-environment node`.

### Component tests (React Testing Library)

- `ArticleEditorPage` — required-field errors, slug auto-generation and manual override, invalid
  slug format, submit success/failure, notFound on a missing article, publish-only public-page
  link, SEO panel fallback text, live preview rendering.
- `ProductEditorPage` — required-field errors, slug auto-generation, `maxPrice < minPrice`
  validation, pasted image URL preview, image upload success/failure (including a hidden
  `<input type="file">`, which needs `fireEvent.change` rather than `user-event`'s `upload()`),
  submit success/failure, featured-checkbox toggle, edit-mode load/notFound/update.
- `ArticleListPage` — empty state, search filtering (title/author/slug/tags), status filtering,
  publish-only public-page link, delete with confirm/cancel, duplicate-and-navigate, import
  success/failure notices, dismissing a notice. jsdom's `File` has no `.text()` method, so the
  import tests polyfill it via `FileReader`.

Not yet covered: `ProductListPage`, `TravelItemsPage`, `ArticlePreviewPage`,
`PublicArticleListPage`, `PublicArticlePage`, and the presentational `PageHeader`/`StatusBadge`
components (indirectly exercised through the pages above, but with no dedicated test file). No
end-to-end (Playwright) tests exist yet.

Run tests with:

```bash
npm test
```

Run tests with coverage (used in CI, uploaded to Codecov):

```bash
npm run test:coverage
```

---

## Git Hooks

Optional Git hooks under `scripts/hooks/` provide fast, local feedback before changes reach CI:

- **`pre-commit`** — runs [lint-staged](https://github.com/okonet/lint-staged) (Prettier and ESLint
  against staged content, not working-tree files, so checks match exactly what will be committed),
  and scans staged changes for potential secrets
  using [Gitleaks](https://github.com/gitleaks/gitleaks) if installed, or a lightweight regex
  fallback if not.
- **`pre-push`** — rejects a push if the working tree has uncommitted changes (so the CI run below
  reflects exactly what is about to be pushed), then runs the full `npm run ci` pipeline (format
  check, lint, typecheck, test coverage, build).

Install them once after cloning:

```bash
npm run hooks:install
```

This configures `core.hooksPath` to point at `scripts/hooks/`, so the hooks are executed directly
from version control instead of being copied into `.git/hooks/`.

Hooks can be skipped in an emergency with `git commit --no-verify` or `git push --no-verify`, but
this is not recommended. Git hooks catch most issues early; they do not fully replace GitHub Actions
CI, since local and CI environments can still differ (line endings, filesystem case sensitivity,
Node version).

---

## Continuous Integration

Every qualifying push to `main` (excluding changes limited to `**.md`, `docs/**`, or `.gitignore`)
and every pull request runs a GitHub Actions workflow (`.github/workflows/ci.yml`) that performs:

1. `npm run format:check` — Prettier formatting check.
2. `npm run lint` — ESLint.
3. `npm run typecheck` — TypeScript checking.
4. `npm run test:coverage` — Jest with coverage collection.
5. Coverage upload to Codecov.
6. `npm run build` — production build verification.

GitHub Actions are pinned to specific commit SHAs (rather than floating version tags) to reduce
supply-chain risk, with a version comment next to each pin for readability.

Pull requests are additionally reviewed automatically by CodeRabbit.

---

## Data Flow

### Article Publishing

```text
Article editor
  → React Hook Form + Zod validation (client)
  → ArticleRepository
  → /api/articles or /api/articles/[articleId] (behind src/middleware.ts session check)
  → Zod validation (server)
  → article.store.server.ts (serialized, atomic read/write)
  → data/articles.json
  → TanStack Query invalidation + 30s polling
  → public article queries
  → /articles and /articles/[slug]
```

Only articles with `status: "published"` are returned to the public article pages.

### Product Publishing

```text
Product editor
  → React Hook Form + Zod validation (client)
  → ProductRepository
  → /api/products or /api/products/[productId] (behind src/middleware.ts session check)
  → Zod validation (server)
  → product.store.server.ts (serialized, atomic read/write)
  → data/products.json
  → TanStack Query invalidation + 30s polling
  → publishedProductListQuery
  → /travel-items
```

Only products with `status: "published"` are returned to the public travel-item page. Published
products are initially ordered by featured priority and then by update time.

---

## Future Development

Planned or reasonable next steps include:

- Replace server-file repositories with Go API clients.
- Persist articles and products in PostgreSQL.
- Replace the shared `ADMIN_TOKEN` cookie stopgap (see
  [Administration Authentication](#administration-authentication)) with real JWT-based, per-user
  administration authentication.
- Add role-based access control.
- Store uploaded product images in dedicated object storage instead of embedding base64 data URLs in
  `data/products.json`.
- Convert public pages to server-rendered data fetching.
- Add `generateMetadata()` for server-generated SEO metadata.
- Add Open Graph and social-sharing metadata.
- Add product-detail pages at `/travel-items/[slug]`.
- Add administration-facing product import and export.
- Add pagination for large article and product collections.
- Add real inquiry-cart behavior.
- Add favorites persistence.
- Add language and currency support.
- Add component tests for `ProductListPage`, `TravelItemsPage`, and the remaining public pages.
- Add Playwright end-to-end coverage for the core login → create → publish → public-page flows.
- Add CI coverage thresholds and PR-level coverage reporting through Codecov.
- Validate exact staged/pushed Git content in an isolated worktree for stronger hook guarantees,
  rather than relying on a clean working tree at push time.

**Completed (Phase 1.5):** Article storage has been migrated from browser `localStorage` to the same
server JSON + API + repository pattern used by products. Cross-device sync for both domains now
relies on polling and focus refetch instead of the `storage` event.

**Completed (Phase 1.6):** Admin pages and write-capable article/product API routes are now
protected by a shared `ADMIN_TOKEN` session cookie enforced in `src/middleware.ts`. See
[Administration Authentication](#administration-authentication).

**Completed:** Test coverage was raised from roughly 11% to over 80% statements, adding
unit tests for schemas/mappers/utilities, full store and repository coverage for both domains, tests
for every API route handler, and React Testing Library component tests for the article/product
editors and the article list page. See [Testing](#testing) for details.

---

## Migration Note

The active application uses Next.js App Router routes under `src/app`. The repository still contains
files under `src/pages` and several earlier migration-related files such as `browser-router.tsx`,
`route-error.tsx`, `styles.scss`, and `src/index.tsx`. These belong to the previous React Router +
Webpack implementation and are not part of the intended App Router architecture. After confirming
that no required code depends on them, remove the legacy files to keep the project structure
consistent and prevent stale imports or missing-package type errors.

---

## Credits

This project is inspired by the architectural ideas demonstrated in `realworld-react-fsd` and was
migrated from an earlier React Router + Webpack SPA to Next.js App Router.

---

## Notes

Image resources are intended for learning and demonstration purposes only. Do not use third-party
images commercially without confirming their licenses and usage rights. If an asset infringes
copyright or other rights, remove or replace it promptly.

The public travel-item page is a visual catalog prototype. It does not currently process payments,
submit inquiries, authenticate customers, or maintain a real shopping cart.

---

## License

This repository is intended for learning and demonstration purposes. Before publishing it as an
open-source or commercial project:

- Add an appropriate license.
- Confirm the usage rights of all third-party assets.
- Confirm the licenses of icons, fonts, images, and dependencies.
- Replace demonstration image URLs when necessary.

---

## Project Structure

> This is a high-level overview of the current repository, not an exhaustive listing.

```text
scripts/
├─ hooks/
│  ├─ pre-commit          # lint-staged (staged Prettier + ESLint) + secret scan
│  └─ pre-push            # Reject dirty worktree, then full `npm run ci`
└─ setup-hooks.sh         # Configures core.hooksPath

src/
├─ middleware.ts          # Admin session-cookie auth guard for /admin/* and write-capable APIs
├─ middleware.test.ts
├─ app/                   # Next.js App Router routes and app setup
│  ├─ layout.tsx
│  ├─ providers.tsx
│  ├─ page.tsx
│  ├─ globals.scss
│  ├─ not-found.tsx
│  ├─ error.tsx
│  ├─ admin/
│  │  ├─ layout.tsx
│  │  ├─ login/
│  │  │  └─ page.tsx
│  │  ├─ articles/
│  │  │  ├─ page.tsx
│  │  │  ├─ new/
│  │  │  │  └─ page.tsx
│  │  │  └─ [articleId]/
│  │  │     ├─ edit/
│  │  │     │  └─ page.tsx
│  │  │     └─ preview/
│  │  │        └─ page.tsx
│  │  └─ products/
│  │     ├─ page.tsx
│  │     ├─ new/
│  │     │  └─ page.tsx
│  │     └─ [productId]/
│  │        └─ edit/
│  │           └─ page.tsx
│  ├─ api/
│  │  ├─ admin/
│  │  │  └─ login/
│  │  │     ├─ route.ts
│  │  │     └─ route.test.ts
│  │  ├─ articles/
│  │  │  ├─ route.ts
│  │  │  ├─ route.test.ts
│  │  │  └─ [articleId]/
│  │  │     ├─ route.ts
│  │  │     └─ route.test.ts
│  │  └─ products/
│  │     ├─ route.ts
│  │     ├─ route.test.ts
│  │     └─ [productId]/
│  │        ├─ route.ts
│  │        └─ route.test.ts
│  ├─ articles/
│  │  ├─ page.tsx
│  │  └─ [slug]/
│  │     └─ page.tsx
│  └─ travel-items/
│     └─ page.tsx
│
├─ features/              # Page-scoped feature implementations
│  ├─ article-editor/
│  │  └─ ui/
│  │     ├─ article-editor-page.tsx
│  │     └─ article-editor-page.test.tsx
│  ├─ article-list/
│  │  └─ ui/
│  │     ├─ article-list-page.tsx
│  │     └─ article-list-page.test.tsx
│  ├─ article-preview/
│  │  └─ ui/article-preview-page.tsx
│  ├─ product-editor/
│  │  └─ ui/
│  │     ├─ product-editor-page.tsx
│  │     └─ product-editor-page.test.tsx
│  ├─ product-list/
│  │  └─ ui/product-list-page.tsx
│  ├─ public-article-list/
│  │  └─ ui/public-article-list-page.tsx
│  ├─ public-article/
│  │  └─ ui/public-article-page.tsx
│  └─ travel-items/
│     └─ ui/travel-items-page.tsx
│
├─ widgets/
│  └─ admin-shell/
│     └─ admin-shell.tsx
│
├─ shared/
│  ├─ api/
│  │  ├─ article.mapper.ts
│  │  ├─ article.mapper.test.ts
│  │  ├─ article.queries.ts
│  │  ├─ article.repository.ts
│  │  ├─ article.repository.test.ts
│  │  ├─ article.schema.ts
│  │  ├─ article.schema.test.ts
│  │  ├─ article.store.server.ts
│  │  ├─ article.store.server.test.ts
│  │  ├─ product.queries.ts
│  │  ├─ product.repository.ts
│  │  ├─ product.repository.test.ts
│  │  ├─ product.schema.ts
│  │  ├─ product.schema.test.ts
│  │  ├─ product.store.server.ts
│  │  └─ product.store.server.test.ts
│  ├─ lib/
│  │  ├─ format-date.ts
│  │  ├─ format-date.test.ts
│  │  ├─ generate-uuid.ts
│  │  ├─ image-file-to-data-url.ts
│  │  ├─ image-file-to-data-url.test.ts
│  │  ├─ markdown.ts
│  │  ├─ markdown.test.ts
│  │  ├─ query-client.ts
│  │  ├─ slugify.ts
│  │  ├─ slugify.test.ts
│  │  ├─ tags.ts
│  │  └─ tags.test.ts
│  └─ ui/
│     ├─ page-header.tsx
│     └─ status-badge.tsx
│
└─ test/
   ├─ setup.ts
   └─ style-mock.js
```

Legacy migration files still exist under `src/pages` and in several top-level `src/app` or `src`
files. See [Migration Note](#migration-note).