"use client";

import { useEffect } from "react";
import { ExternalLink } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { notFound } from "next/navigation";
import { articleDetailQuery } from "@/shared/api/article.queries";
import { formatDate } from "@/shared/lib/format-date";
import { renderMarkdown } from "@/shared/lib/markdown";
import { PageHeader } from "@/shared/ui/page-header";
import { StatusBadge } from "@/shared/ui/status-badge";

export function ArticlePreviewPage({ articleId }: { articleId: string }) {
  const { data: article, isLoading } = useQuery(articleDetailQuery(articleId));

  useEffect(() => {
    if (!isLoading && article === null) notFound();
  }, [isLoading, article]);

  if (isLoading || !article) {
    return (
      <section>
        <PageHeader title="文章預覽" description="載入中…" />
      </section>
    );
  }

  return (
    <section>
      <PageHeader
        title="文章預覽"
        description="此頁可預覽草稿，不代表文章已公開。"
        actions={
          <>
            <Link
              className="button"
              href={`/admin/articles/${article.id}/edit`}
            >
              返回編輯
            </Link>
            {article.status === "published" && (
              <Link
                className="button primary"
                target="_blank"
                href={`/articles/${article.slug}`}
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
