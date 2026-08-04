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
    imageUrl: z.string().trim().url("請輸入有效的圖片網址"),
    minPrice: z.coerce.number().min(0, "最低價格不可小於 0"),
    maxPrice: z.coerce.number().min(0, "最高價格不可小於 0"),
    status: productStatusSchema,
    featured: z.boolean(),
  })
  .refine((value) => value.maxPrice >= value.minPrice, {
    message: "最高價格不可低於最低價格",
    path: ["maxPrice"],
  });

export type Product = z.infer<typeof productSchema>;
export type ProductFormValues = z.infer<typeof productFormSchema>;
