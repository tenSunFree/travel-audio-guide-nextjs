/**
 * @jest-environment node
 */
// Route handlers use the global Fetch API (Request/Response), which jsdom
// (this project's default jest environment) does not provide. Node 18+
// provides it natively, so this file is pinned to the node environment.

import { randomUUID } from "node:crypto";
import type { Article } from "@/shared/api/article.schema";

const getByIdMock = jest.fn();
const updateMock = jest.fn();
const removeMock = jest.fn();

jest.mock("@/shared/api/article.store.server", () => {
  const actual = jest.requireActual("@/shared/api/article.store.server");
  return {
    ...actual,
    articleStore: {
      getById: (...args: unknown[]) => getByIdMock(...args),
      update: (...args: unknown[]) => updateMock(...args),
      remove: (...args: unknown[]) => removeMock(...args),
    },
  };
});

import { DELETE, GET, PUT } from "./route";
import { ArticleSlugConflictError } from "@/shared/api/article.store.server";

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
    slug: "updated-article",
    author: "Tester",
    excerpt: "excerpt",
    content: "這是一篇至少超過十個字的測試文章",
    tagsText: "react",
    status: "draft",
    seoTitle: "",
    seoDescription: "",
  };
}

function makeContext(articleId: string) {
  return { params: Promise.resolve({ articleId }) };
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("GET /api/articles/[articleId]", () => {
  it("returns the matching article", async () => {
    const article = makeArticle();
    getByIdMock.mockResolvedValue(article);

    const response = await GET(
      new Request("http://localhost/api/articles/" + article.id),
      makeContext(article.id),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(article);
  });

  it("returns 404 when the article does not exist", async () => {
    getByIdMock.mockResolvedValue(null);

    const response = await GET(
      new Request("http://localhost/api/articles/missing"),
      makeContext("missing"),
    );

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ message: "找不到文章" });
  });

  it("returns 500 on an unexpected error", async () => {
    getByIdMock.mockRejectedValue(new Error("disk error"));

    const response = await GET(
      new Request("http://localhost/api/articles/x"),
      makeContext("x"),
    );

    expect(response.status).toBe(500);
  });
});

describe("PUT /api/articles/[articleId]", () => {
  it("updates the article and returns it", async () => {
    const updated = makeArticle();
    updateMock.mockResolvedValue(updated);

    const response = await PUT(
      new Request("http://localhost/api/articles/" + updated.id, {
        method: "PUT",
        body: JSON.stringify(validFormBody()),
      }),
      makeContext(updated.id),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(updated);
  });

  it("returns 400 for an invalid payload", async () => {
    const response = await PUT(
      new Request("http://localhost/api/articles/x", {
        method: "PUT",
        body: JSON.stringify({ ...validFormBody(), title: "a" }),
      }),
      makeContext("x"),
    );

    expect(response.status).toBe(400);
    expect(updateMock).not.toHaveBeenCalled();
  });

  it("returns 404 when the article does not exist", async () => {
    updateMock.mockResolvedValue(null);

    const response = await PUT(
      new Request("http://localhost/api/articles/missing", {
        method: "PUT",
        body: JSON.stringify(validFormBody()),
      }),
      makeContext("missing"),
    );

    expect(response.status).toBe(404);
  });

  it("returns 409 on a duplicate slug", async () => {
    updateMock.mockRejectedValue(new ArticleSlugConflictError());

    const response = await PUT(
      new Request("http://localhost/api/articles/x", {
        method: "PUT",
        body: JSON.stringify(validFormBody()),
      }),
      makeContext("x"),
    );

    expect(response.status).toBe(409);
  });

  it("returns 500 on an unexpected error", async () => {
    updateMock.mockRejectedValue(new Error("disk error"));

    const response = await PUT(
      new Request("http://localhost/api/articles/x", {
        method: "PUT",
        body: JSON.stringify(validFormBody()),
      }),
      makeContext("x"),
    );

    expect(response.status).toBe(500);
  });
});

describe("DELETE /api/articles/[articleId]", () => {
  it("removes the article and returns 204", async () => {
    removeMock.mockResolvedValue(true);

    const response = await DELETE(
      new Request("http://localhost/api/articles/x", { method: "DELETE" }),
      makeContext("x"),
    );

    expect(response.status).toBe(204);
  });

  it("returns 404 when the article does not exist", async () => {
    removeMock.mockResolvedValue(false);

    const response = await DELETE(
      new Request("http://localhost/api/articles/missing", {
        method: "DELETE",
      }),
      makeContext("missing"),
    );

    expect(response.status).toBe(404);
  });

  it("returns 500 on an unexpected error", async () => {
    removeMock.mockRejectedValue(new Error("disk error"));

    const response = await DELETE(
      new Request("http://localhost/api/articles/x", { method: "DELETE" }),
      makeContext("x"),
    );

    expect(response.status).toBe(500);
  });
});
