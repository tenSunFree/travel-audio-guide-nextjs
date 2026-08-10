import { z } from "zod";

export const productStatusSchema = z.enum(["draft", "published"]);
export const productCategorySchema = z.enum([
  "旅遊小物",
  "生活小物",
  "收納用品",
  "其他",
]);

export const productSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
  description: z.string(),
  category: productCategorySchema,
  imageUrl: z.string(),
  minPrice: z.number().nonnegative(),
  maxPrice: z.number().nonnegative(),
  status: productStatusSchema,
  featured: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

/**
 * Price fields: when the form input is provided, strings (including empty strings)
 * are allowed; after validation the value is always converted to a number.
 * We intentionally avoid using z.preprocess here because in Zod v4 the preprocess
 * input type degrades to unknown, which prevents the form input type (ProductFormInput)
 * from being usable for string interpolation or comparisons.
 * Instead we use z.union + transform + pipe so the input type is correctly inferred
 * as string | number.
 */
const priceSchema = z
  .union([z.string(), z.number()])
  .transform((value) => {
    if (typeof value === "number") return value;
    const trimmed = value.trim();
    return trimmed === "" ? Number.NaN : Number(trimmed);
  })
  .pipe(
    z
      .number({ error: "請輸入價格" })
      .min(0, "價格不可小於 0"),
  );

export const productFormSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "商品名稱至少需要 2 個字")
      .max(100, "商品名稱最多 100 個字"),
    slug: z
      .string()
      .trim()
      .min(2, "網址代稱至少需要 2 個字")
      .max(120, "網址代稱最多 120 個字")
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "只能使用小寫英文、數字與連字號"),
    description: z.string().trim().max(300, "商品說明最多 300 個字"),
    category: productCategorySchema,
    imageUrl: z
      .string()
      .trim()
      .min(1, "請上傳圖片或輸入圖片網址")
      .refine(
        (value) => /^https?:\/\//.test(value) || /^data:image\//.test(value),
        "請上傳圖片或輸入有效的圖片網址",
      ),
    minPrice: priceSchema,
    maxPrice: priceSchema,
    status: productStatusSchema,
    featured: z.boolean(),
  })
  .refine((value) => value.maxPrice >= value.minPrice, {
    message: "最高價格不可低於最低價格",
    path: ["maxPrice"],
  });

export type Product = z.infer<typeof productSchema>;

/** Form "input" type: minPrice / maxPrice allow string or number (empty string represents not filled) */
export type ProductFormInput = z.input<typeof productFormSchema>;
/** Form "validated" type: minPrice / maxPrice are guaranteed to be numbers; use this type when sending to the API */
export type ProductFormValues = z.output<typeof productFormSchema>;