# travel-audio-guide-nextjs

[![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=nextdotjs&logoColor=white)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Architecture](https://img.shields.io/badge/Architecture-Page--Scoped%20FSD-4CAF50)](#project-structure)
[![State](https://img.shields.io/badge/Server%20State-TanStack%20Query-FF4154?logo=reactquery&logoColor=white)](https://tanstack.com/query)
[![Validation](https://img.shields.io/badge/Validation-Zod-3E67B1)](https://zod.dev)
[![Testing](https://img.shields.io/badge/Testing-Jest%20%2B%20Testing%20Library-C21325?logo=jest&logoColor=white)](#testing)
[![Storage](https://img.shields.io/badge/Storage-localStorage-7952B3)](#local-data-storage)
[![CodeRabbit Reviews](https://img.shields.io/badge/Code%20Review-CodeRabbit-FF6B35)](https://coderabbit.ai)

---

## Introduction

`travel-audio-guide-nextjs` is a local-first travel content and product catalog prototype built with Next.js App Router, React, TypeScript, TanStack Query, React Hook Form, and Zod.

The project currently contains two primary domains:

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

Until backend integration is completed, article and product data are stored in browser `localStorage`.

Storage access is isolated behind repository abstractions:

- `ArticleRepository`
- `ProductRepository`

This separation allows the local storage implementations to be replaced with Go API clients later without rewriting the feature components.

The current public pages are client-rendered because browser `localStorage` is unavailable during server rendering. After migrating data to the Go API, the public pages can be converted to Server Components or server-side data fetching, with real `generateMetadata()` support.

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
- Configure product name, slug, image URL, description, category, and price range.
- Mark selected products as featured for priority display.
- Automatically track creation and update timestamps.
- Search products by name, slug, category, or description.
- Filter products by draft or published status.
- Display product category, price range, status, update time, and featured state in the administration table.
- Open the public travel-item page directly from the administration interface.

### Product Validation

- Require a product name between 2 and 100 characters.
- Require a URL slug between 2 and 120 characters.
- Restrict slugs to lowercase letters, numbers, and hyphens.
- Reject duplicate product slugs.
- Require a valid image URL.
- Limit product descriptions to 300 characters.
- Prevent negative prices.
- Require the maximum price to be greater than or equal to the minimum price.
- Validate all product forms and stored records with Zod.

### Public Travel Item Page

- Display published products at `/travel-items`.
- Automatically reflect products published from the administration interface.
- Seed the browser with example products on first use.
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

Product import and export have not yet been implemented.

### Local Data Storage

Article and product data are currently stored in browser `localStorage`, isolated behind repository abstractions.

Current storage keys:

```text
travel-audio-guide-nextjs:products:v1
```

The article storage key is defined by `STORAGE_KEY` in `article.repository.ts`.

This local-first approach provides:

- Fast prototyping.
- Persistence after page refresh.
- No backend setup requirement.
- A realistic asynchronous repository interface.
- Clear separation between UI features and storage implementations.
- A straightforward migration path toward the future Go API.

Current limitations:

- Data is isolated to one browser and device.
- There is no multi-user synchronization.
- There is no authentication or server-side access control.
- There is no revision history.
- Public content cannot be server-rendered from browser-only storage.
- There is no production-grade backup strategy.
- Browser storage can be cleared by the user.
- Product image availability depends on external URLs.
- Public product and article data are not shared across users.

These limitations can be addressed after the Go API and PostgreSQL persistence layer are connected.

### Cross-Tab Synchronization

The root `Providers` component listens for the browser's native `storage` event.

When article or product data changes in another browser tab, the corresponding TanStack Query cache is invalidated and refreshed automatically.

Mutations performed in the current tab invalidate their own query caches directly.

### User Experience

- Responsive administration layout with sidebar navigation.
- Separate administration sections for articles and products.
- Direct links from the administration interface to public pages.
- Search and status filters in administration lists.
- Public product search, category filtering, and sorting.
- Empty, loading, success, and error states.
- Route-level `error.tsx` and `not-found.tsx` fallbacks.
- Save-state feedback.
- Delete confirmation.
- Live article and product previews while editing.

### Architecture

- Next.js App Router file-system routing for active application routes.
- Page-scoped Feature-Sliced Design.
- Separate feature modules for article and product domains.
- Repository abstractions isolating `localStorage` from feature components.
- `ArticleRepository` for article persistence.
- `ProductRepository` for product persistence.
- TanStack Query for asynchronous state, caching, mutations, and invalidation.
- Structured query keys for article and product list/detail views.
- React Hook Form for editor form state.
- Zod for form, persisted-record, and import validation.
- Shared UI components for page headers and status badges.
- Safe Markdown rendering through `marked` and DOMPurify.

---

## Tech Stack

- **Next.js 16 (App Router)** — file-system routing, layouts, and Server/Client Component boundaries.
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
- **ESLint 9** — flat configuration with `eslint-config-next`.
- **Prettier 3** — source formatting.

---

## Environment

- Node.js: `20.9` or later.
- npm: bundled with Node.js.
- Next.js: `16.x`.
- React: `19.x`.

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

---

## Useful Commands

```bash
npm run dev         # Stop port 30401 first, then start the development server
npm run build       # Create a production build in .next/
npm run start       # Run the production build on port 30401
npm run typecheck   # Run TypeScript checking without emitting files
npm run lint        # Run ESLint
npm run format      # Format the project with Prettier
npm test            # Run Jest serially
npm run test:watch  # Run Jest in watch mode
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
- Duplicate product-slug rejection.
- Product price-range validation.
- Published-product filtering.
- Featured-product sorting.
- Product editor interactions.
- Product administration filtering.
- Public storefront search and sorting.

Run tests with:

```bash
npm test
```

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
  → React Hook Form + Zod validation
  → ProductRepository
  → localStorage
  → TanStack Query invalidation
  → publishedProductListQuery
  → /travel-items
```

Only products with `status: "published"` are returned to the public travel-item page. Published products are initially ordered by featured priority and then by update time.

---

## Future Development

Planned or reasonable next steps include:

- Replace browser repositories with Go API clients.
- Persist articles and products in PostgreSQL.
- Add JWT-based administration authentication.
- Add role-based access control.
- Convert public pages to server-rendered data fetching.
- Add `generateMetadata()` for server-generated SEO metadata.
- Add Open Graph and social-sharing metadata.
- Add product-detail pages at `/travel-items/[slug]`.
- Add product image upload instead of URL-only input.
- Add product import and export.
- Add pagination for large article and product collections.
- Add real inquiry-cart behavior.
- Add favorites persistence.
- Add language and currency support.
- Add repository, schema, and UI tests.
- Add CI checks for linting, type checking, tests, and build verification.

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
│  │  └─ product.schema.ts
│  ├─ lib/
│  │  ├─ format-date.ts
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
