import {
  ArticleSlugConflictError,
  articleStore,
} from "@/shared/api/article.store.server";
import { articleFormSchema, articleSchema } from "@/shared/api/article.schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const slug = url.searchParams.get("slug");

    if (slug) {
      const article = await articleStore.getPublishedBySlug(slug);
      if (!article) {
        return Response.json({ message: "找不到文章" }, { status: 404 });
      }
      return Response.json(article, {
        headers: { "Cache-Control": "no-store" },
      });
    }

    const articles =
      status === "published"
        ? await articleStore.listPublished()
        : await articleStore.list();

    return Response.json(articles, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("GET /api/articles failed:", error);
    return Response.json({ message: "讀取文章失敗" }, { status: 500 });
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);
    const action = url.searchParams.get("action");
    const body: unknown = await request.json();

    if (action === "duplicate") {
      if (
        !body ||
        typeof body !== "object" ||
        !("id" in body) ||
        typeof (body as { id: unknown }).id !== "string"
      ) {
        return Response.json({ message: "缺少文章 id" }, { status: 400 });
      }
      const article = await articleStore.duplicate((body as { id: string }).id);
      if (!article) {
        return Response.json({ message: "找不到文章" }, { status: 404 });
      }
      return Response.json(article, { status: 201 });
    }

    if (action === "import") {
      const parsed = articleSchema.array().safeParse(body);
      if (!parsed.success) {
        return Response.json(
          {
            message: "匯入文章資料格式錯誤",
            errors: parsed.error.flatten(),
          },
          { status: 400 },
        );
      }
      const articles = await articleStore.replaceAll(parsed.data);
      return Response.json({ count: articles.length });
    }

    const parsed = articleFormSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        {
          message: "文章資料格式錯誤",
          errors: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    const article = await articleStore.create(parsed.data);
    return Response.json(article, { status: 201 });
  } catch (error) {
    if (error instanceof ArticleSlugConflictError) {
      return Response.json({ message: error.message }, { status: 409 });
    }
    console.error("POST /api/articles failed:", error);
    return Response.json(
      {
        message: error instanceof Error ? error.message : "建立文章失敗",
      },
      { status: 500 },
    );
  }
}
