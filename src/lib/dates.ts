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
