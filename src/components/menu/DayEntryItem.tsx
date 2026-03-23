"use client";

import { X, UtensilsCrossed, Type } from "lucide-react";
import type { DayEntry } from "@/types";

interface DayEntryItemProps {
  entry: DayEntry;
  onRemove: () => void;
}

export default function DayEntryItem({ entry, onRemove }: DayEntryItemProps) {
  const isText = entry.type === "text";
  const label =
    entry.type === "recipe"
      ? entry.recipeTitle
      : entry.type === "custom-recipe"
      ? entry.recipeTitle
      : entry.text;

  return (
    <div className="flex items-center gap-3 py-2.5 px-1 group">
      {/* Icon */}
      <div className="flex-shrink-0 w-9 h-9 rounded-xl overflow-hidden bg-brand-50 flex items-center justify-center">
        {!isText && entry.recipeImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={entry.recipeImage}
            alt={label ?? ""}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        ) : isText ? (
          <Type size={16} className="text-brand-400" />
        ) : (
          <UtensilsCrossed size={16} className="text-brand-400" />
        )}
      </div>

      {/* Label */}
      <span className="flex-1 text-sm text-gray-800 leading-tight line-clamp-2">
        {label}
      </span>

      {/* Remove */}
      <button
        onClick={onRemove}
        className="flex-shrink-0 p-1.5 rounded-full text-gray-300 hover:text-red-400 hover:bg-red-50 active:bg-red-100 transition-colors"
        aria-label="Remove"
      >
        <X size={16} />
      </button>
    </div>
  );
}
