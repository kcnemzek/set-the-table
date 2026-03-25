"use client";

import { Search, X } from "lucide-react";

interface SearchBarProps {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  placeholder?: string;
}

export default function SearchBar({
  value,
  onChange,
  onSubmit,
  placeholder = "Search recipes…",
}: SearchBarProps) {
  return (
    <div className="relative flex gap-2">
      <div className="relative flex-1">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onSubmit()}
          placeholder={placeholder}
          className="w-full pl-9 pr-9 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 bg-white"
        />
        {value && (
          <button
            onClick={() => onChange("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-500"
          >
            <X size={15} />
          </button>
        )}
      </div>
      <button
        onClick={onSubmit}
        disabled={!value.trim()}
        className="px-4 py-3 bg-brand-500 text-white rounded-xl text-sm font-medium disabled:opacity-40 active:bg-brand-600"
      >
        Go
      </button>
    </div>
  );
}
