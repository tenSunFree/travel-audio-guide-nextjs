/**
 * @jest-environment node
 */
// Route handlers use the global Fetch API (Request/Response), which jsdom
// (this project's default jest environment) does not provide. Node 18+
// provides it natively, so this file is pinned to the node environment.

import { randomUUID } from "node:crypto";
import type { Product } from "@/shared/api/product.schema";

const getByIdMock = jest.fn();
const updateMock = jest.fn();
const removeMock = jest.fn();

jest.mock("@/shared/api/product.store.server", () => {
  const actual = jest.requireActual("@/shared/api/product.store.server");
  return {
    ...actual,
    productStore: {
      getById: (...args: unknown[]) => getByIdMock(...args),
      update: (...args: unknown[]) => updateMock(...args),
      remove: (...args: unknown[]) => removeMock(...args),
    },
  };
});

import { DELETE, GET, PUT } from "./route";
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
    slug: "updated-product",
    description: "description",
    category: "其他",
    imageUrl: "https://example.com/image.png",
    minPrice: 100,
    maxPrice: 200,
    status: "draft",
    featured: false,
  };
}

function makeContext(productId: string) {
  return { params: Promise.resolve({ productId }) };
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("GET /api/products/[productId]", () => {
  it("returns the matching product", async () => {
    const product = makeProduct();
    getByIdMock.mockResolvedValue(product);

    const response = await GET(
      new Request("http://localhost/api/products/" + product.id),
      makeContext(product.id),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(product);
  });

  it("returns 404 when the product does not exist", async () => {
    getByIdMock.mockResolvedValue(null);

    const response = await GET(
      new Request("http://localhost/api/products/missing"),
      makeContext("missing"),
    );

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ message: "找不到商品" });
  });

  it("returns 500 on an unexpected error", async () => {
    getByIdMock.mockRejectedValue(new Error("disk error"));

    const response = await GET(
      new Request("http://localhost/api/products/x"),
      makeContext("x"),
    );

    expect(response.status).toBe(500);
  });
});

describe("PUT /api/products/[productId]", () => {
  it("updates the product and returns it", async () => {
    const updated = makeProduct();
    updateMock.mockResolvedValue(updated);

    const response = await PUT(
      new Request("http://localhost/api/products/" + updated.id, {
        method: "PUT",
        body: JSON.stringify(validFormBody()),
      }),
      makeContext(updated.id),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(updated);
  });

  it("returns 400 for an invalid payload", async () => {
    const response = await PUT(
      new Request("http://localhost/api/products/x", {
        method: "PUT",
        body: JSON.stringify({ ...validFormBody(), minPrice: -1 }),
      }),
      makeContext("x"),
    );

    expect(response.status).toBe(400);
    expect(updateMock).not.toHaveBeenCalled();
  });

  it("returns 404 when the product does not exist", async () => {
    updateMock.mockResolvedValue(null);

    const response = await PUT(
      new Request("http://localhost/api/products/missing", {
        method: "PUT",
        body: JSON.stringify(validFormBody()),
      }),
      makeContext("missing"),
    );

    expect(response.status).toBe(404);
  });

  it("returns 409 on a duplicate slug", async () => {
    updateMock.mockRejectedValue(new ProductSlugConflictError());

    const response = await PUT(
      new Request("http://localhost/api/products/x", {
        method: "PUT",
        body: JSON.stringify(validFormBody()),
      }),
      makeContext("x"),
    );

    expect(response.status).toBe(409);
  });

  it("returns 500 on an unexpected error", async () => {
    updateMock.mockRejectedValue(new Error("disk error"));

    const response = await PUT(
      new Request("http://localhost/api/products/x", {
        method: "PUT",
        body: JSON.stringify(validFormBody()),
      }),
      makeContext("x"),
    );

    expect(response.status).toBe(500);
  });
});

describe("DELETE /api/products/[productId]", () => {
  it("removes the product and returns 204", async () => {
    removeMock.mockResolvedValue(true);

    const response = await DELETE(
      new Request("http://localhost/api/products/x", { method: "DELETE" }),
      makeContext("x"),
    );

    expect(response.status).toBe(204);
  });

  it("returns 404 when the product does not exist", async () => {
    removeMock.mockResolvedValue(false);

    const response = await DELETE(
      new Request("http://localhost/api/products/missing", {
        method: "DELETE",
      }),
      makeContext("missing"),
    );

    expect(response.status).toBe(404);
  });

  it("returns 500 on an unexpected error", async () => {
    removeMock.mockRejectedValue(new Error("disk error"));

    const response = await DELETE(
      new Request("http://localhost/api/products/x", { method: "DELETE" }),
      makeContext("x"),
    );

    expect(response.status).toBe(500);
  });
});
