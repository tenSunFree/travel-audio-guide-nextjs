import {
  ArticleSlugConflictError,
  articleStore,
} from "@/shared/api/article.store.server";
import { articleFormSchema } from "@/shared/api/article.schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ articleId: string }>;
};

export async function GET(
  _request: Request,
  context: RouteContext,
): Promise<Response> {
  try {
    const { articleId } = await context.params;
    const article = await articleStore.getById(articleId);
    if (!article) {
      return Response.json({ message: "找不到文章" }, { status: 404 });
    }
    return Response.json(article, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("GET /api/articles/[articleId] failed:", error);
    return Response.json({ message: "讀取文章失敗" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  try {
    const { articleId } = await context.params;
    const body: unknown = await request.json();
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

    const article = await articleStore.update(articleId, parsed.data);
    if (!article) {
      return Response.json({ message: "找不到文章" }, { status: 404 });
    }
    return Response.json(article);
  } catch (error) {
    if (error instanceof ArticleSlugConflictError) {
      return Response.json({ message: error.message }, { status: 409 });
    }
    console.error("PUT /api/articles/[articleId] failed:", error);
    return Response.json({ message: "更新文章失敗" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  context: RouteContext,
): Promise<Response> {
  try {
    const { articleId } = await context.params;
    const removed = await articleStore.remove(articleId);
    if (!removed) {
      return Response.json({ message: "找不到文章" }, { status: 404 });
    }
    return new Response(null, { status: 204 });
  } catch (error) {
    console.error("DELETE /api/articles/[articleId] failed:", error);
    return Response.json({ message: "刪除文章失敗" }, { status: 500 });
  }
}
