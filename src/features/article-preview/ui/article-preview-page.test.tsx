import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { Article } from "@/shared/api/article.schema";

jest.mock("next/link", () => {
  const MockLink = ({
    children,
    href,
    ...rest
  }: {
    children: React.ReactNode;
    href: string;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  );
  MockLink.displayName = "MockLink";
  return MockLink;
});

const notFoundMock = jest.fn();
jest.mock("next/navigation", () => ({
  notFound: (...args: unknown[]) => notFoundMock(...args),
}));

jest.mock("@/shared/lib/markdown", () => ({
  renderMarkdown: (content: string) =>
    `<div data-testid="rendered-markdown">${content}</div>`,
}));

const getByIdMock = jest.fn();
jest.mock("@/shared/api/article.repository", () => ({
  articleRepository: { getById: (...args: unknown[]) => getByIdMock(...args) },
}));

import { ArticlePreviewPage } from "./article-preview-page";

function makeArticle(overrides: Partial<Article> = {}): Article {
  const now = new Date().toISOString();
  return {
    id: "id-1",
    title: "台北咖啡廳指南",
    slug: "taipei-cafe-guide",
    author: "Sun",
    excerpt: "精選介紹",
    content: "內文",
    tags: ["咖啡"],
    status: "draft",
    seoTitle: "",
    seoDescription: "",
    createdAt: now,
    updatedAt: now,
    publishedAt: null,
    ...overrides,
  };
}

function renderPage(articleId = "id-1") {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <ArticlePreviewPage articleId={articleId} />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("ArticlePreviewPage — loading and not-found", () => {
  it("shows a loading placeholder before the article arrives", () => {
    getByIdMock.mockReturnValue(new Promise(() => {}));
    renderPage();

    expect(screen.getByText("文章預覽")).toBeInTheDocument();
    expect(screen.getByText("載入中…")).toBeInTheDocument();
  });

  it("calls notFound() when the article does not exist", async () => {
    getByIdMock.mockResolvedValue(null);
    renderPage();

    await waitFor(() => expect(notFoundMock).toHaveBeenCalled());
  });
});

describe("ArticlePreviewPage — rendering an article", () => {
  it("renders the article title, excerpt, author, tags, and markdown content", async () => {
    getByIdMock.mockResolvedValue(
      makeArticle({ author: "Sun", tags: ["咖啡", "台北"] }),
    );
    renderPage();

    expect(await screen.findByText("台北咖啡廳指南")).toBeInTheDocument();
    expect(screen.getByText("精選介紹")).toBeInTheDocument();
    expect(screen.getByText("Sun")).toBeInTheDocument();
    expect(screen.getByText("咖啡")).toBeInTheDocument();
    expect(screen.getByText("台北")).toBeInTheDocument();
    expect(screen.getByText(/更新於/)).toBeInTheDocument();
    expect(screen.getByTestId("rendered-markdown")).toHaveTextContent("內文");
  });

  it("shows the draft status badge and no public-page link for a draft", async () => {
    getByIdMock.mockResolvedValue(makeArticle({ status: "draft" }));
    renderPage();

    await screen.findByText("台北咖啡廳指南");
    expect(screen.getByText("草稿")).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /公開頁/ }),
    ).not.toBeInTheDocument();
  });

  it("shows the published status badge and a public-page link for a published article", async () => {
    getByIdMock.mockResolvedValue(
      makeArticle({ status: "published", slug: "published-slug" }),
    );
    renderPage();

    await screen.findByText("台北咖啡廳指南");
    expect(screen.getByText("已發布")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /公開頁/ })).toHaveAttribute(
      "href",
      "/articles/published-slug",
    );
  });

  it("always shows a link back to the editor", async () => {
    getByIdMock.mockResolvedValue(makeArticle({ id: "abc-123" }));
    renderPage("abc-123");

    await screen.findByText("台北咖啡廳指南");
    expect(screen.getByRole("link", { name: "返回編輯" })).toHaveAttribute(
      "href",
      "/admin/articles/abc-123/edit",
    );
  });
});
