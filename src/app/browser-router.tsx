import { createBrowserRouter, Navigate } from "react-router-dom";
import { AppLayout } from "@/app/layout";
import { RouteError } from "@/app/route-error";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    errorElement: <RouteError />,
    children: [
      { index: true, element: <Navigate to="/admin/articles" replace /> },
      {
        path: "admin/articles",
        lazy: () => import("@/pages/article-list/article-list.route"),
      },
      {
        path: "admin/articles/new",
        lazy: () => import("@/pages/article-editor/article-editor.route"),
      },
      {
        path: "admin/articles/:articleId/edit",
        lazy: () => import("@/pages/article-editor/article-editor.route"),
      },
      {
        path: "admin/articles/:articleId/preview",
        lazy: () => import("@/pages/article-preview/article-preview.route"),
      },
    ],
  },
  {
    path: "/articles",
    lazy: () => import("@/pages/public-article-list/public-article-list.route"),
    errorElement: <RouteError />,
  },
  {
    path: "/articles/:slug",
    lazy: () => import("@/pages/public-article/public-article.route"),
    errorElement: <RouteError />,
  },
  { path: "*", element: <Navigate to="/admin/articles" replace /> },
]);
