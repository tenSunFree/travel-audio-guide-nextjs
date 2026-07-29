import type { LoaderFunctionArgs } from "react-router-dom";
import { queryClient } from "@/app/query-client";
import { articleBySlugQuery } from "@/shared/api/article.queries";
import { PublicArticlePage } from "./ui/public-article-page";
export async function loader({ params }: LoaderFunctionArgs) {
  if (!params.slug) throw new Response("缺少網址代稱", { status: 400 });
  const article = await queryClient.ensureQueryData(articleBySlugQuery(params.slug));
  if (!article) throw new Response("文章不存在或尚未發布", { status: 404 });
  return article;
}
export function Component() { return <PublicArticlePage/>; }
