import { ArticlePreviewPage } from "@/features/article-preview/ui/article-preview-page";

export default async function Page({
  params,
}: {
  params: Promise<{ articleId: string }>;
}) {
  const { articleId } = await params;
  return <ArticlePreviewPage articleId={articleId} />;
}
