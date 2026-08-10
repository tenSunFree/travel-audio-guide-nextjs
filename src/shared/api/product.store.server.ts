import "server-only";

import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  productSchema,
  type Product,
  type ProductFormValues,
} from "./product.schema";

const DATA_DIRECTORY = path.join(process.cwd(), "data");
const PRODUCTS_FILE = path.join(DATA_DIRECTORY, "products.json");

/**
 * Serialize JSON file operations within the same Node.js process
 * to avoid race conditions where two requests (for example from a phone
 * and a computer) write at nearly the same time and overwrite data.
 * This approach is suitable for a single-instance development environment;
 * for multi-instance production deployments a database should be used.
 */
let operationQueue: Promise<void> = Promise.resolve();

function serialize<T>(operation: () => Promise<T>): Promise<T> {
  const result = operationQueue.then(operation, operation);
  operationQueue = result.then(
    () => undefined,
    () => undefined,
  );
  return result;
}

async function ensureDataFile(): Promise<void> {
  await mkdir(DATA_DIRECTORY, { recursive: true });
  try {
    await readFile(PRODUCTS_FILE, "utf8");
  } catch (error) {
    const code =
      error instanceof Error && "code" in error ? error.code : undefined;
    if (code !== "ENOENT") throw error;
    await writeFile(PRODUCTS_FILE, "[]\n", "utf8");
  }
}

async function readProductsUnsafe(): Promise<Product[]> {
  await ensureDataFile();
  const raw = await readFile(PRODUCTS_FILE, "utf8");
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("商品資料檔案不是有效的 JSON");
  }
  const result = productSchema.array().safeParse(parsed);
  if (!result.success) {
    console.error("Invalid products.json:", result.error.flatten());
    throw new Error("商品資料格式錯誤");
  }
  return result.data;
}

async function writeProductsUnsafe(products: Product[]): Promise<void> {
  const validated = productSchema.array().parse(products);
  await ensureDataFile();
  await writeFile(
    PRODUCTS_FILE,
    `${JSON.stringify(validated, null, 2)}\n`,
    "utf8",
  );
}

function assertUniqueSlug(
  products: Product[],
  slug: string,
  ignoredId?: string,
): void {
  const duplicated = products.some(
    (product) => product.slug === slug && product.id !== ignoredId,
  );
  if (duplicated) throw new Error("此商品網址代稱已被使用");
}

export const productStore = {
  list(): Promise<Product[]> {
    return serialize(async () => {
      const products = await readProductsUnsafe();
      return [...products].sort((a, b) =>
        b.updatedAt.localeCompare(a.updatedAt),
      );
    });
  },

  listPublished(): Promise<Product[]> {
    return serialize(async () => {
      const products = await readProductsUnsafe();
      return products
        .filter((product) => product.status === "published")
        .sort(
          (a, b) =>
            Number(b.featured) - Number(a.featured) ||
            b.updatedAt.localeCompare(a.updatedAt),
        );
    });
  },

  getById(id: string): Promise<Product | null> {
    return serialize(async () => {
      const products = await readProductsUnsafe();
      return products.find((product) => product.id === id) ?? null;
    });
  },

  create(values: ProductFormValues): Promise<Product> {
    return serialize(async () => {
      const products = await readProductsUnsafe();
      assertUniqueSlug(products, values.slug);
      const timestamp = new Date().toISOString();
      const product = productSchema.parse({
        id: randomUUID(),
        ...values,
        createdAt: timestamp,
        updatedAt: timestamp,
      });
      await writeProductsUnsafe([product, ...products]);
      return product;
    });
  },

  update(id: string, values: ProductFormValues): Promise<Product | null> {
    return serialize(async () => {
      const products = await readProductsUnsafe();
      const current = products.find((product) => product.id === id);
      if (!current) return null;
      assertUniqueSlug(products, values.slug, id);
      const updatedProduct = productSchema.parse({
        ...current,
        ...values,
        updatedAt: new Date().toISOString(),
      });
      await writeProductsUnsafe(
        products.map((product) =>
          product.id === id ? updatedProduct : product,
        ),
      );
      return updatedProduct;
    });
  },

  remove(id: string): Promise<boolean> {
    return serialize(async () => {
      const products = await readProductsUnsafe();
      const exists = products.some((product) => product.id === id);
      if (!exists) return false;
      await writeProductsUnsafe(
        products.filter((product) => product.id !== id),
      );
      return true;
    });
  },

  /**
   * For migrating localStorage data to the server only.
   * After the migration is complete, remove the `src/app/api/products/import`
   * route to avoid leaving a public endpoint that could overwrite all products.
   */
  replaceAll(products: Product[]): Promise<Product[]> {
    return serialize(async () => {
      const validated = productSchema.array().parse(products);
      const slugs = new Set<string>();
      for (const product of validated) {
        if (slugs.has(product.slug)) {
          throw new Error(`商品網址代稱重複：${product.slug}`);
        }
        slugs.add(product.slug);
      }
      await writeProductsUnsafe(validated);
      return validated;
    });
  },
};
