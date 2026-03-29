"use client";

import BottomSheet from "@/components/shared/BottomSheet";
import { useAppContext } from "@/store/context";
import { getNext10Days, formatDateLabelRelative } from "@/lib/dates";
import type { RecipeSummary } from "@/types";
import type { DayEntry } from "@/types";

interface DayPickerSheetProps {
  open: boolean;
  onClose: () => void;
  recipe: RecipeSummary;
  onAdded: () => void;
  /** When provided, this entry is added directly instead of building one from recipe */
  entry?: DayEntry;
}

export default function DayPickerSheet({
  open,
  onClose,
  recipe,
  onAdded,
  entry,
}: DayPickerSheetProps) {
  const { addDayEntry, state } = useAppContext();
  const days = getNext10Days();

  const handlePick = (dateStr: string) => {
    const toAdd: DayEntry = entry
      ? { ...entry, id: crypto.randomUUID() }
      : {
          id: crypto.randomUUID(),
          type: "recipe",
          recipeId: recipe.id,
          recipeTitle: recipe.title,
          recipeImage: recipe.image || `/api/recipes/${recipe.id}/image`,
          recipeUrl: recipe.sourceUrl,
        };
    addDayEntry(dateStr, toAdd);
    onAdded();
    onClose();
  };

  return (
    <BottomSheet open={open} onClose={onClose} title="Add to which day?">
      <div className="p-4 space-y-1">
        {days.map((dateStr, i) => {
          const { primary, secondary } = formatDateLabelRelative(dateStr);
          const entries = (state.menu[dateStr] ?? []).filter((e) => e.type !== "event");
          return (
            <button
              key={dateStr}
              onClick={() => handlePick(dateStr)}
              className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl hover:bg-brand-50 active:bg-brand-100 transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-xl bg-brand-50 flex flex-col items-center justify-center flex-shrink-0">
                <span className="text-[10px] font-semibold text-brand-400 leading-none">
                  {primary.slice(0, 3)}
                </span>
                <span className="text-sm font-bold text-brand-600 leading-none">
                  {secondary.split(" ")[1] ?? secondary}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800">{primary}</p>
                {entries.length > 0 ? (
                  <p className="text-xs text-gray-400 truncate">
                    {entries.map((e) => e.recipeTitle ?? e.text).join(" · ")}
                  </p>
                ) : (
                  <p className="text-xs text-gray-400">{secondary}</p>
                )}
              </div>
              {i === 0 && (
                <span className="ml-auto text-xs font-semibold text-brand-500 bg-brand-50 px-2 py-0.5 rounded-full flex-shrink-0">
                  Today
                </span>
              )}
            </button>
          );
        })}
      </div>
    </BottomSheet>
  );
}
