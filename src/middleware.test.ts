/**
 * @jest-environment node
 */
// next/server's NextRequest/NextResponse rely on the global Fetch API
// (Request/Response), which Node.js provides natively but jsdom (this
// project's default jest environment) does not. Pin this file to node.

import { NextRequest } from "next/server";
import { middleware } from "./middleware";

const ADMIN_TOKEN = "test-admin-token";

function makeRequest(
  path: string,
  options: { method?: string; cookie?: string } = {},
): NextRequest {
  const headers: Record<string, string> = {};
  if (options.cookie) headers.cookie = options.cookie;
  return new NextRequest(new URL(path, "http://localhost:30401"), {
    method: options.method ?? "GET",
    headers,
  });
}

// NextResponse.next() sets an internal "x-middleware-next: 1" response
// header as its signal to continue the request chain. There is no public
// NextResponse API to distinguish "pass through" from other response types,
// so tests below assert on this header for the pass-through cases and on
// status/location/body for redirect and 401 cases.
describe("middleware", () => {
  const originalToken = process.env.ADMIN_TOKEN;

  beforeEach(() => {
    process.env.ADMIN_TOKEN = ADMIN_TOKEN;
  });

  afterAll(() => {
    if (originalToken === undefined) {
      delete process.env.ADMIN_TOKEN;
    } else {
      process.env.ADMIN_TOKEN = originalToken;
    }
  });

  it("passes through the login page and login API without a cookie", () => {
    const pageResponse = middleware(makeRequest("/admin/login"));
    const apiResponse = middleware(
      makeRequest("/api/admin/login", { method: "POST" }),
    );

    expect(pageResponse.headers.get("x-middleware-next")).toBe("1");
    expect(apiResponse.headers.get("x-middleware-next")).toBe("1");
  });

  it("redirects an unauthenticated admin page request to /admin/login with a next param", () => {
    const response = middleware(makeRequest("/admin/articles"));

    expect(response.status).toBe(307);
    const location = response.headers.get("location") ?? "";
    expect(location).toContain("/admin/login");
    expect(location).toContain(`next=${encodeURIComponent("/admin/articles")}`);
  });

  it("lets an authenticated admin page request through", () => {
    const response = middleware(
      makeRequest("/admin/articles", {
        cookie: `admin_session=${ADMIN_TOKEN}`,
      }),
    );

    expect(response.headers.get("x-middleware-next")).toBe("1");
  });

  it("returns 401 JSON for an unauthenticated mutating articles API request", async () => {
    const response = middleware(
      makeRequest("/api/articles", { method: "POST" }),
    );

    expect(response.status).toBe(401);
    const body = (await response.json()) as { message: string };
    expect(body.message).toBe("未授權的操作");
  });

  it("returns 401 for an unauthenticated full article list (draft-inclusive) request", async () => {
    const response = middleware(makeRequest("/api/articles"));

    expect(response.status).toBe(401);
  });

  it("allows an unauthenticated published-article list request through", () => {
    const response = middleware(makeRequest("/api/articles?status=published"));

    expect(response.headers.get("x-middleware-next")).toBe("1");
  });

  it("allows an unauthenticated single-article-by-slug request through", () => {
    const response = middleware(
      makeRequest("/api/articles?slug=welcome-to-the-desk-cms"),
    );

    expect(response.headers.get("x-middleware-next")).toBe("1");
  });

  it("also protects mutating product API requests", () => {
    const unauth = middleware(makeRequest("/api/products", { method: "POST" }));
    const auth = middleware(
      makeRequest("/api/products", {
        method: "POST",
        cookie: `admin_session=${ADMIN_TOKEN}`,
      }),
    );

    expect(unauth.status).toBe(401);
    expect(auth.headers.get("x-middleware-next")).toBe("1");
  });

  it("rejects a cookie that does not match ADMIN_TOKEN", () => {
    const response = middleware(
      makeRequest("/api/articles", {
        method: "POST",
        cookie: "admin_session=wrong-token",
      }),
    );

    expect(response.status).toBe(401);
  });

  it("does not touch unrelated routes", () => {
    const response = middleware(makeRequest("/articles"));

    expect(response.headers.get("x-middleware-next")).toBe("1");
  });
});
