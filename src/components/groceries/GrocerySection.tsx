"use client";

import { useState } from "react";
import clsx from "clsx";
import { Tag, Trash2, Check, X, EyeOff } from "lucide-react";
import { useAppContext } from "@/store/context";
import { groceryItemKey } from "@/lib/ingredient-utils";
import type { AggregatedIngredient } from "@/types";

const AISLE_CONFIG: Record<string, { color: string; emoji: string }> = {
  "Produce":           { color: "#16a34a", emoji: "🥦" },
  "Meat & Seafood":    { color: "#dc2626", emoji: "🥩" },
  "Dairy":             { color: "#2563eb", emoji: "🥛" },
  "Grains & Pasta":    { color: "#d97706", emoji: "🌾" },
  "Canned & Dry Goods":{ color: "#0d9488", emoji: "🥫" },
  "Bakery":            { color: "#c2410c", emoji: "🥐" },
  "Baking":            { color: "#f59e0b", emoji: "🧁" },
  "Spices & Herbs":    { color: "#7c3aed", emoji: "🌿" },
  "Oils & Condiments": { color: "#ea580c", emoji: "🫙" },
  "Frozen":            { color: "#0891b2", emoji: "🧊" },
  "Beverages":         { color: "#8b5cf6", emoji: "🧃" },
  "Nuts & Snacks":     { color: "#b45309", emoji: "🥜" },
  "Miscellaneous":     { color: "#6b7280", emoji: "📦" },
};
const DEFAULT_CONFIG = { color: "#6b7280", emoji: "🛒" };

interface GrocerySectionProps {
  aisle: string;
  items: AggregatedIngredient[];
  hideChecked?: boolean;
}

export default function GrocerySection({ aisle, items, hideChecked }: GrocerySectionProps) {
  const { dispatch, state } = useAppContext();
  const config = AISLE_CONFIG[aisle] ?? DEFAULT_CONFIG;
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const visibleItems = hideChecked
    ? items.filter((item) => {
        const key = groceryItemKey(item.aisle, item.name, item.unit);
        return !(state.groceryChecked[key] ?? false);
      })
    : items;

  if (visibleItems.length === 0) return null;

  return (
    <div>
      <h3 className="text-xs font-bold uppercase tracking-widest px-4 pt-4 pb-2 flex items-center gap-1.5"
        style={{ color: config.color }}>
        <span>{config.emoji}</span> {aisle}
      </h3>
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden mx-4"
        style={{ borderLeft: `4px solid ${config.color}` }}>
        {visibleItems.map((item, i) => {
          const key = groceryItemKey(item.aisle, item.name, item.unit);
          const checked = state.groceryChecked[key] ?? false;

          return (
            <div
              key={key}
              onClick={() => {
                if (item.stapleId && item.manualId) {
                  dispatch({ type: "REMOVE_MANUAL_GROCERY", id: item.manualId });
                } else {
                  dispatch({ type: "TOGGLE_GROCERY_CHECKED", key });
                }
              }}
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
                  checked ? "border-green-500" : "border-gray-300"
                )}
                style={checked ? { background: "#16a34a", borderColor: "#16a34a" } : {}}
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

              {/* Hide in pantry */}
              {!item.manualId && (
                <button
                  onClick={(e) => { e.stopPropagation(); dispatch({ type: "ADD_TO_PANTRY", name: item.name }); }}
                  className="text-gray-300 hover:text-amber-400 transition-colors p-1 flex-shrink-0"
                  title="Move to pantry (always on hand)"
                >
                  <EyeOff size={14} />
                </button>
              )}

              {/* Delete — manual items only (not staple-sourced items) */}
              {item.manualId && !item.stapleId && (
                confirmingId === item.manualId ? (
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={(e) => { e.stopPropagation(); dispatch({ type: "REMOVE_MANUAL_GROCERY", id: item.manualId! }); setConfirmingId(null); }}
                      className="p-1 text-red-500 hover:text-red-700 transition-colors"
                      title="Confirm delete"
                    >
                      <Check size={14} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setConfirmingId(null); }}
                      className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                      title="Cancel"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={(e) => { e.stopPropagation(); setConfirmingId(item.manualId!); }}
                    className="text-gray-300 hover:text-red-400 transition-colors p-1 flex-shrink-0"
                  >
                    <Trash2 size={14} />
                  </button>
                )
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
