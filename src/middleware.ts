// middleware.ts
import { NextRequest, NextResponse } from "next/server";

const ADMIN_COOKIE_NAME = "admin_session";
const PUBLIC_PATHS = ["/admin/login", "/api/admin/login"];

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const isAdminPage = pathname.startsWith("/admin");
  const isArticlesApi = pathname.startsWith("/api/articles");
  const isProductsApi = pathname.startsWith("/api/products");

  if (!isAdminPage && !isArticlesApi && !isProductsApi) {
    return NextResponse.next();
  }

  // 公開讀取路徑放行：已發布清單 / 依 slug 查單篇
  if ((isArticlesApi || isProductsApi) && request.method === "GET") {
    const status = searchParams.get("status");
    const slug = searchParams.get("slug");
    if (status === "published" || slug) {
      return NextResponse.next();
    }
  }

  const expected = process.env.ADMIN_TOKEN;
  const session = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
  const authorized = Boolean(expected) && session === expected;

  if (authorized) {
    return NextResponse.next();
  }

  if (isAdminPage) {
    const loginUrl = new URL("/admin/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.json({ message: "未授權的操作" }, { status: 401 });
}

export const config = {
  matcher: ["/admin/:path*", "/api/articles/:path*", "/api/products/:path*"],
};
