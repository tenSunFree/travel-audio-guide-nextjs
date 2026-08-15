import { productFormSchema } from "@/shared/api/product.schema";
import {
  ProductSlugConflictError,
  productStore,
} from "@/shared/api/product.store.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ productId: string }> };

export async function GET(
  _request: Request,
  context: RouteContext,
): Promise<Response> {
  try {
    const { productId } = await context.params;
    const product = await productStore.getById(productId);
    if (!product) {
      return Response.json({ message: "找不到商品" }, { status: 404 });
    }
    return Response.json(product, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("GET /api/products/[productId] failed:", error);
    return Response.json({ message: "讀取商品失敗" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  try {
    const { productId } = await context.params;
    const body: unknown = await request.json();
    const parsed = productFormSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { message: "商品資料格式錯誤", errors: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const product = await productStore.update(productId, parsed.data);
    if (!product) {
      return Response.json({ message: "找不到商品" }, { status: 404 });
    }
    return Response.json(product);
  } catch (error) {
    console.error("PUT /api/products/[productId] failed:", error);
    if (error instanceof ProductSlugConflictError) {
      return Response.json({ message: error.message }, { status: 409 });
    }
    return Response.json({ message: "更新商品失敗" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  context: RouteContext,
): Promise<Response> {
  try {
    const { productId } = await context.params;
    const removed = await productStore.remove(productId);
    if (!removed) {
      return Response.json({ message: "找不到商品" }, { status: 404 });
    }
    return new Response(null, { status: 204 });
  } catch (error) {
    console.error("DELETE /api/products/[productId] failed:", error);
    return Response.json({ message: "刪除商品失敗" }, { status: 500 });
  }
}
