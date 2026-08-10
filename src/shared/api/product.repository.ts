"use client";

import {
  productSchema,
  type Product,
  type ProductFormValues,
} from "./product.schema";

export type ProductRepository = {
  list(): Promise<Product[]>;
  listPublished(): Promise<Product[]>;
  getById(id: string): Promise<Product | null>;
  create(values: ProductFormValues): Promise<Product>;
  update(id: string, values: ProductFormValues): Promise<Product>;
  remove(id: string): Promise<void>;
};

type ApiErrorBody = { message?: string };

async function parseError(
  response: Response,
  fallback: string,
): Promise<Error> {
  try {
    const body = (await response.json()) as ApiErrorBody;
    return new Error(body.message || fallback);
  } catch {
    return new Error(fallback);
  }
}

async function requestJson(
  path: string,
  options?: RequestInit,
): Promise<unknown> {
  const response = await fetch(path, {
    ...options,
    cache: "no-store",
    headers: {
      Accept: "application/json",
      ...(options?.body ? { "Content-Type": "application/json" } : {}),
      ...options?.headers,
    },
  });
  if (!response.ok) {
    throw await parseError(response, `API 請求失敗：${response.status}`);
  }
  return response.json();
}

export const productRepository: ProductRepository = {
  async list() {
    const result = await requestJson("/api/products");
    return productSchema.array().parse(result);
  },

  async listPublished() {
    const result = await requestJson("/api/products?status=published");
    return productSchema.array().parse(result);
  },

  async getById(id) {
    const response = await fetch(`/api/products/${encodeURIComponent(id)}`, {
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
    if (response.status === 404) return null;
    if (!response.ok) throw await parseError(response, "取得商品失敗");
    return productSchema.parse(await response.json());
  },

  async create(values) {
    const result = await requestJson("/api/products", {
      method: "POST",
      body: JSON.stringify(values),
    });
    return productSchema.parse(result);
  },

  async update(id, values) {
    const result = await requestJson(
      `/api/products/${encodeURIComponent(id)}`,
      { method: "PUT", body: JSON.stringify(values) },
    );
    return productSchema.parse(result);
  },

  async remove(id) {
    const response = await fetch(`/api/products/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    if (!response.ok) throw await parseError(response, "刪除商品失敗");
  },
};
