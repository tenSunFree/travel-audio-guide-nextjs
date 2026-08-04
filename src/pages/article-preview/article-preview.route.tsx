import type { LoaderFunctionArgs } from "react-router-dom";
import { queryClient } from "@/app/query-client";
import { articleDetailQuery } from "@/shared/api/article.queries";
import { ArticlePreviewPage } from "./ui/article-preview-page";
export async function loader({ params }: LoaderFunctionArgs) {
  if (!params.articleId) throw new Response("缺少文章 ID", { status: 400 });
  const article = await queryClient.ensureQueryData(
    articleDetailQuery(params.articleId),
  );
  if (!article) throw new Response("找不到文章", { status: 404 });
  return article;
}
export function Component() {
  return <ArticlePreviewPage />;
}
