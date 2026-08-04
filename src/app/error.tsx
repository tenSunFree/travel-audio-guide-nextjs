"use client";

import Link from "next/link";

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  return (
    <main className="error-page">
      <div className="empty-state card">
        <strong>500</strong>
        <h1>頁面載入失敗</h1>
        <p>{error.message || "發生未知錯誤"}</p>
        <Link className="button primary" href="/admin/articles">
          回文章管理
        </Link>
      </div>
    </main>
  );
}
