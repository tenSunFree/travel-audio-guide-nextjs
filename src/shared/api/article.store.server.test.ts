/**
 * @jest-environment node
 */
// article.store.server.ts imports "server-only", which throws if `window`
// is defined. The default jest environment for this project is jsdom, so
// this file is pinned to the node environment.

import { randomUUID } from "node:crypto";
import type { Article, ArticleFormValues } from "./article.schema";

const mkdirMock = jest.fn();
const readFileMock = jest.fn();
const writeFileMock = jest.fn();
const renameMock = jest.fn();

jest.mock("node:fs/promises", () => ({
  mkdir: (...args: unknown[]) => mkdirMock(...args),
  readFile: (...args: unknown[]) => readFileMock(...args),
  writeFile: (...args: unknown[]) => writeFileMock(...args),
  rename: (...args: unknown[]) => renameMock(...args),
}));

import {
  ArticleImportValidationError,
  ArticleSlugConflictError,
  articleStore,
} from "./article.store.server";

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

function makeFormValues(
  overrides: Partial<ArticleFormValues> = {},
): ArticleFormValues {
  return {
    title: "測試文章",
    slug: `test-${randomUUID()}`,
    author: "Tester",
    excerpt: "excerpt",
    content: "這是一篇至少超過十個字的文章內容",
    tagsText: "react, nextjs",
    status: "draft",
    seoTitle: "",
    seoDescription: "",
    ...overrides,
  };
}

function setStoredArticles(articles: Article[]) {
  readFileMock.mockResolvedValue(JSON.stringify(articles));
}

describe("articleStore", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mkdirMock.mockResolvedValue(undefined);
    readFileMock.mockResolvedValue("[]");
    writeFileMock.mockResolvedValue(undefined);
    renameMock.mockResolvedValue(undefined);
  });

  describe("list", () => {
    it("sorts articles by updatedAt descending", async () => {
      const older = makeArticle({ updatedAt: "2026-01-01T00:00:00.000Z" });
      const newer = makeArticle({ updatedAt: "2026-02-01T00:00:00.000Z" });

      setStoredArticles([older, newer]);

      const result = await articleStore.list();

      expect(result.map((article) => article.id)).toEqual([newer.id, older.id]);
    });
  });

  describe("listPublished", () => {
    it("returns only published articles sorted by publishedAt", async () => {
      const draft = makeArticle();
      const olderPublished = makeArticle({
        status: "published",
        publishedAt: "2026-01-01T00:00:00.000Z",
      });
      const newerPublished = makeArticle({
        status: "published",
        publishedAt: "2026-02-01T00:00:00.000Z",
      });

      setStoredArticles([draft, olderPublished, newerPublished]);

      const result = await articleStore.listPublished();

      expect(result.map((article) => article.id)).toEqual([
        newerPublished.id,
        olderPublished.id,
      ]);
    });
  });

  describe("getById", () => {
    it("returns matching article", async () => {
      const article = makeArticle();
      setStoredArticles([article]);

      await expect(articleStore.getById(article.id)).resolves.toEqual(article);
    });

    it("returns null when article does not exist", async () => {
      setStoredArticles([]);

      await expect(articleStore.getById(randomUUID())).resolves.toBeNull();
    });
  });

  describe("getPublishedBySlug", () => {
    it("returns a published matching article", async () => {
      const article = makeArticle({
        slug: "public-post",
        status: "published",
        publishedAt: new Date().toISOString(),
      });

      setStoredArticles([article]);

      await expect(
        articleStore.getPublishedBySlug("public-post"),
      ).resolves.toEqual(article);
    });

    it("does not return drafts", async () => {
      const article = makeArticle({
        slug: "draft-post",
        status: "draft",
      });

      setStoredArticles([article]);

      await expect(
        articleStore.getPublishedBySlug("draft-post"),
      ).resolves.toBeNull();
    });
  });

  describe("create", () => {
    it("creates and persists a draft article", async () => {
      setStoredArticles([]);

      const created = await articleStore.create(
        makeFormValues({ slug: "new-post" }),
      );

      expect(created.id).toBeTruthy();
      expect(created.slug).toBe("new-post");
      expect(created.status).toBe("draft");
      expect(created.publishedAt).toBeNull();

      expect(writeFileMock).toHaveBeenCalledTimes(1);
      expect(renameMock).toHaveBeenCalledTimes(1);
    });

    it("sets publishedAt when creating published article", async () => {
      setStoredArticles([]);

      const created = await articleStore.create(
        makeFormValues({ slug: "published-post", status: "published" }),
      );

      expect(created.publishedAt).not.toBeNull();
    });

    it("rejects duplicate slug", async () => {
      setStoredArticles([makeArticle({ slug: "taken-slug" })]);

      await expect(
        articleStore.create(makeFormValues({ slug: "taken-slug" })),
      ).rejects.toThrow(ArticleSlugConflictError);

      expect(writeFileMock).not.toHaveBeenCalled();
    });
  });

  describe("update", () => {
    it("updates existing article but preserves id and createdAt", async () => {
      const existing = makeArticle({
        slug: "old-slug",
        createdAt: "2026-01-01T00:00:00.000Z",
      });

      setStoredArticles([existing]);

      const updated = await articleStore.update(
        existing.id,
        makeFormValues({ title: "新的文章標題", slug: "new-slug" }),
      );

      expect(updated?.id).toBe(existing.id);
      expect(updated?.createdAt).toBe(existing.createdAt);
      expect(updated?.title).toBe("新的文章標題");
      expect(updated?.slug).toBe("new-slug");
    });

    it("returns null when article does not exist", async () => {
      setStoredArticles([]);

      await expect(
        articleStore.update(randomUUID(), makeFormValues()),
      ).resolves.toBeNull();

      expect(writeFileMock).not.toHaveBeenCalled();
    });

    it("rejects another article's slug", async () => {
      const target = makeArticle({ slug: "target" });
      const another = makeArticle({ slug: "already-used" });

      setStoredArticles([target, another]);

      await expect(
        articleStore.update(
          target.id,
          makeFormValues({ slug: "already-used" }),
        ),
      ).rejects.toThrow(ArticleSlugConflictError);
    });

    it("allows keeping its own slug", async () => {
      const existing = makeArticle({ slug: "same-slug" });
      setStoredArticles([existing]);

      const result = await articleStore.update(
        existing.id,
        makeFormValues({ slug: "same-slug" }),
      );

      expect(result?.slug).toBe("same-slug");
    });

    it("keeps original publishedAt when updating a published article", async () => {
      const originalPublishedAt = "2026-01-01T00:00:00.000Z";
      const existing = makeArticle({
        status: "published",
        publishedAt: originalPublishedAt,
      });

      setStoredArticles([existing]);

      const result = await articleStore.update(
        existing.id,
        makeFormValues({ status: "published", slug: existing.slug }),
      );

      expect(result?.publishedAt).toBe(originalPublishedAt);
    });

    it("clears publishedAt when article becomes draft", async () => {
      const existing = makeArticle({
        status: "published",
        publishedAt: "2026-01-01T00:00:00.000Z",
      });

      setStoredArticles([existing]);

      const result = await articleStore.update(
        existing.id,
        makeFormValues({ status: "draft", slug: existing.slug }),
      );

      expect(result?.publishedAt).toBeNull();
    });
  });

  describe("duplicate", () => {
    it("creates a draft copy", async () => {
      const source = makeArticle({
        title: "Original",
        slug: "original",
        status: "published",
        publishedAt: new Date().toISOString(),
      });

      setStoredArticles([source]);

      const copy = await articleStore.duplicate(source.id);

      expect(copy?.id).not.toBe(source.id);
      expect(copy?.title).toBe("Original（副本）");
      expect(copy?.slug).toBe("original-copy");
      expect(copy?.status).toBe("draft");
      expect(copy?.publishedAt).toBeNull();
    });

    it("increments copy slug when copy slug already exists", async () => {
      const source = makeArticle({ slug: "original" });
      const copy1 = makeArticle({ slug: "original-copy" });
      const copy2 = makeArticle({ slug: "original-copy-2" });

      setStoredArticles([source, copy1, copy2]);

      const result = await articleStore.duplicate(source.id);

      expect(result?.slug).toBe("original-copy-3");
    });

    it("returns null when source does not exist", async () => {
      setStoredArticles([]);

      await expect(articleStore.duplicate(randomUUID())).resolves.toBeNull();
    });
  });

  describe("remove", () => {
    it("removes existing article", async () => {
      const article = makeArticle();
      setStoredArticles([article]);

      await expect(articleStore.remove(article.id)).resolves.toBe(true);

      expect(writeFileMock).toHaveBeenCalledTimes(1);
      expect(renameMock).toHaveBeenCalledTimes(1);
    });

    it("returns false without writing when article does not exist", async () => {
      setStoredArticles([]);

      await expect(articleStore.remove(randomUUID())).resolves.toBe(false);

      expect(writeFileMock).not.toHaveBeenCalled();
    });
  });

  describe("replaceAll", () => {
    it("rejects duplicate slugs", async () => {
      const a = makeArticle({ slug: "same-slug" });
      const b = makeArticle({ slug: "same-slug" });

      await expect(articleStore.replaceAll([a, b])).rejects.toThrow(
        ArticleImportValidationError,
      );

      expect(writeFileMock).not.toHaveBeenCalled();
      expect(renameMock).not.toHaveBeenCalled();
    });

    it("rejects duplicate ids", async () => {
      const id = randomUUID();
      const a = makeArticle({ id, slug: "a" });
      const b = makeArticle({ id, slug: "b" });

      await expect(articleStore.replaceAll([a, b])).rejects.toThrow(
        ArticleImportValidationError,
      );

      expect(writeFileMock).not.toHaveBeenCalled();
    });

    it("writes unique articles atomically", async () => {
      const articles = [makeArticle(), makeArticle()];

      await expect(articleStore.replaceAll(articles)).resolves.toHaveLength(2);

      expect(writeFileMock).toHaveBeenCalledTimes(1);
      expect(renameMock).toHaveBeenCalledTimes(1);

      const [temporaryPath] = writeFileMock.mock.calls[0] as [string];
      const [renameFrom, renameTo] = renameMock.mock.calls[0] as [
        string,
        string,
      ];

      expect(renameFrom).toBe(temporaryPath);
      expect(renameTo).toMatch(/articles\.json$/);
    });
  });

  describe("file handling", () => {
    it("seeds data when articles.json does not exist", async () => {
      const error = Object.assign(new Error("missing"), { code: "ENOENT" });
      readFileMock.mockRejectedValue(error);

      const result = await articleStore.list();

      expect(result.length).toBeGreaterThan(0);
      expect(writeFileMock).toHaveBeenCalled();
      expect(renameMock).toHaveBeenCalled();
    });

    it("throws when JSON is malformed", async () => {
      readFileMock.mockResolvedValue("{invalid-json");

      await expect(articleStore.list()).rejects.toThrow("文章資料檔案格式錯誤");
    });

    it("throws when persisted data violates schema", async () => {
      readFileMock.mockResolvedValue(JSON.stringify([{ hello: "world" }]));

      await expect(articleStore.list()).rejects.toThrow(
        "文章資料檔案內容不符合格式",
      );
    });

    it("rethrows non-ENOENT file errors", async () => {
      const error = Object.assign(new Error("permission denied"), {
        code: "EACCES",
      });
      readFileMock.mockRejectedValue(error);

      await expect(articleStore.list()).rejects.toThrow("permission denied");
    });
  });
});
