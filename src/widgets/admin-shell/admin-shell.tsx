"use client";

import type { ReactNode } from "react";
import {
  FileText,
  LayoutDashboard,
  Package,
  PlusCircle,
  Store,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

function NavItem({
  href,
  exact,
  children,
}: {
  href: string;
  exact?: boolean;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const active = exact ? pathname === href : (pathname ?? "").startsWith(href);
  return (
    <Link href={href} className={active ? "active" : ""}>
      {children}
    </Link>
  );
}

export function AdminShell({ children }: { children: ReactNode }) {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span>Travel Audio Guide</span>
          <small>CONTENT STUDIO</small>
        </div>
        <nav>
          <NavItem exact href="/admin/articles">
            <LayoutDashboard size={18} />
            文章管理
          </NavItem>
          <NavItem exact href="/admin/articles/new">
            <PlusCircle size={18} />
            新增文章
          </NavItem>
          <NavItem exact href="/admin/products">
            <Package size={18} />
            商品管理
          </NavItem>
          <NavItem exact href="/admin/products/new">
            <PlusCircle size={18} />
            新增商品
          </NavItem>
          <NavItem href="/travel-items">
            <Store size={18} />
            旅遊小物前台
          </NavItem>
          <NavItem href="/articles">
            <FileText size={18} />
            公開文章
          </NavItem>
        </nav>
      </aside>
      <main className="main-content">{children}</main>
    </div>
  );
}
