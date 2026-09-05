import { cookies } from "next/headers";

export const runtime = "nodejs";

const ADMIN_COOKIE_NAME = "admin_session";

export async function POST(request: Request): Promise<Response> {
  const expected = process.env.ADMIN_TOKEN;
  if (!expected) {
    return Response.json(
      { message: "伺服器尚未設定 ADMIN_TOKEN" },
      { status: 500 },
    );
  }
  const body: unknown = await request.json().catch(() => null);
  const token =
    body && typeof body === "object" && "token" in body
      ? String((body as { token: unknown }).token)
      : "";
  if (token !== expected) {
    return Response.json({ message: "密碼錯誤" }, { status: 401 });
  }
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE_NAME, expected, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8, // 8 hours
  });
  return new Response(null, { status: 204 });
}

export async function DELETE(): Promise<Response> {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE_NAME);
  return new Response(null, { status: 204 });
}
