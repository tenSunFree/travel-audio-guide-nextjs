/**
 * @jest-environment node
 */
// Route handlers use the global Fetch API (Request/Response), which jsdom
// (this project's default jest environment) does not provide. Node 18+
// provides it natively, so this file is pinned to the node environment.

import { randomUUID } from "node:crypto";
import type { Product } from "@/shared/api/product.schema";

const listMock = jest.fn();
const listPublishedMock = jest.fn();
const createMock = jest.fn();

jest.mock("@/shared/api/product.store.server", () => {
  const actual = jest.requireActual("@/shared/api/product.store.server");
  return {
    ...actual,
    productStore: {
      list: (...args: unknown[]) => listMock(...args),
      listPublished: (...args: unknown[]) => listPublishedMock(...args),
      create: (...args: unknown[]) => createMock(...args),
    },
  };
});

import { GET, POST } from "./route";
import { ProductSlugConflictError } from "@/shared/api/product.store.server";

function makeProduct(overrides: Partial<Product> = {}): Product {
  const now = new Date().toISOString();
  return {
    id: randomUUID(),
    name: "測試商品",
    slug: `test-${randomUUID()}`,
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

function validFormBody() {
  return {
    name: "測試商品",
    slug: "new-product",
    description: "description",
    category: "其他",
    imageUrl: "https://example.com/image.png",
    minPrice: 100,
    maxPrice: 200,
    status: "draft",
    featured: false,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("GET /api/products", () => {
  it("returns the full list when no query params are given", async () => {
    const products = [makeProduct()];
    listMock.mockResolvedValue(products);

    const response = await GET(new Request("http://localhost/api/products"));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(products);
    expect(listMock).toHaveBeenCalledTimes(1);
  });

  it("returns only published products when status=published", async () => {
    const products = [makeProduct({ status: "published" })];
    listPublishedMock.mockResolvedValue(products);

    const response = await GET(
      new Request("http://localhost/api/products?status=published"),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(products);
    expect(listPublishedMock).toHaveBeenCalledTimes(1);
  });

  it("returns 500 when the store throws unexpectedly", async () => {
    listMock.mockRejectedValue(new Error("disk error"));

    const response = await GET(new Request("http://localhost/api/products"));

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ message: "讀取商品失敗" });
  });
});

describe("POST /api/products", () => {
  it("creates a product and returns 201", async () => {
    const created = makeProduct();
    createMock.mockResolvedValue(created);

    const response = await POST(
      new Request("http://localhost/api/products", {
        method: "POST",
        body: JSON.stringify(validFormBody()),
      }),
    );

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual(created);
  });

  it("returns 400 for an invalid payload", async () => {
    const response = await POST(
      new Request("http://localhost/api/products", {
        method: "POST",
        body: JSON.stringify({ ...validFormBody(), minPrice: -1 }),
      }),
    );

    expect(response.status).toBe(400);
    expect(createMock).not.toHaveBeenCalled();
  });

  it("returns 409 on a duplicate slug", async () => {
    createMock.mockRejectedValue(new ProductSlugConflictError());

    const response = await POST(
      new Request("http://localhost/api/products", {
        method: "POST",
        body: JSON.stringify(validFormBody()),
      }),
    );

    expect(response.status).toBe(409);
  });

  it("returns 500 on an unexpected error", async () => {
    createMock.mockRejectedValue(new Error("disk error"));

    const response = await POST(
      new Request("http://localhost/api/products", {
        method: "POST",
        body: JSON.stringify(validFormBody()),
      }),
    );

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ message: "新增商品失敗" });
  });
});
