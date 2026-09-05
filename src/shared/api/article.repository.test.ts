import { randomUUID } from "node:crypto";
import { articleRepository } from "./article.repository";
import type { Article } from "./article.schema";

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

function fakeResponse(
  body: unknown,
  init: { ok?: boolean; status?: number } = {},
): Response {
  return {
    ok: init.ok ?? true,
    status: init.status ?? 200,
    json: async () => body,
  } as unknown as Response;
}

describe("articleRepository.importJson", () => {
  const fetchMock = jest.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  it("rejects invalid JSON without calling the API", async () => {
    await expect(articleRepository.importJson("not json")).rejects.toThrow(
      "匯入檔案不是合法 JSON",
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects a payload that fails article schema validation", async () => {
    const invalid = [{ title: "missing required fields" }];

    await expect(
      articleRepository.importJson(JSON.stringify(invalid)),
    ).rejects.toThrow();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects duplicate slugs before calling the API", async () => {
    const articles = [
      makeArticle({ slug: "same-slug" }),
      makeArticle({ slug: "same-slug" }),
    ];

    await expect(
      articleRepository.importJson(JSON.stringify(articles)),
    ).rejects.toThrow("匯入資料包含重複網址代稱");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects duplicate ids before calling the API", async () => {
    const sharedId = randomUUID();
    const articles = [
      makeArticle({ id: sharedId, slug: "slug-a" }),
      makeArticle({ id: sharedId, slug: "slug-b" }),
    ];

    await expect(
      articleRepository.importJson(JSON.stringify(articles)),
    ).rejects.toThrow("匯入資料包含重複文章 id");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("calls the import API and returns the validated count on success", async () => {
    const articles = [makeArticle(), makeArticle()];
    fetchMock.mockResolvedValue(fakeResponse({ count: 2 }));

    const count = await articleRepository.importJson(JSON.stringify(articles));

    expect(count).toBe(2);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/articles?action=import",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("rejects when the API response does not match the expected shape", async () => {
    const articles = [makeArticle()];
    fetchMock.mockResolvedValue(fakeResponse({ imported: "oops" }));

    await expect(
      articleRepository.importJson(JSON.stringify(articles)),
    ).rejects.toThrow();
  });

  it("surfaces the server error message when the API call fails", async () => {
    const articles = [makeArticle()];
    fetchMock.mockResolvedValue(
      fakeResponse({ message: "伺服器錯誤" }, { ok: false, status: 500 }),
    );

    await expect(
      articleRepository.importJson(JSON.stringify(articles)),
    ).rejects.toThrow("伺服器錯誤");
  });
});
