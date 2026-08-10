import { productSchema } from "@/shared/api/product.schema";
import { productStore } from "@/shared/api/product.store.server";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<Response> {
  try {
    const body: unknown = await request.json();
    const parsed = productSchema.array().safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { message: "匯入的商品格式錯誤", errors: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const products = await productStore.replaceAll(parsed.data);
    return Response.json({ message: "商品匯入成功", count: products.length });
  } catch (error) {
    console.error("POST /api/products/import failed:", error);
    return Response.json(
      { message: error instanceof Error ? error.message : "商品匯入失敗" },
      { status: 500 },
    );
  }
}
