/**
 * @jest-environment jsdom
 */
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { Product } from "@/shared/api/product.schema";

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

const getByIdMock = jest.fn();
const createMock = jest.fn();
const updateMock = jest.fn();

jest.mock("@/shared/api/product.repository", () => ({
  productRepository: {
    getById: (...args: unknown[]) => getByIdMock(...args),
    create: (...args: unknown[]) => createMock(...args),
    update: (...args: unknown[]) => updateMock(...args),
  },
}));

const imageFileToDataUrlMock = jest.fn();

jest.mock("@/shared/lib/image-file-to-data-url", () => ({
  imageFileToDataUrl: (...args: unknown[]) => imageFileToDataUrlMock(...args),
}));

import { ProductEditorPage } from "./product-editor-page";

function makeProduct(overrides: Partial<Product> = {}): Product {
  const now = new Date().toISOString();
  return {
    id: "96784776-469d-4c9b-b70e-f760a9fe1513",
    name: "既有商品",
    slug: "existing-product",
    description: "既有商品說明",
    category: "旅遊小物",
    imageUrl: "https://example.com/existing.png",
    minPrice: 100,
    maxPrice: 200,
    status: "draft",
    featured: false,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function renderPage(productId?: string) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <ProductEditorPage productId={productId} />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("ProductEditorPage — new product", () => {
  it("shows required-field errors when submitting an untouched form", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole("button", { name: "儲存商品" }));

    expect(
      await screen.findByText("商品名稱至少需要 2 個字"),
    ).toBeInTheDocument();
    expect(screen.getByText("網址代稱至少需要 2 個字")).toBeInTheDocument();
    expect(screen.getByText("請上傳圖片或輸入圖片網址")).toBeInTheDocument();
    expect(screen.getAllByText("請輸入價格")).toHaveLength(2);
    expect(createMock).not.toHaveBeenCalled();
  });

  it("auto-generates the slug from the product name while untouched", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.type(
      screen.getByPlaceholderText("例如：折疊迷你小圓扇"),
      "Foldable Mini Fan",
    );

    expect(screen.getByPlaceholderText("foldable-mini-fan")).toHaveValue(
      "foldable-mini-fan",
    );
  });

  it("shows an error when maxPrice is lower than minPrice", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByPlaceholderText("請輸入最低價格"), "300");
    await user.type(screen.getByPlaceholderText("請輸入最高價格"), "100");
    await user.click(screen.getByRole("button", { name: "儲存商品" }));

    expect(
      await screen.findByText("最高價格不可低於最低價格"),
    ).toBeInTheDocument();
    expect(createMock).not.toHaveBeenCalled();
  });

  it("accepts a pasted image URL and shows it in the preview", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.type(
      screen.getByLabelText("商品圖片網址"),
      "https://example.com/photo.png",
    );

    expect(screen.getByAltText("商品預覽")).toHaveAttribute(
      "src",
      "https://example.com/photo.png",
    );
  });

  it("uploads an image file and fills the image URL field", async () => {
    imageFileToDataUrlMock.mockResolvedValue("data:image/png;base64,abc");
    renderPage();

    const file = new File(["fake"], "photo.png", { type: "image/png" });
    const fileInput = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;

    // The file input is visually hidden (style={{ display: "none" }}) and
    // triggered via a separate "上傳圖片" button, so @testing-library
    // user-event's upload() — which performs a visibility/pointer-events
    // check before dispatching — silently no-ops on it. Firing the change
    // event directly is the reliable way to drive a hidden file input.
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() =>
      expect(screen.getByLabelText("商品圖片網址")).toHaveValue(
        "data:image/png;base64,abc",
      ),
    );
  });

  it("shows an error banner when image processing fails", async () => {
    imageFileToDataUrlMock.mockRejectedValue(new Error("請選擇圖片檔案"));
    renderPage();

    const file = new File(["fake"], "photo.txt", { type: "text/plain" });
    const fileInput = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;

    fireEvent.change(fileInput, { target: { files: [file] } });

    expect(await screen.findByText("請選擇圖片檔案")).toBeInTheDocument();
  });

  it("submits successfully with valid data and redirects to the edit page", async () => {
    const user = userEvent.setup();
    const created = makeProduct({ name: "New Product", slug: "new-product" });
    createMock.mockResolvedValue(created);

    renderPage();

    await user.type(
      screen.getByPlaceholderText("例如：折疊迷你小圓扇"),
      "New Product",
    );
    await user.type(
      screen.getByLabelText("商品圖片網址"),
      "https://example.com/photo.png",
    );
    await user.type(screen.getByPlaceholderText("請輸入最低價格"), "100");
    await user.type(screen.getByPlaceholderText("請輸入最高價格"), "200");
    await user.click(screen.getByRole("button", { name: "儲存商品" }));

    await waitFor(() => expect(createMock).toHaveBeenCalledTimes(1));
    expect(replaceMock).toHaveBeenCalledWith(
      `/admin/products/${created.id}/edit`,
    );
  });

  it("shows the server error message when submission fails", async () => {
    const user = userEvent.setup();
    createMock.mockRejectedValue(new Error("此商品網址代稱已被使用"));

    renderPage();

    await user.type(
      screen.getByPlaceholderText("例如：折疊迷你小圓扇"),
      "Duplicate Product",
    );
    await user.type(
      screen.getByLabelText("商品圖片網址"),
      "https://example.com/photo.png",
    );
    await user.type(screen.getByPlaceholderText("請輸入最低價格"), "100");
    await user.type(screen.getByPlaceholderText("請輸入最高價格"), "200");
    await user.click(screen.getByRole("button", { name: "儲存商品" }));

    expect(
      await screen.findByText("此商品網址代稱已被使用"),
    ).toBeInTheDocument();
  });

  it("toggles the featured checkbox", async () => {
    const user = userEvent.setup();
    renderPage();

    const checkbox = screen.getByRole("checkbox");
    expect(checkbox).not.toBeChecked();
    await user.click(checkbox);
    expect(checkbox).toBeChecked();
  });
});

describe("ProductEditorPage — editing an existing product", () => {
  it("loads the product and pre-fills the form", async () => {
    const product = makeProduct();
    getByIdMock.mockResolvedValue(product);

    renderPage(product.id);

    expect(await screen.findByDisplayValue(product.name)).toBeInTheDocument();
    expect(screen.getByDisplayValue(product.slug)).toBeInTheDocument();
  });

  it("calls notFound when the product does not exist", async () => {
    getByIdMock.mockResolvedValue(null);

    renderPage("missing-id");

    await waitFor(() => expect(notFoundMock).toHaveBeenCalled());
  });

  it("submits an update using the existing product id", async () => {
    const user = userEvent.setup();
    const product = makeProduct();
    getByIdMock.mockResolvedValue(product);
    updateMock.mockResolvedValue(product);

    renderPage(product.id);

    await screen.findByDisplayValue(product.name);
    await user.click(screen.getByRole("button", { name: "儲存商品" }));

    await waitFor(() => expect(updateMock).toHaveBeenCalledTimes(1));
    expect(updateMock).toHaveBeenCalledWith(
      product.id,
      expect.objectContaining({ name: product.name }),
    );
  });
});
