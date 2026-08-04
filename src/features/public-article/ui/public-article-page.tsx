"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { notFound } from "next/navigation";
import { articleBySlugQuery } from "@/shared/api/article.queries";
import { formatDate } from "@/shared/lib/format-date";
import { renderMarkdown } from "@/shared/lib/markdown";

export function PublicArticlePage({ slug }: { slug: string }) {
  const { data: article, isLoading } = useQuery(articleBySlugQuery(slug));

  useEffect(() => {
    if (!isLoading && article === null) notFound();
  }, [isLoading, article]);

  useEffect(() => {
    if (!article) return;
    document.title = article.seoTitle || article.title;

    // Next.js `generateMetadata()` runs on the server and cannot access localStorage.
    // As a temporary Phase 1 workaround we set the description via DOM so social previews are updated (SSR preview remains the source of truth).
    // In Phase 2, when a Go API is available, remove this block and use `generateMetadata()` instead.
    const description = article.seoDescription || article.excerpt;
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", description);
  }, [article]);

  if (isLoading || !article)
    return (
      <main className="public-page">
        <p>載入中…</p>
      </main>
    );

  return (
    <main className="public-page">
      <article className="public-article">
        <Link className="back-link" href="/articles">
          ← 所有文章
        </Link>
        <p className="publication">THE DESK JOURNAL</p>
        <h1>{article.title}</h1>
        <p className="lead">{article.excerpt}</p>
        <div className="article-meta">
          <span>作者 {article.author}</span>
          <span>發布於 {formatDate(article.publishedAt)}</span>
        </div>
        <div className="tag-row">
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
    </main>
  );
}
