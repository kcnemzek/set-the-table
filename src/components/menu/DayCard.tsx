"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import clsx from "clsx";
import DayEntryItem from "./DayEntryItem";
import AddEntrySheet from "./AddEntrySheet";
import CustomRecipeSheet from "@/components/recipes/CustomRecipeSheet";
import { useAppContext } from "@/store/context";
import { formatDateLabelRelative } from "@/lib/dates";
import type { CustomRecipe, DayEntry } from "@/types";

interface DayCardProps {
  dateStr: string;
  isToday: boolean;
}

export default function DayCard({ dateStr, isToday }: DayCardProps) {
  const { state, removeDayEntry } = useAppContext();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [viewingRecipe, setViewingRecipe] = useState<CustomRecipe | null>(null);

  const entries = state.menu[dateStr] ?? [];
  const { primary, secondary } = formatDateLabelRelative(dateStr);

  function getOnOpen(entry: DayEntry): (() => void) | undefined {
    if (entry.type === "recipe" && entry.recipeUrl) {
      return () => window.open(entry.recipeUrl, "_blank", "noopener,noreferrer");
    }
    if (entry.type === "custom-recipe" && entry.customRecipeId) {
      const cr = state.customRecipes.find((r) => r.id === entry.customRecipeId);
      if (cr) return () => setViewingRecipe(cr);
    }
    return undefined;
  }

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
          "flex items-center justify-between px-4 py-3 rounded-t-2xl",
          isToday ? "bg-brand-500" : "bg-gray-100"
        )}
      >
        <div>
          <p
            className={clsx(
              "font-semibold text-base leading-tight",
              isToday ? "text-white" : "text-gray-800"
            )}
          >
            {primary}
          </p>
          <p
            className={clsx(
              "text-xs leading-tight",
              isToday ? "text-brand-100" : "text-gray-500"
            )}
          >
            {secondary}
          </p>
        </div>
        <button
          onClick={() => setSheetOpen(true)}
          className={clsx(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors",
            isToday
              ? "bg-white/20 text-white hover:bg-white/30 active:bg-white/40"
              : "bg-brand-500 text-white hover:bg-brand-600 active:bg-brand-700"
          )}
        >
          <Plus size={14} />
          Add
        </button>
      </div>

      {/* Entries */}
      <div className="px-4 py-1">
        {entries.length === 0 ? (
          <button
            onClick={() => setSheetOpen(true)}
            className="w-full py-4 text-sm text-gray-400 hover:text-gray-500 text-center"
          >
            Tap + to add something
          </button>
        ) : (
          <div className="divide-y divide-gray-50">
            {entries.map((entry) => (
              <DayEntryItem
                key={entry.id}
                entry={entry}
                onRemove={() => removeDayEntry(dateStr, entry.id)}
                onOpen={getOnOpen(entry)}
              />
            ))}
          </div>
        )}
      </div>

      <AddEntrySheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        dateStr={dateStr}
        dateLabel={primary}
      />

      {viewingRecipe && (
        <CustomRecipeSheet
          key={viewingRecipe.id}
          open={true}
          onClose={() => setViewingRecipe(null)}
          existing={viewingRecipe}
        />
      )}
    </div>
  );
}
