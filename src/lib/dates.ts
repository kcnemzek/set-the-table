/** Returns "YYYY-MM-DD" for a given Date */
export function toDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Returns the 10 upcoming date strings starting from today */
export function getNext10Days(): string[] {
  const days: string[] = [];
  const base = new Date();
  base.setHours(0, 0, 0, 0);
  for (let i = 0; i < 10; i++) {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    days.push(toDateStr(d));
  }
  return days;
}

/**
 * Returns the Sunday that anchors menu week navigation.
 * - Sun–Wed → Sunday of the current week
 * - Thu–Sat → Sunday of next week (so the default view always has ≥3 future days)
 */
export function getMenuAnchorSunday(today: Date = new Date()): Date {
  const d = new Date(today);
  d.setHours(0, 0, 0, 0);
  const dow = d.getDay(); // 0 = Sun … 6 = Sat
  const daysToSunday = dow >= 4 ? 7 - dow : -dow;
  d.setDate(d.getDate() + daysToSunday);
  return d;
}

/**
 * Returns the date strings to display in the menu view.
 *
 * offset = 0  → "today" view:
 *   Sun–Wed: full current Sun–Sat week (7 days, today somewhere inside)
 *   Thu–Sat: today through the end of next Sun–Sat week (8–10 days)
 * offset = ±N → full 7-day Sun–Sat week N weeks from the anchor week
 */
export function getMenuDays(offset: number, today: Date = new Date()): string[] {
  const now = new Date(today);
  now.setHours(0, 0, 0, 0);
  const anchor = getMenuAnchorSunday(now);

  if (offset === 0) {
    const dow = now.getDay();
    if (dow >= 4) {
      // Thu–Sat: from today through the anchor week's Saturday
      const anchorSat = new Date(anchor);
      anchorSat.setDate(anchor.getDate() + 6);
      const days: string[] = [];
      const cur = new Date(now);
      while (cur <= anchorSat) {
        days.push(toDateStr(cur));
        cur.setDate(cur.getDate() + 1);
      }
      return days;
    }
    // Sun–Wed: full current week (anchor IS this week's Sunday)
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(anchor);
      d.setDate(anchor.getDate() + i);
      return toDateStr(d);
    });
  }

  // Non-zero offset: always a full 7-day Sun–Sat week
  const weekStart = new Date(anchor);
  weekStart.setDate(anchor.getDate() + offset * 7);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return toDateStr(d);
  });
}

/** Formats a date-range label for a week view, e.g. "Jun 7–13" or "May 31–Jun 6" */
export function formatWeekRangeLabel(days: string[]): string {
  if (days.length === 0) return "";
  const parse = (s: string) => {
    const [y, m, d] = s.split("-").map(Number);
    return new Date(y, m - 1, d);
  };
  const first = parse(days[0]);
  const last = parse(days[days.length - 1]);
  const sameMonth = first.getMonth() === last.getMonth();
  const startLabel = first.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const endLabel = last.toLocaleDateString("en-US", sameMonth ? { day: "numeric" } : { month: "short", day: "numeric" });
  return `${startLabel}–${endLabel}`;
}

/**
 * Removes menu entries older than `daysToKeep` days.
 * Called on every save to prevent the KV blob from growing indefinitely.
 */
export function pruneMenuHistory(
  menu: Record<string, unknown[]>,
  daysToKeep = 180
): Record<string, unknown[]> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - daysToKeep);
  const cutoffStr = toDateStr(cutoff);
  return Object.fromEntries(
    Object.entries(menu).filter(([date]) => date >= cutoffStr)
  );
}

/** "Mon, Mar 24" style label */
export function formatDateLabel(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

/** "Today", "Tomorrow", or formatted date */
export function formatDateLabelRelative(dateStr: string): { primary: string; secondary: string } {
  const today = toDateStr(new Date());
  const tomorrow = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return toDateStr(d);
  })();

  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);

  const weekday = date.toLocaleDateString("en-US", { weekday: "long" });
  const monthDay = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });

  if (dateStr === today) return { primary: "Today", secondary: monthDay };
  if (dateStr === tomorrow) return { primary: "Tomorrow", secondary: monthDay };
  return { primary: weekday, secondary: monthDay };
}
