"use client";
import { ExternalLink, Pencil, Plus, Search, Trash2 } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { productKeys, productListQuery } from "@/shared/api/product.queries";
import { productRepository } from "@/shared/api/product.repository";
import { formatDate } from "@/shared/lib/format-date";
import { PageHeader } from "@/shared/ui/page-header";
import { StatusBadge } from "@/shared/ui/status-badge";

export function ProductListPage() {
  const queryClient = useQueryClient();
  const { data: products = [] } = useQuery(productListQuery());
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const removeMutation = useMutation({
    mutationFn: productRepository.remove,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: productKeys.all }),
  });
  const filtered = useMemo(() => {
    const keyword = query.trim().toLocaleLowerCase("zh-TW");
    return products.filter(
      (p) =>
        (status === "all" || p.status === status) &&
        (!keyword ||
          [p.name, p.slug, p.category, p.description]
            .join(" ")
            .toLocaleLowerCase("zh-TW")
            .includes(keyword)),
    );
  }, [products, query, status]);
  return (
    <section>
      <PageHeader
        title="商品管理"
        description={`共 ${products.length} 項商品；新增或發布後會顯示於旅遊小物前台。`}
        actions={
          <>
            <Link className="button" target="_blank" href="/travel-items">
              <ExternalLink size={16} />
              前台頁面
            </Link>
            <Link className="button primary" href="/admin/products/new">
              <Plus size={16} />
              新增商品
            </Link>
          </>
        }
      />
      <div className="toolbar card">
        <label className="search-box">
          <Search size={17} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜尋商品名稱、分類或 slug"
          />
        </label>
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="all">全部狀態</option>
          <option value="published">已發布</option>
          <option value="draft">草稿</option>
        </select>
        <span className="result-count">顯示 {filtered.length} 項</span>
      </div>
      <div className="card table-card">
        <table>
          <thead>
            <tr>
              <th>商品</th>
              <th>分類</th>
              <th>價格</th>
              <th>狀態</th>
              <th>更新時間</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id}>
                <td>
                  <strong>{p.name}</strong>
                  <small>/{p.slug}</small>
                  <p>{p.description || "尚未填寫商品說明"}</p>
                </td>
                <td>
                  {p.category}
                  {p.featured && (
                    <div className="tag-row">
                      <span className="tag">熱門優先</span>
                    </div>
                  )}
                </td>
                <td>
                  NT${p.minPrice} ～ NT${p.maxPrice}
                </td>
                <td>
                  <StatusBadge status={p.status} />
                </td>
                <td>{formatDate(p.updatedAt)}</td>
                <td>
                  <div className="actions-cell">
                    <Link title="編輯" href={`/admin/products/${p.id}/edit`}>
                      <Pencil size={17} />
                    </Link>
                    <button
                      className="danger"
                      title="刪除"
                      onClick={() =>
                        confirm(`確定刪除「${p.name}」？`) &&
                        removeMutation.mutate(p.id)
                      }
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6}>
                  <div className="empty-table">找不到符合條件的商品。</div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
