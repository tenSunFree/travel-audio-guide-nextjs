import "server-only";

import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

import {
  articleSchema,
  type Article,
  type ArticleFormValues,
} from "./article.schema";
import { formToArticleData } from "./article.mapper";

const DATA_DIRECTORY = path.join(process.cwd(), "data");
const ARTICLES_FILE = path.join(DATA_DIRECTORY, "articles.json");

export class ArticleSlugConflictError extends Error {
  constructor() {
    super("此網址代稱已被其他文章使用");
    this.name = "ArticleSlugConflictError";
  }
}

/**
 * Serialize the complete read → validate → mutate → write operation
 * to avoid lost updates inside one Node.js process.
 *
 * Suitable for local / single-instance development.
 * Production multi-instance should use a real database.
 */
let operationQueue: Promise<void> = Promise.resolve();

function serialize<T>(operation: () => Promise<T>): Promise<T> {
  const result = operationQueue.then(operation, operation);
  operationQueue = result.then(
    () => undefined,
    () => undefined,
  );
  return result;
}

function nowIso(): string {
  return new Date().toISOString();
}

const seedTimestamp = "2026-01-01T00:00:00.000Z";

const seedArticles: Article[] = [
  {
    id: "96784776-469d-4c9b-b70e-f760a9fe1513",
    title: "歡迎使用 The Desk CMS",
    slug: "welcome-to-the-desk-cms",
    author: "Sun",
    excerpt:
      "這是一套採用 page-scoped FSD、Next.js App Router 與 TanStack Query 的 CMS。",
    content:
      "# 歡迎使用 The Desk CMS\n\n你可以在後台新增、編輯、搜尋、預覽與發布文章。\n\n## 技術特色\n\n- React 19\n- Next.js App Router\n- TanStack Query\n- React Hook Form + Zod\n- Repository Pattern\n- Markdown + DOMPurify",
    tags: ["react", "nextjs", "cms"],
    status: "published",
    seoTitle: "The Desk CMS｜Next.js 內容管理系統",
    seoDescription:
      "使用 Next.js、TypeScript 與 TanStack Query 建立的內容管理系統。",
    createdAt: seedTimestamp,
    updatedAt: seedTimestamp,
    publishedAt: seedTimestamp,
  },
];

async function readArticlesUnsafe(): Promise<Article[]> {
  await mkdir(DATA_DIRECTORY, { recursive: true });

  let raw: string;
  try {
    raw = await readFile(ARTICLES_FILE, "utf8");
  } catch (error) {
    const code =
      error instanceof Error && "code" in error ? error.code : undefined;
    if (code !== "ENOENT") throw error;
    await writeArticlesUnsafe(seedArticles);
    return [...seedArticles];
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("文章資料檔案格式錯誤，不是合法的 JSON");
  }

  const result = articleSchema.array().safeParse(parsed);
  if (!result.success) {
    console.error("Invalid articles.json:", result.error.flatten());
    throw new Error("文章資料檔案內容不符合格式");
  }
  return result.data;
}

async function writeArticlesUnsafe(articles: Article[]): Promise<void> {
  const validated = articleSchema.array().parse(articles);
  await mkdir(DATA_DIRECTORY, { recursive: true });

  const tempFile = path.join(
    DATA_DIRECTORY,
    `.articles.${process.pid}.${Date.now()}.tmp`,
  );
  await writeFile(tempFile, `${JSON.stringify(validated, null, 2)}\n`, "utf8");
  await rename(tempFile, ARTICLES_FILE);
}

function assertUniqueSlug(
  articles: Article[],
  slug: string,
  ignoredId?: string,
): void {
  const duplicated = articles.some(
    (article) => article.slug === slug && article.id !== ignoredId,
  );
  if (duplicated) throw new ArticleSlugConflictError();
}

function assertUniqueSlugs(articles: Article[]): void {
  const slugs = new Set<string>();
  for (const article of articles) {
    if (slugs.has(article.slug)) {
      throw new Error(`匯入資料包含重複網址代稱：${article.slug}`);
    }
    slugs.add(article.slug);
  }
}

function assertUniqueIds(articles: Article[]): void {
  const ids = new Set<string>();
  for (const article of articles) {
    if (ids.has(article.id)) {
      throw new Error(`匯入資料包含重複文章 id：${article.id}`);
    }
    ids.add(article.id);
  }
}

export const articleStore = {
  list(): Promise<Article[]> {
    return serialize(async () => {
      const articles = await readArticlesUnsafe();
      return [...articles].sort((a, b) =>
        b.updatedAt.localeCompare(a.updatedAt),
      );
    });
  },

  listPublished(): Promise<Article[]> {
    return serialize(async () => {
      const articles = await readArticlesUnsafe();
      return articles
        .filter((article) => article.status === "published")
        .sort((a, b) =>
          (b.publishedAt ?? "").localeCompare(a.publishedAt ?? ""),
        );
    });
  },

  getById(id: string): Promise<Article | null> {
    return serialize(async () => {
      const articles = await readArticlesUnsafe();
      return articles.find((article) => article.id === id) ?? null;
    });
  },

  getPublishedBySlug(slug: string): Promise<Article | null> {
    return serialize(async () => {
      const articles = await readArticlesUnsafe();
      return (
        articles.find(
          (article) => article.slug === slug && article.status === "published",
        ) ?? null
      );
    });
  },

  create(values: ArticleFormValues): Promise<Article> {
    return serialize(async () => {
      const articles = await readArticlesUnsafe();
      assertUniqueSlug(articles, values.slug);

      const timestamp = nowIso();
      const article = articleSchema.parse({
        id: randomUUID(),
        ...formToArticleData(values),
        createdAt: timestamp,
        updatedAt: timestamp,
        publishedAt: values.status === "published" ? timestamp : null,
      });

      await writeArticlesUnsafe([article, ...articles]);
      return article;
    });
  },

  update(id: string, values: ArticleFormValues): Promise<Article | null> {
    return serialize(async () => {
      const articles = await readArticlesUnsafe();
      const current = articles.find((article) => article.id === id);
      if (!current) return null;

      assertUniqueSlug(articles, values.slug, id);

      const timestamp = nowIso();
      const updatedArticle = articleSchema.parse({
        ...current,
        ...formToArticleData(values),
        id: current.id,
        createdAt: current.createdAt,
        updatedAt: timestamp,
        publishedAt:
          values.status === "published"
            ? (current.publishedAt ?? timestamp)
            : null,
      });

      await writeArticlesUnsafe(
        articles.map((article) =>
          article.id === id ? updatedArticle : article,
        ),
      );
      return updatedArticle;
    });
  },

  duplicate(id: string): Promise<Article | null> {
    return serialize(async () => {
      const articles = await readArticlesUnsafe();
      const source = articles.find((article) => article.id === id);
      if (!source) return null;

      let slug = `${source.slug}-copy`;
      let index = 2;
      while (articles.some((article) => article.slug === slug)) {
        slug = `${source.slug}-copy-${index}`;
        index += 1;
      }

      const timestamp = nowIso();
      const copy = articleSchema.parse({
        ...source,
        id: randomUUID(),
        title: `${source.title}（副本）`,
        slug,
        status: "draft",
        publishedAt: null,
        createdAt: timestamp,
        updatedAt: timestamp,
      });

      await writeArticlesUnsafe([copy, ...articles]);
      return copy;
    });
  },

  remove(id: string): Promise<boolean> {
    return serialize(async () => {
      const articles = await readArticlesUnsafe();
      const exists = articles.some((article) => article.id === id);
      if (!exists) return false;
      await writeArticlesUnsafe(
        articles.filter((article) => article.id !== id),
      );
      return true;
    });
  },

  replaceAll(articles: Article[]): Promise<Article[]> {
    return serialize(async () => {
      const validated = articleSchema.array().parse(articles);
      assertUniqueSlugs(validated);
      assertUniqueIds(validated);
      await writeArticlesUnsafe(validated);
      return validated;
    });
  },
};
