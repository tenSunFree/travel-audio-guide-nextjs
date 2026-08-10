import { productFormSchema } from "@/shared/api/product.schema";
import { productStore } from "@/shared/api/product.store.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const products =
      status === "published"
        ? await productStore.listPublished()
        : await productStore.list();
    return Response.json(products, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("GET /api/products failed:", error);
    return Response.json({ message: "讀取商品失敗" }, { status: 500 });
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    const body: unknown = await request.json();
    const parsed = productFormSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { message: "商品資料格式錯誤", errors: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const product = await productStore.create(parsed.data);
    return Response.json(product, { status: 201 });
  } catch (error) {
    console.error("POST /api/products failed:", error);
    const message = error instanceof Error ? error.message : "新增商品失敗";
    const status = message === "此商品網址代稱已被使用" ? 409 : 500;
    return Response.json({ message }, { status });
  }
}
