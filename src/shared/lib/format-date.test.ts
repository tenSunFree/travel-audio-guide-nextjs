import { formatDate } from "./format-date";

describe("formatDate", () => {
  it.each([null, ""])("returns placeholder for empty value: %s", (value) => {
    expect(formatDate(value)).toBe("—");
  });

  it("returns placeholder for invalid date", () => {
    expect(formatDate("not-a-date")).toBe("—");
  });

  it("formats a valid ISO datetime", () => {
    const result = formatDate("2026-01-01T00:00:00.000Z");
    expect(result).not.toBe("—");
    expect(result).toContain("2026");
  });
});
