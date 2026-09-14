/**
 * @jest-environment jsdom
 */
import {
  render,
  screen,
  waitFor,
  within,
  fireEvent,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { randomUUID } from "node:crypto";
import type { Article } from "@/shared/api/article.schema";

// jsdom's File implementation does not include the standard File.text()
// method (confirmed: `new File([...]).text()` throws "not a function" in
// this project's jsdom version). ArticleListPage's import flow calls
// `await file.text()`, so without this polyfill every import test would
// fail before articleRepository.importJson is ever reached — not because
// of a bug in the component, but because of a jsdom gap. FileReader is
// implemented, so we build text() on top of that.
if (!File.prototype.text) {
  File.prototype.text = function (this: File) {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsText(this);
    });
  };
}

const pushMock = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock, replace: jest.fn() }),
}));

jest.mock("next/link", () => {
  const MockLink = ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>;
  MockLink.displayName = "MockLink";
  return MockLink;
});

const listMock = jest.fn();
const removeMock = jest.fn();
const duplicateMock = jest.fn();
const exportJsonMock = jest.fn();
const importJsonMock = jest.fn();

jest.mock("@/shared/api/article.repository", () => ({
  articleRepository: {
    list: (...args: unknown[]) => listMock(...args),
    remove: (...args: unknown[]) => removeMock(...args),
    duplicate: (...args: unknown[]) => duplicateMock(...args),
    exportJson: (...args: unknown[]) => exportJsonMock(...args),
    importJson: (...args: unknown[]) => importJsonMock(...args),
  },
}));

import { ArticleListPage } from "./article-list-page";

function makeArticle(overrides: Partial<Article> = {}): Article {
  const now = new Date().toISOString();
  return {
    id: randomUUID(),
    title: "台北咖啡廳指南",
    slug: "taipei-cafe-guide",
    author: "Sun",
    excerpt: "台北最新咖啡廳精選",
    content: "content",
    tags: ["咖啡", "台北"],
    status: "published",
    seoTitle: "",
    seoDescription: "",
    createdAt: now,
    updatedAt: now,
    publishedAt: now,
    ...overrides,
  };
}

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <ArticleListPage />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  listMock.mockResolvedValue([]);
});

describe("ArticleListPage — listing and filtering", () => {
  it("shows the empty-state row when there are no articles", async () => {
    listMock.mockResolvedValue([]);
    renderPage();

    expect(
      await screen.findByText("找不到符合條件的文章。"),
    ).toBeInTheDocument();
  });

  it("renders every article returned by the API", async () => {
    listMock.mockResolvedValue([
      makeArticle({ title: "文章一" }),
      makeArticle({ title: "文章二", slug: "article-two" }),
    ]);
    renderPage();

    expect(await screen.findByText("文章一")).toBeInTheDocument();
    expect(screen.getByText("文章二")).toBeInTheDocument();
    expect(screen.getByText("顯示 2 篇")).toBeInTheDocument();
  });

  it("filters the list by the search box (matches title, author, slug, and tags)", async () => {
    const user = userEvent.setup();
    listMock.mockResolvedValue([
      makeArticle({ title: "台北咖啡廳指南", slug: "taipei-cafe" }),
      makeArticle({ title: "東京自由行", slug: "tokyo-trip", author: "Ren" }),
    ]);
    renderPage();

    await screen.findByText("台北咖啡廳指南");

    await user.type(
      screen.getByPlaceholderText("搜尋標題、作者、slug 或標籤"),
      "東京",
    );

    expect(screen.queryByText("台北咖啡廳指南")).not.toBeInTheDocument();
    expect(screen.getByText("東京自由行")).toBeInTheDocument();
    expect(screen.getByText("顯示 1 篇")).toBeInTheDocument();
  });

  it("filters the list by status", async () => {
    const user = userEvent.setup();
    listMock.mockResolvedValue([
      makeArticle({ title: "已發布文章", status: "published" }),
      makeArticle({ title: "草稿文章", slug: "draft-post", status: "draft" }),
    ]);
    renderPage();

    await screen.findByText("已發布文章");

    await user.selectOptions(
      screen.getByRole("combobox", { name: "文章狀態" }),
      "draft",
    );

    expect(screen.queryByText("已發布文章")).not.toBeInTheDocument();
    expect(screen.getByText("草稿文章")).toBeInTheDocument();
  });

  it("shows no public-page link for draft articles", async () => {
    listMock.mockResolvedValue([makeArticle({ status: "draft" })]);
    renderPage();

    await screen.findByText("台北咖啡廳指南");
    expect(screen.queryByTitle("公開頁")).not.toBeInTheDocument();
  });
});

describe("ArticleListPage — row actions", () => {
  it("deletes an article after the user confirms the browser dialog", async () => {
    const user = userEvent.setup();
    const article = makeArticle();
    listMock.mockResolvedValue([article]);
    removeMock.mockResolvedValue(undefined);
    const confirmSpy = jest.spyOn(window, "confirm").mockReturnValue(true);

    renderPage();
    await screen.findByText(article.title);

    await user.click(screen.getByTitle("刪除"));

    expect(confirmSpy).toHaveBeenCalledWith(`確定刪除「${article.title}」？`);
    await waitFor(() =>
      expect(removeMock).toHaveBeenCalledWith(article.id, expect.anything()),
    );

    confirmSpy.mockRestore();
  });

  it("does not delete when the user cancels the browser dialog", async () => {
    const user = userEvent.setup();
    const article = makeArticle();
    listMock.mockResolvedValue([article]);
    const confirmSpy = jest.spyOn(window, "confirm").mockReturnValue(false);

    renderPage();
    await screen.findByText(article.title);

    await user.click(screen.getByTitle("刪除"));

    expect(removeMock).not.toHaveBeenCalled();

    confirmSpy.mockRestore();
  });

  it("duplicates an article and navigates to its edit page", async () => {
    const user = userEvent.setup();
    const article = makeArticle();
    const copy = makeArticle({ id: "copy-id", slug: "taipei-cafe-guide-copy" });
    listMock.mockResolvedValue([article]);
    duplicateMock.mockResolvedValue(copy);

    renderPage();
    await screen.findByText(article.title);

    await user.click(screen.getByTitle("建立副本"));

    await waitFor(() =>
      expect(duplicateMock).toHaveBeenCalledWith(article.id, expect.anything()),
    );
    await waitFor(() =>
      expect(pushMock).toHaveBeenCalledWith(`/admin/articles/${copy.id}/edit`),
    );
  });
});

describe("ArticleListPage — import / export", () => {
  it("shows a success notice with the imported count", async () => {
    listMock.mockResolvedValue([]);
    importJsonMock.mockResolvedValue(3);

    renderPage();
    await screen.findByText("找不到符合條件的文章。");

    const file = new File(["[]"], "articles.json", {
      type: "application/json",
    });
    const fileInput = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;

    Object.defineProperty(fileInput, "files", { value: [file] });
    fireEvent.change(fileInput);

    expect(await screen.findByText("已匯入 3 篇文章。")).toBeInTheDocument();
  });

  it("shows the error message when import fails", async () => {
    listMock.mockResolvedValue([]);
    importJsonMock.mockRejectedValue(new Error("匯入資料包含重複網址代稱"));

    renderPage();
    await screen.findByText("找不到符合條件的文章。");

    const file = new File(["[]"], "articles.json", {
      type: "application/json",
    });
    const fileInput = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;

    Object.defineProperty(fileInput, "files", { value: [file] });
    fireEvent.change(fileInput);

    expect(
      await screen.findByText("匯入資料包含重複網址代稱"),
    ).toBeInTheDocument();
  });

  it("dismisses the notice when its close button is clicked", async () => {
    const user = userEvent.setup();
    listMock.mockResolvedValue([]);
    importJsonMock.mockResolvedValue(1);

    renderPage();
    await screen.findByText("找不到符合條件的文章。");

    const file = new File(["[]"], "articles.json", {
      type: "application/json",
    });
    const fileInput = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    Object.defineProperty(fileInput, "files", { value: [file] });
    fireEvent.change(fileInput);

    const notice = await screen.findByText("已匯入 1 篇文章。");
    await user.click(within(notice.parentElement!).getByText("×"));

    expect(screen.queryByText("已匯入 1 篇文章。")).not.toBeInTheDocument();
  });
});
