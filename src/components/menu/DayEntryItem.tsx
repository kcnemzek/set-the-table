"use client";

import { X, UtensilsCrossed, ChevronRight } from "lucide-react";
import type { DayEntry } from "@/types";
import { getRecipeEmoji } from "@/lib/recipe-emoji";

interface DayEntryItemProps {
  entry: DayEntry;
  onRemove: () => void;
  onOpen?: () => void;
  readOnly?: boolean;
}


export default function DayEntryItem({ entry, onRemove, onOpen, readOnly }: DayEntryItemProps) {
  // Event banner — special full-width treatment
  if (entry.type === "event") {
    return (
      <div className="py-1.5 px-1">
        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5">
          <button
            onClick={onOpen}
            className="flex-1 text-left text-sm font-semibold text-amber-800 leading-snug"
          >
            {entry.text}
          </button>
          {!readOnly && (
            <button
              onClick={onRemove}
              className="flex-shrink-0 p-1 rounded-full text-amber-400 hover:text-red-400 hover:bg-red-50 active:bg-red-100 transition-colors"
              aria-label="Remove"
            >
              <X size={15} />
            </button>
          )}
        </div>
      </div>
    );
  }

  const isText = entry.type === "text";
  const isCustomRecipe = entry.type === "custom-recipe";
  const label =
    entry.type === "recipe"
      ? entry.recipeTitle
      : entry.type === "custom-recipe"
      ? entry.recipeTitle
      : entry.text;

  const icon = (
    <div className="flex-shrink-0 w-9 h-9 rounded-xl overflow-hidden bg-brand-50 flex items-center justify-center">
      {!isText && entry.recipeImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={entry.recipeImage}
          alt={label ?? ""}
          className="w-full h-full object-cover"
          onError={(e) => {
            const img = e.target as HTMLImageElement;
            if (entry.type === "recipe" && entry.recipeId && !img.src.includes("/api/recipes/")) {
              img.src = `/api/recipes/${entry.recipeId}/image`;
            } else {
              img.style.display = "none";
            }
          }}
        />
      ) : isText ? (
        <span className="text-lg leading-none">📝</span>
      ) : isCustomRecipe ? (
        <span className="text-lg leading-none">{getRecipeEmoji(label ?? "")}</span>
      ) : (
        <UtensilsCrossed size={16} className="text-brand-400" />
      )}
    </div>
  );

  return (
    <div className="flex items-center gap-2 py-2 px-1">
      {onOpen ? (
        <button
          onClick={onOpen}
          className="flex items-center gap-3 flex-1 min-w-0 text-left hover:opacity-75 active:opacity-60 transition-opacity"
        >
          {icon}
          <span className="flex-1 text-sm text-gray-800 leading-tight line-clamp-2">{label}</span>
          <ChevronRight size={15} className="flex-shrink-0 text-gray-400" />
        </button>
      ) : (
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {icon}
          <span className="flex-1 text-sm text-gray-800 leading-tight line-clamp-2">{label}</span>
        </div>
      )}

      {!readOnly && (
        <button
          onClick={onRemove}
          className="flex-shrink-0 p-1.5 rounded-full text-gray-500 hover:text-red-400 hover:bg-red-50 active:bg-red-100 transition-colors"
          aria-label="Remove"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}
