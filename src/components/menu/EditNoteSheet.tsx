"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import BottomSheet from "@/components/shared/BottomSheet";
import { useAppContext } from "@/store/context";
import type { DayEntry } from "@/types";

interface EditNoteSheetProps {
  open: boolean;
  onClose: () => void;
  entry: DayEntry;
  dateStr: string;
}

export default function EditNoteSheet({ open, onClose, entry, dateStr }: EditNoteSheetProps) {
  const { dispatch } = useAppContext();
  const [text, setText] = useState(entry.text ?? "");
  const [url, setUrl] = useState(entry.url ?? "");

  useEffect(() => {
    if (open) {
      setText(entry.text ?? "");
      setUrl(entry.url ?? "");
    }
  }, [open, entry]);

  const handleSave = () => {
    if (!text.trim()) return;
    dispatch({
      type: "UPDATE_DAY_ENTRY",
      dateStr,
      entry: { ...entry, text: text.trim(), url: url.trim() || undefined },
    });
    onClose();
  };

  return (
    <BottomSheet open={open} onClose={onClose} title="Edit Note">
      <div className="p-4 space-y-3 pb-8">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSave()}
          placeholder="e.g. Easter Brunch"
          className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
          autoFocus
        />
        {url.trim() ? (
          <div className="flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-3">
            <a
              href={url.trim()}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 text-sm text-brand-500 underline truncate"
            >
              {url.trim()}
            </a>
            <button onClick={() => setUrl("")} className="text-gray-400 hover:text-gray-600 flex-shrink-0">
              <X size={15} />
            </button>
          </div>
        ) : (
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Link (optional)"
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
          />
        )}
        <button
          onClick={handleSave}
          disabled={!text.trim()}
          className="w-full py-3.5 bg-brand-500 text-white rounded-xl font-semibold text-sm disabled:opacity-40 active:bg-brand-600"
        >
          Save
        </button>
      </div>
    </BottomSheet>
  );
}
