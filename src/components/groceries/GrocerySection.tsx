"use client";

import clsx from "clsx";
import { useAppContext } from "@/store/context";
import { groceryItemKey } from "@/lib/ingredient-utils";
import type { AggregatedIngredient } from "@/types";

interface GrocerySectionProps {
  aisle: string;
  items: AggregatedIngredient[];
}

export default function GrocerySection({ aisle, items }: GrocerySectionProps) {
  const { dispatch, state } = useAppContext();

  return (
    <div>
      <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest px-4 pt-4 pb-2">
        {aisle}
      </h3>
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden mx-4">
        {items.map((item, i) => {
          const key = groceryItemKey(item.aisle, item.name, item.unit);
          const checked = state.groceryChecked[key] ?? false;

          return (
            <button
              key={key}
              onClick={() => dispatch({ type: "TOGGLE_GROCERY_CHECKED", key })}
              className={clsx(
                "w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors",
                i > 0 && "border-t border-gray-50",
                checked ? "bg-gray-100" : "hover:bg-gray-100 active:bg-gray-200"
              )}
            >
              {/* Checkbox */}
              <div
                className={clsx(
                  "w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors",
                  checked
                    ? "bg-brand-500 border-brand-500"
                    : "border-gray-300"
                )}
              >
                {checked && (
                  <svg viewBox="0 0 10 8" className="w-2.5 h-2.5 text-white" fill="none">
                    <path
                      d="M1 4l2.5 2.5L9 1"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </div>

              {/* Name */}
              <span
                className={clsx(
                  "flex-1 text-sm capitalize",
                  checked ? "text-gray-500 line-through" : "text-gray-800"
                )}
              >
                {item.name}
              </span>

              {/* Amount */}
              {item.totalAmount > 0 && (
                <span className={clsx("text-xs", checked ? "text-gray-400" : "text-gray-500")}>
                  {item.totalAmount % 1 === 0
                    ? item.totalAmount
                    : item.totalAmount.toFixed(2)}{" "}
                  {item.unit}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
