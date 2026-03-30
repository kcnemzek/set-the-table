"use client";

import { X, UtensilsCrossed, ArrowRight, GripVertical } from "lucide-react";
import type { DayEntry } from "@/types";
import { getRecipeEmoji } from "@/lib/recipe-emoji";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface DayEntryItemProps {
  entry: DayEntry;
  onRemove: () => void;
  onOpen?: () => void;
  onMove?: () => void;
  readOnly?: boolean;
  sortable?: boolean;
}


export default function DayEntryItem({ entry, onRemove, onOpen, onMove, readOnly, sortable }: DayEntryItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: entry.id,
    disabled: !sortable,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // Event banner — special full-width treatment (not sortable)
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
    <div ref={setNodeRef} style={style} className="flex items-center gap-2 py-2 px-1">
      {sortable && !readOnly && (
        <button
          {...attributes}
          {...listeners}
          className="flex-shrink-0 p-1 text-gray-300 hover:text-gray-400 cursor-grab active:cursor-grabbing touch-none"
          aria-label="Drag to reorder"
        >
          <GripVertical size={16} />
        </button>
      )}

      {onOpen ? (
        <button
          onClick={onOpen}
          className="flex items-center gap-3 flex-1 min-w-0 text-left hover:opacity-75 active:opacity-60 transition-opacity"
        >
          {icon}
          <span className="flex-1 text-sm text-gray-800 leading-tight line-clamp-2">{label}</span>
        </button>
      ) : (
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {icon}
          <span className="flex-1 text-sm text-gray-800 leading-tight line-clamp-2">{label}</span>
        </div>
      )}

      {onMove && !readOnly && (
        <button
          onClick={onMove}
          className="flex-shrink-0 p-1.5 rounded-full text-gray-300 hover:text-brand-500 hover:bg-brand-50 active:bg-brand-100 transition-colors"
          aria-label="Move to another day"
        >
          <ArrowRight size={15} />
        </button>
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
