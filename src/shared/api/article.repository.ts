"use client";

import {
  articleSchema,
  type Article,
  type ArticleFormValues,
} from "./article.schema";

/**
 * Article data-layer contract.
 * Implementation is now server-backed (API + JSON store).
 * When Go API + PostgreSQL are ready, swap the fetch base URL;
 * callers of this interface need no changes.
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
  exportJson(): Promise<string>;
  importJson(raw: string): Promise<number>;
};

type ApiErrorBody = { message?: string };

async function parseError(
  response: Response,
  fallback: string,
): Promise<Error> {
  try {
    const body = (await response.json()) as ApiErrorBody;
    return new Error(body.message || fallback);
  } catch {
    return new Error(fallback);
  }
}

async function requestJson(
  path: string,
  options?: RequestInit,
): Promise<unknown> {
  const response = await fetch(path, {
    ...options,
    cache: "no-store",
    headers: {
      Accept: "application/json",
      ...(options?.body ? { "Content-Type": "application/json" } : {}),
      ...options?.headers,
    },
  });

  if (!response.ok) {
    throw await parseError(response, `API 請求失敗：${response.status}`);
  }

  if (response.status === 204) return undefined;
  return response.json();
}

export const articleRepository: ArticleRepository = {
  async list() {
    const result = await requestJson("/api/articles");
    return articleSchema.array().parse(result);
  },

  async listPublished() {
    const result = await requestJson("/api/articles?status=published");
    return articleSchema.array().parse(result);
  },

  async getById(id) {
    const response = await fetch(`/api/articles/${encodeURIComponent(id)}`, {
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
    if (response.status === 404) return null;
    if (!response.ok) throw await parseError(response, "取得文章失敗");
    return articleSchema.parse(await response.json());
  },

  async getPublishedBySlug(slug) {
    const response = await fetch(
      `/api/articles?slug=${encodeURIComponent(slug)}`,
      {
        cache: "no-store",
        headers: { Accept: "application/json" },
      },
    );
    if (response.status === 404) return null;
    if (!response.ok) throw await parseError(response, "取得公開文章失敗");
    return articleSchema.parse(await response.json());
  },

  async create(values) {
    const result = await requestJson("/api/articles", {
      method: "POST",
      body: JSON.stringify(values),
    });
    return articleSchema.parse(result);
  },

  async update(id, values) {
    const result = await requestJson(
      `/api/articles/${encodeURIComponent(id)}`,
      {
        method: "PUT",
        body: JSON.stringify(values),
      },
    );
    return articleSchema.parse(result);
  },

  async duplicate(id) {
    const result = await requestJson("/api/articles?action=duplicate", {
      method: "POST",
      body: JSON.stringify({ id }),
    });
    return articleSchema.parse(result);
  },

  async remove(id) {
    const response = await fetch(`/api/articles/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    if (!response.ok) throw await parseError(response, "刪除文章失敗");
  },

  async exportJson() {
    const articles = await this.list();
    return JSON.stringify(articles, null, 2);
  },

  async importJson(raw) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new Error("匯入檔案不是合法 JSON");
    }

    const articles = articleSchema.array().parse(parsed);
    const slugs = new Set(articles.map((a) => a.slug));
    if (slugs.size !== articles.length) {
      throw new Error("匯入資料包含重複網址代稱");
    }

    const result = (await requestJson("/api/articles?action=import", {
      method: "POST",
      body: JSON.stringify(articles),
    })) as { count: number };

    return result.count;
  },
};
