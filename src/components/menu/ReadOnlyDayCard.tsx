"use client";

import clsx from "clsx";
import DayEntryItem from "./DayEntryItem";
import { formatDateLabelRelative } from "@/lib/dates";
import type { DayEntry } from "@/types";

interface ReadOnlyDayCardProps {
  dateStr: string;
  isToday: boolean;
  entries: DayEntry[];
}

export default function ReadOnlyDayCard({ dateStr, isToday, entries }: ReadOnlyDayCardProps) {
  const { primary, secondary } = formatDateLabelRelative(dateStr);

  return (
    <div
      className={clsx(
        "bg-white rounded-2xl shadow-sm border",
        isToday ? "border-brand-300 ring-1 ring-brand-200" : "border-gray-200"
      )}
    >
      {/* Day Header */}
      <div
        className={clsx(
          "px-4 py-3 rounded-t-2xl",
          isToday ? "bg-brand-500" : "bg-gray-100"
        )}
      >
        <p className={clsx("font-semibold text-base leading-tight", isToday ? "text-white" : "text-gray-800")}>
          {primary}
        </p>
        <p className={clsx("text-xs leading-tight", isToday ? "text-brand-100" : "text-gray-500")}>
          {secondary}
        </p>
      </div>

      {/* Entries */}
      <div className="px-4 py-1">
        {entries.length === 0 ? (
          <p className="w-full py-4 text-sm text-gray-500 text-center">Nothing planned yet.</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {entries.map((entry) => (
              <DayEntryItem
                key={entry.id}
                entry={entry}
                onRemove={() => {}}
                readOnly
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
