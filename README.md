# travel-audio-guide-react

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Architecture](https://img.shields.io/badge/Architecture-Page--Scoped%20FSD-4CAF50)](#architecture)
[![State](https://img.shields.io/badge/Server%20State-TanStack%20Query-FF4154?logo=reactquery&logoColor=white)](https://tanstack.com/query)
[![Routing](https://img.shields.io/badge/Routing-React%20Router-CA4245?logo=reactrouter&logoColor=white)](https://reactrouter.com)
[![Validation](https://img.shields.io/badge/Validation-Zod-3E67B1)](https://zod.dev)
[![Testing](https://img.shields.io/badge/Testing-Jest%20%2B%20Testing%20Library-C21325?logo=jest&logoColor=white)](#testing-and-quality)
[![Storage](https://img.shields.io/badge/Storage-localStorage-7952B3)](#local-data-storage)

---

## Introduction

travel-audio-guide-react is a local-first React CMS built with React, TypeScript, React Router, TanStack Query, React Hook Form, and Zod.

The project uses a page-scoped Feature-Sliced Design approach. It combines a maintainable frontend architecture with a practical editorial interface for creating, editing, previewing, publishing, duplicating, importing, and exporting articles.

Article data is currently stored in the browser through `localStorage`. The storage implementation is isolated behind a Repository abstraction, allowing it to be replaced later with a Go API, an OpenAPI-generated Orval client, or another remote data source without significantly rewriting the page components.

This project is intended for architectural practice, CMS prototyping, and technical demonstration.

---

## Preview

<p align="left">
  <img src="" width="160"/>
  <img src="" width="160"/>
</p>

---

## Features

### Article Management

- Create new articles
- Edit existing articles
- Delete articles
- Duplicate articles as new drafts
- Save articles as drafts
- Publish articles
- Automatically track creation, update, and publication timestamps
- Display clear draft and published status indicators

### Content Editing

- Edit article title, author, excerpt, tags, and body content
- Write article content in Markdown
- Display a live Markdown preview while editing
- Automatically generate a URL-friendly slug from the article title
- Allow manual slug editing
- Validate slug uniqueness before saving
- Sanitize generated HTML with DOMPurify before rendering
- Validate article fields with Zod and React Hook Form

### SEO Metadata

- Configure a custom SEO title
- Configure a custom SEO description
- Fall back to the article title and excerpt when custom SEO fields are empty
- Keep SEO-related fields inside the article data model for future SSR or SSG integration

### Article Discovery

- Search articles by title, author, slug, excerpt, or tags
- Filter articles by draft or published status
- Sort articles by their latest update time
- Display public URLs for published articles

### Preview and Publishing

- Preview draft or published content from the administration interface
- Access draft previews through an administration-only route
- Publish articles to a real public React route
- Prevent unpublished articles from being displayed through public routes
- Display all published articles on a public article index page

### Import and Export

- Export all local CMS data as a JSON backup
- Import article data from a JSON file
- Validate imported data with Zod
- Reject malformed article records
- Reject duplicate article IDs
- Reject duplicate slugs
- Restore imported data into local storage
- Refresh TanStack Query caches after importing data

### User Experience

- Responsive administration layout
- Desktop sidebar navigation
- Mobile-friendly content layout
- Empty, loading, and error states
- Route-level error boundaries
- Save-state feedback
- Delete confirmation
- Direct links between the article list, editor, preview, and public pages

---

## Runtime Patterns

### Lazy Route Modules

Administration and public pages are loaded through React Router lazy route modules.

This keeps route-specific code isolated and allows the initial application bundle to remain smaller as the CMS grows.

### Route Loaders

Article lists and article details are prepared through React Router loaders backed by TanStack Query.

Loaders use `queryClient.ensureQueryData` so routing and query caching share the same data-fetching workflow.

### Repository Abstraction

All article persistence is accessed through an article repository.

Page components do not directly call `localStorage`, which keeps the UI independent from the current storage implementation.

The repository currently handles:

- Listing articles
- Retrieving an article by ID
- Retrieving a published article by slug
- Creating articles
- Updating articles
- Deleting articles
- Duplicating articles
- Importing data
- Exporting data
- Slug uniqueness validation

### Query Cache Management

TanStack Query maintains cached article data through structured query keys.

Separate keys are used for:

- Administration article lists
- Published article lists
- Article details by ID
- Public articles by slug

Mutations invalidate the relevant article queries after create, update, duplicate, delete, or import operations.

### Form Validation

React Hook Form manages editor state and form submission.

Zod defines the source-of-truth schema for:

- Article titles
- Slugs
- Authors
- Excerpts
- Markdown content
- Tags
- Publication status
- SEO metadata

The Zod resolver maps validation failures directly to the relevant form fields.

### Safe Markdown Rendering

Markdown content is converted into HTML before rendering.

The generated HTML is passed through DOMPurify to remove unsafe markup and reduce cross-site scripting risks before being assigned through `dangerouslySetInnerHTML`.

---

## Architecture

The codebase uses a practical page-scoped Feature-Sliced Design structure rather than a full multi-layer FSD tree.

```text
src/
├─ app/
│  ├─ browser-router.tsx
│  ├─ layout.tsx
│  ├─ query-client.ts
│  ├─ route-error.tsx
│  └─ styles.scss
│
├─ pages/
│  ├─ article-list/
│  │  ├─ article-list.route.tsx
│  │  └─ ui/
│  │     └─ article-list-page.tsx
│  │
│  ├─ article-editor/
│  │  ├─ article-editor.route.tsx
│  │  └─ ui/
│  │     └─ article-editor-page.tsx
│  │
│  ├─ article-preview/
│  │  ├─ article-preview.route.tsx
│  │  └─ ui/
│  │     └─ article-preview-page.tsx
│  │
│  ├─ public-article-list/
│  │  ├─ public-article-list.route.tsx
│  │  └─ ui/
│  │     └─ public-article-list-page.tsx
│  │
│  └─ public-article/
│     ├─ public-article.route.tsx
│     └─ ui/
│        └─ public-article-page.tsx
│
├─ shared/
│  ├─ api/
│  │  ├─ article.mapper.ts
│  │  ├─ article.queries.ts
│  │  ├─ article.repository.ts
│  │  └─ article.schema.ts
│  │
│  ├─ lib/
│  │  ├─ format-date.ts
│  │  ├─ markdown.ts
│  │  ├─ slug.ts
│  │  └─ tags.ts
│  │
│  └─ ui/
│     └─ page-header.tsx
│
├─ test/
│  ├─ article.repository.test.ts
│  ├─ article.schema.test.ts
│  └─ setup.ts
│
└─ index.tsx
```

### Application Layer

`src/app` contains application-wide infrastructure:

- Root router
- Administration layout
- Query client
- Global route error handling
- Global styles

### Page Layer

`src/pages` contains route-scoped modules.

Each page owns its route configuration, loader logic, and page-level UI.

This keeps route behavior close to the screen that uses it while avoiding unnecessary global feature abstractions.

### Shared Layer

`src/shared` contains reusable code that is not owned by one specific page:

- Article schemas
- Article repository
- Query options
- Markdown rendering
- Slug utilities
- Tag parsing
- Date formatting
- Shared UI components

---

## Tech Stack

- **React**  
  Component-based user interface library used for the CMS administration interface and public article pages.

- **TypeScript**  
  Static type system used across routes, schemas, repositories, forms, query options, and UI components.

- **React Router**  
  Declarative routing library used for administration routes, public routes, lazy route modules, loaders, navigation, and route-level error handling.

- **TanStack Query**  
  Asynchronous state and cache management library used for article lists, article details, public content, mutation invalidation, and loader integration.

- **React Hook Form**  
  Form state management library used to reduce unnecessary re-renders and manage article editor input state.

- **Zod**  
  Runtime validation and schema definition library used for form data, stored article records, and imported JSON backups.

- **Marked**  
  Markdown parser used to convert article body content into HTML.

- **DOMPurify**  
  HTML sanitization library used to clean Markdown-generated HTML before rendering.

- **Webpack**  
  Application bundler used for development, production builds, TypeScript compilation, Sass processing, and asset generation.

- **Sass**  
  Stylesheet preprocessor used for application-wide styling and responsive layouts.

- **Jest**  
  Test runner used for repository, schema, and utility tests.

- **Testing Library**  
  Testing utilities for rendering and validating React components from a user-focused perspective.

- **ESLint**  
  Static analysis tool configured with ESLint 9 flat configuration.

- **Prettier**  
  Code formatting tool used to maintain consistent source formatting.

---

## Public Routes

The public article index is available at:

```text
/articles
```

Each published article is available at:

```text
/articles/:slug
```

For example, an article with the following slug:

```text
taipei-cafe-guide
```

is available at:

```text
http://localhost:30401/articles/taipei-cafe-guide
```

Draft articles are not accessible through public routes.

They can still be previewed through the administration interface:

```text
/admin/articles/:articleId/preview
```

---

## Page Generation

The current implementation generates article pages through React Router dynamic routes.

Publishing an article creates a stable public URL:

```text
/articles/your-article-slug
```

The project does not currently generate a standalone `.html` file for each article.

This SPA-based approach is suitable for:

- CMS prototypes
- Internal content tools
- Mobile WebView content
- Applications where search engine indexing is not the primary requirement
- Early-stage integration with a future backend

For public content that requires stronger search engine optimization, social sharing metadata, server-rendered HTML, or static deployment, the recommended architecture is:

```text
React CMS Administration
        ↓
Go API stores structured article data
        ↓
Next.js public website
        ↓
SSR / SSG article pages
```

Another recommended approach is to store reusable Content Blocks instead of only Markdown:

```text
CMS Editor
    ↓
Structured Content Blocks
    ↓
Go API + PostgreSQL
    ↓
Next.js renderer
    ↓
Public website or Flutter WebView
```

This allows the same content to be rendered consistently across web and mobile applications.

---

## Local Data Storage

Article data is currently stored in browser `localStorage`.

This provides:

- Fast local prototyping
- Persistence after page refresh
- No backend setup requirement
- Simple import and export
- A realistic asynchronous repository interface

Local storage is not intended to replace a production database.

Its current limitations include:

- Data is isolated to one browser and device
- Browser storage can be cleared by the user
- There is no authentication
- There is no multi-user synchronization
- There is no revision history
- There is no server-side access control
- There is no reliable production backup
- Public routes are still rendered by the client-side application

---

## Local Development

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm start
```

Open:

```text
http://localhost:30401
```

The CMS administration interface is available at:

```text
http://localhost:30401/admin/articles
```

The public article index is available at:

```text
http://localhost:30401/articles
```

---

## Useful Commands

```bash
npm start
```

Starts the Webpack development server.

```bash
npm run typecheck
```

Runs the TypeScript compiler without generating output files.

```bash
npm run lint
```

Runs ESLint against the source code.

```bash
npm run format
```

Formats the repository with Prettier.

```bash
npm test
```

Runs the Jest test suite.

```bash
npm run build
```

Creates a production build in the `dist` directory.

```bash
npm run check
```

Runs the complete local quality pipeline:

1. TypeScript type checking
2. ESLint static analysis
3. Jest tests
4. Webpack production build

---

## Testing and Quality

The project includes automated tests for important data and validation behavior.

Current testing targets include:

- Article schema validation
- Valid and invalid article form data
- Slug validation
- Article repository creation
- Article repository updates
- Article deletion
- Article duplication
- Article retrieval by ID
- Published article retrieval by slug
- Draft article protection on public queries
- JSON import validation
- Duplicate slug detection

The local quality command is:

```bash
npm run check
```

This command should pass before opening or merging a Pull Request.

---

## Error Handling

The project includes route-level and repository-level error handling.

Examples include:

- Missing route parameters
- Missing articles
- Invalid article IDs
- Duplicate slugs
- Invalid imported JSON
- Invalid stored article records
- Storage parsing failures
- Attempting to access an unpublished article publicly

React Router error elements provide a consistent fallback page when route loaders fail.

---

## Future Integration

### Go Backend

The local repository can later be replaced with a Go API.

A possible backend stack is:

- Go
- chi
- PostgreSQL
- pgxpool
- sqlc
- OpenAPI
- JWT authentication
- Docker

The frontend Repository can then delegate to generated API functions instead of `localStorage`.

### OpenAPI and Orval

The recommended API workflow is:

```text
Go API
   ↓
OpenAPI specification
   ↓
Orval code generation
   ↓
Typed React Query clients
   ↓
React CMS pages
```

This keeps API contracts synchronized and reduces manually written request code.

### Authentication and Authorization

A production CMS should add:

- User authentication
- Role-based permissions
- Editor and administrator roles
- Protected administration routes
- Server-side authorization
- Audit logs
- Session expiration handling

### Media Library

A future media module could support:

- Image uploads
- Image previews
- Image metadata
- File size validation
- MIME type validation
- Alternative text
- Reusable media selection
- Object storage integration
- Signed upload URLs

### Article Revisions

A production editorial workflow could support:

- Revision history
- Draft snapshots
- Revision comparison
- Restore previous versions
- Editor attribution
- Approval workflow
- Scheduled publication
- Unpublishing
- Soft deletion

### Content Blocks

Markdown can later be extended or replaced with structured content blocks such as:

- Heading
- Paragraph
- Image
- Gallery
- Button
- Quote
- Video
- Audio
- Map
- Callout
- Divider
- Related article list
- Embedded mobile application action

Structured blocks are especially useful when the same content must be rendered by Next.js, Flutter WebView, or native mobile widgets.

---

## Deployment

Create a production build:

```bash
npm run build
```

The generated assets are written to:

```text
dist/
```

Because the project uses client-side routing, the production web server must route unknown paths back to `index.html`.

For example, direct requests to:

```text
/articles/taipei-cafe-guide
```

must still serve the React application entry point.

A production Nginx configuration typically requires a fallback similar to:

```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

---

## Architecture Decisions

### Why Page-Scoped FSD?

A complete Feature-Sliced Design tree can introduce unnecessary layers for a small or medium-sized CMS.

This project uses:

```text
app
pages
shared
```

instead of immediately introducing:

```text
app
processes
pages
widgets
features
entities
shared
```

The simplified structure provides:

- Clear route ownership
- Lower navigation overhead
- Fewer artificial abstractions
- Easier onboarding
- A straightforward migration path as the project grows

Additional `features`, `entities`, or `widgets` layers should be introduced only when real reuse and dependency boundaries justify them.

### Why Use TanStack Query with localStorage?

Although `localStorage` is synchronous, the Repository exposes asynchronous methods.

This intentionally simulates a remote API contract and allows the UI to keep the same query and mutation workflow after migrating to a backend.

### Why Separate Preview and Public Routes?

Administration previews and public pages have different access rules.

The preview route can display drafts, while the public route only returns published articles.

Keeping these routes separate prevents presentation logic from accidentally exposing unpublished content.

### Why Use a Repository?

The Repository prevents UI components from depending directly on storage details.

This makes it easier to replace:

```text
localStorage
```

with:

```text
REST API
GraphQL API
IndexedDB
Supabase
Firebase
Go API
Orval-generated client
```

without redesigning the page components.

---

## Notes

- The current project is a frontend demonstration and does not include authentication.
- Article data is stored only in the current browser.
- Public article pages use client-side rendering.
- SEO metadata is stored but cannot provide complete server-rendered SEO in the current SPA architecture.
- Imported JSON should only come from trusted sources.
- DOMPurify is used to sanitize Markdown output, but production security should also include a restrictive Content Security Policy.
- A real backend must enforce all validation and authorization rules again on the server.
- Client-side validation alone must never be treated as a production security boundary.

---

## Credits

This project is inspired by the architectural ideas demonstrated in `realworld-react-fsd`.

The Desk interface and CMS integration were created for independent learning, architectural experimentation, and portfolio demonstration.

---

## License

This repository is intended for learning and demonstration purposes.

Before publishing it as an open-source or commercial project, add an appropriate license and confirm the usage rights of all third-party assets, icons, fonts, and dependencies.
