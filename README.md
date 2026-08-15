# travel-audio-guide-nextjs

[![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=nextdotjs&logoColor=white)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Architecture](https://img.shields.io/badge/Architecture-Page--Scoped%20FSD-4CAF50)](#project-structure)
[![State](https://img.shields.io/badge/Server%20State-TanStack%20Query-FF4154?logo=reactquery&logoColor=white)](https://tanstack.com/query)
[![Validation](https://img.shields.io/badge/Validation-Zod-3E67B1)](https://zod.dev)
[![Testing](https://img.shields.io/badge/Testing-Jest%20%2B%20Testing%20Library-C21325?logo=jest&logoColor=white)](#testing)
[![Articles Storage](https://img.shields.io/badge/Articles-localStorage-7952B3)](#data-storage)
[![Products Storage](https://img.shields.io/badge/Products-Server%20JSON%20API-2E8B57)](#data-storage)
[![CI](https://github.com/tenSunFree/travel-audio-guide-nextjs/actions/workflows/ci.yml/badge.svg)](https://github.com/tenSunFree/travel-audio-guide-nextjs/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/tenSunFree/travel-audio-guide-nextjs/graph/badge.svg)](https://codecov.io/gh/tenSunFree/travel-audio-guide-nextjs)
[![CodeRabbit Reviews](https://img.shields.io/badge/Code%20Review-CodeRabbit-FF6B35)](https://coderabbit.ai)

---

## Introduction

`travel-audio-guide-nextjs` is a travel content and product catalog prototype built with Next.js App Router, React, TypeScript, TanStack Query, React Hook Form, and Zod.

The project currently uses a hybrid persistence model while the planned Go/PostgreSQL backend is still in development:

- **Article data** is stored in browser `localStorage`.
- **Product data** is persisted server-side, through Next.js API routes to a JSON file store.

The project contains two primary domains:

- **Article CMS** — create, edit, preview, and publish travel-related articles.
- **Travel Item Management** — create, edit, and publish travel-related products to a public storefront-style listing page.

The public website and administration interface live inside a single Next.js project. Active application routing is handled through the App Router's file-system conventions under `src/app`.

The project follows a page-scoped Feature-Sliced Design approach with a compact and practical layer set:

- `app`
- `features`
- `widgets`
- `shared`

This repository is intended for architectural practice, CMS prototyping, travel-platform development, and technical demonstration.

---

## Related Backend

This project is designed to eventually connect to the `travel-audio-guide-go` backend for persistent article and product data.

Planned backend stack:

- Go
- chi
- PostgreSQL
- pgxpool
- sqlc
- JWT authentication
- Docker

Until backend integration is completed:

- **Article data** is stored in browser `localStorage`.
- **Product data** is stored server-side as a JSON file (`data/products.json`) and served through internal Next.js API routes (`/api/products`).

Storage access is isolated behind repository abstractions:

- `ArticleRepository`
- `ProductRepository`

This separation allows both the browser `localStorage` implementation (articles) and the current server-side JSON file implementation (products) to be replaced with Go API clients later without rewriting the feature components.

Public article pages are still client-rendered because browser `localStorage` is unavailable during server rendering. The public product listing page is also client-rendered today; because product data already lives on the server, it is a smaller step to convert it to a Server Component once the Go API is connected.

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

### Article Content Editing

- Edit article title, author, excerpt, tags, and body content.
- Write article content in Markdown.
- Display a live preview while editing.
- Automatically generate a URL-friendly slug from the title.
- Allow manual slug override.
- Validate slug uniqueness before saving.
- Validate form values with Zod and React Hook Form.
- Convert Markdown to HTML with `marked`.
- Sanitize generated HTML with DOMPurify before rendering.

### Article SEO Metadata

- Configure a custom SEO title and description per article.
- Fall back to the article title and excerpt when custom SEO fields are empty.
- Keep SEO fields in the article data model for future `generateMetadata()` integration.
- Update browser metadata on the current client-rendered public article page as a temporary local-storage phase solution.

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
- Display product category, price range, status, update time, and featured state in the administration table.
- Open the public travel-item page directly from the administration interface.
- Persist product data on the server so it is shared across devices and browsers, instead of being tied to a single browser's `localStorage`.

### Product Image Upload

- Upload a product image directly from the editor, or paste an image URL.
- Automatically resize uploaded images client-side (longest edge capped at 1000px).
- Automatically compress uploaded images to JPEG (quality 0.82) before storing.
- Fill transparent PNG backgrounds with white before conversion, since JPEG has no alpha channel.
- Reject SVG uploads and images with unusable dimensions.
- Store the resulting image as a `data:image/jpeg;...` URL alongside the rest of the product record.

### Product Validation

- Require a product name between 2 and 100 characters.
- Require a URL slug between 2 and 120 characters.
- Restrict slugs to lowercase letters, numbers, and hyphens.
- Reject duplicate product slugs, both on the client and on the server.
- Require a valid image (uploaded image or a valid image URL).
- Limit product descriptions to 300 characters.
- Prevent negative prices.
- Require the maximum price to be greater than or equal to the minimum price.
- Leave price inputs empty by default instead of defaulting to `0`, so the user is required to enter a value explicitly.
- Validate all product forms and stored records with Zod, both on the client (form submission) and on the server (API routes).

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

> The cart, favorites, authentication, language switcher, currency switcher, and individual product-detail pages are currently presentation placeholders and are not complete commerce features.

### Import and Export

Article data currently supports JSON import and export:

- Export all local article data as a JSON backup.
- Import article data from a JSON file.
- Validate imported records with Zod.
- Reject malformed records, duplicate IDs, and duplicate slugs.
- Refresh TanStack Query caches after importing data.

Product import and export have not yet been implemented as an administration feature. A one-time server-side import route was used to migrate existing browser data to the server and has since been removed.

### Data Storage

Article and product data currently use two different storage strategies.

**Articles** are stored in browser `localStorage`, isolated behind the `ArticleRepository` abstraction.

Storage key:

```text
travel-audio-guide-nextjs:articles:v1
```

The article storage key is defined by `STORAGE_KEY` in `article.repository.ts`.

**Products** are stored server-side as a JSON file at `data/products.json`, accessed through `/api/products` and `/api/products/[productId]`, and isolated behind the `ProductRepository` abstraction. Writes are serialized within a single Node.js process and written atomically (write to a temp file, then rename) to avoid partial or corrupted data on crash.

`data/` is excluded from version control via `.gitignore`; product data is local to whichever machine or environment is running the server.

This mixed local-first approach provides:

- Fast prototyping without a database.
- Persistence after page refresh (both articles and products).
- Product data shared across devices and browsers on the same server, unlike the article's per-browser storage.
- A realistic asynchronous repository interface for both domains.
- Clear separation between UI features and storage implementations.
- A straightforward migration path toward the future Go API for both domains.

Current limitations:

**Articles** (browser `localStorage`):

- Data is isolated to one browser and device.
- There is no multi-user synchronization.
- Browser storage can be cleared by the user.
- Public article data is not shared across users.

**Products** (server-side JSON file):

- Suitable for a single-instance development environment only; the in-process write queue does not protect against concurrent writes across multiple server processes or instances.
- Storage is ephemeral on common serverless hosts; redeploying can delete `data/products.json` unless it is mounted on durable storage.
- There is no authentication or server-side access control on the product API routes.
- There is no revision history.
- There is no production-grade backup strategy.
- Product images are embedded as base64 data URLs directly in `data/products.json` rather than stored in dedicated object storage, which increases file size over time.

**Both domains:**

- Product image availability (for pasted URLs) depends on external hosts remaining online.
- These limitations can be addressed after the Go API and PostgreSQL persistence layer are connected.

### Cross-Tab and Cross-Device Synchronization

Articles and products use different synchronization strategies, matching their different storage backends:

- **Articles** — the root `Providers` component listens for the browser's native `storage` event. When article data changes in another browser tab, the corresponding TanStack Query cache is invalidated and refreshed automatically.
- **Products** — since product data lives on the server, the admin product list and the public travel-item list poll the API every 30 seconds (paused while the browser tab is in the background) and refetch when the window regains focus, so changes made from another device or tab appear without a manual refresh.

Mutations performed in the current tab invalidate their own query caches directly in both cases.

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
- Repository abstractions isolating `localStorage` (articles) and the server-side JSON store (products) from feature components.
- `ArticleRepository` for article persistence.
- `ProductRepository` for product persistence, calling internal API routes.
- Server-only product store (`product.store.server.ts`) performing serialized, atomic reads and writes to `data/products.json`.
- TanStack Query for asynchronous state, caching, mutations, and invalidation.
- Structured query keys for article and product list/detail views.
- React Hook Form for editor form state.
- Zod for form, persisted-record, and import validation, on both the client and the server.
- Shared UI components for page headers and status badges.
- Safe Markdown rendering through `marked` and DOMPurify.

---

## Tech Stack

- **Next.js 16 (App Router)** — file-system routing, layouts, Server/Client Component boundaries, and Route Handlers for the product API.
- **React 19** — component model for the public site and administration interface.
- **TypeScript 5** — static types across routes, schemas, repositories, forms, query options, and UI.
- **TanStack Query 5** — cache and asynchronous state management for article and product lists, details, and mutations.
- **React Hook Form** — article and product editor form state with minimal re-renders.
- **Zod 4** — runtime validation for forms, stored records, and imported article data.
- **Marked** — Markdown-to-HTML conversion.
- **DOMPurify** — sanitization of Markdown-generated HTML.
- **Lucide React** — administration and storefront icons.
- **Sass** — global styling and responsive layouts.
- **Jest 30 + Testing Library** — utility and component test foundation through `next/jest`.
- **ESLint 9** — flat configuration with `eslint-config-next`, run directly via the ESLint CLI (Next.js 16 removed the `next lint` command).
- **Prettier 3** — source formatting.
- **GitHub Actions** — CI running format, lint, typecheck, test coverage, and build on every push and pull request.
- **Codecov** — test coverage reporting.

---

## Environment

- Node.js: `20.9` or later.
- npm: bundled with Node.js.
- Next.js: `16.x`.
- React: `19.x`.

### Local Environment Variables

Copy `.env.example` to `.env.local` and fill in values as needed. `.env.local` is excluded by `.gitignore` and should not be committed.

```text
DEV_ALLOWED_ORIGINS=192.168.0.49
```

`DEV_ALLOWED_ORIGINS` is a comma-separated list of hostnames or LAN IP addresses. It is read by `next.config.mjs` and passed to Next.js's `allowedDevOrigins` option, allowing devices on the same network (for example, a phone on the same Wi-Fi) to reach the development server without cross-origin warnings. This variable is optional; leave it unset if you only develop against `localhost`.

`npm run dev` binds the development server to `0.0.0.0`, making it reachable from other devices on the local network. The product API routes do not currently require authentication, so treat LAN access as a development convenience rather than a secure deployment.

---

## Local Development

Install dependencies and start the development server:

```bash
npm install
npm run dev
```

Open:

```text
http://localhost:30401
```

`npm run dev` runs the `predev` script first. The script uses `kill-port 30401` to stop a leftover process before starting the Next.js development server, preventing an `EADDRINUSE` error.

### Administration Pages

```text
http://localhost:30401/admin/articles
http://localhost:30401/admin/articles/new
http://localhost:30401/admin/products
http://localhost:30401/admin/products/new
```

### Public Pages

```text
http://localhost:30401/articles
http://localhost:30401/travel-items
```

---

## Main Routes

| Route                                 | Description                    |
| ------------------------------------- | ------------------------------ |
| `/`                                   | Redirects to `/admin/articles` |
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

The product slug is currently reserved for a future product-detail route. There is no `/travel-items/[slug]` page yet.

### API Routes

| Route                        | Method   | Description                                                     |
| ----------------------------- | -------- | ----------------------------------------------------------------- |
| `/api/products`              | `GET`    | List all products, or published-only with `?status=published`   |
| `/api/products`              | `POST`   | Create a product                                                 |
| `/api/products/[productId]`  | `GET`    | Get a single product by id                                       |
| `/api/products/[productId]`  | `PUT`    | Update a product                                                 |
| `/api/products/[productId]`  | `DELETE` | Delete a product                                                 |

All product routes read from and write to `data/products.json` on the server and are validated with Zod. These routes currently have no authentication and should not be exposed to an untrusted network without adding access control.

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
```

---

## Testing

Automated tests currently cover:

- `slugify` — English and Chinese normalization and unsupported-character stripping.
- `tags` — trimming and de-duplication.

Tests still to be added:

- Article schema validation.
- Article repository behavior.
- Article import/export validation.
- Product schema validation.
- Product repository behavior.
- Product API route behavior (slug conflicts, validation errors, not-found handling).
- Duplicate product-slug rejection.
- Product price-range validation.
- Published-product filtering.
- Featured-product sorting.
- Product editor interactions, including image upload.
- Product administration filtering.
- Public storefront search and sorting.

Run tests with:

```bash
npm test
```

Run tests with coverage (used in CI, uploaded to Codecov):

```bash
npm run test:coverage
```

---

## Continuous Integration

Every push to `main` and every pull request runs a GitHub Actions workflow (`.github/workflows/ci.yml`) that performs:

1. `npm run format:check` — Prettier formatting check.
2. `npm run lint` — ESLint.
3. `npm run typecheck` — TypeScript checking.
4. `npm run test:coverage` — Jest with coverage collection.
5. Coverage upload to Codecov.
6. `npm run build` — production build verification.

Pull requests are additionally reviewed automatically by CodeRabbit.

---

## Data Flow

### Article Publishing

```text
Article editor
  → React Hook Form + Zod validation
  → ArticleRepository
  → localStorage
  → TanStack Query invalidation
  → public article queries
  → /articles and /articles/[slug]
```

### Product Publishing

```text
Product editor
  → React Hook Form + Zod validation (client)
  → ProductRepository
  → /api/products or /api/products/[productId]
  → Zod validation (server)
  → product.store.server.ts (serialized, atomic read/write)
  → data/products.json
  → TanStack Query invalidation + polling
  → publishedProductListQuery
  → /travel-items
```

Only products with `status: "published"` are returned to the public travel-item page. Published products are initially ordered by featured priority and then by update time.

---

## Future Development

Planned or reasonable next steps include:

- Replace browser and server-file repositories with Go API clients.
- Persist articles and products in PostgreSQL.
- Add JWT-based administration authentication.
- Add role-based access control.
- Add authentication or another access-control mechanism to the product API routes before exposing them beyond local development.
- Store uploaded product images in dedicated object storage instead of embedding base64 data URLs in `data/products.json`.
- Convert public pages to server-rendered data fetching.
- Add `generateMetadata()` for server-generated SEO metadata.
- Add Open Graph and social-sharing metadata.
- Add product-detail pages at `/travel-items/[slug]`.
- Add administration-facing product import and export.
- Add pagination for large article and product collections.
- Add real inquiry-cart behavior.
- Add favorites persistence.
- Add language and currency support.
- Add repository, schema, and UI tests, including for the product API routes.
- Migrate article storage to the server as well, for consistency with products.
- Add CI coverage thresholds and PR-level coverage reporting through Codecov.

---

## Migration Note

The active application uses Next.js App Router routes under `src/app`.

The repository still contains files under `src/pages` and several earlier migration-related files such as `browser-router.tsx`, `route-error.tsx`, `styles.scss`, and `src/index.tsx`. These belong to the previous React Router + Webpack implementation and are not part of the intended App Router architecture.

After confirming that no required code depends on them, remove the legacy files to keep the project structure consistent and prevent stale imports or missing-package type errors.

---

## Credits

This project is inspired by the architectural ideas demonstrated in `realworld-react-fsd` and was migrated from an earlier React Router + Webpack SPA to Next.js App Router.

---

## Notes

Image resources are intended for learning and demonstration purposes only. Do not use third-party images commercially without confirming their licenses and usage rights.

If an asset infringes copyright or other rights, remove or replace it promptly.

The public travel-item page is a visual catalog prototype. It does not currently process payments, submit inquiries, authenticate customers, or maintain a real shopping cart.

---

## License

This repository is intended for learning and demonstration purposes.

Before publishing it as an open-source or commercial project:

- Add an appropriate license.
- Confirm the usage rights of all third-party assets.
- Confirm the licenses of icons, fonts, images, and dependencies.
- Replace demonstration image URLs when necessary.

---

## Project Structure

> This is a high-level overview of the current repository, not an exhaustive listing.

```text
src/
├─ app/                                      # Next.js App Router routes and app setup
│  ├─ layout.tsx
│  ├─ providers.tsx
│  ├─ page.tsx
│  ├─ globals.scss
│  ├─ not-found.tsx
│  ├─ error.tsx
│  ├─ admin/
│  │  ├─ layout.tsx
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
│  │  └─ products/
│  │     ├─ route.ts
│  │     └─ [productId]/
│  │        └─ route.ts
│  ├─ articles/
│  │  ├─ page.tsx
│  │  └─ [slug]/
│  │     └─ page.tsx
│  └─ travel-items/
│     └─ page.tsx
│
├─ features/                                 # Page-scoped feature implementations
│  ├─ article-editor/
│  │  └─ ui/article-editor-page.tsx
│  ├─ article-list/
│  │  └─ ui/article-list-page.tsx
│  ├─ article-preview/
│  │  └─ ui/article-preview-page.tsx
│  ├─ product-editor/
│  │  └─ ui/product-editor-page.tsx
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
│  │  ├─ article.queries.ts
│  │  ├─ article.repository.ts
│  │  ├─ article.schema.ts
│  │  ├─ product.queries.ts
│  │  ├─ product.repository.ts
│  │  ├─ product.schema.ts
│  │  └─ product.store.server.ts
│  ├─ lib/
│  │  ├─ format-date.ts
│  │  ├─ generate-uuid.ts
│  │  ├─ image-file-to-data-url.ts
│  │  ├─ markdown.ts
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

Legacy migration files still exist under `src/pages` and in several top-level `src/app` or `src` files. See [Migration Note](#migration-note).