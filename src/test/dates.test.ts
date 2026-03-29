import { describe, it, expect } from "vitest";
import { toDateStr, formatDateLabel, formatDateLabelRelative, getNext10Days } from "@/lib/dates";

describe("toDateStr", () => {
  it("formats a date as YYYY-MM-DD", () => {
    expect(toDateStr(new Date(2026, 2, 28))).toBe("2026-03-28");
  });

  it("zero-pads month and day", () => {
    expect(toDateStr(new Date(2026, 0, 5))).toBe("2026-01-05");
  });
});

describe("formatDateLabel", () => {
  it("returns a short readable date", () => {
    const result = formatDateLabel("2026-03-28");
    expect(result).toMatch(/Mar/);
    expect(result).toMatch(/28/);
  });
});

describe("formatDateLabelRelative", () => {
  it("returns Today for today's date", () => {
    const today = toDateStr(new Date());
    const { primary } = formatDateLabelRelative(today);
    expect(primary).toBe("Today");
  });

  it("returns Tomorrow for tomorrow's date", () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    const { primary } = formatDateLabelRelative(toDateStr(d));
    expect(primary).toBe("Tomorrow");
  });

  it("returns weekday name for other dates", () => {
    const d = new Date();
    d.setDate(d.getDate() + 5);
    const dateStr = toDateStr(d);
    const expected = d.toLocaleDateString("en-US", { weekday: "long" });
    const { primary } = formatDateLabelRelative(dateStr);
    expect(primary).toBe(expected);
  });

  it("returns short month/day as secondary", () => {
    const { secondary } = formatDateLabelRelative("2026-03-28");
    expect(secondary).toMatch(/Mar/);
    expect(secondary).toMatch(/28/);
  });
});

describe("getNext10Days", () => {
  it("returns exactly 10 days", () => {
    expect(getNext10Days()).toHaveLength(10);
  });

  it("starts with today", () => {
    const today = toDateStr(new Date());
    expect(getNext10Days()[0]).toBe(today);
  });

  it("returns consecutive days", () => {
    const days = getNext10Days();
    for (let i = 1; i < days.length; i++) {
      const prev = new Date(days[i - 1]);
      const curr = new Date(days[i]);
      const diffMs = curr.getTime() - prev.getTime();
      expect(diffMs).toBe(24 * 60 * 60 * 1000);
    }
  });
});
