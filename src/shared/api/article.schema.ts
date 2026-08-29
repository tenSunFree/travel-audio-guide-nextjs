import { z } from "zod";

export const articleStatusSchema = z.enum(["draft", "published"]);

export const articleSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  slug: z.string(),
  author: z.string(),
  excerpt: z.string(),
  content: z.string(),
  tags: z.array(z.string()),
  status: articleStatusSchema,
  seoTitle: z.string(),
  seoDescription: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  publishedAt: z.string().datetime().nullable(),
});

export const articleFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, "標題至少需要 2 個字")
    .max(120, "標題最多 120 個字"),
  slug: z
    .string()
    .trim()
    .min(2, "網址代稱至少需要 2 個字")
    .max(120, "網址代稱最多 120 個字")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "只能使用小寫英文、數字與連字號"),
  author: z
    .string()
    .trim()
    .min(1, "請輸入作者")
    .max(60, "作者名稱最多 60 個字"),
  excerpt: z.string().trim().max(200, "摘要最多 200 個字"),
  content: z.string().trim().min(10, "文章內容至少需要 10 個字"),
  tagsText: z.string().trim().max(200, "標籤內容過長"),
  status: articleStatusSchema,
  seoTitle: z.string().trim().max(70, "SEO 標題最多 70 個字"),
  seoDescription: z.string().trim().max(160, "SEO 描述最多 160 個字"),
});

export const articleImportResultSchema = z.object({
  count: z.number().int().nonnegative(),
});

export type Article = z.infer<typeof articleSchema>;
export type ArticleFormValues = z.infer<typeof articleFormSchema>;
export type ArticleStatus = z.infer<typeof articleStatusSchema>;
