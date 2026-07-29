import type { LoaderFunctionArgs } from "react-router-dom";
import { queryClient } from "@/app/query-client";
import { articleDetailQuery } from "@/shared/api/article.queries";
import { ArticleEditorPage } from "./ui/article-editor-page";
export async function loader({ params }: LoaderFunctionArgs) {
  if (!params.articleId) return null;
  const article = await queryClient.ensureQueryData(articleDetailQuery(params.articleId));
  if (!article) throw new Response("找不到文章", { status: 404 });
  return article;
}
export function Component() { return <ArticleEditorPage/>; }
