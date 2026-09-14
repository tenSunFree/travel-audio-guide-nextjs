import { randomUUID } from "node:crypto";
import { productRepository } from "./product.repository";
import type { Product, ProductFormValues } from "./product.schema";

function makeProduct(overrides: Partial<Product> = {}): Product {
  const now = new Date().toISOString();

  return {
    id: randomUUID(),
    name: "測試商品",
    slug: `product-${randomUUID()}`,
    description: "description",
    category: "其他",
    imageUrl: "https://example.com/image.png",
    minPrice: 100,
    maxPrice: 200,
    status: "draft",
    featured: false,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function makeFormValues(): ProductFormValues {
  return {
    name: "測試商品",
    slug: "test-product",
    description: "description",
    category: "其他",
    imageUrl: "https://example.com/image.png",
    minPrice: 100,
    maxPrice: 200,
    status: "draft",
    featured: false,
  };
}

function fakeResponse(
  body: unknown,
  init: { ok?: boolean; status?: number; jsonError?: Error } = {},
): Response {
  return {
    ok: init.ok ?? true,
    status: init.status ?? 200,
    json: async () => {
      if (init.jsonError) {
        throw init.jsonError;
      }
      return body;
    },
  } as unknown as Response;
}

describe("productRepository", () => {
  const fetchMock = jest.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  describe("list", () => {
    it("returns validated products", async () => {
      const products = [makeProduct(), makeProduct()];
      fetchMock.mockResolvedValue(fakeResponse(products));

      const result = await productRepository.list();

      expect(result).toEqual(products);
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/products",
        expect.objectContaining({ cache: "no-store" }),
      );
    });

    it("surfaces server message", async () => {
      fetchMock.mockResolvedValue(
        fakeResponse({ message: "商品讀取失敗" }, { ok: false, status: 500 }),
      );

      await expect(productRepository.list()).rejects.toThrow("商品讀取失敗");
    });

    it("uses status fallback when error body is not readable", async () => {
      fetchMock.mockResolvedValue(
        fakeResponse(null, {
          ok: false,
          status: 503,
          jsonError: new Error("invalid response"),
        }),
      );

      await expect(productRepository.list()).rejects.toThrow(
        "API 請求失敗：503",
      );
    });

    it("rejects invalid product schema", async () => {
      fetchMock.mockResolvedValue(fakeResponse([{ invalid: true }]));

      await expect(productRepository.list()).rejects.toThrow();
    });
  });

  describe("listPublished", () => {
    it("requests only published products", async () => {
      fetchMock.mockResolvedValue(fakeResponse([]));

      await productRepository.listPublished();

      expect(fetchMock).toHaveBeenCalledWith(
        "/api/products?status=published",
        expect.objectContaining({ cache: "no-store" }),
      );
    });
  });

  describe("getById", () => {
    it("returns matching product", async () => {
      const product = makeProduct();
      fetchMock.mockResolvedValue(fakeResponse(product));

      await expect(productRepository.getById(product.id)).resolves.toEqual(
        product,
      );
    });

    it("URL-encodes id", async () => {
      fetchMock.mockResolvedValue(
        fakeResponse(null, { ok: false, status: 404 }),
      );

      await productRepository.getById("a/b c");

      expect(fetchMock).toHaveBeenCalledWith(
        "/api/products/a%2Fb%20c",
        expect.anything(),
      );
    });

    it("returns null on 404", async () => {
      fetchMock.mockResolvedValue(
        fakeResponse(null, { ok: false, status: 404 }),
      );

      await expect(productRepository.getById("missing")).resolves.toBeNull();
    });

    it("throws server error for non-404", async () => {
      fetchMock.mockResolvedValue(
        fakeResponse({ message: "取得失敗" }, { ok: false, status: 500 }),
      );

      await expect(productRepository.getById("id")).rejects.toThrow("取得失敗");
    });

    it("validates returned product", async () => {
      fetchMock.mockResolvedValue(fakeResponse({ id: "invalid" }));

      await expect(productRepository.getById("id")).rejects.toThrow();
    });
  });

  describe("create", () => {
    it("posts product values", async () => {
      const product = makeProduct();
      fetchMock.mockResolvedValue(fakeResponse(product));

      const values = makeFormValues();
      const result = await productRepository.create(values);

      expect(result).toEqual(product);
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/products",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify(values),
        }),
      );
    });
  });

  describe("update", () => {
    it("puts updated values", async () => {
      const product = makeProduct();
      fetchMock.mockResolvedValue(fakeResponse(product));

      const values = makeFormValues();
      const result = await productRepository.update("product/id", values);

      expect(result).toEqual(product);
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/products/product%2Fid",
        expect.objectContaining({
          method: "PUT",
          body: JSON.stringify(values),
        }),
      );
    });
  });

  describe("remove", () => {
    it("sends DELETE", async () => {
      fetchMock.mockResolvedValue(fakeResponse(undefined, { status: 204 }));

      await productRepository.remove("product/id");

      expect(fetchMock).toHaveBeenCalledWith("/api/products/product%2Fid", {
        method: "DELETE",
      });
    });

    it("surfaces server delete error", async () => {
      fetchMock.mockResolvedValue(
        fakeResponse({ message: "刪除失敗" }, { ok: false, status: 500 }),
      );

      await expect(productRepository.remove("id")).rejects.toThrow("刪除失敗");
    });

    it("uses fallback error when response body is invalid", async () => {
      fetchMock.mockResolvedValue(
        fakeResponse(null, {
          ok: false,
          status: 500,
          jsonError: new Error("bad body"),
        }),
      );

      await expect(productRepository.remove("id")).rejects.toThrow(
        "刪除商品失敗",
      );
    });
  });
});
