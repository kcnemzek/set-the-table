"use client";

import { forwardRef } from "react";
import { ChefHat } from "lucide-react";
import type { DayEntry } from "@/types";
import { getRecipeEmoji } from "@/lib/recipe-emoji";
import { useAppContext } from "@/store/context";

interface MenuShareCardProps {
  dateStr: string;
  entries: DayEntry[];
}

const MenuShareCard = forwardRef<HTMLDivElement, MenuShareCardProps>(
  ({ dateStr, entries }, ref) => {
    const { state } = useAppContext();
    const [y, m, d] = dateStr.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    const weekday = date.toLocaleDateString("en-US", { weekday: "long" });
    const monthDay = date.toLocaleDateString("en-US", { month: "long", day: "numeric" });

    const eventEntry = entries.find((e) => e.type === "event");
    const menuEntries = entries.filter((e) => e.type !== "event");

    return (
      <div
        ref={ref}
        style={{ fontFamily: "system-ui, -apple-system, sans-serif", width: 400 }}
        className="bg-white rounded-3xl overflow-hidden shadow-2xl"
      >
        {/* Header */}
        <div className="bg-brand-500 px-6 pt-6 pb-5">
          {eventEntry ? (
            <>
              <p className="text-white text-xl font-bold leading-tight">{eventEntry.text}</p>
              <p className="text-brand-100 text-sm mt-1">{weekday}, {monthDay}</p>
            </>
          ) : (
            <>
              <p className="text-brand-100 text-sm font-medium uppercase tracking-widest">{weekday}</p>
              <p className="text-white text-2xl font-bold mt-0.5">{monthDay}</p>
            </>
          )}
        </div>

        {/* Menu items */}
        <div className="px-6 py-4 space-y-3">
          {menuEntries.map((entry) => {
            const title =
              entry.type === "recipe" || entry.type === "custom-recipe"
                ? entry.recipeTitle ?? ""
                : entry.text ?? "";
            const category = entry.type === "custom-recipe"
              ? state.customRecipes.find((r) => r.id === entry.customRecipeId)?.category
              : undefined;
            const emoji = getRecipeEmoji(title, category);

            const image = entry.type === "recipe" && entry.recipeId
              ? `/api/recipes/${entry.recipeId}/image`
              : undefined;

            return (
              <div key={entry.id} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-brand-50 flex items-center justify-center text-xl flex-shrink-0 overflow-hidden">
                  {image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={image}
                      alt={title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const img = e.target as HTMLImageElement;
                        img.style.display = "none";
                        img.parentElement!.textContent = emoji;
                      }}
                    />
                  ) : (
                    emoji
                  )}
                </div>
                <span className="text-gray-800 text-sm font-medium leading-snug">{title}</span>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 pb-5 pt-1 flex items-center gap-1.5">
          <ChefHat size={13} className="text-brand-300" />
          <p className="text-xs text-brand-300 font-medium">Mom, What&apos;s for Dinner?</p>
        </div>
      </div>
    );
  }
);

MenuShareCard.displayName = "MenuShareCard";
export default MenuShareCard;
