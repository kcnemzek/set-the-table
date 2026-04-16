"use client";

import { useState, useEffect } from "react";
import { Check } from "lucide-react";
import clsx from "clsx";
import BottomSheet from "@/components/shared/BottomSheet";
import { useAppContext } from "@/store/context";
import { getRecipeEmoji } from "@/lib/recipe-emoji";
import type { SavedMenu, DayEntry } from "@/types";

interface TemplatePreviewSheetProps {
  open: boolean;
  onClose: () => void;
  template: SavedMenu | null;
  dateStr: string;
  dateLabel: string;
  onAddEntry?: (entry: DayEntry) => void;
  /** Called after stamping so the parent sheet can close itself */
  onStamped?: () => void;
}

export default function TemplatePreviewSheet({
  open,
  onClose,
  template,
  dateStr,
  dateLabel,
  onAddEntry,
  onStamped,
}: TemplatePreviewSheetProps) {
  const { addDayEntry, state } = useAppContext();
  const [excluded, setExcluded] = useState<Set<string>>(new Set());

  // Reset selection whenever a new template opens
  useEffect(() => {
    if (open) setExcluded(new Set());
  }, [open, template?.id]);

  if (!template) return null;

  const toggle = (id: string) => {
    setExcluded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectedCount = template.entries.length - excluded.size;

  const handleStamp = () => {
    template.entries
      .filter((e) => !excluded.has(e.id))
      .forEach((entry) => {
        const newEntry = { ...entry, id: crypto.randomUUID() };
        if (onAddEntry) {
          onAddEntry(newEntry);
        } else {
          addDayEntry(dateStr, newEntry);
        }
      });
    onClose();
    onStamped?.();
  };

  return (
    <BottomSheet open={open} onClose={onClose} title={template.name}>
      <div className="flex flex-col">
        <p className="px-4 pt-3 pb-1 text-xs text-gray-400">
          Tap any item to deselect it before adding
        </p>

        <div className="divide-y divide-gray-50 max-h-64 overflow-y-auto">
          {template.entries.map((entry) => {
            const isExcluded = excluded.has(entry.id);
            const label = entry.recipeTitle ?? entry.text ?? "";
            const cr =
              entry.type === "custom-recipe"
                ? state.customRecipes.find((r) => r.id === entry.customRecipeId)
                : undefined;
            const emoji =
              entry.type === "event"
                ? "📌"
                : entry.type === "text"
                ? "📝"
                : getRecipeEmoji(label, cr?.category, cr?.emoji);

            return (
              <button
                key={entry.id}
                onClick={() => toggle(entry.id)}
                className={clsx(
                  "w-full flex items-center gap-3 px-4 py-3 text-left transition-opacity",
                  isExcluded ? "opacity-35" : "hover:bg-brand-50 active:bg-brand-100"
                )}
              >
                {/* Checkbox */}
                <div
                  className={clsx(
                    "flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors",
                    isExcluded
                      ? "border-gray-300 bg-white"
                      : "border-brand-500 bg-brand-500"
                  )}
                >
                  {!isExcluded && (
                    <Check size={11} strokeWidth={3} className="text-white" />
                  )}
                </div>

                {/* Icon */}
                {(entry.type === "recipe" || entry.type === "custom-recipe") &&
                entry.recipeImage ? (
                  <div className="w-9 h-9 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={entry.recipeImage}
                      alt={label}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        if (entry.recipeId)
                          (e.target as HTMLImageElement).src = `/api/recipes/${entry.recipeId}/image`;
                      }}
                    />
                  </div>
                ) : (
                  <div className="w-9 h-9 rounded-lg bg-brand-50 flex items-center justify-center text-lg flex-shrink-0">
                    {emoji}
                  </div>
                )}

                {/* Label */}
                <span
                  className={clsx(
                    "flex-1 text-sm font-medium text-gray-800 line-clamp-1",
                    isExcluded && "line-through"
                  )}
                >
                  {label}
                </span>
              </button>
            );
          })}
        </div>

        <div className="p-4 border-t border-gray-100">
          <button
            onClick={handleStamp}
            disabled={selectedCount === 0}
            className="w-full py-3 bg-brand-500 text-white rounded-xl text-sm font-semibold disabled:opacity-40 active:bg-brand-600"
          >
            {selectedCount === 0
              ? "Nothing selected"
              : selectedCount === template.entries.length
              ? `Add all to ${dateLabel}`
              : `Add ${selectedCount} to ${dateLabel}`}
          </button>
        </div>
      </div>
    </BottomSheet>
  );
}
