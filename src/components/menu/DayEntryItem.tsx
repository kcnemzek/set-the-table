"use client";

import { X, UtensilsCrossed, ChevronRight } from "lucide-react";
import type { DayEntry } from "@/types";

interface DayEntryItemProps {
  entry: DayEntry;
  onRemove: () => void;
  onOpen?: () => void;
}

function getFoodEmoji(title: string): string {
  const t = title.toLowerCase();
  if (/pasta|spaghetti|lasagna|linguine|fettuccine|penne|rigatoni|noodle/.test(t)) return "🍝";
  if (/pizza/.test(t)) return "🍕";
  if (/burger|hamburger/.test(t)) return "🍔";
  if (/taco|burrito|quesadilla|enchilada|fajita/.test(t)) return "🌮";
  if (/soup|stew|chowder|bisque|broth/.test(t)) return "🍲";
  if (/salad/.test(t)) return "🥗";
  if (/sandwich|sub|wrap|panini/.test(t)) return "🥪";
  if (/chicken|poultry|hen/.test(t)) return "🍗";
  if (/steak|beef|brisket|roast|meatball/.test(t)) return "🥩";
  if (/fish|salmon|tuna|cod|shrimp|prawn|seafood|sushi|sashimi/.test(t)) return "🐟";
  if (/rice|pilaf|risotto|fried rice/.test(t)) return "🍚";
  if (/curry/.test(t)) return "🍛";
  if (/egg|omelette|frittata|quiche/.test(t)) return "🍳";
  if (/pancake|waffle|crepe/.test(t)) return "🥞";
  if (/bread|toast|baguette|muffin|scone/.test(t)) return "🍞";
  if (/cake|cupcake|brownie|cookie|dessert|pie|tart/.test(t)) return "🎂";
  if (/ice cream|gelato|sorbet/.test(t)) return "🍦";
  if (/smoothie|juice|shake/.test(t)) return "🥤";
  if (/pork|bacon|ham|sausage/.test(t)) return "🥓";
  if (/potato|fries|chips/.test(t)) return "🥔";
  if (/vegetable|veggie|vegan|tofu|green bean|broccoli|spinach|zucchini|asparagus|brussels/.test(t)) return "🥦";
  return "🍽️";
}

export default function DayEntryItem({ entry, onRemove, onOpen }: DayEntryItemProps) {
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
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
      ) : isCustomRecipe || isText ? (
        <span className="text-lg leading-none">{getFoodEmoji(label ?? "")}</span>
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
          <ChevronRight size={15} className="flex-shrink-0 text-gray-300" />
        </button>
      ) : (
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {icon}
          <span className="flex-1 text-sm text-gray-800 leading-tight line-clamp-2">{label}</span>
        </div>
      )}

      <button
        onClick={onRemove}
        className="flex-shrink-0 p-1.5 rounded-full text-gray-400 hover:text-red-400 hover:bg-red-50 active:bg-red-100 transition-colors"
        aria-label="Remove"
      >
        <X size={16} />
      </button>
    </div>
  );
}
