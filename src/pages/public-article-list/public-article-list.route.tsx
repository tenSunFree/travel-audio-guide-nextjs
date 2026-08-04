import { queryClient } from "@/app/query-client";
import { publishedArticleListQuery } from "@/shared/api/article.queries";
import { PublicArticleListPage } from "./ui/public-article-list-page";
export async function loader() {
  return queryClient.ensureQueryData(publishedArticleListQuery());
}
export function Component() {
  return <PublicArticleListPage />;
}
