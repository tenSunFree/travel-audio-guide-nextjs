import { ProductEditorPage } from "@/features/product-editor/ui/product-editor-page";
export default async function Page({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = await params;
  return <ProductEditorPage productId={productId} />;
}
