/**
 * @jest-environment node
 */
// Route handlers use the global Fetch API (Request/Response), which jsdom
// (this project's default jest environment) does not provide. Node 18+
// provides it natively, so this file is pinned to the node environment.

import { randomUUID } from "node:crypto";
import type { Article } from "@/shared/api/article.schema";

const listMock = jest.fn();
const listPublishedMock = jest.fn();
const getPublishedBySlugMock = jest.fn();
const createMock = jest.fn();
const duplicateMock = jest.fn();
const replaceAllMock = jest.fn();

jest.mock("@/shared/api/article.store.server", () => {
  const actual = jest.requireActual("@/shared/api/article.store.server");
  return {
    ...actual,
    articleStore: {
      list: (...args: unknown[]) => listMock(...args),
      listPublished: (...args: unknown[]) => listPublishedMock(...args),
      getPublishedBySlug: (...args: unknown[]) =>
        getPublishedBySlugMock(...args),
      create: (...args: unknown[]) => createMock(...args),
      duplicate: (...args: unknown[]) => duplicateMock(...args),
      replaceAll: (...args: unknown[]) => replaceAllMock(...args),
    },
  };
});

import { GET, POST } from "./route";
import {
  ArticleImportValidationError,
  ArticleSlugConflictError,
} from "@/shared/api/article.store.server";

function makeArticle(overrides: Partial<Article> = {}): Article {
  const now = new Date().toISOString();
  return {
    id: randomUUID(),
    title: "測試文章",
    slug: `test-${randomUUID()}`,
    author: "Tester",
    excerpt: "excerpt",
    content: "content",
    tags: [],
    status: "draft",
    seoTitle: "",
    seoDescription: "",
    createdAt: now,
    updatedAt: now,
    publishedAt: null,
    ...overrides,
  };
}

function validFormBody() {
  return {
    title: "測試文章",
    slug: "new-article",
    author: "Tester",
    excerpt: "excerpt",
    content: "這是一篇至少超過十個字的測試文章",
    tagsText: "react",
    status: "draft",
    seoTitle: "",
    seoDescription: "",
  };
}

function makeRequest(url: string, init?: RequestInit) {
  return new Request(url, init);
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("GET /api/articles", () => {
  it("returns the full list when no query params are given", async () => {
    const articles = [makeArticle()];
    listMock.mockResolvedValue(articles);

    const response = await GET(makeRequest("http://localhost/api/articles"));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(articles);
    expect(listMock).toHaveBeenCalledTimes(1);
    expect(listPublishedMock).not.toHaveBeenCalled();
  });

  it("returns only published articles when status=published", async () => {
    const articles = [makeArticle({ status: "published" })];
    listPublishedMock.mockResolvedValue(articles);

    const response = await GET(
      makeRequest("http://localhost/api/articles?status=published"),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(articles);
    expect(listPublishedMock).toHaveBeenCalledTimes(1);
  });

  it("returns a single published article when slug is given", async () => {
    const article = makeArticle({ slug: "hello" });
    getPublishedBySlugMock.mockResolvedValue(article);

    const response = await GET(
      makeRequest("http://localhost/api/articles?slug=hello"),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(article);
    expect(getPublishedBySlugMock).toHaveBeenCalledWith("hello");
  });

  it("returns 404 when the requested slug does not exist", async () => {
    getPublishedBySlugMock.mockResolvedValue(null);

    const response = await GET(
      makeRequest("http://localhost/api/articles?slug=missing"),
    );

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ message: "找不到文章" });
  });

  it("returns 500 when the store throws unexpectedly", async () => {
    listMock.mockRejectedValue(new Error("disk error"));

    const response = await GET(makeRequest("http://localhost/api/articles"));

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ message: "讀取文章失敗" });
  });
});

describe("POST /api/articles (create)", () => {
  it("creates an article and returns 201", async () => {
    const created = makeArticle();
    createMock.mockResolvedValue(created);

    const response = await POST(
      makeRequest("http://localhost/api/articles", {
        method: "POST",
        body: JSON.stringify(validFormBody()),
      }),
    );

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual(created);
  });

  it("returns 400 for an invalid payload", async () => {
    const response = await POST(
      makeRequest("http://localhost/api/articles", {
        method: "POST",
        body: JSON.stringify({ ...validFormBody(), title: "a" }),
      }),
    );

    expect(response.status).toBe(400);
    const body = (await response.json()) as { message: string };
    expect(body.message).toBe("文章資料格式錯誤");
    expect(createMock).not.toHaveBeenCalled();
  });

  it("returns 409 on a duplicate slug", async () => {
    createMock.mockRejectedValue(new ArticleSlugConflictError());

    const response = await POST(
      makeRequest("http://localhost/api/articles", {
        method: "POST",
        body: JSON.stringify(validFormBody()),
      }),
    );

    expect(response.status).toBe(409);
  });

  it("returns 500 on an unexpected error", async () => {
    createMock.mockRejectedValue(new Error("disk error"));

    const response = await POST(
      makeRequest("http://localhost/api/articles", {
        method: "POST",
        body: JSON.stringify(validFormBody()),
      }),
    );

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ message: "建立文章失敗" });
  });
});

describe("POST /api/articles?action=duplicate", () => {
  it("duplicates an article and returns 201", async () => {
    const copy = makeArticle();
    duplicateMock.mockResolvedValue(copy);

    const response = await POST(
      makeRequest("http://localhost/api/articles?action=duplicate", {
        method: "POST",
        body: JSON.stringify({ id: "some-id" }),
      }),
    );

    expect(response.status).toBe(201);
    expect(duplicateMock).toHaveBeenCalledWith("some-id");
  });

  it("returns 400 when id is missing", async () => {
    const response = await POST(
      makeRequest("http://localhost/api/articles?action=duplicate", {
        method: "POST",
        body: JSON.stringify({}),
      }),
    );

    expect(response.status).toBe(400);
    expect(duplicateMock).not.toHaveBeenCalled();
  });

  it("returns 404 when the source article does not exist", async () => {
    duplicateMock.mockResolvedValue(null);

    const response = await POST(
      makeRequest("http://localhost/api/articles?action=duplicate", {
        method: "POST",
        body: JSON.stringify({ id: "missing" }),
      }),
    );

    expect(response.status).toBe(404);
  });
});

describe("POST /api/articles?action=import", () => {
  it("imports valid articles and returns the count", async () => {
    const articles = [makeArticle(), makeArticle()];
    replaceAllMock.mockResolvedValue(articles);

    const response = await POST(
      makeRequest("http://localhost/api/articles?action=import", {
        method: "POST",
        body: JSON.stringify(articles),
      }),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ count: 2 });
  });

  it("returns 400 for a payload that fails schema validation", async () => {
    const response = await POST(
      makeRequest("http://localhost/api/articles?action=import", {
        method: "POST",
        body: JSON.stringify([{ title: "missing fields" }]),
      }),
    );

    expect(response.status).toBe(400);
    expect(replaceAllMock).not.toHaveBeenCalled();
  });

  it("returns 400 when the store reports a validation conflict", async () => {
    const articles = [makeArticle()];
    replaceAllMock.mockRejectedValue(
      new ArticleImportValidationError("匯入資料包含重複網址代稱"),
    );

    const response = await POST(
      makeRequest("http://localhost/api/articles?action=import", {
        method: "POST",
        body: JSON.stringify(articles),
      }),
    );

    expect(response.status).toBe(400);
    const body = (await response.json()) as { message: string };
    expect(body.message).toBe("匯入資料包含重複網址代稱");
  });
});
