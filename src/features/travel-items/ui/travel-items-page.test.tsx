import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { randomUUID } from "node:crypto";
import type { Product } from "@/shared/api/product.schema";

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

const listPublishedMock = jest.fn();
jest.mock("@/shared/api/product.repository", () => ({
  productRepository: {
    listPublished: (...args: unknown[]) => listPublishedMock(...args),
  },
}));

import { TravelItemsPage } from "./travel-items-page";

function makeProduct(overrides: Partial<Product> = {}): Product {
  const now = new Date().toISOString();
  return {
    id: randomUUID(),
    name: "旅行收納包",
    slug: "travel-pouch",
    description: "輕巧防水收納包",
    category: "旅遊小物",
    imageUrl: "https://example.com/a.jpg",
    minPrice: 100,
    maxPrice: 200,
    status: "published",
    featured: false,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <TravelItemsPage />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("TravelItemsPage — loading and rendering", () => {
  it("shows a loading state before data arrives", () => {
    listPublishedMock.mockReturnValue(new Promise(() => {}));
    renderPage();
    expect(screen.getByText("載入中…")).toBeInTheDocument();
  });

  it("renders every published product once loaded", async () => {
    listPublishedMock.mockResolvedValue([
      makeProduct({ name: "商品甲" }),
      makeProduct({ name: "商品乙", slug: "item-b" }),
    ]);
    renderPage();

    expect(await screen.findByText("商品甲")).toBeInTheDocument();
    expect(screen.getByText("商品乙")).toBeInTheDocument();
  });

  it("shows the empty state with a link to admin when nothing matches", async () => {
    listPublishedMock.mockResolvedValue([]);
    renderPage();

    expect(
      await screen.findByText("目前沒有符合條件的商品"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "前往後台新增商品" }),
    ).toHaveAttribute("href", "/admin/products/new");
  });
});

describe("TravelItemsPage — filtering", () => {
  it("filters by the search box", async () => {
    const user = userEvent.setup();
    listPublishedMock.mockResolvedValue([
      makeProduct({ name: "旅行收納包" }),
      makeProduct({ name: "隨行水壺", slug: "bottle" }),
    ]);
    renderPage();
    await screen.findByText("旅行收納包");

    await user.type(screen.getByPlaceholderText("搜尋關鍵字"), "水壺");

    expect(screen.queryByText("旅行收納包")).not.toBeInTheDocument();
    expect(screen.getByText("隨行水壺")).toBeInTheDocument();
  });

  it("filters by category dropdown", async () => {
    const user = userEvent.setup();
    listPublishedMock.mockResolvedValue([
      makeProduct({ name: "分類甲商品", category: "旅遊小物" }),
      makeProduct({ name: "分類乙商品", slug: "b", category: "生活小物" }),
    ]);
    renderPage();
    await screen.findByText("分類甲商品");

    const selects = screen.getAllByRole("combobox");
    await user.selectOptions(selects[0], "生活小物");

    expect(screen.queryByText("分類甲商品")).not.toBeInTheDocument();
    expect(screen.getByText("分類乙商品")).toBeInTheDocument();
  });

  it("lists every distinct category plus the 全部分類 option", async () => {
    listPublishedMock.mockResolvedValue([
      makeProduct({ name: "商品甲", category: "旅遊小物" }),
      makeProduct({ name: "商品乙", slug: "b", category: "生活小物" }),
      makeProduct({ name: "商品丙", slug: "c", category: "旅遊小物" }),
    ]);
    renderPage();
    await screen.findByText("商品甲");

    const categorySelect = screen.getAllByRole("combobox")[0];
    const options = Array.from(categorySelect.querySelectorAll("option")).map(
      (o) => o.textContent,
    );

    expect(options).toEqual(["全部分類", "旅遊小物", "生活小物"]);
  });
});

describe("TravelItemsPage — sorting", () => {
  it("sorts by price low to high", async () => {
    const user = userEvent.setup();
    listPublishedMock.mockResolvedValue([
      makeProduct({ name: "貴的", minPrice: 500, maxPrice: 600 }),
      makeProduct({
        name: "便宜的",
        slug: "cheap",
        minPrice: 50,
        maxPrice: 80,
      }),
    ]);
    renderPage();
    await screen.findByText("貴的");

    const selects = screen.getAllByRole("combobox");
    await user.selectOptions(selects[1], "價格低到高");

    const names = screen
      .getAllByRole("heading", { level: 2 })
      .map((h) => h.textContent);
    expect(names).toEqual(["便宜的", "貴的"]);
  });

  it("sorts by price high to low", async () => {
    const user = userEvent.setup();
    listPublishedMock.mockResolvedValue([
      makeProduct({ name: "便宜的", minPrice: 50, maxPrice: 80 }),
      makeProduct({
        name: "貴的",
        slug: "expensive",
        minPrice: 500,
        maxPrice: 900,
      }),
    ]);
    renderPage();
    await screen.findByText("便宜的");

    const selects = screen.getAllByRole("combobox");
    await user.selectOptions(selects[1], "價格高到低");

    const names = screen
      .getAllByRole("heading", { level: 2 })
      .map((h) => h.textContent);
    expect(names).toEqual(["貴的", "便宜的"]);
  });

  it("puts featured products first for default sorting (熱門優先)", async () => {
    listPublishedMock.mockResolvedValue([
      makeProduct({ name: "一般商品", featured: false }),
      makeProduct({ name: "熱門商品", slug: "featured-one", featured: true }),
    ]);
    renderPage();
    await screen.findByText("一般商品");

    const names = screen
      .getAllByRole("heading", { level: 2 })
      .map((h) => h.textContent);
    expect(names).toEqual(["熱門商品", "一般商品"]);
  });
});
