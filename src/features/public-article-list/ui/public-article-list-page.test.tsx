import { render, screen } from "@testing-library/react";
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

const listPublishedMock = jest.fn();
jest.mock("@/shared/api/article.repository", () => ({
  articleRepository: {
    listPublished: (...args: unknown[]) => listPublishedMock(...args),
  },
}));

import { PublicArticleListPage } from "./public-article-list-page";

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
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <PublicArticleListPage />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("PublicArticleListPage", () => {
  it("sets the document title regardless of loading state", () => {
    listPublishedMock.mockReturnValue(new Promise(() => {}));
    renderPage();
    expect(document.title).toBe("The Desk Journal");
  });

  it("shows a loading state before data arrives", () => {
    listPublishedMock.mockReturnValue(new Promise(() => {}));
    renderPage();
    expect(screen.getByText("載入中…")).toBeInTheDocument();
  });

  it("renders each published article with author, date, and tags", async () => {
    listPublishedMock.mockResolvedValue([
      makeArticle({
        title: "文章一",
        author: "Alice",
        tags: ["咖啡", "台北"],
      }),
    ]);
    renderPage();

    expect(await screen.findByText("文章一")).toBeInTheDocument();
    expect(screen.getByText("精選介紹")).toBeInTheDocument();
    expect(screen.getByText(/Alice/)).toBeInTheDocument();
    expect(screen.getByText("咖啡")).toBeInTheDocument();
    expect(screen.getByText("台北")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /文章一/ })).toHaveAttribute(
      "href",
      "/articles/taipei-cafe-guide",
    );
  });

  it("shows an empty state with a CMS link when there are no articles", async () => {
    listPublishedMock.mockResolvedValue([]);
    renderPage();

    expect(await screen.findByText("尚無公開文章")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "前往 CMS 建立文章" }),
    ).toHaveAttribute("href", "/admin/articles");
  });

  it("shows the CMS back-office link in the header once loaded", async () => {
    listPublishedMock.mockResolvedValue([]);
    renderPage();

    await screen.findByText("尚無公開文章");
    expect(screen.getByRole("link", { name: "CMS 後台" })).toHaveAttribute(
      "href",
      "/admin/articles",
    );
  });
});
