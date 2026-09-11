import { formatDate } from "./format-date";

describe("formatDate", () => {
  it.each([null, ""])("returns placeholder for empty value: %s", (value) => {
    expect(formatDate(value)).toBe("—");
  });

  it("returns placeholder for invalid date", () => {
    expect(formatDate("not-a-date")).toBe("—");
  });

  it("formats a valid ISO datetime", () => {
    // Mid-year, midday UTC on purpose: formatDate() uses
    // Intl.DateTimeFormat("zh-TW", ...) without an explicit timeZone, so it
    // renders in the machine's local timezone. A UTC midnight timestamp near
    // a year boundary (e.g. 2026-01-01T00:00:00.000Z) rolls back to
    // 2025-12-31 on any negative-offset timezone, making this assertion
    // fail depending on where the test runs. Midday on a date far from any
    // year boundary keeps the same calendar year across every UTC offset.
    const result = formatDate("2026-06-15T12:00:00.000Z");

    expect(result).not.toBe("—");
    expect(result).toContain("2026");
  });
});
