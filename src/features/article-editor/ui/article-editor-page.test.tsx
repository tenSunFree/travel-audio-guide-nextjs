/**
 * @jest-environment jsdom
 */
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { Article } from "@/shared/api/article.schema";

const replaceMock = jest.fn();
const notFoundMock = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: replaceMock, push: jest.fn() }),
  notFound: () => notFoundMock(),
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

jest.mock("@/shared/lib/markdown", () => ({
  // The real renderMarkdown() pipes through `marked`, an ESM-only package
  // that next/jest cannot transform (see notes in markdown.test.ts). For
  // this component test we only care that whatever renderMarkdown returns
  // ends up in the live-preview pane, not that markdown parsing itself is
  // correct — that's covered by markdown.test.ts.
  renderMarkdown: (markdown: string) =>
    `<div data-testid="rendered-markdown">${markdown}</div>`,
}));

const getByIdMock = jest.fn();
const createMock = jest.fn();
const updateMock = jest.fn();

jest.mock("@/shared/api/article.repository", () => ({
  articleRepository: {
    getById: (...args: unknown[]) => getByIdMock(...args),
    create: (...args: unknown[]) => createMock(...args),
    update: (...args: unknown[]) => updateMock(...args),
  },
}));

import { ArticleEditorPage } from "./article-editor-page";

function makeArticle(overrides: Partial<Article> = {}): Article {
  const now = new Date().toISOString();
  return {
    id: "96784776-469d-4c9b-b70e-f760a9fe1513",
    title: "既有文章",
    slug: "existing-article",
    author: "Sun",
    excerpt: "既有摘要",
    content: "既有文章內容已經超過十個字了",
    tags: ["react"],
    status: "draft",
    seoTitle: "",
    seoDescription: "",
    createdAt: now,
    updatedAt: now,
    publishedAt: null,
    ...overrides,
  };
}

function renderPage(articleId?: string) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <ArticleEditorPage articleId={articleId} />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("ArticleEditorPage — new article", () => {
  it("shows required-field errors when submitting an untouched form", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole("button", { name: "儲存文章" }));

    expect(await screen.findByText("標題至少需要 2 個字")).toBeInTheDocument();
    expect(screen.getByText("網址代稱至少需要 2 個字")).toBeInTheDocument();
    expect(createMock).not.toHaveBeenCalled();
  });

  it("auto-generates the slug from the title while the slug field is untouched", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.type(
      screen.getByPlaceholderText("例如：台北咖啡廳指南"),
      "台北 Cafe Guide",
    );

    expect(screen.getByPlaceholderText("taipei-cafe-guide")).toHaveValue(
      "cafe-guide",
    );
  });

  it("stops auto-generating the slug once the user edits it manually", async () => {
    const user = userEvent.setup();
    renderPage();

    const titleInput = screen.getByPlaceholderText("例如：台北咖啡廳指南");
    const slugInput = screen.getByPlaceholderText("taipei-cafe-guide");

    await user.type(titleInput, "Original Title");
    await user.clear(slugInput);
    await user.type(slugInput, "custom-slug");
    await user.type(titleInput, " More");

    expect(slugInput).toHaveValue("custom-slug");
  });

  it("shows a validation error for an invalid slug format", async () => {
    const user = userEvent.setup();
    renderPage();

    const slugInput = screen.getByPlaceholderText("taipei-cafe-guide");
    await user.clear(slugInput);
    await user.type(slugInput, "Not A Valid Slug!");
    await user.click(screen.getByRole("button", { name: "儲存文章" }));

    expect(
      await screen.findByText("只能使用小寫英文、數字與連字號"),
    ).toBeInTheDocument();
    expect(createMock).not.toHaveBeenCalled();
  });

  it("submits successfully with valid data and redirects to the edit page", async () => {
    const user = userEvent.setup();
    const created = makeArticle({ title: "New Article", slug: "new-article" });
    createMock.mockResolvedValue(created);

    renderPage();

    await user.type(
      screen.getByPlaceholderText("例如：台北咖啡廳指南"),
      "New Article",
    );
    await user.click(screen.getByRole("button", { name: "儲存文章" }));

    await waitFor(() => expect(createMock).toHaveBeenCalledTimes(1));
    expect(replaceMock).toHaveBeenCalledWith(
      `/admin/articles/${created.id}/edit`,
    );
  });

  it("shows the server error message when submission fails", async () => {
    const user = userEvent.setup();
    createMock.mockRejectedValue(new Error("此網址代稱已被其他文章使用"));

    renderPage();

    await user.type(
      screen.getByPlaceholderText("例如：台北咖啡廳指南"),
      "Duplicate Article",
    );
    await user.click(screen.getByRole("button", { name: "儲存文章" }));

    expect(
      await screen.findByText("此網址代稱已被其他文章使用"),
    ).toBeInTheDocument();
  });
});

describe("ArticleEditorPage — editing an existing article", () => {
  it("loads the article and pre-fills the form", async () => {
    const article = makeArticle();
    getByIdMock.mockResolvedValue(article);

    renderPage(article.id);

    expect(await screen.findByDisplayValue(article.title)).toBeInTheDocument();
    expect(screen.getByDisplayValue(article.slug)).toBeInTheDocument();
  });

  it("calls notFound when the article does not exist", async () => {
    getByIdMock.mockResolvedValue(null);

    renderPage("missing-id");

    await waitFor(() => expect(notFoundMock).toHaveBeenCalled());
  });

  it("shows the public-page link only when the article is published", async () => {
    const draft = makeArticle({ status: "draft" });
    getByIdMock.mockResolvedValue(draft);

    renderPage(draft.id);

    await screen.findByDisplayValue(draft.title);
    expect(
      screen.queryByRole("link", { name: /公開頁/ }),
    ).not.toBeInTheDocument();
  });

  it("submits an update using the existing article id", async () => {
    const user = userEvent.setup();
    const article = makeArticle();
    getByIdMock.mockResolvedValue(article);
    updateMock.mockResolvedValue(article);

    renderPage(article.id);

    await screen.findByDisplayValue(article.title);
    await user.click(screen.getByRole("button", { name: "儲存文章" }));

    await waitFor(() => expect(updateMock).toHaveBeenCalledTimes(1));
    expect(updateMock).toHaveBeenCalledWith(
      article.id,
      expect.objectContaining({ title: article.title }),
    );
  });
});

describe("ArticleEditorPage — SEO panel and live preview", () => {
  it("switches to the SEO panel and falls back preview text to title/excerpt", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.type(
      screen.getByPlaceholderText("例如：台北咖啡廳指南"),
      "我的標題",
    );
    await user.click(screen.getByRole("button", { name: "SEO 設定" }));

    const preview = screen.getByText("搜尋結果預覽").closest("div")!;
    expect(within(preview).getByText("我的標題")).toBeInTheDocument();
  });

  it("renders the markdown content in the live preview", async () => {
    renderPage();

    expect(await screen.findByTestId("rendered-markdown")).toHaveTextContent(
      "新文章",
    );
  });
});
