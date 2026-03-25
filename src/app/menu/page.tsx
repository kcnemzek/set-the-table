"use client";

import DayCard from "@/components/menu/DayCard";
import { getNext10Days, toDateStr } from "@/lib/dates";

export default function MenuPage() {
  const days = getNext10Days();
  const today = toDateStr(new Date());

  return (
    <div className="space-y-3 px-4 py-4">
      <h1 className="text-xl font-bold text-gray-800 mb-1">Menu Items</h1>
      {days.map((dateStr) => (
        <DayCard key={dateStr} dateStr={dateStr} isToday={dateStr === today} />
      ))}
    </div>
  );
}
