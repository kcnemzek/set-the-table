"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import clsx from "clsx";
import DayCard from "@/components/menu/DayCard";
import { getMenuDays, toDateStr, formatWeekRangeLabel } from "@/lib/dates";

export default function MenuPage() {
  const [weekOffset, setWeekOffset] = useState(0);
  const today = toDateStr(new Date());
  const days = getMenuDays(weekOffset);

  return (
    <div className="space-y-3 px-4 py-4">
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-xl font-bold text-gray-800">Menu</h1>
        <div className="flex items-center gap-1">
          {weekOffset !== 0 && (
            <button
              onClick={() => setWeekOffset(0)}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-brand-500 text-white hover:bg-brand-600 active:bg-brand-700 transition-colors"
            >
              Today
            </button>
          )}
          <span className="text-sm text-gray-500 px-1">{formatWeekRangeLabel(days)}</span>
          <button
            onClick={() => setWeekOffset((o) => o - 1)}
            className="p-1.5 rounded-lg text-gray-600 hover:bg-gray-100 active:bg-gray-200 transition-colors"
            aria-label="Previous week"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={() => setWeekOffset((o) => o + 1)}
            className={clsx(
              "p-1.5 rounded-lg transition-colors",
              weekOffset >= 0
                ? "text-gray-300 cursor-default"
                : "text-gray-600 hover:bg-gray-100 active:bg-gray-200"
            )}
            disabled={weekOffset >= 0}
            aria-label="Next week"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {days.map((dateStr) => (
        <DayCard key={dateStr} dateStr={dateStr} isToday={dateStr === today} />
      ))}
    </div>
  );
}
