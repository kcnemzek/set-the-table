"use client";

import { useState } from "react";
import BottomSheet from "@/components/shared/BottomSheet";
import { useAppContext } from "@/store/context";
import type { ManualGroceryItem } from "@/types";

const AISLES = [
  "Produce",
  "Meat & Seafood",
  "Dairy",
  "Grains & Pasta",
  "Canned & Dry Goods",
  "Baking",
  "Spices & Herbs",
  "Oils & Condiments",
  "Frozen",
  "Beverages",
  "Nuts & Snacks",
  "Miscellaneous",
];

interface ManualAddSheetProps {
  open: boolean;
  onClose: () => void;
}

export default function ManualAddSheet({ open, onClose }: ManualAddSheetProps) {
  const { dispatch, state } = useAppContext();
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [unit, setUnit] = useState("");
  const [aisle, setAisle] = useState("Miscellaneous");
  const [store, setStore] = useState("");

  const handleAdd = () => {
    if (!name.trim()) return;
    const item: ManualGroceryItem = {
      id: crypto.randomUUID(),
      name: name.trim(),
      amount: parseFloat(amount) || 0,
      unit: unit.trim(),
      aisle,
      checked: false,
      store: store.trim() || undefined,
    };
    dispatch({ type: "ADD_MANUAL_GROCERY", item });
    setName("");
    setAmount("");
    setUnit("");
    setAisle("Miscellaneous");
    setStore("");
    onClose();
  };

  return (
    <BottomSheet open={open} onClose={onClose} title="Add Item">
      <div className="p-4 space-y-4 pb-8">
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Item
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            placeholder="e.g. Olive oil"
            autoFocus
            className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
          />
        </div>

        <div className="flex gap-3">
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Amount
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              className="mt-1 w-20 rounded-xl border border-gray-200 px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Unit
            </label>
            <input
              type="text"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder="cups"
              className="mt-1 w-24 rounded-xl border border-gray-200 px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Aisle
          </label>
          <select
            value={aisle}
            onChange={(e) => setAisle(e.target.value)}
            className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 bg-white"
          >
            {AISLES.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Store <span className="font-normal normal-case text-gray-400">(optional — makes it a staple)</span>
          </label>
          <select
            value={store}
            onChange={(e) => setStore(e.target.value)}
            className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 bg-white"
          >
            <option value="">No store (one-time item)</option>
            {state.stores.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <button
          onClick={handleAdd}
          disabled={!name.trim()}
          className="w-full py-3.5 bg-brand-500 text-white rounded-xl font-semibold text-sm disabled:opacity-40 active:bg-brand-600"
        >
          Add to List
        </button>
      </div>
    </BottomSheet>
  );
}
