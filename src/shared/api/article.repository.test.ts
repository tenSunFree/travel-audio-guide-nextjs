import { randomUUID } from "node:crypto";
import { articleRepository } from "./article.repository";
import type { Article, ArticleFormValues } from "./article.schema";

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

function makeFormValues(): ArticleFormValues {
  return {
    title: "測試文章",
    slug: "test-article",
    author: "Tester",
    excerpt: "excerpt",
    content: "這是一篇至少超過十個字的測試文章",
    tagsText: "react",
    status: "draft",
    seoTitle: "",
    seoDescription: "",
  };
}

function fakeResponse(
  body: unknown,
  init: { ok?: boolean; status?: number; jsonError?: Error } = {},
): Response {
  return {
    ok: init.ok ?? true,
    status: init.status ?? 200,
    json: async () => {
      if (init.jsonError) {
        throw init.jsonError;
      }
      return body;
    },
  } as unknown as Response;
}

describe("articleRepository", () => {
  const fetchMock = jest.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  describe("list", () => {
    it("returns validated article list", async () => {
      const articles = [makeArticle(), makeArticle()];
      fetchMock.mockResolvedValue(fakeResponse(articles));

      const result = await articleRepository.list();

      expect(result).toEqual(articles);
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/articles",
        expect.objectContaining({ cache: "no-store" }),
      );
    });

    it("throws server message on failure", async () => {
      fetchMock.mockResolvedValue(
        fakeResponse({ message: "讀取失敗" }, { ok: false, status: 500 }),
      );

      await expect(articleRepository.list()).rejects.toThrow("讀取失敗");
    });

    it("uses fallback error if error response cannot be parsed", async () => {
      fetchMock.mockResolvedValue(
        fakeResponse(null, {
          ok: false,
          status: 500,
          jsonError: new Error("broken json"),
        }),
      );

      await expect(articleRepository.list()).rejects.toThrow(
        "API 請求失敗：500",
      );
    });

    it("rejects invalid response schema", async () => {
      fetchMock.mockResolvedValue(fakeResponse([{ invalid: true }]));

      await expect(articleRepository.list()).rejects.toThrow();
    });
  });

  describe("listPublished", () => {
    it("uses published endpoint", async () => {
      fetchMock.mockResolvedValue(fakeResponse([]));

      await articleRepository.listPublished();

      expect(fetchMock).toHaveBeenCalledWith(
        "/api/articles?status=published",
        expect.objectContaining({ cache: "no-store" }),
      );
    });
  });

  describe("getById", () => {
    it("returns article", async () => {
      const article = makeArticle();
      fetchMock.mockResolvedValue(fakeResponse(article));

      await expect(articleRepository.getById(article.id)).resolves.toEqual(
        article,
      );
    });

    it("URL-encodes id", async () => {
      fetchMock.mockResolvedValue(fakeResponse(null, { status: 404 }));

      await articleRepository.getById("a/b c");

      expect(fetchMock).toHaveBeenCalledWith(
        "/api/articles/a%2Fb%20c",
        expect.anything(),
      );
    });

    it("returns null on 404", async () => {
      fetchMock.mockResolvedValue(
        fakeResponse(null, { ok: false, status: 404 }),
      );

      await expect(articleRepository.getById("missing")).resolves.toBeNull();
    });

    it("throws server message on other errors", async () => {
      fetchMock.mockResolvedValue(
        fakeResponse({ message: "文章讀取失敗" }, { ok: false, status: 500 }),
      );

      await expect(articleRepository.getById("1")).rejects.toThrow(
        "文章讀取失敗",
      );
    });
  });

  describe("getPublishedBySlug", () => {
    it("URL-encodes slug", async () => {
      fetchMock.mockResolvedValue(
        fakeResponse(null, { ok: false, status: 404 }),
      );

      await articleRepository.getPublishedBySlug("hello world");

      expect(fetchMock).toHaveBeenCalledWith(
        "/api/articles?slug=hello%20world",
        expect.anything(),
      );
    });

    it("returns null on 404", async () => {
      fetchMock.mockResolvedValue(
        fakeResponse(null, { ok: false, status: 404 }),
      );

      await expect(
        articleRepository.getPublishedBySlug("missing"),
      ).resolves.toBeNull();
    });
  });

  describe("create", () => {
    it("posts article form values", async () => {
      const article = makeArticle();
      fetchMock.mockResolvedValue(fakeResponse(article));

      const values = makeFormValues();
      const result = await articleRepository.create(values);

      expect(result).toEqual(article);
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/articles",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify(values),
        }),
      );
    });
  });

  describe("update", () => {
    it("puts article changes", async () => {
      const article = makeArticle();
      fetchMock.mockResolvedValue(fakeResponse(article));

      const values = makeFormValues();
      await articleRepository.update("article/id", values);

      expect(fetchMock).toHaveBeenCalledWith(
        "/api/articles/article%2Fid",
        expect.objectContaining({
          method: "PUT",
          body: JSON.stringify(values),
        }),
      );
    });
  });

  describe("duplicate", () => {
    it("calls duplicate endpoint", async () => {
      const article = makeArticle();
      fetchMock.mockResolvedValue(fakeResponse(article));

      const result = await articleRepository.duplicate(article.id);

      expect(result).toEqual(article);
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/articles?action=duplicate",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ id: article.id }),
        }),
      );
    });
  });

  describe("remove", () => {
    it("calls DELETE", async () => {
      fetchMock.mockResolvedValue(fakeResponse(undefined, { status: 204 }));

      await articleRepository.remove("article/id");

      expect(fetchMock).toHaveBeenCalledWith("/api/articles/article%2Fid", {
        method: "DELETE",
      });
    });

    it("throws server error", async () => {
      fetchMock.mockResolvedValue(
        fakeResponse({ message: "刪除失敗" }, { ok: false, status: 500 }),
      );

      await expect(articleRepository.remove("id")).rejects.toThrow("刪除失敗");
    });
  });

  describe("exportJson", () => {
    it("exports formatted JSON", async () => {
      const articles = [makeArticle()];
      fetchMock.mockResolvedValue(fakeResponse(articles));

      const result = await articleRepository.exportJson();

      expect(result).toBe(JSON.stringify(articles, null, 2));
    });
  });

  describe("importJson", () => {
    it("rejects malformed JSON without API call", async () => {
      await expect(articleRepository.importJson("not-json")).rejects.toThrow(
        "匯入檔案不是合法 JSON",
      );
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it("rejects invalid article schema", async () => {
      await expect(
        articleRepository.importJson(
          JSON.stringify([{ title: "missing fields" }]),
        ),
      ).rejects.toThrow();
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it("rejects duplicate slugs", async () => {
      const articles = [
        makeArticle({ slug: "same" }),
        makeArticle({ slug: "same" }),
      ];

      await expect(
        articleRepository.importJson(JSON.stringify(articles)),
      ).rejects.toThrow("匯入資料包含重複網址代稱");
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it("rejects duplicate ids", async () => {
      const id = randomUUID();
      const articles = [
        makeArticle({ id, slug: "a" }),
        makeArticle({ id, slug: "b" }),
      ];

      await expect(
        articleRepository.importJson(JSON.stringify(articles)),
      ).rejects.toThrow("匯入資料包含重複文章 id");
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it("imports valid articles", async () => {
      const articles = [makeArticle(), makeArticle()];
      fetchMock.mockResolvedValue(fakeResponse({ count: 2 }));

      await expect(
        articleRepository.importJson(JSON.stringify(articles)),
      ).resolves.toBe(2);

      expect(fetchMock).toHaveBeenCalledWith(
        "/api/articles?action=import",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify(articles),
        }),
      );
    });

    it("validates import API response", async () => {
      const articles = [makeArticle()];
      fetchMock.mockResolvedValue(fakeResponse({ imported: 1 }));

      await expect(
        articleRepository.importJson(JSON.stringify(articles)),
      ).rejects.toThrow();
    });
  });
});
