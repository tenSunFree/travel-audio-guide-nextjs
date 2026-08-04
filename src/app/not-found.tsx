import Link from "next/link";

export default function NotFound() {
  return (
    <main className="error-page">
      <div className="empty-state card">
        <strong>404</strong>
        <h1>頁面載入失敗</h1>
        <p>找不到您要瀏覽的頁面。</p>
        <Link className="button primary" href="/admin/articles">
          回文章管理
        </Link>
      </div>
    </main>
  );
}
