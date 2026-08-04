"use client";

import {
  articleSchema,
  type Article,
  type ArticleFormValues,
} from "./article.schema";
import { formToArticleData } from "./article.mapper";

/**
 * This type defines the article data-layer contract. Currently `articleRepository` is a localStorage implementation.
 * Later (when a Go API + PostgreSQL are ready), add `article.repository.remote.ts` implementing the same `ArticleRepository`
 * (internally using fetch to the API) and swap this file's export so callers need no changes.
 */
export type ArticleRepository = {
  list(): Promise<Article[]>;
  listPublished(): Promise<Article[]>;
  getById(id: string): Promise<Article | null>;
  getPublishedBySlug(slug: string): Promise<Article | null>;
  create(values: ArticleFormValues): Promise<Article>;
  update(id: string, values: ArticleFormValues): Promise<Article>;
  duplicate(id: string): Promise<Article>;
  remove(id: string): Promise<void>;
  exportJson(): string;
  importJson(raw: string): number;
};

export const STORAGE_KEY = "travel-audio-guide-react:articles:v2";

function now() {
  return new Date().toISOString();
}

const seedArticles: Article[] = [
  {
    id: "96784776-469d-4c9b-b70e-f760a9fe1513",
    title: "歡迎使用 The Desk CMS",
    slug: "welcome-to-the-desk-cms",
    author: "Sun",
    excerpt:
      "這是一套採用 page-scoped FSD、Next.js App Router 與 TanStack Query 的本地 CMS。",
    content:
      "# 歡迎使用 The Desk CMS\n\n你可以在後台新增、編輯、搜尋、預覽與發布文章。\n\n## 技術特色\n\n- React 19\n- Next.js App Router\n- TanStack Query\n- React Hook Form + Zod\n- localStorage Repository（未來將替換為 Go API + PostgreSQL）\n- Markdown + DOMPurify",
    tags: ["react", "nextjs", "cms"],
    status: "published",
    seoTitle: "The Desk CMS｜Next.js 內容管理系統",
    seoDescription:
      "使用 Next.js、TypeScript 與 TanStack Query 建立的內容管理系統。",
    createdAt: now(),
    updatedAt: now(),
    publishedAt: now(),
  },
];

const delay = (ms = 80) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

function clone<T>(value: T): T {
  return structuredClone(value);
}

function isBrowser() {
  return typeof window !== "undefined";
}

function readAll(): Article[] {
  // localStorage exists only in the browser; during server-side rendering (or if used in a Server Component),
  // return an empty array to avoid crashing the page.
  if (!isBrowser()) return [];
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    writeAll(seedArticles);
    return clone(seedArticles);
  }
  try {
    return articleSchema.array().parse(JSON.parse(raw));
  } catch {
    writeAll(seedArticles);
    return clone(seedArticles);
  }
}

function writeAll(articles: Article[]) {
  if (!isBrowser()) return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(articles));
}

function assertUniqueSlug(
  articles: Article[],
  slug: string,
  ignoredId?: string,
) {
  if (
    articles.some(
      (article) => article.slug === slug && article.id !== ignoredId,
    )
  ) {
    throw new Error("此網址代稱已被其他文章使用");
  }
}

export const articleRepository: ArticleRepository = {
  async list(): Promise<Article[]> {
    await delay();
    return readAll().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  },
  async listPublished(): Promise<Article[]> {
    await delay();
    return readAll()
      .filter((a) => a.status === "published")
      .sort((a, b) => (b.publishedAt ?? "").localeCompare(a.publishedAt ?? ""));
  },
  async getById(id: string): Promise<Article | null> {
    await delay();
    return readAll().find((a) => a.id === id) ?? null;
  },
  async getPublishedBySlug(slug: string): Promise<Article | null> {
    await delay();
    return (
      readAll().find((a) => a.slug === slug && a.status === "published") ?? null
    );
  },
  async create(values: ArticleFormValues): Promise<Article> {
    await delay();
    const articles = readAll();
    assertUniqueSlug(articles, values.slug);
    const timestamp = now();
    const article: Article = {
      id: crypto.randomUUID(),
      ...formToArticleData(values),
      createdAt: timestamp,
      updatedAt: timestamp,
      publishedAt: values.status === "published" ? timestamp : null,
    };
    writeAll([article, ...articles]);
    return clone(article);
  },
  async update(id: string, values: ArticleFormValues): Promise<Article> {
    await delay();
    const articles = readAll();
    const current = articles.find((a) => a.id === id);
    if (!current) throw new Error("找不到文章");
    assertUniqueSlug(articles, values.slug, id);
    const article: Article = {
      ...current,
      ...formToArticleData(values),
      updatedAt: now(),
      publishedAt:
        values.status === "published" ? (current.publishedAt ?? now()) : null,
    };
    writeAll(articles.map((a) => (a.id === id ? article : a)));
    return clone(article);
  },
  async duplicate(id: string): Promise<Article> {
    await delay();
    const articles = readAll();
    const source = articles.find((a) => a.id === id);
    if (!source) throw new Error("找不到文章");
    let slug = `${source.slug}-copy`;
    let index = 2;
    while (articles.some((a) => a.slug === slug))
      slug = `${source.slug}-copy-${index++}`;
    const timestamp = now();
    const copy: Article = {
      ...source,
      id: crypto.randomUUID(),
      title: `${source.title}（副本）`,
      slug,
      status: "draft",
      createdAt: timestamp,
      updatedAt: timestamp,
      publishedAt: null,
    };
    writeAll([copy, ...articles]);
    return clone(copy);
  },
  async remove(id: string): Promise<void> {
    await delay();
    writeAll(readAll().filter((a) => a.id !== id));
  },
  exportJson(): string {
    return JSON.stringify(readAll(), null, 2);
  },
  importJson(raw: string): number {
    const articles = articleSchema.array().parse(JSON.parse(raw));
    const slugs = new Set(articles.map((a) => a.slug));
    if (slugs.size !== articles.length)
      throw new Error("匯入資料包含重複網址代稱");
    writeAll(articles);
    return articles.length;
  },
};
