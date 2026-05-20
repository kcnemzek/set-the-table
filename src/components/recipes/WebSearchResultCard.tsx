"use client";

import { ExternalLink, Loader2, AlertCircle, Globe, ArrowDownToLine } from "lucide-react";
import type { WebSearchResult } from "@/lib/recipe-search";

interface WebSearchResultCardProps {
  result: WebSearchResult;
  onImport: (result: WebSearchResult) => void;
  importing: boolean;
  importError?: string;
}

export default function WebSearchResultCard({
  result,
  onImport,
  importing,
  importError,
}: WebSearchResultCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-2 shadow-sm">
      <div className="flex items-center gap-1.5 text-xs text-gray-400">
        <Globe size={12} />
        <span>{result.domain}</span>
      </div>

      <a
        href={result.url}
        target="_blank"
        rel="noopener noreferrer"
        className="block text-sm font-semibold text-gray-800 leading-snug hover:text-brand-600"
      >
        {result.title}
      </a>

      <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{result.snippet}</p>

      {importError && (
        <div className="flex items-center gap-1.5 text-xs text-red-500">
          <AlertCircle size={12} />
          <span>{importError}</span>
        </div>
      )}

      <div className="flex gap-2 pt-1">
        <a
          href={result.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50 active:bg-gray-100"
        >
          <ExternalLink size={13} />
          View
        </a>
        <button
          onClick={() => onImport(result)}
          disabled={importing}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-brand-500 text-white text-xs font-medium hover:bg-brand-600 active:bg-brand-700 disabled:opacity-50"
        >
          {importing ? (
            <>
              <Loader2 size={13} className="animate-spin" />
              Importing…
            </>
          ) : (
            <>
              <ArrowDownToLine size={13} />
              Import
            </>
          )}
        </button>
      </div>
    </div>
  );
}
