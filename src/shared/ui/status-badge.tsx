import type { ArticleStatus } from "@/shared/api/article.schema";
export function StatusBadge({ status }: { status: ArticleStatus }) {
  return (
    <span className={`status ${status}`}>
      {status === "published" ? "已發布" : "草稿"}
    </span>
  );
}
