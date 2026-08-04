"use client";
import { useQuery } from "@tanstack/react-query";
import { Heart, Menu, Search, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { publishedProductListQuery } from "@/shared/api/product.queries";

export function TravelItemsPage() {
  const { data: products = [], isLoading } = useQuery(
    publishedProductListQuery(),
  );
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("全部分類");
  const [sort, setSort] = useState("熱門優先");
  const categories = useMemo(
    () => ["全部分類", ...Array.from(new Set(products.map((p) => p.category)))],
    [products],
  );
  const visible = useMemo(() => {
    const keyword = query.trim().toLocaleLowerCase("zh-TW");
    const result = products.filter(
      (p) =>
        (category === "全部分類" || p.category === category) &&
        (!keyword ||
          [p.name, p.description, p.category]
            .join(" ")
            .toLocaleLowerCase("zh-TW")
            .includes(keyword)),
    );
    return [...result].sort((a, b) =>
      sort === "價格低到高"
        ? a.minPrice - b.minPrice
        : sort === "價格高到低"
          ? b.maxPrice - a.maxPrice
          : Number(b.featured) - Number(a.featured),
    );
  }, [products, query, category, sort]);
  return (
    <main className="storefront">
      <header className="store-header">
        <button className="icon-button" aria-label="開啟選單">
          <Menu />
        </button>
        <Link className="store-logo" href="/travel-items">
          <span>🌿</span>
          <strong>Ligo</strong>
        </Link>
        <nav>
          <Link href="/travel-items">🎁 客製禮贈品</Link>
          <Link href="/articles">▥ 禮贈品知識</Link>
          <Link href="/articles">🤝 成功案例</Link>
          <Link href="/admin/products">✉ 聯繫提案</Link>
        </nav>
        <div className="store-actions">
          <ShoppingCart />
          <b>0</b>
          <Link href="/admin/products">登入</Link>
          <button>繁體中文</button>
          <button>TWD</button>
        </div>
      </header>
      <div className="wave-rule" />
      <section className="store-content">
        <div className="store-breadcrumb">
          <b>客製禮贈品</b>
          <span>/</span>
          <span>旅行小物</span>
        </div>
        <div className="store-toolbar">
          <label>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="搜尋關鍵字"
            />
            <Search size={20} />
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {categories.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            <option>熱門優先</option>
            <option>價格低到高</option>
            <option>價格高到低</option>
          </select>
        </div>
        {isLoading ? (
          <p>載入中…</p>
        ) : (
          <section className="product-grid">
            {visible.map((p) => (
              <article className="product-card" key={p.id}>
                <div className="product-image-wrap">
                  <img src={p.imageUrl} alt={p.name} />
                  <button aria-label="加入收藏">
                    <Heart />
                  </button>
                  <span>{p.category}</span>
                </div>
                <div className="product-card-body">
                  <h2>{p.name}</h2>
                  <p>{p.description}</p>
                  <button className="quote-button">▤ 加入詢價車</button>
                  <strong>
                    NT${p.minPrice} ～ NT${p.maxPrice}
                  </strong>
                </div>
              </article>
            ))}
            {visible.length === 0 && (
              <div className="store-empty">
                <h2>目前沒有符合條件的商品</h2>
                <Link href="/admin/products/new">前往後台新增商品</Link>
              </div>
            )}
          </section>
        )}
      </section>
    </main>
  );
}
