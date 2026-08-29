"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || "登入失敗");
      }
      router.push(searchParams.get("next") || "/admin/articles");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "登入失敗");
    } finally {
      setLoading(false);
    }
  }
  return (
    <form
      onSubmit={handleSubmit}
      className="card"
      style={{ maxWidth: 360, margin: "80px auto", padding: 24 }}
    >
      <h1>管理後台登入</h1>
      <input
        type="password"
        placeholder="Admin token"
        value={token}
        onChange={(e) => setToken(e.target.value)}
        autoFocus
      />
      {error && <p style={{ color: "crimson" }}>{error}</p>}
      <button className="button primary" type="submit" disabled={loading}>
        {loading ? "登入中…" : "登入"}
      </button>
    </form>
  );
}

export default function AdminLoginPage() {
  return (
    <main className="public-page">
      <Suspense fallback={null}>
        <AdminLoginForm />
      </Suspense>
    </main>
  );
}
