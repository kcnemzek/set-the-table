"use client";

import { useState, useEffect } from "react";
import BottomSheet from "@/components/shared/BottomSheet";
import { useAppContext } from "@/store/context";
import type { Tip } from "@/types";

const CATEGORIES = ["Technique", "Timing", "Substitution", "Storage", "General"];

interface TipSheetProps {
  open: boolean;
  onClose: () => void;
  existing?: Tip;
}

export default function TipSheet({ open, onClose, existing }: TipSheetProps) {
  const { dispatch } = useAppContext();
  const [title, setTitle] = useState(existing?.title ?? "");
  const [body, setBody] = useState(existing?.body ?? "");
  const [category, setCategory] = useState(existing?.category ?? "");
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (open) {
      setTitle(existing?.title ?? "");
      setBody(existing?.body ?? "");
      setCategory(existing?.category ?? "");
      setShowConfirm(false);
    }
  }, [open, existing]);

  function isDirty() {
    if (existing) {
      return (
        title !== existing.title ||
        body !== existing.body ||
        category !== (existing.category ?? "")
      );
    }
    return title.trim() !== "" || body.trim() !== "";
  }

  function handleClose() {
    if (isDirty()) {
      setShowConfirm(true);
    } else {
      onClose();
    }
  }

  function handleSave() {
    if (!title.trim() || !body.trim()) return;

    const tip: Tip = {
      id: existing?.id ?? crypto.randomUUID(),
      title: title.trim(),
      body: body.trim(),
      category: category || undefined,
      createdAt: existing?.createdAt ?? new Date().toISOString(),
    };

    dispatch({ type: existing ? "UPDATE_TIP" : "ADD_TIP", tip });
    onClose();
  }

  return (
    <BottomSheet
      open={open}
      onClose={handleClose}
      title={existing ? "Edit Tip" : "New Tip"}
    >
      {showConfirm && (
        <div className="absolute inset-0 z-10 flex items-end justify-center bg-black/20 rounded-t-2xl">
          <div className="w-full bg-white rounded-t-2xl p-6 space-y-3 shadow-xl">
            <p className="text-base font-semibold text-gray-800">Discard changes?</p>
            <p className="text-sm text-gray-500">Your unsaved changes will be lost.</p>
            <button
              onClick={onClose}
              className="w-full py-3 rounded-xl bg-red-500 text-white font-semibold text-sm active:bg-red-600"
            >
              Discard
            </button>
            <button
              onClick={() => setShowConfirm(false)}
              className="w-full py-3 rounded-xl border border-gray-200 text-gray-700 font-semibold text-sm active:bg-gray-50"
            >
              Keep Editing
            </button>
          </div>
        </div>
      )}

      <div className="p-4 space-y-4 pb-8">
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. How to poach chicken"
            className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Category (optional)
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 bg-white"
          >
            <option value="">No category</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Notes
          </label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="e.g. Bring water to a gentle simmer (not a rolling boil)..."
            rows={6}
            className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 resize-none"
          />
        </div>

        <button
          onClick={handleSave}
          disabled={!title.trim() || !body.trim()}
          className="w-full py-3.5 bg-brand-500 text-white rounded-xl font-semibold text-sm disabled:opacity-40 active:bg-brand-600"
        >
          {existing ? "Save Changes" : "Save Tip"}
        </button>
      </div>
    </BottomSheet>
  );
}
