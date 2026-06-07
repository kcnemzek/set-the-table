import { describe, it, expect } from "vitest";
import {
  toDateStr,
  formatDateLabel,
  formatDateLabelRelative,
  getNext10Days,
  getMenuAnchorSunday,
  getMenuDays,
  formatWeekRangeLabel,
  pruneMenuHistory,
} from "@/lib/dates";

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

// ─── Menu week navigation ─────────────────────────────────────────────────────
// Reference dates (June 2026):  Jun 7 = Sunday, Jun 8 = Monday, … Jun 13 = Saturday, Jun 14 = Sunday

describe("getMenuAnchorSunday", () => {
  it("returns same day for Sunday", () => {
    const sun = new Date(2026, 5, 7); // Sun Jun 7
    expect(toDateStr(getMenuAnchorSunday(sun))).toBe("2026-06-07");
  });

  it("returns previous Sunday for Monday", () => {
    const mon = new Date(2026, 5, 8); // Mon Jun 8
    expect(toDateStr(getMenuAnchorSunday(mon))).toBe("2026-06-07");
  });

  it("returns previous Sunday for Wednesday", () => {
    const wed = new Date(2026, 5, 10); // Wed Jun 10
    expect(toDateStr(getMenuAnchorSunday(wed))).toBe("2026-06-07");
  });

  it("returns next Sunday for Thursday", () => {
    const thu = new Date(2026, 5, 11); // Thu Jun 11
    expect(toDateStr(getMenuAnchorSunday(thu))).toBe("2026-06-14");
  });

  it("returns next Sunday for Friday", () => {
    const fri = new Date(2026, 5, 12); // Fri Jun 12
    expect(toDateStr(getMenuAnchorSunday(fri))).toBe("2026-06-14");
  });

  it("returns next Sunday for Saturday", () => {
    const sat = new Date(2026, 5, 13); // Sat Jun 13
    expect(toDateStr(getMenuAnchorSunday(sat))).toBe("2026-06-14");
  });
});

describe("getMenuDays — offset 0 (today view)", () => {
  it("shows 7-day current week starting Sunday when today is Sunday", () => {
    const days = getMenuDays(0, new Date(2026, 5, 7)); // Sun Jun 7
    expect(days).toHaveLength(7);
    expect(days[0]).toBe("2026-06-07");
    expect(days[6]).toBe("2026-06-13");
  });

  it("shows 7-day current week (with past days) when today is Monday", () => {
    const days = getMenuDays(0, new Date(2026, 5, 8)); // Mon Jun 8
    expect(days).toHaveLength(7);
    expect(days[0]).toBe("2026-06-07"); // Sunday (yesterday) is visible
    expect(days[6]).toBe("2026-06-13");
  });

  it("shows 7-day current week when today is Wednesday", () => {
    const days = getMenuDays(0, new Date(2026, 5, 10)); // Wed Jun 10
    expect(days).toHaveLength(7);
    expect(days[0]).toBe("2026-06-07");
    expect(days[6]).toBe("2026-06-13");
  });

  it("shows today through end of next week when today is Thursday (10 days)", () => {
    const days = getMenuDays(0, new Date(2026, 5, 11)); // Thu Jun 11
    expect(days[0]).toBe("2026-06-11"); // starts on today
    expect(days[days.length - 1]).toBe("2026-06-20"); // ends on next week's Sat
    expect(days).toHaveLength(10);
  });

  it("shows today through end of next week when today is Friday (9 days)", () => {
    const days = getMenuDays(0, new Date(2026, 5, 12)); // Fri Jun 12
    expect(days[0]).toBe("2026-06-12");
    expect(days[days.length - 1]).toBe("2026-06-20");
    expect(days).toHaveLength(9);
  });

  it("shows today through end of next week when today is Saturday (8 days)", () => {
    const days = getMenuDays(0, new Date(2026, 5, 13)); // Sat Jun 13
    expect(days[0]).toBe("2026-06-13");
    expect(days[days.length - 1]).toBe("2026-06-20");
    expect(days).toHaveLength(8);
  });
});

describe("getMenuDays — non-zero offsets", () => {
  it("offset -1 returns the previous 7-day Sun–Sat week", () => {
    const days = getMenuDays(-1, new Date(2026, 5, 8)); // Mon Jun 8, anchor = Jun 7
    expect(days).toHaveLength(7);
    expect(days[0]).toBe("2026-05-31"); // prior Sunday
    expect(days[6]).toBe("2026-06-06"); // prior Saturday
  });

  it("offset +1 returns the next 7-day Sun–Sat week", () => {
    const days = getMenuDays(1, new Date(2026, 5, 8)); // Mon Jun 8, anchor = Jun 7
    expect(days).toHaveLength(7);
    expect(days[0]).toBe("2026-06-14");
    expect(days[6]).toBe("2026-06-20");
  });

  it("offset -2 returns two weeks prior", () => {
    const days = getMenuDays(-2, new Date(2026, 5, 8));
    expect(days).toHaveLength(7);
    expect(days[0]).toBe("2026-05-24");
    expect(days[6]).toBe("2026-05-30");
  });

  it("returned days are always consecutive", () => {
    const days = getMenuDays(-3, new Date(2026, 5, 10));
    for (let i = 1; i < days.length; i++) {
      const prev = new Date(days[i - 1]);
      const curr = new Date(days[i]);
      expect(curr.getTime() - prev.getTime()).toBe(24 * 60 * 60 * 1000);
    }
  });
});

describe("formatWeekRangeLabel", () => {
  it("same-month range omits repeated month", () => {
    const days = ["2026-06-07", "2026-06-08", "2026-06-09", "2026-06-10", "2026-06-11", "2026-06-12", "2026-06-13"];
    expect(formatWeekRangeLabel(days)).toBe("Jun 7–13");
  });

  it("cross-month range shows both months", () => {
    const days = ["2026-05-31", "2026-06-01", "2026-06-02", "2026-06-03", "2026-06-04", "2026-06-05", "2026-06-06"];
    expect(formatWeekRangeLabel(days)).toBe("May 31–Jun 6");
  });

  it("returns empty string for empty array", () => {
    expect(formatWeekRangeLabel([])).toBe("");
  });
});

describe("pruneMenuHistory", () => {
  it("removes entries older than the cutoff", () => {
    const old = new Date();
    old.setDate(old.getDate() - 200);
    const oldKey = toDateStr(old);
    const menu = { [oldKey]: [{ id: "1" }] };
    const result = pruneMenuHistory(menu);
    expect(result[oldKey]).toBeUndefined();
  });

  it("keeps entries within the cutoff window", () => {
    const recent = new Date();
    recent.setDate(recent.getDate() - 10);
    const recentKey = toDateStr(recent);
    const menu = { [recentKey]: [{ id: "1" }] };
    const result = pruneMenuHistory(menu);
    expect(result[recentKey]).toBeDefined();
  });

  it("keeps today's entries", () => {
    const todayKey = toDateStr(new Date());
    const menu = { [todayKey]: [{ id: "1" }] };
    const result = pruneMenuHistory(menu);
    expect(result[todayKey]).toBeDefined();
  });

  it("respects a custom daysToKeep", () => {
    const fiftyDaysAgo = new Date();
    fiftyDaysAgo.setDate(fiftyDaysAgo.getDate() - 50);
    const key = toDateStr(fiftyDaysAgo);
    const menu = { [key]: [{ id: "1" }] };
    expect(pruneMenuHistory(menu, 30)[key]).toBeUndefined();
    expect(pruneMenuHistory(menu, 60)[key]).toBeDefined();
  });

  it("returns an empty object for an empty menu", () => {
    expect(pruneMenuHistory({})).toEqual({});
  });
});
