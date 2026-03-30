"use client";

import { useState, useRef } from "react";
import { Plus, Share2, Check, Bookmark } from "lucide-react";
import DayPickerSheet from "@/components/recipes/DayPickerSheet";
import clsx from "clsx";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import DayEntryItem from "./DayEntryItem";
import AddEntrySheet from "./AddEntrySheet";
import EditNoteSheet from "./EditNoteSheet";
import CustomRecipeSheet from "@/components/recipes/CustomRecipeSheet";
import { useAppContext } from "@/store/context";
import { formatDateLabelRelative } from "@/lib/dates";
import { getRecipeEmoji } from "@/lib/recipe-emoji";
import type { CustomRecipe, DayEntry, RecipeSummary } from "@/types";
import MenuShareCard from "./MenuShareCard";
import SaveMenuSheet from "./SaveMenuSheet";

interface DayCardProps {
  dateStr: string;
  isToday: boolean;
}

export default function DayCard({ dateStr, isToday }: DayCardProps) {
  const { state, removeDayEntry, dispatch } = useAppContext();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [viewingRecipe, setViewingRecipe] = useState<CustomRecipe | null>(null);
  const [editingNote, setEditingNote] = useState<DayEntry | null>(null);
  const [copied, setCopied] = useState(false);
  const [saveMenuOpen, setSaveMenuOpen] = useState(false);
  const [movingEntry, setMovingEntry] = useState<DayEntry | null>(null);
  const shareCardRef = useRef<HTMLDivElement>(null);

  const allEntries = state.menu[dateStr] ?? [];
  const eventEntries = allEntries.filter((e) => e.type === "event");
  const menuEntries = allEntries.filter((e) => e.type !== "event");
  const entries = [...eventEntries, ...menuEntries];

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = menuEntries.findIndex((e) => e.id === active.id);
    const newIndex = menuEntries.findIndex((e) => e.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const reordered = arrayMove(menuEntries, oldIndex, newIndex);
    dispatch({ type: "REORDER_DAY_ENTRIES", dateStr, entries: [...eventEntries, ...reordered] });
  }
  const { primary, secondary } = formatDateLabelRelative(dateStr);

  function buildShareText(): string {
    const [y, m, d] = dateStr.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    const fullDate = date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

    const eventEntry = entries.find((e) => e.type === "event");
    const menuEntries = entries.filter((e) => e.type !== "event");

    const lines: string[] = [];

    if (eventEntry) {
      lines.push(eventEntry.text ?? "");
      lines.push(fullDate);
    } else {
      lines.push(`📅 ${fullDate}`);
    }

    if (menuEntries.length > 0) {
      lines.push("");
      for (const entry of menuEntries) {
        if (entry.type === "recipe" || entry.type === "custom-recipe") {
          lines.push(entry.recipeTitle ?? "");
        } else if (entry.type === "text") {
          lines.push(entry.url ? `${entry.text} — ${entry.url}` : `${entry.text ?? ""}`);
        }
      }
    }

    if (eventEntry) {
      lines.push("");
      lines.push("See you there! 🙌");
    }

    return lines.join("\n");
  }

  async function handleShare() {
    // Try to share as an image first
    if (shareCardRef.current && navigator.share) {
      try {
        const { toPng } = await import("html-to-image");
        const dataUrl = await toPng(shareCardRef.current, { pixelRatio: 2 });
        const res = await fetch(dataUrl);
        const blob = await res.blob();
        const file = new File([blob], "menu.png", { type: "image/png" });
        if (navigator.canShare?.({ files: [file] })) {
          await navigator.share({ files: [file] });
          return;
        }
      } catch { /* fall through to text share */ }
    }

    // Fall back to text
    const text = buildShareText();
    if (navigator.share) {
      try { await navigator.share({ text }); } catch { /* dismissed */ }
    } else {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  function getOnOpen(entry: DayEntry): (() => void) | undefined {
    if (entry.type === "recipe" && entry.recipeUrl) {
      return () => window.open(entry.recipeUrl, "_blank", "noopener,noreferrer");
    }
    if (entry.type === "custom-recipe" && entry.customRecipeId) {
      const cr = state.customRecipes.find((r) => r.id === entry.customRecipeId);
      if (cr) {
        if (cr.url) return () => window.open(cr.url, "_blank", "noopener,noreferrer");
        return () => setViewingRecipe(cr);
      }
    }
    if (entry.type === "text" || entry.type === "event") {
      return () => setEditingNote(entry);
    }
    return undefined;
  }

  return (
    <div
      className={clsx(
        "bg-white rounded-2xl shadow-sm border",
        isToday ? "border-brand-300 ring-1 ring-brand-200" : "border-gray-200"
      )}
    >
      {/* Day Header */}
      <div
        className={clsx(
          "flex items-center justify-between px-4 py-3 rounded-t-2xl",
          isToday ? "bg-brand-500" : "bg-gray-100"
        )}
      >
        <div>
          <p
            className={clsx(
              "font-semibold text-base leading-tight",
              isToday ? "text-white" : "text-gray-800"
            )}
          >
            {primary}
          </p>
          <p
            className={clsx(
              "text-xs leading-tight",
              isToday ? "text-brand-100" : "text-gray-500"
            )}
          >
            {secondary}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          {entries.length > 0 && (
            <>
              <button
                onClick={() => setSaveMenuOpen(true)}
                className={clsx(
                  "p-1.5 rounded-xl transition-colors",
                  isToday
                    ? "text-white/70 hover:text-white hover:bg-white/20 active:bg-white/30"
                    : "text-gray-400 hover:text-gray-600 hover:bg-gray-200 active:bg-gray-300"
                )}
                title="Save as menu"
              >
                <Bookmark size={15} />
              </button>
              <button
                onClick={handleShare}
                className={clsx(
                  "p-1.5 rounded-xl transition-colors",
                  isToday
                    ? "text-white/70 hover:text-white hover:bg-white/20 active:bg-white/30"
                    : "text-gray-400 hover:text-gray-600 hover:bg-gray-200 active:bg-gray-300"
                )}
                title="Share menu"
              >
                {copied ? <Check size={15} /> : <Share2 size={15} />}
              </button>
            </>
          )}
          <button
            onClick={() => setSheetOpen(true)}
            className={clsx(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors",
              isToday
                ? "bg-white/20 text-white hover:bg-white/30 active:bg-white/40"
                : "bg-brand-500 text-white hover:bg-brand-600 active:bg-brand-700"
            )}
          >
            <Plus size={14} />
            Add
          </button>
        </div>
      </div>

      {/* Entries */}
      <div className="px-4 py-1">
        {entries.length === 0 ? (
          <button
            onClick={() => setSheetOpen(true)}
            className="w-full py-4 text-sm text-gray-400 hover:text-gray-500 text-center"
          >
            Tap + to add something
          </button>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={menuEntries.map((e) => e.id)} strategy={verticalListSortingStrategy}>
              <div className="divide-y divide-gray-50">
                {entries.map((entry) => (
                  <DayEntryItem
                    key={entry.id}
                    entry={entry}
                    onRemove={() => removeDayEntry(dateStr, entry.id)}
                    onOpen={getOnOpen(entry)}
                    onMove={entry.type !== "event" ? () => setMovingEntry(entry) : undefined}
                    sortable={entry.type !== "event"}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>

      <AddEntrySheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        dateStr={dateStr}
        dateLabel={primary}
      />

      {viewingRecipe && (
        <CustomRecipeSheet
          key={viewingRecipe.id}
          open={true}
          onClose={() => setViewingRecipe(null)}
          existing={viewingRecipe}
        />
      )}

      {editingNote && (
        <EditNoteSheet
          open={true}
          onClose={() => setEditingNote(null)}
          entry={editingNote}
          dateStr={dateStr}
        />
      )}

      <SaveMenuSheet
        open={saveMenuOpen}
        onClose={() => setSaveMenuOpen(false)}
        entries={entries}
      />

      {movingEntry && (
        <DayPickerSheet
          open={!!movingEntry}
          onClose={() => setMovingEntry(null)}
          recipe={{ id: "", title: movingEntry.recipeTitle ?? movingEntry.text ?? "", image: "", readyInMinutes: 0, servings: 0 } as RecipeSummary}
          entry={movingEntry}
          onAdded={() => {
            removeDayEntry(dateStr, movingEntry.id);
            setMovingEntry(null);
          }}
        />
      )}

      {/* Off-screen card used for image generation */}
      <div className="fixed -left-[9999px] top-0 pointer-events-none" aria-hidden>
        <MenuShareCard ref={shareCardRef} dateStr={dateStr} entries={entries} />
      </div>
    </div>
  );
}
