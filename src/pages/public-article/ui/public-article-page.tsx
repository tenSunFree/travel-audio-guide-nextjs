import { Link, useLoaderData } from "react-router-dom";
import type { Article } from "@/shared/api/article.schema";
import { formatDate } from "@/shared/lib/format-date";
import { renderMarkdown } from "@/shared/lib/markdown";

export function PublicArticlePage() {
  const article = useLoaderData() as Article;
  document.title = article.seoTitle || article.title;
  return (
    <main className="public-page">
      <article className="public-article">
        <Link className="back-link" to="/articles">
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
