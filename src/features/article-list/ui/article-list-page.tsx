"use client";

import { useMemo, useRef, useState } from "react";
import { Copy, Download, ExternalLink, FileUp, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { articleKeys, articleListQuery } from "@/shared/api/article.queries";
import { articleRepository } from "@/shared/api/article.repository";
import { formatDate } from "@/shared/lib/format-date";
import { PageHeader } from "@/shared/ui/page-header";
import { StatusBadge } from "@/shared/ui/status-badge";

export function ArticleListPage() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);
  const { data: articles = [] } = useQuery(articleListQuery());
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [notice, setNotice] = useState("");

  const refresh = () => queryClient.invalidateQueries({ queryKey: articleKeys.all });
  const removeMutation = useMutation({ mutationFn: articleRepository.remove, onSuccess: refresh });
  const duplicateMutation = useMutation({
    mutationFn: articleRepository.duplicate,
    onSuccess: async (article) => { await refresh(); router.push(`/admin/articles/${article.id}/edit`); }
  });

  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("zh-TW");
    return articles.filter((article) => {
      const matchesStatus = status === "all" || article.status === status;
      const haystack = [article.title, article.author, article.slug, article.excerpt, ...article.tags].join(" ").toLocaleLowerCase("zh-TW");
      return matchesStatus && (!normalized || haystack.includes(normalized));
    });
  }, [articles, query, status]);

  function exportData() {
    const blob = new Blob([articleRepository.exportJson()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url; link.download = `cms-articles-${new Date().toISOString().slice(0, 10)}.json`; link.click();
    URL.revokeObjectURL(url);
  }

  async function importData(file?: File) {
    if (!file) return;
    try {
      const count = articleRepository.importJson(await file.text());
      await refresh(); setNotice(`已匯入 ${count} 篇文章。`);
    } catch (error) { setNotice(error instanceof Error ? error.message : "匯入失敗"); }
    finally { if (fileInput.current) fileInput.current.value = ""; }
  }

  return <section>
    <PageHeader title="文章管理" description={`共 ${articles.length} 篇文章；資料儲存在目前瀏覽器。`} actions={<>
      <button className="button" onClick={exportData}><Download size={16}/>匯出</button>
      <button className="button" onClick={() => fileInput.current?.click()}><FileUp size={16}/>匯入</button>
      <input hidden ref={fileInput} type="file" accept="application/json" onChange={(e) => void importData(e.target.files?.[0])}/>
      <Link className="button primary" href="/admin/articles/new"><Plus size={16}/>新增文章</Link>
    </>}/>

    {notice && <div className="alert info">{notice}<button onClick={() => setNotice("")}>×</button></div>}

    <div className="toolbar card">
      <label className="search-box"><Search size={17}/><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="搜尋標題、作者、slug 或標籤"/></label>
      <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="文章狀態"><option value="all">全部狀態</option><option value="published">已發布</option><option value="draft">草稿</option></select>
      <span className="result-count">顯示 {filtered.length} 篇</span>
    </div>

    <div className="card table-card">
      <table><thead><tr><th>文章</th><th>作者／標籤</th><th>狀態</th><th>更新時間</th><th>操作</th></tr></thead>
      <tbody>{filtered.map((article) => <tr key={article.id}>
        <td><strong>{article.title}</strong><small>/{article.slug}</small><p>{article.excerpt || "尚未填寫摘要"}</p></td>
        <td><span>{article.author}</span><div className="tag-row">{article.tags.map((tag) => <span className="tag" key={tag}>{tag}</span>)}</div></td>
        <td><StatusBadge status={article.status}/></td>
        <td>{formatDate(article.updatedAt)}</td>
        <td><div className="actions-cell">
          <Link title="編輯" href={`/admin/articles/${article.id}/edit`}><Pencil size={17}/></Link>
          <button title="建立副本" onClick={() => duplicateMutation.mutate(article.id)}><Copy size={17}/></button>
          {article.status === "published" && <Link title="公開頁" target="_blank" href={`/articles/${article.slug}`}><ExternalLink size={17}/></Link>}
          <button className="danger" title="刪除" onClick={() => confirm(`確定刪除「${article.title}」？`) && removeMutation.mutate(article.id)}><Trash2 size={17}/></button>
        </div></td>
      </tr>)}
      {filtered.length === 0 && <tr><td colSpan={5}><div className="empty-table">找不到符合條件的文章。</div></td></tr>}</tbody></table>
    </div>
  </section>;
}
