"use client";

import { useState } from "react";
import BottomSheet from "@/components/shared/BottomSheet";
import { useAppContext } from "@/store/context";
import type { StapleItem } from "@/types";

const AISLES = [
  "Bakery", "Baking", "Beverages", "Canned & Dry Goods", "Dairy",
  "Frozen", "Grains & Pasta", "Meat & Seafood", "Nuts & Snacks",
  "Oils & Condiments", "Produce", "Spices & Herbs", "Miscellaneous",
];

interface StapleAddSheetProps {
  open: boolean;
  onClose: () => void;
  editingStaple?: StapleItem;
}

export default function StapleAddSheet({ open, onClose, editingStaple }: StapleAddSheetProps) {
  const { dispatch, state } = useAppContext();
  const [name, setName] = useState(editingStaple?.name ?? "");
  const [aisle, setAisle] = useState(editingStaple?.aisle ?? "Miscellaneous");
  const [store, setStore] = useState(editingStaple?.store ?? "");

  const handleSave = () => {
    if (!name.trim()) return;
    if (editingStaple) {
      dispatch({ type: "UPDATE_STAPLE", staple: { ...editingStaple, name: name.trim(), aisle, store: store || undefined } });
    } else {
      const staple: StapleItem = {
        id: crypto.randomUUID(),
        name: name.trim(),
        aisle,
        store: store || undefined,
      };
      dispatch({ type: "ADD_STAPLE", staple });
    }
    onClose();
  };

  return (
    <BottomSheet open={open} onClose={onClose} title={editingStaple ? "Edit Staple" : "Add Staple"}>
      <div className="p-4 space-y-4 pb-8">
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Item</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
            placeholder="e.g. Olive oil"
            autoFocus
            spellCheck
            autoCorrect="on"
            autoCapitalize="sentences"
            className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Aisle</label>
          <select
            value={aisle}
            onChange={(e) => setAisle(e.target.value)}
            className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 bg-white"
          >
            {AISLES.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Store <span className="font-normal normal-case text-gray-400">(optional)</span>
          </label>
          <select
            value={store}
            onChange={(e) => setStore(e.target.value)}
            className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 bg-white"
          >
            <option value="">Any store</option>
            {state.stores.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <button
          onClick={handleSave}
          disabled={!name.trim()}
          className="w-full py-3.5 bg-brand-500 text-white rounded-xl font-semibold text-sm disabled:opacity-40 active:bg-brand-600"
        >
          {editingStaple ? "Save" : "Add to Staples"}
        </button>
      </div>
    </BottomSheet>
  );
}
