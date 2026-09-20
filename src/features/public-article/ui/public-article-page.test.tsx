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

const getPublishedBySlugMock = jest.fn();
jest.mock("@/shared/api/article.repository", () => ({
  articleRepository: {
    getPublishedBySlug: (...args: unknown[]) => getPublishedBySlugMock(...args),
  },
}));

import { PublicArticlePage } from "./public-article-page";

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

function renderPage(slug = "taipei-cafe-guide") {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <PublicArticlePage slug={slug} />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  document.head
    .querySelectorAll('meta[name="description"]')
    .forEach((el) => el.remove());
});

describe("PublicArticlePage — loading and not-found", () => {
  it("shows a loading state before the article arrives", () => {
    getPublishedBySlugMock.mockReturnValue(new Promise(() => {}));
    renderPage();
    expect(screen.getByText("載入中…")).toBeInTheDocument();
  });

  it("calls notFound() when the article does not exist", async () => {
    getPublishedBySlugMock.mockResolvedValue(null);
    renderPage();

    await waitFor(() => expect(notFoundMock).toHaveBeenCalled());
  });
});

describe("PublicArticlePage — rendering an article", () => {
  it("renders title, excerpt, author, date, tags, and markdown content", async () => {
    getPublishedBySlugMock.mockResolvedValue(
      makeArticle({ author: "Sun", tags: ["咖啡", "台北"] }),
    );
    renderPage();

    expect(await screen.findByText("台北咖啡廳指南")).toBeInTheDocument();
    expect(screen.getByText("精選介紹")).toBeInTheDocument();
    expect(screen.getByText("作者 Sun")).toBeInTheDocument();
    expect(screen.getByText(/發布於/)).toBeInTheDocument();
    expect(screen.getByText("咖啡")).toBeInTheDocument();
    expect(screen.getByText("台北")).toBeInTheDocument();
    expect(screen.getByTestId("rendered-markdown")).toHaveTextContent("內文");
    expect(screen.getByRole("link", { name: /所有文章/ })).toHaveAttribute(
      "href",
      "/articles",
    );
  });

  it("sets document title to seoTitle when provided", async () => {
    getPublishedBySlugMock.mockResolvedValue(
      makeArticle({ seoTitle: "SEO 標題" }),
    );
    renderPage();

    await screen.findByText("台北咖啡廳指南");
    expect(document.title).toBe("SEO 標題");
  });

  it("falls back to the article title when seoTitle is empty", async () => {
    getPublishedBySlugMock.mockResolvedValue(makeArticle({ seoTitle: "" }));
    renderPage();

    await screen.findByText("台北咖啡廳指南");
    expect(document.title).toBe("台北咖啡廳指南");
  });

  it("inserts a meta description tag when one doesn't exist", async () => {
    getPublishedBySlugMock.mockResolvedValue(
      makeArticle({ seoDescription: "自訂描述" }),
    );
    renderPage();

    await waitFor(() =>
      expect(
        document
          .querySelector('meta[name="description"]')
          ?.getAttribute("content"),
      ).toBe("自訂描述"),
    );
  });

  it("falls back to excerpt when seoDescription is empty", async () => {
    getPublishedBySlugMock.mockResolvedValue(
      makeArticle({ seoDescription: "", excerpt: "備援摘要" }),
    );
    renderPage();

    await waitFor(() =>
      expect(
        document
          .querySelector('meta[name="description"]')
          ?.getAttribute("content"),
      ).toBe("備援摘要"),
    );
  });

  it("updates an existing meta description instead of creating a duplicate", async () => {
    const meta = document.createElement("meta");
    meta.setAttribute("name", "description");
    meta.setAttribute("content", "old");
    document.head.appendChild(meta);

    getPublishedBySlugMock.mockResolvedValue(
      makeArticle({ seoDescription: "新的 SEO 描述" }),
    );
    renderPage();

    await screen.findByText("台北咖啡廳指南");

    const descriptions = document.querySelectorAll('meta[name="description"]');
    expect(descriptions).toHaveLength(1);
    expect(descriptions[0]).toHaveAttribute("content", "新的 SEO 描述");
  });
});
