import { FileText, LayoutDashboard, PlusCircle, ExternalLink } from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";

export function AppLayout() {
  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><span>Travel Audio Guide</span><small>CONTENT STUDIO</small></div>
      <nav>
        <NavLink end to="/admin/articles"><LayoutDashboard size={18}/>文章管理</NavLink>
        <NavLink to="/admin/articles/new"><PlusCircle size={18}/>新增文章</NavLink>
        <NavLink to="/articles"><FileText size={18}/>公開文章</NavLink>
      </nav>
    </aside>
    <main className="main-content"><Outlet /></main>
  </div>;
}
