/**
 * @jest-environment node
 */

import { randomUUID } from "node:crypto";
import type { Product, ProductFormValues } from "./product.schema";

const mkdirMock = jest.fn();
const readFileMock = jest.fn();
const writeFileMock = jest.fn();
const renameMock = jest.fn();

jest.mock("node:fs/promises", () => ({
  mkdir: (...args: unknown[]) => mkdirMock(...args),
  readFile: (...args: unknown[]) => readFileMock(...args),
  writeFile: (...args: unknown[]) => writeFileMock(...args),
  rename: (...args: unknown[]) => renameMock(...args),
}));

import { ProductSlugConflictError, productStore } from "./product.store.server";

function makeProduct(overrides: Partial<Product> = {}): Product {
  const now = new Date().toISOString();

  return {
    id: randomUUID(),
    name: "旅行收納包",
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

function makeFormValues(
  overrides: Partial<ProductFormValues> = {},
): ProductFormValues {
  return {
    name: "旅行收納包",
    slug: `product-${randomUUID()}`,
    description: "description",
    category: "其他",
    imageUrl: "https://example.com/image.png",
    minPrice: 100,
    maxPrice: 200,
    status: "draft",
    featured: false,
    ...overrides,
  };
}

function setStoredProducts(products: Product[]) {
  readFileMock.mockResolvedValue(JSON.stringify(products));
}

describe("productStore", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mkdirMock.mockResolvedValue(undefined);
    readFileMock.mockResolvedValue("[]");
    writeFileMock.mockResolvedValue(undefined);
    renameMock.mockResolvedValue(undefined);
  });

  describe("list", () => {
    it("sorts by updatedAt descending", async () => {
      const older = makeProduct({ updatedAt: "2026-01-01T00:00:00.000Z" });
      const newer = makeProduct({ updatedAt: "2026-02-01T00:00:00.000Z" });

      setStoredProducts([older, newer]);

      const result = await productStore.list();

      expect(result.map((product) => product.id)).toEqual([newer.id, older.id]);
    });
  });

  describe("listPublished", () => {
    it("returns only published products with featured first", async () => {
      const draft = makeProduct();
      const normal = makeProduct({
        status: "published",
        featured: false,
        updatedAt: "2026-03-01T00:00:00.000Z",
      });
      const featured = makeProduct({
        status: "published",
        featured: true,
        updatedAt: "2026-01-01T00:00:00.000Z",
      });

      setStoredProducts([draft, normal, featured]);

      const result = await productStore.listPublished();

      expect(result.map((product) => product.id)).toEqual([
        featured.id,
        normal.id,
      ]);
    });

    it("sorts same featured status by updatedAt", async () => {
      const older = makeProduct({
        status: "published",
        updatedAt: "2026-01-01T00:00:00.000Z",
      });
      const newer = makeProduct({
        status: "published",
        updatedAt: "2026-02-01T00:00:00.000Z",
      });

      setStoredProducts([older, newer]);

      const result = await productStore.listPublished();

      expect(result.map((product) => product.id)).toEqual([newer.id, older.id]);
    });
  });

  describe("getById", () => {
    it("returns existing product", async () => {
      const product = makeProduct();
      setStoredProducts([product]);

      await expect(productStore.getById(product.id)).resolves.toEqual(product);
    });

    it("returns null when missing", async () => {
      setStoredProducts([]);

      await expect(productStore.getById(randomUUID())).resolves.toBeNull();
    });
  });

  describe("create", () => {
    it("creates and persists product", async () => {
      setStoredProducts([]);

      const created = await productStore.create(
        makeFormValues({ slug: "new-product" }),
      );

      expect(created.id).toBeTruthy();
      expect(created.slug).toBe("new-product");

      expect(writeFileMock).toHaveBeenCalledTimes(1);
      expect(renameMock).toHaveBeenCalledTimes(1);
    });

    it("rejects duplicate slug", async () => {
      setStoredProducts([makeProduct({ slug: "taken" })]);

      await expect(
        productStore.create(makeFormValues({ slug: "taken" })),
      ).rejects.toThrow(ProductSlugConflictError);

      expect(writeFileMock).not.toHaveBeenCalled();
    });
  });

  describe("update", () => {
    it("updates existing product", async () => {
      const existing = makeProduct({
        slug: "old-slug",
        createdAt: "2026-01-01T00:00:00.000Z",
      });

      setStoredProducts([existing]);

      const updated = await productStore.update(
        existing.id,
        makeFormValues({ name: "新的商品", slug: "new-slug" }),
      );

      expect(updated?.id).toBe(existing.id);
      expect(updated?.createdAt).toBe(existing.createdAt);
      expect(updated?.name).toBe("新的商品");
      expect(updated?.slug).toBe("new-slug");
    });

    it("returns null when product does not exist", async () => {
      setStoredProducts([]);

      await expect(
        productStore.update(randomUUID(), makeFormValues()),
      ).resolves.toBeNull();

      expect(writeFileMock).not.toHaveBeenCalled();
    });

    it("rejects another product's slug", async () => {
      const target = makeProduct({ slug: "target" });
      const another = makeProduct({ slug: "taken" });

      setStoredProducts([target, another]);

      await expect(
        productStore.update(target.id, makeFormValues({ slug: "taken" })),
      ).rejects.toThrow(ProductSlugConflictError);
    });

    it("allows keeping its own slug", async () => {
      const existing = makeProduct({ slug: "own-slug" });
      setStoredProducts([existing]);

      const result = await productStore.update(
        existing.id,
        makeFormValues({ slug: "own-slug" }),
      );

      expect(result?.slug).toBe("own-slug");
    });
  });

  describe("remove", () => {
    it("removes existing product", async () => {
      const existing = makeProduct();
      setStoredProducts([existing]);

      await expect(productStore.remove(existing.id)).resolves.toBe(true);

      expect(writeFileMock).toHaveBeenCalledTimes(1);
      expect(renameMock).toHaveBeenCalledTimes(1);
    });

    it("returns false when missing", async () => {
      setStoredProducts([]);

      await expect(productStore.remove(randomUUID())).resolves.toBe(false);

      expect(writeFileMock).not.toHaveBeenCalled();
    });
  });

  describe("replaceAll", () => {
    it("rejects duplicate slugs", async () => {
      const a = makeProduct({ slug: "same-slug" });
      const b = makeProduct({ slug: "same-slug" });

      await expect(productStore.replaceAll([a, b])).rejects.toThrow(
        "商品網址代稱重複",
      );

      expect(writeFileMock).not.toHaveBeenCalled();
    });

    it("writes products atomically", async () => {
      const products = [makeProduct(), makeProduct()];

      await expect(productStore.replaceAll(products)).resolves.toHaveLength(2);

      expect(writeFileMock).toHaveBeenCalledTimes(1);
      expect(renameMock).toHaveBeenCalledTimes(1);

      const [temporaryPath] = writeFileMock.mock.calls[0] as [string];
      const [renameFrom, renameTo] = renameMock.mock.calls[0] as [
        string,
        string,
      ];

      expect(renameFrom).toBe(temporaryPath);
      expect(renameTo).toMatch(/products\.json$/);
    });
  });

  describe("file handling", () => {
    it("creates empty products file when file does not exist", async () => {
      const error = Object.assign(new Error("missing"), { code: "ENOENT" });
      readFileMock.mockRejectedValue(error);

      const result = await productStore.list();

      expect(result).toEqual([]);

      expect(writeFileMock).toHaveBeenCalledWith(
        expect.stringMatching(/products\.json$/),
        "[]\n",
        "utf8",
      );
    });

    it("throws for malformed JSON", async () => {
      readFileMock.mockResolvedValue("{bad-json");

      await expect(productStore.list()).rejects.toThrow("商品資料檔案格式錯誤");
    });

    it("throws when persisted product fails schema validation", async () => {
      readFileMock.mockResolvedValue(JSON.stringify([{ hello: "world" }]));

      await expect(productStore.list()).rejects.toThrow(
        "商品資料檔案內容不符合格式",
      );
    });

    it("rethrows non-ENOENT filesystem errors", async () => {
      const error = Object.assign(new Error("permission denied"), {
        code: "EACCES",
      });
      readFileMock.mockRejectedValue(error);

      await expect(productStore.list()).rejects.toThrow("permission denied");
    });
  });
});
