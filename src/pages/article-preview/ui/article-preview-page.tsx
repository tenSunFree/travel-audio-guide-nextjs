import { ExternalLink } from "lucide-react";
import { Link, useLoaderData } from "react-router-dom";
import type { Article } from "@/shared/api/article.schema";
import { formatDate } from "@/shared/lib/format-date";
import { renderMarkdown } from "@/shared/lib/markdown";
import { PageHeader } from "@/shared/ui/page-header";
import { StatusBadge } from "@/shared/ui/status-badge";

export function ArticlePreviewPage() {
  const article = useLoaderData() as Article;
  return (
    <section>
      <PageHeader
        title="文章預覽"
        description="此頁可預覽草稿，不代表文章已公開。"
        actions={
          <>
            <Link className="button" to={`/admin/articles/${article.id}/edit`}>
              返回編輯
            </Link>
            {article.status === "published" && (
              <Link
                className="button primary"
                target="_blank"
                to={`/articles/${article.slug}`}
              >
                <ExternalLink size={16} />
                公開頁
              </Link>
            )}
          </>
        }
      />
      <article className="public-article card preview-document">
        <StatusBadge status={article.status} />
        <h1>{article.title}</h1>
        <p className="lead">{article.excerpt}</p>
        <div className="article-meta">
          <span>{article.author}</span>
          <span>更新於 {formatDate(article.updatedAt)}</span>
          {article.tags.map((tag) => (
            <span className="tag" key={tag}>
              {tag}
            </span>
          ))}
        </div>
        <div
          className="article-content"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(article.content) }}
        />
      </article>
    </section>
  );
}
