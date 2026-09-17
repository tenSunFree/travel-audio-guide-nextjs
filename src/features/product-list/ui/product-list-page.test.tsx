import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { randomUUID } from "node:crypto";
import type { Product } from "@/shared/api/product.schema";
import { productKeys } from "@/shared/api/product.queries";

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

const listMock = jest.fn();
const removeMock = jest.fn();

jest.mock("@/shared/api/product.repository", () => ({
  productRepository: {
    list: (...args: unknown[]) => listMock(...args),
    remove: (...args: unknown[]) => removeMock(...args),
  },
}));

import { ProductListPage } from "./product-list-page";

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
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <ProductListPage />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  listMock.mockResolvedValue([]);
  window.confirm = jest.fn(() => true);
});

describe("ProductListPage — listing and filtering", () => {
  it("shows the empty-state row when there are no products", async () => {
    renderPage();
    expect(
      await screen.findByText("找不到符合條件的商品。"),
    ).toBeInTheDocument();
  });

  it("renders every product returned by the API", async () => {
    listMock.mockResolvedValue([
      makeProduct({ name: "商品一" }),
      makeProduct({ name: "商品二", slug: "product-two" }),
    ]);
    renderPage();

    expect(await screen.findByText("商品一")).toBeInTheDocument();
    expect(screen.getByText("商品二")).toBeInTheDocument();
    expect(screen.getByText("顯示 2 項")).toBeInTheDocument();
  });

  it("filters by the search box (matches product name)", async () => {
    const user = userEvent.setup();
    listMock.mockResolvedValue([
      makeProduct({ name: "旅行收納包" }),
      makeProduct({ name: "隨行水壺", slug: "bottle" }),
    ]);
    renderPage();
    await screen.findByText("旅行收納包");

    await user.type(
      screen.getByPlaceholderText("搜尋商品名稱、分類或 slug"),
      "水壺",
    );

    expect(screen.queryByText("旅行收納包")).not.toBeInTheDocument();
    expect(screen.getByText("隨行水壺")).toBeInTheDocument();
  });

  it("matches by slug when the keyword only appears in the slug", async () => {
    const user = userEvent.setup();
    listMock.mockResolvedValue([
      makeProduct({ name: "商品甲", slug: "special-slug-abc" }),
      makeProduct({ name: "商品乙", slug: "other-slug" }),
    ]);
    renderPage();
    await screen.findByText("商品甲");

    await user.type(
      screen.getByPlaceholderText("搜尋商品名稱、分類或 slug"),
      "special-slug",
    );

    expect(screen.getByText("商品甲")).toBeInTheDocument();
    expect(screen.queryByText("商品乙")).not.toBeInTheDocument();
  });

  it("matches by category when the keyword only appears in the category", async () => {
    const user = userEvent.setup();
    listMock.mockResolvedValue([
      makeProduct({
        name: "商品甲",
        category: "收納用品",
        description: "一般說明文字",
      }),
      makeProduct({
        name: "商品乙",
        slug: "b",
        category: "其他",
        description: "一般說明文字",
      }),
    ]);
    renderPage();
    await screen.findByText("商品甲");

    await user.type(
      screen.getByPlaceholderText("搜尋商品名稱、分類或 slug"),
      "收納",
    );

    expect(screen.getByText("商品甲")).toBeInTheDocument();
    expect(screen.queryByText("商品乙")).not.toBeInTheDocument();
  });

  it("matches by description when the keyword only appears in the description", async () => {
    const user = userEvent.setup();
    listMock.mockResolvedValue([
      makeProduct({ name: "商品甲", description: "獨特關鍵字描述" }),
      makeProduct({ name: "商品乙", slug: "b", description: "其他描述" }),
    ]);
    renderPage();
    await screen.findByText("商品甲");

    await user.type(
      screen.getByPlaceholderText("搜尋商品名稱、分類或 slug"),
      "獨特關鍵字",
    );

    expect(screen.getByText("商品甲")).toBeInTheDocument();
    expect(screen.queryByText("商品乙")).not.toBeInTheDocument();
  });

  it("filters by status dropdown", async () => {
    const user = userEvent.setup();
    listMock.mockResolvedValue([
      makeProduct({ name: "已發布商品", status: "published" }),
      makeProduct({ name: "草稿商品", slug: "draft-item", status: "draft" }),
    ]);
    renderPage();
    await screen.findByText("已發布商品");

    await user.selectOptions(screen.getByRole("combobox"), "draft");

    expect(screen.queryByText("已發布商品")).not.toBeInTheDocument();
    expect(screen.getByText("草稿商品")).toBeInTheDocument();
  });

  it("shows a featured tag for featured products", async () => {
    listMock.mockResolvedValue([makeProduct({ featured: true })]);
    renderPage();
    expect(await screen.findByText("熱門優先")).toBeInTheDocument();
  });

  it("falls back to a placeholder when description is empty", async () => {
    listMock.mockResolvedValue([makeProduct({ description: "" })]);
    renderPage();
    expect(await screen.findByText("尚未填寫商品說明")).toBeInTheDocument();
  });
});

describe("ProductListPage — delete flow", () => {
  it("deletes a product after confirmation", async () => {
    const user = userEvent.setup();
    listMock.mockResolvedValue([makeProduct({ name: "待刪除商品" })]);
    removeMock.mockResolvedValue(undefined);
    renderPage();
    await screen.findByText("待刪除商品");

    await user.click(screen.getByTitle("刪除"));

    expect(window.confirm).toHaveBeenCalledWith("確定刪除「待刪除商品」？");
    await waitFor(() => expect(removeMock).toHaveBeenCalled());
  });

  it("does not delete when confirmation is cancelled", async () => {
    const user = userEvent.setup();
    window.confirm = jest.fn(() => false);
    listMock.mockResolvedValue([makeProduct({ name: "不要刪除" })]);
    renderPage();
    await screen.findByText("不要刪除");

    await user.click(screen.getByTitle("刪除"));

    expect(removeMock).not.toHaveBeenCalled();
  });

  it("invalidates product queries after successful deletion", async () => {
    const user = userEvent.setup();
    const product = makeProduct();

    listMock.mockResolvedValue([product]);
    removeMock.mockResolvedValue(undefined);
    window.confirm = jest.fn(() => true);

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    const invalidateSpy = jest.spyOn(queryClient, "invalidateQueries");

    render(
      <QueryClientProvider client={queryClient}>
        <ProductListPage />
      </QueryClientProvider>,
    );

    await screen.findByText(product.name);
    await user.click(screen.getByTitle("刪除"));

    await waitFor(() =>
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: productKeys.all,
      }),
    );
  });
});
