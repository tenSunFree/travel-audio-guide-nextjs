/**
 * `marked` ships as an ESM-only package (no CJS build), and Next.js's built-in
 * jest transform config only lets you *append* to transformIgnorePatterns,
 * not remove the default node_modules exclusion. That combination makes it
 * impossible to have Jest transform marked's source through next/jest
 * without ejecting the whole Next.js jest preset.
 *
 * Rather than reimplementing a chunk of markdown parsing as a fake (which
 * would just end up testing that fake), we mock `marked.parse` directly as
 * a plain jest.fn() and control its return value per test. That keeps the
 * test's responsibility honest: it verifies that renderMarkdown() actually
 * pipes marked's output through DOMPurify before returning it — not whether
 * marked itself can parse Markdown correctly (that's marked's own test
 * suite's job).
 */
const parseMock = jest.fn();

jest.mock("marked", () => ({
  marked: {
    setOptions: jest.fn(),
    parse: (...args: unknown[]) => parseMock(...args),
  },
}));

import { renderMarkdown } from "./markdown";

describe("renderMarkdown", () => {
  beforeEach(() => {
    parseMock.mockReset();
  });

  it("returns sanitized HTML returned by marked", () => {
    parseMock.mockReturnValue('<h1>Hello</h1><script>alert("xss")</script>');
    const result = renderMarkdown("# Hello");
    expect(parseMock).toHaveBeenCalledWith("# Hello");
    expect(result).toContain("<h1>Hello</h1>");
    expect(result).not.toContain("<script>");
  });

  it("removes inline event handlers", () => {
    parseMock.mockReturnValue('<img src="image.jpg" onerror="alert(1)">');
    const result = renderMarkdown("image");
    expect(result).toContain("<img");
    expect(result).not.toContain("onerror");
  });

  it("keeps safe HTML", () => {
    parseMock.mockReturnValue(
      '<p><strong>Hello</strong> <a href="https://example.com">link</a></p>',
    );
    const result = renderMarkdown("safe markdown");
    expect(result).toContain("<strong>Hello</strong>");
    expect(result).toContain('href="https://example.com"');
  });

  it("passes empty input to marked as an empty string", () => {
    parseMock.mockReturnValue("");
    expect(renderMarkdown("")).toBe("");
    expect(parseMock).toHaveBeenCalledWith("");
  });
});
