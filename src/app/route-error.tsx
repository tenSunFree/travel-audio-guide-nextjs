import { isRouteErrorResponse, Link, useRouteError } from "react-router-dom";

export function RouteError() {
  const error = useRouteError();
  const status = isRouteErrorResponse(error) ? error.status : 500;
  const message = isRouteErrorResponse(error)
    ? typeof error.data === "string"
      ? error.data
      : error.statusText
    : error instanceof Error
      ? error.message
      : "發生未知錯誤";
  return (
    <main className="error-page">
      <div className="empty-state card">
        <strong>{status}</strong>
        <h1>頁面載入失敗</h1>
        <p>{message}</p>
        <Link className="button primary" to="/admin/articles">
          回文章管理
        </Link>
      </div>
    </main>
  );
}
