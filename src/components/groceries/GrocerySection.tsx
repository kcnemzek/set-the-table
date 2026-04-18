"use client";

import clsx from "clsx";
import { Tag, Trash2 } from "lucide-react";
import { useAppContext } from "@/store/context";
import { groceryItemKey } from "@/lib/ingredient-utils";
import type { AggregatedIngredient } from "@/types";

interface GrocerySectionProps {
  aisle: string;
  items: AggregatedIngredient[];
  hideChecked?: boolean;
}

export default function GrocerySection({ aisle, items, hideChecked }: GrocerySectionProps) {
  const { dispatch, state } = useAppContext();

  const visibleItems = hideChecked
    ? items.filter((item) => {
        const key = groceryItemKey(item.aisle, item.name, item.unit);
        return !(state.groceryChecked[key] ?? false);
      })
    : items;

  if (visibleItems.length === 0) return null;

  return (
    <div>
      <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest px-4 pt-4 pb-2">
        {aisle}
      </h3>
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden mx-4">
        {visibleItems.map((item, i) => {
          const key = groceryItemKey(item.aisle, item.name, item.unit);
          const checked = state.groceryChecked[key] ?? false;

          return (
            <div
              key={key}
              onClick={() => dispatch({ type: "TOGGLE_GROCERY_CHECKED", key })}
              className={clsx(
                "w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors cursor-pointer",
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

              {/* Name + recipe sources */}
              <div className="flex-1 min-w-0">
                <span
                  className={clsx(
                    "text-sm capitalize",
                    checked ? "text-gray-500 line-through" : "text-gray-800"
                  )}
                >
                  {item.name}
                </span>
                {item.recipes.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-0.5">
                    {item.recipes.map((r) => (
                      <span key={r} className="text-[10px] text-gray-500 bg-gray-100 rounded-full px-2 py-0.5 leading-tight">
                        {r}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Amount */}
              {item.totalAmount > 0 && (
                <span className={clsx("text-xs", checked ? "text-gray-400" : "text-gray-600")}>
                  {item.totalAmount % 1 === 0
                    ? item.totalAmount
                    : item.totalAmount.toFixed(2)}{" "}
                  {item.unit}
                </span>
              )}

              {/* Store picker */}
              <div className="relative flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                <div className={clsx(
                  "flex items-center gap-1 rounded-full px-2 py-0.5 border text-xs pointer-events-none",
                  item.store
                    ? "bg-brand-50 text-brand-600 border-brand-200"
                    : "bg-gray-50 text-gray-400 border-gray-200"
                )}>
                  <Tag size={11} />
                  {item.store && <span className="max-w-[60px] truncate">{item.store}</span>}
                </div>
                <select
                  value={item.store ?? ""}
                  onChange={(e) => {
                    const store = e.target.value || undefined;
                    if (item.manualId) {
                      dispatch({ type: "SET_MANUAL_GROCERY_STORE", id: item.manualId, store });
                    } else {
                      dispatch({ type: "SET_ITEM_STORE", key: groceryItemKey(item.aisle, item.name, item.unit), store });
                    }
                  }}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full"
                >
                  <option value="">No store</option>
                  {state.stores.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              {/* Delete — manual items only */}
              {item.manualId && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    dispatch({ type: "REMOVE_MANUAL_GROCERY", id: item.manualId! });
                  }}
                  className="text-gray-300 hover:text-red-400 transition-colors p-1 flex-shrink-0"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
