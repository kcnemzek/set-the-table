"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, CalendarCheck, Bookmark, ScrollText, ChevronRight, Pencil, Check, Trash2, ChevronsDown, Copy } from "lucide-react";
import clsx from "clsx";
import { useAppContext } from "@/store/context";
import BottomSheet from "@/components/shared/BottomSheet";
import EmptyState from "@/components/shared/EmptyState";
import AddEntrySheet from "@/components/menu/AddEntrySheet";
import SaveMenuSheet from "@/components/menu/SaveMenuSheet";
import DayPickerSheet from "@/components/recipes/DayPickerSheet";
import RecipeDetailSheet from "@/components/recipes/RecipeDetailSheet";
import CustomRecipeSheet from "@/components/recipes/CustomRecipeSheet";
import { getRecipeEmoji } from "@/lib/recipe-emoji";
import type { EventPlan, DayEntry, RecipeSummary, CustomRecipe } from "@/types";

type Tab = "events" | "menus";

export default function EventPlanningPage() {
  const router = useRouter();
  const { state, dispatch } = useAppContext();
  const [tab, setTab] = useState<Tab>("events");

  // New event sheet
  const [newEventOpen, setNewEventOpen] = useState(false);
  const [newEventName, setNewEventName] = useState("");
  const [newEventDate, setNewEventDate] = useState("");

  // Copy event sheet
  const [copySourceId, setCopySourceId] = useState<string | null>(null);
  const [copyName, setCopyName] = useState("");
  const [copyDate, setCopyDate] = useState("");

  // Saved Menus state
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);
  const [pickerEntry, setPickerEntry] = useState<DayEntry | null>(null);
  const [addAllMenuId, setAddAllMenuId] = useState<string | null>(null);
  const [addingToMenuId, setAddingToMenuId] = useState<string | null>(null);
  const [renamingMenuId, setRenamingMenuId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [newMenuOpen, setNewMenuOpen] = useState(false);
  const [viewingMenuRecipe, setViewingMenuRecipe] = useState<RecipeSummary | null>(null);
  const [viewingMenuCustom, setViewingMenuCustom] = useState<CustomRecipe | null>(null);
  const [confirmDeleteMenu, setConfirmDeleteMenu] = useState<{ id: string; name: string } | null>(null);
  const [confirmDeleteEvent, setConfirmDeleteEvent] = useState<{ id: string; name: string } | null>(null);

  const today = new Date(new Date().toDateString());
  const sortedEvents = [...state.eventPlans].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  const upcomingEvents = sortedEvents.filter((p) => new Date(p.date + "T00:00:00") >= today);
  const pastEvents = sortedEvents.filter((p) => new Date(p.date + "T00:00:00") < today);

  function handleCopyEvent() {
    if (!copySourceId || !copyName.trim() || !copyDate) return;
    dispatch({ type: "COPY_EVENT_PLAN", sourceId: copySourceId, newId: crypto.randomUUID(), name: copyName.trim(), date: copyDate });
    setCopySourceId(null);
    setCopyName("");
    setCopyDate("");
  }

  function handleCreateEvent() {
    if (!newEventName.trim() || !newEventDate) return;
    const plan: EventPlan = {
      id: crypto.randomUUID(),
      name: newEventName.trim(),
      date: newEventDate,
      dishes: [],
      tasks: [],
      addedToGroceries: false,
      createdAt: new Date().toISOString(),
    };
    dispatch({ type: "ADD_EVENT_PLAN", plan });
    setNewEventName("");
    setNewEventDate("");
    setNewEventOpen(false);
    router.push(`/event-planning/${plan.id}`);
  }

  const handleViewMenuEntry = (entry: DayEntry) => {
    if (entry.type === "recipe" && entry.recipeId) {
      setViewingMenuRecipe({ id: entry.recipeId, title: entry.recipeTitle ?? "", image: entry.recipeImage ?? "", readyInMinutes: 0, servings: 0, sourceUrl: entry.recipeUrl });
    } else if (entry.type === "custom-recipe" && entry.customRecipeId) {
      const cr = state.customRecipes.find((r) => r.id === entry.customRecipeId);
      if (cr) setViewingMenuCustom(cr);
    } else if (entry.type === "text" && entry.url) {
      window.open(entry.url, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div className="pb-6">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-lg font-bold text-gray-800">Event Planning</h1>
          {tab === "events" && (
            <button
              onClick={() => setNewEventOpen(true)}
              className="flex items-center gap-1.5 bg-brand-500 text-white rounded-xl text-sm font-medium px-4 py-2 active:bg-brand-600"
            >
              <Plus size={16} />
              New Event
            </button>
          )}
          {tab === "menus" && (
            <button
              onClick={() => setNewMenuOpen(true)}
              className="flex items-center gap-1.5 bg-brand-500 text-white rounded-xl text-sm font-medium px-4 py-2 active:bg-brand-600"
            >
              <Plus size={16} />
              New Menu
            </button>
          )}
        </div>
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
          {(["events", "menus"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={clsx(
                "flex-1 py-1.5 rounded-lg text-sm font-medium transition-colors",
                tab === t ? "bg-white text-gray-800 shadow-sm" : "text-gray-500 hover:text-gray-700"
              )}
            >
              {t === "events" ? "Events" : "Saved Menus"}
            </button>
          ))}
        </div>
      </div>

      {/* Events Tab */}
      {tab === "events" && (
        <div className="p-4 space-y-3">
          {sortedEvents.length === 0 ? (
            <EmptyState
              icon={<CalendarCheck size={48} />}
              title="No events yet"
              description="Plan a holiday dinner, birthday party, or any special occasion"
              action={
                <button
                  onClick={() => setNewEventOpen(true)}
                  className="px-6 py-3 bg-brand-500 text-white rounded-xl text-sm font-semibold"
                >
                  New Event
                </button>
              }
            />
          ) : (
            <>
              {upcomingEvents.map((plan) => {
                const eventDate = new Date(plan.date + "T00:00:00");
                return (
                  <div key={plan.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                    <div
                      className="flex items-center gap-3 px-4 py-4 cursor-pointer hover:bg-gray-50 active:bg-gray-100"
                      onClick={() => router.push(`/event-planning/${plan.id}`)}
                    >
                      <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center flex-shrink-0">
                        <CalendarCheck size={20} className="text-brand-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">{plan.name}</p>
                        <p className="text-xs text-gray-500">
                          {eventDate.toLocaleDateString("en-US", { weekday: "short", month: "long", day: "numeric", year: "numeric" })}
                          {" · "}{plan.dishes.length} dish{plan.dishes.length !== 1 ? "es" : ""}
                          {" · "}{plan.tasks.length} task{plan.tasks.length !== 1 ? "s" : ""}
                          {plan.addedToGroceries && " · 🛒"}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => { e.stopPropagation(); setCopySourceId(plan.id); setCopyName(plan.name + " (copy)"); setCopyDate(""); }}
                          className="p-1.5 rounded-lg text-gray-300 hover:text-brand-500 hover:bg-brand-50 transition-colors"
                          title="Copy event"
                        >
                          <Copy size={14} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setConfirmDeleteEvent({ id: plan.id, name: plan.name }); }}
                          className="p-1.5 rounded-lg text-gray-300 hover:text-red-400 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                        <ChevronRight size={16} className="text-gray-400" />
                      </div>
                    </div>
                  </div>
                );
              })}

              {pastEvents.length > 0 && (
                <>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest px-1 pt-2">Past Events</p>
                  {pastEvents.map((plan) => {
                    const eventDate = new Date(plan.date + "T00:00:00");
                    return (
                      <div key={plan.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden opacity-70">
                        <div
                          className="flex items-center gap-3 px-4 py-4 cursor-pointer hover:bg-gray-50 active:bg-gray-100"
                          onClick={() => router.push(`/event-planning/${plan.id}`)}
                        >
                          <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                            <CalendarCheck size={20} className="text-gray-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-500 truncate">{plan.name}</p>
                            <p className="text-xs text-gray-400">
                              {eventDate.toLocaleDateString("en-US", { weekday: "short", month: "long", day: "numeric", year: "numeric" })}
                              {" · "}{plan.dishes.length} dish{plan.dishes.length !== 1 ? "es" : ""}
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={(e) => { e.stopPropagation(); setCopySourceId(plan.id); setCopyName(plan.name + " (copy)"); setCopyDate(""); }}
                              className="p-1.5 rounded-lg text-gray-300 hover:text-brand-500 hover:bg-brand-50 transition-colors"
                              title="Copy event"
                            >
                              <Copy size={14} />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); setConfirmDeleteEvent({ id: plan.id, name: plan.name }); }}
                              className="p-1.5 rounded-lg text-gray-300 hover:text-red-400 hover:bg-red-50 transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                            <ChevronRight size={16} className="text-gray-400" />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </>
          )}
        </div>
      )}

      {/* Saved Menus Tab */}
      {tab === "menus" && (
        <div className="p-4 space-y-3">
          {state.savedMenus.length === 0 ? (
            <EmptyState
              icon={<Bookmark size={48} />}
              title="No saved menus yet"
              description="Tap the bookmark icon on any day to save it, or create a new one above"
            />
          ) : (
            state.savedMenus.map((savedMenu) => (
              <div key={savedMenu.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                <div
                  className="flex items-center gap-2 px-4 py-3 cursor-pointer select-none"
                  onClick={() => setExpandedMenu(expandedMenu === savedMenu.id ? null : savedMenu.id)}
                >
                  <ScrollText size={16} className="text-brand-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    {renamingMenuId === savedMenu.id ? (
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <input
                          autoFocus
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && renameValue.trim()) {
                              dispatch({ type: "RENAME_SAVED_MENU", id: savedMenu.id, name: renameValue.trim() });
                              setRenamingMenuId(null);
                            }
                            if (e.key === "Escape") setRenamingMenuId(null);
                          }}
                          className="flex-1 text-sm font-semibold rounded-lg border border-brand-300 px-2 py-1 focus:outline-none focus:ring-2 focus:ring-brand-400"
                        />
                        <button
                          onClick={() => {
                            if (renameValue.trim()) dispatch({ type: "RENAME_SAVED_MENU", id: savedMenu.id, name: renameValue.trim() });
                            setRenamingMenuId(null);
                          }}
                          className="p-1 text-brand-500 hover:text-brand-700"
                        >
                          <Check size={16} />
                        </button>
                      </div>
                    ) : (
                      <p className="text-sm font-semibold text-gray-800 truncate">{savedMenu.name}</p>
                    )}
                    <p className="text-xs text-gray-500">
                      {savedMenu.entries.length} item{savedMenu.entries.length !== 1 ? "s" : ""} · {new Date(savedMenu.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); setRenamingMenuId(savedMenu.id); setRenameValue(savedMenu.name); }}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-gray-500 hover:bg-gray-100 transition-colors"
                      title="Rename"
                    ><Pencil size={14} /></button>
                    {savedMenu.entries.length > 0 && (
                      <button
                        onClick={(e) => { e.stopPropagation(); setAddAllMenuId(savedMenu.id); }}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-brand-500 hover:bg-brand-50 transition-colors"
                        title="Add all to a day"
                      ><ChevronsDown size={15} /></button>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); setConfirmDeleteMenu({ id: savedMenu.id, name: savedMenu.name }); }}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-50 transition-colors"
                      title="Delete"
                    ><Trash2 size={14} /></button>
                    <div className="p-1.5">
                      <ChevronRight size={16} className={clsx("transition-transform text-gray-500", expandedMenu === savedMenu.id && "rotate-90")} />
                    </div>
                  </div>
                </div>
                {expandedMenu === savedMenu.id && (
                  <div className="border-t border-gray-100 divide-y divide-gray-50">
                    {savedMenu.entries.map((entry) => {
                      const canView = entry.type === "recipe" || entry.type === "custom-recipe" || (entry.type === "text" && !!entry.url);
                      return (
                        <div key={entry.id} className="flex items-center gap-2 hover:bg-brand-50 active:bg-brand-100">
                          <button
                            onClick={() => canView ? handleViewMenuEntry(entry) : undefined}
                            className="flex items-center gap-3 flex-1 min-w-0 px-4 py-3 text-left"
                          >
                            {(entry.type === "recipe" || entry.type === "custom-recipe") && entry.recipeImage ? (
                              <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={entry.recipeImage} alt={entry.recipeTitle ?? ""} className="w-full h-full object-cover"
                                  onError={(e) => { if (entry.recipeId) (e.target as HTMLImageElement).src = `/api/recipes/${entry.recipeId}/image`; }} />
                              </div>
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-brand-50 flex items-center justify-center text-xl flex-shrink-0">
                                {entry.type === "event" ? "🎉" : entry.type === "text" ? "📝" : (() => {
                                  const cr = entry.type === "custom-recipe" ? state.customRecipes.find((r) => r.id === entry.customRecipeId) : undefined;
                                  return getRecipeEmoji(entry.recipeTitle ?? "", cr?.category, cr?.emoji);
                                })()}
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-800 line-clamp-2">{entry.recipeTitle ?? entry.text ?? ""}</p>
                              <p className="text-xs text-gray-500 capitalize">{entry.type === "custom-recipe" ? "my recipe" : entry.type}</p>
                            </div>
                          </button>
                          <button onClick={() => setPickerEntry(entry)} className="flex-shrink-0 p-2 mr-2 rounded-xl text-brand-500 hover:bg-brand-100" aria-label="Add to day">
                            <Plus size={18} />
                          </button>
                        </div>
                      );
                    })}
                    <button
                      onClick={() => setAddingToMenuId(savedMenu.id)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm text-brand-500 hover:bg-brand-50 active:bg-brand-100"
                    >
                      <Plus size={15} />
                      Add items
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Copy Event Sheet */}
      <BottomSheet open={!!copySourceId} onClose={() => setCopySourceId(null)} title="Copy Event">
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New event name</label>
            <input
              autoFocus
              type="text"
              value={copyName}
              onChange={(e) => setCopyName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCopyEvent()}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New date</label>
            <input
              type="date"
              value={copyDate}
              onChange={(e) => setCopyDate(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
          </div>
          <p className="text-xs text-gray-400">Dishes and tasks will be copied. Relative-date tasks will recalculate automatically.</p>
          <button
            onClick={handleCopyEvent}
            disabled={!copyName.trim() || !copyDate}
            className="w-full py-3 bg-brand-500 text-white rounded-xl text-sm font-semibold disabled:opacity-40"
          >
            Copy Event
          </button>
        </div>
      </BottomSheet>

      {/* New Event Sheet */}
      <BottomSheet open={newEventOpen} onClose={() => setNewEventOpen(false)} title="New Event">
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Event name</label>
            <input
              autoFocus
              type="text"
              placeholder="e.g. Thanksgiving 2025"
              value={newEventName}
              onChange={(e) => setNewEventName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreateEvent()}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input
              type="date"
              value={newEventDate}
              onChange={(e) => setNewEventDate(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
          </div>
          <button
            onClick={handleCreateEvent}
            disabled={!newEventName.trim() || !newEventDate}
            className="w-full py-3 bg-brand-500 text-white rounded-xl text-sm font-semibold disabled:opacity-40"
          >
            Create Event
          </button>
        </div>
      </BottomSheet>

      {/* Saved Menus sheets */}
      {pickerEntry && (
        <DayPickerSheet
          open={!!pickerEntry}
          onClose={() => setPickerEntry(null)}
          recipe={{ id: "", title: pickerEntry.recipeTitle ?? pickerEntry.text ?? "", image: "", readyInMinutes: 0, servings: 0 }}
          entry={pickerEntry}
          onAdded={() => setPickerEntry(null)}
        />
      )}
      <RecipeDetailSheet recipe={viewingMenuRecipe} onClose={() => setViewingMenuRecipe(null)} />
      <CustomRecipeSheet open={!!viewingMenuCustom} onClose={() => setViewingMenuCustom(null)} existing={viewingMenuCustom ?? undefined} />
      {addAllMenuId && (() => {
        const m = state.savedMenus.find((s) => s.id === addAllMenuId);
        return m ? (
          <DayPickerSheet
            open={!!addAllMenuId}
            onClose={() => setAddAllMenuId(null)}
            recipe={{ id: "", title: m.name, image: "", readyInMinutes: 0, servings: 0 }}
            entries={m.entries}
            onAdded={() => setAddAllMenuId(null)}
          />
        ) : null;
      })()}
      {addingToMenuId && (
        <AddEntrySheet
          open={!!addingToMenuId}
          onClose={() => setAddingToMenuId(null)}
          dateStr=""
          dateLabel={state.savedMenus.find((m) => m.id === addingToMenuId)?.name ?? "Menu"}
          onAddEntry={(entry) => dispatch({ type: "ADD_ENTRY_TO_SAVED_MENU", savedMenuId: addingToMenuId, entry })}
        />
      )}
      <SaveMenuSheet open={newMenuOpen} onClose={() => setNewMenuOpen(false)} entries={[]} />

      {/* Delete event confirmation */}
      {confirmDeleteEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={() => setConfirmDeleteEvent(null)}>
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-base font-semibold text-gray-800 mb-1">Delete Event?</h2>
            <p className="text-sm text-gray-500 mb-4">&ldquo;{confirmDeleteEvent.name}&rdquo; and all its dishes and tasks will be permanently removed.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDeleteEvent(null)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600">Cancel</button>
              <button
                onClick={() => { dispatch({ type: "DELETE_EVENT_PLAN", id: confirmDeleteEvent.id }); setConfirmDeleteEvent(null); }}
                className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-medium"
              >Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete menu confirmation */}
      {confirmDeleteMenu && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={() => setConfirmDeleteMenu(null)}>
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-base font-semibold text-gray-800 mb-1">Delete Menu?</h2>
            <p className="text-sm text-gray-500 mb-4">&ldquo;{confirmDeleteMenu.name}&rdquo; will be permanently removed.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDeleteMenu(null)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600">Cancel</button>
              <button
                onClick={() => { dispatch({ type: "DELETE_SAVED_MENU", id: confirmDeleteMenu.id }); setConfirmDeleteMenu(null); }}
                className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-medium"
              >Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
