/**
 * @jest-environment node
 */
// article.store.server.ts imports "server-only", which throws if `window`
// is defined. The default jest environment for this project is jsdom, so
// this file is pinned to the node environment.

import { randomUUID } from "node:crypto";
import type { Article } from "./article.schema";

const mkdirMock = jest.fn().mockResolvedValue(undefined);
const readFileMock = jest.fn();
const writeFileMock = jest.fn().mockResolvedValue(undefined);
const renameMock = jest.fn().mockResolvedValue(undefined);

jest.mock("node:fs/promises", () => ({
  mkdir: (...args: unknown[]) => mkdirMock(...args),
  readFile: (...args: unknown[]) => readFileMock(...args),
  writeFile: (...args: unknown[]) => writeFileMock(...args),
  rename: (...args: unknown[]) => renameMock(...args),
}));

// Imported after the mock so article.store.server.ts picks up the mocked fs.
import { articleStore } from "./article.store.server";

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

describe("articleStore.replaceAll", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mkdirMock.mockResolvedValue(undefined);
    writeFileMock.mockResolvedValue(undefined);
    renameMock.mockResolvedValue(undefined);
  });

  it("rejects duplicate slugs and does not write to disk", async () => {
    const a = makeArticle({ slug: "same-slug" });
    const b = makeArticle({ slug: "same-slug" });

    await expect(articleStore.replaceAll([a, b])).rejects.toThrow(
      "匯入資料包含重複網址代稱",
    );
    expect(writeFileMock).not.toHaveBeenCalled();
    expect(renameMock).not.toHaveBeenCalled();
  });

  it("rejects duplicate ids even when slugs are unique, and does not write to disk", async () => {
    const sharedId = randomUUID();
    const a = makeArticle({ id: sharedId, slug: "slug-a" });
    const b = makeArticle({ id: sharedId, slug: "slug-b" });

    await expect(articleStore.replaceAll([a, b])).rejects.toThrow(
      "匯入資料包含重複文章 id",
    );
    expect(writeFileMock).not.toHaveBeenCalled();
    expect(renameMock).not.toHaveBeenCalled();
  });

  it("accepts unique articles and writes them atomically (temp file then rename)", async () => {
    const articles = [makeArticle(), makeArticle()];

    const result = await articleStore.replaceAll(articles);

    expect(result).toHaveLength(2);
    expect(writeFileMock).toHaveBeenCalledTimes(1);
    expect(renameMock).toHaveBeenCalledTimes(1);

    const [tempFilePath] = writeFileMock.mock.calls[0] as [string];
    const [renamedFrom, renamedTo] = renameMock.mock.calls[0] as [
      string,
      string,
    ];
    expect(renamedFrom).toBe(tempFilePath);
    expect(renamedTo).toMatch(/articles\.json$/);
  });
});
