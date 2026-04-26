"use client";

import { useState } from "react";
import BottomSheet from "@/components/shared/BottomSheet";
import { useAppContext } from "@/store/context";
import type { DayEntry } from "@/types";

interface SaveMenuSheetProps {
  open: boolean;
  onClose: () => void;
  entries: DayEntry[];
}

export default function SaveMenuSheet({ open, onClose, entries }: SaveMenuSheetProps) {
  const { dispatch } = useAppContext();
  const [name, setName] = useState("");

  function handleSave() {
    if (!name.trim()) return;
    dispatch({
      type: "SAVE_DAY_AS_MENU",
      savedMenu: {
        id: crypto.randomUUID(),
        name: name.trim(),
        entries,
        createdAt: new Date().toISOString(),
      },
    });
    setName("");
    onClose();
  }

  function handleClose() {
    setName("");
    onClose();
  }

  return (
    <BottomSheet open={open} onClose={handleClose} title="Save as template">
      <div className="p-4 space-y-3">
        <p className="text-sm text-gray-500">Give this template a name so you can reuse it later.</p>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSave()}
          placeholder="e.g. Taco Tuesday, Pasta Night, Sunday Roast"
          spellCheck
          autoCorrect="on"
          autoCapitalize="words"
          className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
          autoFocus
        />
        <button
          onClick={handleSave}
          disabled={!name.trim()}
          className="w-full py-3 bg-brand-500 text-white rounded-xl text-sm font-semibold disabled:opacity-50 active:bg-brand-600"
        >
          Save
        </button>
      </div>
    </BottomSheet>
  );
}
