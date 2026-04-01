"use client";

import { useState, useEffect } from "react";
import { Heart, Plus, Check, Clock, Users, ExternalLink, ThumbsDown, Loader2 } from "lucide-react";
import clsx from "clsx";
import BottomSheet from "@/components/shared/BottomSheet";
import DayPickerSheet from "./DayPickerSheet";
import { useAppContext } from "@/store/context";
import type { RecipeSummary, RecipeDetail } from "@/types";

interface RecipeDetailSheetProps {
  recipe: RecipeSummary | null;
  onClose: () => void;
}

export default function RecipeDetailSheet({ recipe, onClose }: RecipeDetailSheetProps) {
  const { toggleFavorite, isFavorite, toggleDisliked, isDisliked, state, dispatch } = useAppContext();
  const [dayPickerOpen, setDayPickerOpen] = useState(false);
  const [addedFlash, setAddedFlash] = useState(false);
  const [detail, setDetail] = useState<RecipeDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    if (!recipe) return;
    // Use cache if available
    if (state.recipeCache[recipe.id]) {
      setDetail(state.recipeCache[recipe.id]);
      return;
    }
    setDetailLoading(true);
    fetch(`/api/recipes/${recipe.id}`)
      .then((r) => r.json())
      .then((data: RecipeDetail) => {
        dispatch({ type: "CACHE_RECIPE", recipe: data });
        setDetail(data);
      })
      .catch(() => {})
      .finally(() => setDetailLoading(false));
  }, [recipe?.id]);

  if (!recipe) return null;

  const favorited = isFavorite(recipe.id);
  const disliked = isDisliked(recipe.id);
  const isOnMenu = Object.values(state.menu).some((entries) =>
    entries.some((e) => e.type === "recipe" && e.recipeId === recipe.id)
  );

  const handleAdded = () => {
    setAddedFlash(true);
    setTimeout(() => setAddedFlash(false), 1500);
    onClose();
  };

  const badges = [
    recipe.vegan && { label: "Vegan", color: "bg-green-500" },
    !recipe.vegan && recipe.vegetarian && { label: "Vegetarian", color: "bg-green-400" },
    recipe.glutenFree && { label: "Gluten Free", color: "bg-yellow-500" },
    recipe.dairyFree && { label: "Dairy Free", color: "bg-blue-400" },
  ].filter(Boolean) as { label: string; color: string }[];

  return (
    <>
      <BottomSheet open={!!recipe} onClose={onClose} title={recipe.title}>
        <div className="pb-8">
          {/* Image */}
          {recipe.image && (
            <div className="relative aspect-video bg-gray-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={recipe.image}
                alt={recipe.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `/api/recipes/${recipe.id}/image`;
                }}
              />
              {isOnMenu && (
                <div className="absolute top-3 right-3">
                  <span className="px-2 py-1 bg-brand-500 text-white text-xs font-semibold rounded-full shadow">
                    ✓ On menu
                  </span>
                </div>
              )}
            </div>
          )}

          <div className="px-4 pt-4 space-y-4">
            {/* Meta */}
            <div className="flex items-center gap-4 text-sm text-gray-500">
              {recipe.readyInMinutes > 0 && (
                <span className="flex items-center gap-1.5">
                  <Clock size={15} />
                  {recipe.readyInMinutes} min
                </span>
              )}
              {recipe.servings > 0 && (
                <span className="flex items-center gap-1.5">
                  <Users size={15} />
                  {recipe.servings} servings
                </span>
              )}
              {recipe.cuisines?.[0] && (
                <span className="capitalize">{recipe.cuisines[0]}</span>
              )}
            </div>

            {/* Dietary badges */}
            {badges.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {badges.map((b) => (
                  <span key={b.label} className={clsx("px-2.5 py-1 text-xs font-semibold text-white rounded-full", b.color)}>
                    {b.label}
                  </span>
                ))}
              </div>
            )}

            {/* Diets */}
            {recipe.diets && recipe.diets.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {recipe.diets.map((d) => (
                  <span key={d} className="px-2.5 py-1 text-xs text-gray-600 bg-gray-100 rounded-full capitalize">
                    {d}
                  </span>
                ))}
              </div>
            )}

            {/* Ingredients */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Ingredients</p>
              {detailLoading ? (
                <div className="flex justify-center py-4">
                  <Loader2 size={18} className="animate-spin text-gray-500" />
                </div>
              ) : detail?.extendedIngredients && detail.extendedIngredients.length > 0 ? (
                <ul className="space-y-1">
                  {detail.extendedIngredients.map((ing, i) => (
                    <li key={i} className="text-sm text-gray-700 flex gap-2">
                      <span className="text-gray-500 flex-shrink-0">·</span>
                      <span>{ing.original}</span>
                    </li>
                  ))}
                </ul>
              ) : !detailLoading && (
                <p className="text-sm text-gray-500">No ingredients available.</p>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => toggleFavorite(recipe.id)}
                className={clsx(
                  "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-colors",
                  favorited
                    ? "bg-red-50 text-red-500"
                    : "bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-400"
                )}
              >
                <Heart size={16} fill={favorited ? "currentColor" : "none"} />
                {favorited ? "Saved" : "Save"}
              </button>

              <button
                onClick={() => toggleDisliked(recipe.id)}
                className={clsx(
                  "flex items-center justify-center p-3 rounded-xl transition-colors",
                  disliked
                    ? "bg-gray-300 text-gray-600"
                    : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                )}
                title={disliked ? "Remove dislike" : "Not interested"}
              >
                <ThumbsDown size={16} fill={disliked ? "currentColor" : "none"} />
              </button>

              <button
                onClick={() => setDayPickerOpen(true)}
                className={clsx(
                  "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-colors",
                  addedFlash
                    ? "bg-green-100 text-green-600"
                    : "bg-brand-500 text-white hover:bg-brand-600 active:bg-brand-700"
                )}
              >
                {addedFlash ? <Check size={16} /> : <Plus size={16} />}
                {addedFlash ? "Added!" : "Add to menu"}
              </button>
            </div>

            {/* View full recipe */}
            {recipe.sourceUrl && (
              <a
                href={recipe.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <ExternalLink size={15} />
                View full recipe
              </a>
            )}
          </div>
        </div>
      </BottomSheet>

      <DayPickerSheet
        open={dayPickerOpen}
        onClose={() => setDayPickerOpen(false)}
        recipe={recipe}
        onAdded={handleAdded}
      />
    </>
  );
}
