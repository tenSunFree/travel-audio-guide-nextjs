"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { publishedArticleListQuery } from "@/shared/api/article.queries";
import { formatDate } from "@/shared/lib/format-date";

export function PublicArticleListPage() {
  const { data: articles = [], isLoading } = useQuery(publishedArticleListQuery());

  useEffect(() => { document.title = "The Desk Journal"; }, []);

  if (isLoading) return <main className="public-page public-index"><p>載入中…</p></main>;

  return <main className="public-page public-index"><header><Link href="/admin/articles">CMS 後台</Link><p className="publication">THE DESK JOURNAL</p><h1>Ideas, notes and field reports.</h1><p>由本地 React CMS 發布的文章。</p></header><section className="public-list">{articles.map((article) => <Link className="public-list-item" key={article.id} href={`/articles/${article.slug}`}><div><small>{formatDate(article.publishedAt)} · {article.author}</small><h2>{article.title}</h2><p>{article.excerpt}</p><div className="tag-row">{article.tags.map((tag) => <span className="tag" key={tag}>{tag}</span>)}</div></div><span>閱讀文章 →</span></Link>)}{articles.length === 0 && <div className="empty-state"><h2>尚無公開文章</h2><Link href="/admin/articles">前往 CMS 建立文章</Link></div>}</section></main>;
}
