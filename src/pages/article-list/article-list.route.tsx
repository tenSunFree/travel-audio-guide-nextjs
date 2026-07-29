import { queryClient } from "@/app/query-client";
import { articleListQuery } from "@/shared/api/article.queries";
import { ArticleListPage } from "./ui/article-list-page";
export async function loader() { return queryClient.ensureQueryData(articleListQuery()); }
export function Component() { return <ArticleListPage/>; }
