"use client";

import { useState } from "react";
import { Heart, ThumbsDown, Plus, Clock, Check } from "lucide-react";
import clsx from "clsx";
import type { RecipeSummary } from "@/types";
import { useAppContext } from "@/store/context";
import DayPickerSheet from "./DayPickerSheet";
import RecipeDetailSheet from "./RecipeDetailSheet";

interface RecipeCardProps {
  recipe: RecipeSummary;
}

export default function RecipeCard({ recipe }: RecipeCardProps) {
  const { toggleFavorite, isFavorite, toggleDisliked, isDisliked, state } = useAppContext();
  const [dayPickerOpen, setDayPickerOpen] = useState(false);
  const [addedFlash, setAddedFlash] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);

  const favorited = isFavorite(recipe.id);
  const disliked = isDisliked(recipe.id);
  const today = new Date().toISOString().slice(0, 10);
  const isOnMenu = Object.entries(state.menu).some(([date, entries]) =>
    date >= today && entries.some((e) => e.type === "recipe" && e.recipeId === recipe.id)
  );

  const handleAddedToMenu = () => {
    setAddedFlash(true);
    setTimeout(() => setAddedFlash(false), 1500);
  };

  return (
    <>
      <div
        className={clsx(
          "bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col",
          disliked && "opacity-50"
        )}
      >
        {/* Image */}
        <div className="relative aspect-[4/3] bg-gray-200">
          <button
            onClick={() => setDetailOpen(true)}
            className="absolute inset-0 z-10"
            aria-label={`View ${recipe.title} details`}
          />
          {recipe.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={recipe.image}
              alt={recipe.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = `/api/recipes/${recipe.id}/image`;
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-500">
              <svg viewBox="0 0 24 24" className="w-10 h-10" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
          )}

          {/* On menu badge */}
          {isOnMenu && (
            <div className="absolute top-2 right-2 z-20">
              <span className="px-2 py-0.5 bg-brand-500 text-white text-[10px] font-semibold rounded-full shadow-sm">
                ✓ On menu
              </span>
            </div>
          )}

          {/* Dietary badges */}
          <div className="absolute top-2 left-2 flex flex-wrap gap-1 z-20">
            {recipe.vegan && (
              <span className="px-1.5 py-0.5 bg-green-500 text-white text-[10px] font-semibold rounded-full">
                Vegan
              </span>
            )}
            {!recipe.vegan && recipe.vegetarian && (
              <span className="px-1.5 py-0.5 bg-green-400 text-white text-[10px] font-semibold rounded-full">
                Veg
              </span>
            )}
            {recipe.glutenFree && (
              <span className="px-1.5 py-0.5 bg-yellow-500 text-white text-[10px] font-semibold rounded-full">
                GF
              </span>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="p-3 flex-1 flex flex-col gap-2">
          <button
            onClick={() => setDetailOpen(true)}
            className="text-sm font-semibold text-gray-800 leading-tight line-clamp-2 text-left hover:underline"
          >
            {recipe.title}
          </button>

          <div className="flex items-center gap-2 text-xs text-gray-500">
            {recipe.readyInMinutes > 0 && (
              <span className="flex items-center gap-1">
                <Clock size={11} />
                {recipe.readyInMinutes}m
              </span>
            )}
            {recipe.cuisines?.[0] && (
              <span className="truncate">{recipe.cuisines[0]}</span>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 mt-auto pt-1">
            {/* Favorite */}
            <button
              onClick={() => toggleFavorite(recipe.id)}
              className={clsx(
                "flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl text-xs font-medium transition-colors",
                favorited
                  ? "bg-red-50 text-red-500"
                  : "bg-gray-200 text-gray-500 hover:bg-red-50 hover:text-red-400"
              )}
            >
              <Heart size={14} fill={favorited ? "currentColor" : "none"} />
              <span className="hidden sm:inline">{favorited ? "Saved" : "Save"}</span>
            </button>

            {/* Dislike */}
            <button
              onClick={() => toggleDisliked(recipe.id)}
              className={clsx(
                "flex items-center justify-center p-3 rounded-xl text-xs transition-colors",
                disliked
                  ? "bg-gray-300 text-gray-600"
                  : "bg-gray-200 text-gray-500 hover:bg-gray-300 hover:text-gray-600"
              )}
              title={disliked ? "Remove dislike" : "Not interested"}
            >
              <ThumbsDown size={14} fill={disliked ? "currentColor" : "none"} />
            </button>

            {/* Add to menu */}
            <button
              onClick={() => setDayPickerOpen(true)}
              className={clsx(
                "flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl text-xs font-medium transition-colors",
                addedFlash
                  ? "bg-green-100 text-green-600"
                  : "bg-brand-500 text-white hover:bg-brand-600 active:bg-brand-700"
              )}
            >
              {addedFlash ? (
                <>
                  <Check size={14} />
                  <span className="hidden sm:inline">Added!</span>
                </>
              ) : (
                <>
                  <Plus size={14} />
                  <span className="hidden sm:inline">Menu</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <DayPickerSheet
        open={dayPickerOpen}
        onClose={() => setDayPickerOpen(false)}
        recipe={recipe}
        onAdded={handleAddedToMenu}
      />

      <RecipeDetailSheet
        recipe={detailOpen ? recipe : null}
        onClose={() => setDetailOpen(false)}
      />
    </>
  );
}
