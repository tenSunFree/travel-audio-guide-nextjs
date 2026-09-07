/**
 * @jest-environment node
 */
// Route handlers use the global Fetch API (Request/Response), which jsdom
// (this project's default jest environment) does not provide. Node 18+
// provides it natively, so this file is pinned to the node environment.

const setCookieMock = jest.fn();
const deleteCookieMock = jest.fn();

jest.mock("next/headers", () => ({
  cookies: jest.fn(async () => ({
    set: setCookieMock,
    delete: deleteCookieMock,
  })),
}));

import { DELETE, POST } from "./route";

const ADMIN_TOKEN = "test-admin-token";

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/admin/login", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

describe("POST /api/admin/login", () => {
  const originalToken = process.env.ADMIN_TOKEN;
  const originalNodeEnv = process.env.NODE_ENV;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.ADMIN_TOKEN = ADMIN_TOKEN;
  });

  afterAll(() => {
    if (originalToken === undefined) {
      delete process.env.ADMIN_TOKEN;
    } else {
      process.env.ADMIN_TOKEN = originalToken;
    }
    if (originalNodeEnv !== undefined) {
      // See setNodeEnv() below for why this uses a type-cast instead of
      // Object.defineProperty.
      (process.env as Record<string, string>).NODE_ENV = originalNodeEnv;
    }
  });

  function setNodeEnv(value: string) {
    // NODE_ENV is typed as a read-only literal in this project's global.d.ts,
    // so a plain assignment doesn't type-check. Object.defineProperty is the
    // usual workaround, but it does not reliably propagate to
    // process.env.NODE_ENV on every platform (observed to silently no-op on
    // Windows in this project). A type-cast plus a normal assignment goes
    // through Node's real process.env setter and is portable across
    // platforms.
    (process.env as Record<string, string>).NODE_ENV = value;
  }

  it("returns 500 when ADMIN_TOKEN is not configured on the server", async () => {
    delete process.env.ADMIN_TOKEN;

    const response = await POST(makeRequest({ token: "anything" }));

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      message: "伺服器尚未設定 ADMIN_TOKEN",
    });
    expect(setCookieMock).not.toHaveBeenCalled();
  });

  it("returns 401 for a wrong token", async () => {
    const response = await POST(makeRequest({ token: "wrong-token" }));

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ message: "密碼錯誤" });
    expect(setCookieMock).not.toHaveBeenCalled();
  });

  it("treats a missing token field as an empty string and rejects it", async () => {
    const response = await POST(makeRequest({}));

    expect(response.status).toBe(401);
  });

  it("treats an unparsable JSON body as an empty token and rejects it", async () => {
    const response = await POST(
      new Request("http://localhost/api/admin/login", {
        method: "POST",
        body: "not json",
      }),
    );

    expect(response.status).toBe(401);
  });

  it("sets the admin session cookie and returns 204 for the correct token", async () => {
    const response = await POST(makeRequest({ token: ADMIN_TOKEN }));

    expect(response.status).toBe(204);
    expect(setCookieMock).toHaveBeenCalledWith(
      "admin_session",
      ADMIN_TOKEN,
      expect.objectContaining({
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 8,
      }),
    );
  });

  it("marks the cookie secure only in production", async () => {
    setNodeEnv("production");

    await POST(makeRequest({ token: ADMIN_TOKEN }));

    expect(setCookieMock).toHaveBeenCalledWith(
      "admin_session",
      ADMIN_TOKEN,
      expect.objectContaining({ secure: true }),
    );
  });
});

describe("DELETE /api/admin/login", () => {
  it("clears the admin session cookie and returns 204", async () => {
    const response = await DELETE();

    expect(response.status).toBe(204);
    expect(deleteCookieMock).toHaveBeenCalledWith("admin_session");
  });
});
