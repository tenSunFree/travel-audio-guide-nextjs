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

export const PRODUCT_STORAGE_KEY = "travel-audio-guide-nextjs:products:v1";
const now = () => new Date().toISOString();
const delay = (ms = 80) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));
const clone = <T>(value: T): T => structuredClone(value);
const isBrowser = () => typeof window !== "undefined";

const seedProducts: Product[] = [
  {
    id: "899238e1-2bcb-4cd8-8e29-217fb912fd91",
    name: "防丟神器螢光行李吊牌",
    slug: "neon-luggage-tag",
    description: "繽紛醒目的行李吊牌，旅行途中快速辨識自己的行李。",
    category: "旅遊小物",
    imageUrl:
      "https://images.unsplash.com/photo-1553531384-cc64ac80f931?auto=format&fit=crop&w=900&q=80",
    minPrice: 7,
    maxPrice: 11,
    status: "published",
    featured: true,
    createdAt: now(),
    updatedAt: now(),
  },
  {
    id: "a1843de8-af8b-4aa7-b8d4-a970d5ed9027",
    name: "可拆洗涼感記憶棉 U 型枕",
    slug: "memory-foam-neck-pillow",
    description: "適合飛機、火車與長途巴士使用，支撐頸部並可拆洗。",
    category: "生活小物",
    imageUrl:
      "https://images.unsplash.com/photo-1520999439012-7e65c027fe5b?auto=format&fit=crop&w=900&q=80",
    minPrice: 147,
    maxPrice: 479,
    status: "published",
    featured: true,
    createdAt: now(),
    updatedAt: now(),
  },
  {
    id: "392b314e-dd02-4e7b-9c67-acddc965b405",
    name: "折疊迷你小圓扇",
    slug: "foldable-mini-fan",
    description: "輕巧可折疊，適合放入隨身包或登機箱。",
    category: "旅遊小物",
    imageUrl:
      "https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?auto=format&fit=crop&w=900&q=80",
    minPrice: 27,
    maxPrice: 61,
    status: "published",
    featured: false,
    createdAt: now(),
    updatedAt: now(),
  },
  {
    id: "8e12f881-b199-4893-b24c-537711416cbf",
    name: "皮革質感開瓶鑰匙圈",
    slug: "leather-bottle-opener-keyring",
    description: "皮革質感與開瓶器二合一，旅行與露營都實用。",
    category: "旅遊小物",
    imageUrl:
      "https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?auto=format&fit=crop&w=900&q=80",
    minPrice: 71,
    maxPrice: 159,
    status: "published",
    featured: false,
    createdAt: now(),
    updatedAt: now(),
  },
  {
    id: "afc685fa-aa6b-429e-b17f-815aa0596d48",
    name: "見證愛情愛心鎖",
    slug: "love-heart-lock",
    description: "可作為紀念小物、旅行掛飾或送禮選擇。",
    category: "旅遊小物",
    imageUrl:
      "https://images.unsplash.com/photo-1519238425857-d6922ed3d613?auto=format&fit=crop&w=900&q=80",
    minPrice: 117,
    maxPrice: 289,
    status: "published",
    featured: false,
    createdAt: now(),
    updatedAt: now(),
  },
];

function readAll(): Product[] {
  if (!isBrowser()) return [];
  const raw = localStorage.getItem(PRODUCT_STORAGE_KEY);
  if (!raw) {
    writeAll(seedProducts);
    return clone(seedProducts);
  }
  try {
    return productSchema.array().parse(JSON.parse(raw));
  } catch {
    writeAll(seedProducts);
    return clone(seedProducts);
  }
}
function writeAll(products: Product[]) {
  if (isBrowser())
    localStorage.setItem(PRODUCT_STORAGE_KEY, JSON.stringify(products));
}
function assertUniqueSlug(
  products: Product[],
  slug: string,
  ignoredId?: string,
) {
  if (
    products.some(
      (product) => product.slug === slug && product.id !== ignoredId,
    )
  )
    throw new Error("此商品網址代稱已被使用");
}

export const productRepository: ProductRepository = {
  async list() {
    await delay();
    return readAll().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  },
  async listPublished() {
    await delay();
    return readAll()
      .filter((p) => p.status === "published")
      .sort(
        (a, b) =>
          Number(b.featured) - Number(a.featured) ||
          b.updatedAt.localeCompare(a.updatedAt),
      );
  },
  async getById(id) {
    await delay();
    return readAll().find((p) => p.id === id) ?? null;
  },
  async create(values) {
    await delay();
    const products = readAll();
    assertUniqueSlug(products, values.slug);
    const timestamp = now();
    const product: Product = {
      id: crypto.randomUUID(),
      ...values,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    writeAll([product, ...products]);
    return clone(product);
  },
  async update(id, values) {
    await delay();
    const products = readAll();
    const current = products.find((p) => p.id === id);
    if (!current) throw new Error("找不到商品");
    assertUniqueSlug(products, values.slug, id);
    const product: Product = { ...current, ...values, updatedAt: now() };
    writeAll(products.map((p) => (p.id === id ? product : p)));
    return clone(product);
  },
  async remove(id) {
    await delay();
    writeAll(readAll().filter((p) => p.id !== id));
  },
};
