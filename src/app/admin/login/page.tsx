"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const DEFAULT_REDIRECT = "/admin/articles";

/**
 * `next` comes from a query string and is attacker-controllable (anyone can
 * craft a link like `/admin/login?next=javascript:alert(1)`). Only allow a
 * same-origin, absolute-path redirect; anything else falls back to the
 * default destination.
 */
function sanitizeNextPath(value: string | null): string {
  if (!value) return DEFAULT_REDIRECT;
  // Must start with a single "/" (a path), not "//" (protocol-relative URL)
  // or anything containing a scheme like "javascript:" or "https:".
  if (!value.startsWith("/") || value.startsWith("//")) {
    return DEFAULT_REDIRECT;
  }
  try {
    const resolved = new URL(value, "http://localhost");
    if (resolved.origin !== "http://localhost") return DEFAULT_REDIRECT;
    return `${resolved.pathname}${resolved.search}${resolved.hash}`;
  } catch {
    return DEFAULT_REDIRECT;
  }
}

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
      router.push(sanitizeNextPath(searchParams.get("next")));
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
