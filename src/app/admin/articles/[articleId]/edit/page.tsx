import { ArticleEditorPage } from "@/features/article-editor/ui/article-editor-page";

export default async function Page({
  params,
}: {
  params: Promise<{ articleId: string }>;
}) {
  const { articleId } = await params;
  return <ArticleEditorPage articleId={articleId} />;
}
