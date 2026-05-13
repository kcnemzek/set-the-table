"use client";

import { useState, useMemo } from "react";
import { Plus, Trash2, Check, X, ShoppingCart } from "lucide-react";
import { useAppContext } from "@/store/context";
import EmptyState from "@/components/shared/EmptyState";
import StapleAddSheet from "./StapleAddSheet";
import type { StapleItem } from "@/types";

const AISLE_CONFIG: Record<string, { color: string; emoji: string }> = {
  "Produce":            { color: "#16a34a", emoji: "🥦" },
  "Meat & Seafood":     { color: "#dc2626", emoji: "🥩" },
  "Dairy":              { color: "#2563eb", emoji: "🥛" },
  "Grains & Pasta":     { color: "#d97706", emoji: "🌾" },
  "Canned & Dry Goods": { color: "#0d9488", emoji: "🥫" },
  "Bakery":             { color: "#c2410c", emoji: "🥐" },
  "Baking":             { color: "#f59e0b", emoji: "🧁" },
  "Spices & Herbs":     { color: "#7c3aed", emoji: "🌿" },
  "Oils & Condiments":  { color: "#ea580c", emoji: "🫙" },
  "Frozen":             { color: "#0891b2", emoji: "🧊" },
  "Beverages":          { color: "#8b5cf6", emoji: "🧃" },
  "Nuts & Snacks":      { color: "#b45309", emoji: "🥜" },
  "Miscellaneous":      { color: "#6b7280", emoji: "📦" },
};
const DEFAULT_CONFIG = { color: "#6b7280", emoji: "🛒" };

export default function StaplesTab() {
  const { state, dispatch } = useAppContext();
  const [addSheetOpen, setAddSheetOpen] = useState(false);
  const [editingStaple, setEditingStaple] = useState<StapleItem | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const inListIds = useMemo(
    () => new Set(state.manualGroceryItems.map((i) => i.stapleId).filter(Boolean)),
    [state.manualGroceryItems]
  );

  const allInList = state.staples.length > 0 && state.staples.every((s) => inListIds.has(s.id));

  const byAisle = useMemo(() => {
    const map: Record<string, StapleItem[]> = {};
    for (const s of state.staples) {
      const aisle = s.aisle || "Miscellaneous";
      (map[aisle] ??= []).push(s);
    }
    const sorted = Object.entries(map).sort(([a], [b]) => {
      if (a === "Miscellaneous") return 1;
      if (b === "Miscellaneous") return -1;
      return a.localeCompare(b);
    });
    return sorted;
  }, [state.staples]);

  const handleClose = () => {
    setAddSheetOpen(false);
    setEditingStaple(null);
  };

  if (state.staples.length === 0) {
    return (
      <>
        <EmptyState
          icon={<ShoppingCart size={48} />}
          title="No staples yet"
          description="Add items you always keep stocked — then pull them into your list each week"
          action={
            <button
              onClick={() => setAddSheetOpen(true)}
              className="px-6 py-3 bg-brand-500 text-white rounded-xl text-sm font-semibold"
            >
              Add staple
            </button>
          }
        />
        <StapleAddSheet key={addSheetOpen ? "new" : "closed"} open={addSheetOpen} onClose={handleClose} />
      </>
    );
  }

  return (
    <div className="pb-6">
      {/* Actions bar */}
      <div className="flex items-center justify-between px-4 py-3 gap-2">
        <button
          onClick={() => dispatch({ type: "ADD_ALL_STAPLES_TO_LIST" })}
          disabled={allInList}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-brand-500 text-white text-sm font-medium disabled:opacity-40 active:bg-brand-600"
        >
          <ShoppingCart size={14} />
          {allInList ? "All in list" : "Add all to list"}
        </button>
        <button
          onClick={() => setAddSheetOpen(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-100 text-gray-700 text-sm font-medium active:bg-gray-200"
        >
          <Plus size={14} />
          Add staple
        </button>
      </div>

      {/* Staples grouped by aisle */}
      {byAisle.map(([aisle, items]) => {
        const config = AISLE_CONFIG[aisle] ?? DEFAULT_CONFIG;
        return (
          <div key={aisle}>
            <h3
              className="text-xs font-bold uppercase tracking-widest px-4 pt-4 pb-2 flex items-center gap-1.5"
              style={{ color: config.color }}
            >
              <span>{config.emoji}</span> {aisle}
            </h3>
            <div
              className="bg-white rounded-2xl border border-gray-200 overflow-hidden mx-4"
              style={{ borderLeft: `4px solid ${config.color}` }}
            >
              {items.map((staple, i) => {
                const inList = inListIds.has(staple.id);
                return (
                  <div
                    key={staple.id}
                    className={`flex items-center gap-3 px-4 py-3.5 ${i > 0 ? "border-t border-gray-50" : ""}`}
                  >
                    {/* Tappable name + store badge — opens edit sheet */}
                    <button
                      onClick={() => setEditingStaple(staple)}
                      className="flex-1 flex items-center gap-2 text-left min-w-0"
                    >
                      <span className={`text-sm truncate ${inList ? "text-gray-400" : "text-gray-800"}`}>
                        {staple.name}
                      </span>
                      {staple.store && (
                        <span className="text-xs bg-brand-50 text-brand-600 border border-brand-200 rounded-full px-2 py-0.5 flex-shrink-0">
                          {staple.store}
                        </span>
                      )}
                    </button>

                    {/* Add to / remove from list */}
                    <button
                      onClick={() => dispatch({ type: "TOGGLE_STAPLE_IN_LIST", stapleId: staple.id })}
                      className={`flex-shrink-0 transition-all ${inList ? "bg-brand-500 text-white rounded-full p-1.5 hover:bg-brand-600" : "p-1.5 text-gray-300 hover:text-brand-400"}`}
                      title={inList ? "Remove from list" : "Add to list"}
                    >
                      <ShoppingCart size={16} />
                    </button>

                    {/* Delete with confirm */}
                    {confirmingId === staple.id ? (
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => { dispatch({ type: "REMOVE_STAPLE", id: staple.id }); setConfirmingId(null); }}
                          className="p-1 text-red-500 hover:text-red-700 transition-colors"
                        >
                          <Check size={14} />
                        </button>
                        <button
                          onClick={() => setConfirmingId(null)}
                          className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmingId(staple.id)}
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
      })}

      <StapleAddSheet
        key={editingStaple?.id ?? (addSheetOpen ? "new" : "closed")}
        open={addSheetOpen || editingStaple !== null}
        onClose={handleClose}
        editingStaple={editingStaple ?? undefined}
      />
    </div>
  );
}
