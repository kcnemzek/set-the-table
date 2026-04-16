"use client";

import { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, Pencil, Check, X, Plus, Trash2, ShoppingCart,
  ChefHat, UtensilsCrossed, CalendarDays, Clock, CheckSquare, Square,
  ChevronsDown, Search, BookOpen,
} from "lucide-react";
import clsx from "clsx";
import { useAppContext } from "@/store/context";
import BottomSheet from "@/components/shared/BottomSheet";
import AddEntrySheet from "@/components/menu/AddEntrySheet";
import DayPickerSheet from "@/components/recipes/DayPickerSheet";
import CustomRecipeSheet from "@/components/recipes/CustomRecipeSheet";
import RecipeDetailSheet from "@/components/recipes/RecipeDetailSheet";
import { getRecipeEmoji } from "@/lib/recipe-emoji";
import type { EventDish, EventTask, DayEntry, RecipeSummary, CustomRecipe } from "@/types";

// ─── Add/Edit Task Sheet ───────────────────────────────────────────────────────

function TaskSheet({
  open,
  onClose,
  onSave,
  initial,
  eventDate,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (task: Omit<EventTask, "id" | "completed">) => void;
  initial?: EventTask;
  eventDate: string;
}) {
  const { state } = useAppContext();
  const [text, setText] = useState(initial?.text ?? "");
  const [dateType, setDateType] = useState<"absolute" | "relative">(
    initial?.daysBeforeEvent !== undefined ? "relative" : "absolute"
  );
  const [date, setDate] = useState(initial?.date ?? "");
  const [daysBeforeEvent, setDaysBeforeEvent] = useState(initial?.daysBeforeEvent ?? 3);
  const [time, setTime] = useState(initial?.time ?? "");
  const [linkedRecipeId, setLinkedRecipeId] = useState(initial?.customRecipeId ?? "");
  const [recipeSearch, setRecipeSearch] = useState("");

  useMemo(() => {
    if (open) {
      setText(initial?.text ?? "");
      setDateType(initial?.daysBeforeEvent !== undefined ? "relative" : "absolute");
      setDate(initial?.date ?? "");
      setDaysBeforeEvent(initial?.daysBeforeEvent ?? 3);
      setTime(initial?.time ?? "");
      setLinkedRecipeId(initial?.customRecipeId ?? "");
      setRecipeSearch("");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const linkedRecipe = state.customRecipes.find((r) => r.id === linkedRecipeId);
  const filteredRecipes = recipeSearch.trim()
    ? state.customRecipes.filter((r) => r.title.toLowerCase().includes(recipeSearch.toLowerCase()))
    : state.customRecipes;

  const relativePreviewDate = (() => {
    const d = new Date(eventDate + "T00:00:00");
    d.setDate(d.getDate() - daysBeforeEvent);
    return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  })();

  const isValid = text.trim() && (dateType === "absolute" ? !!date : daysBeforeEvent >= 0);

  function handleSave() {
    if (!isValid) return;
    const task: Omit<EventTask, "id" | "completed"> = {
      text: text.trim(),
      time: time || undefined,
      customRecipeId: linkedRecipeId || undefined,
      recipeTitle: linkedRecipe?.title,
    };
    if (dateType === "relative") {
      task.daysBeforeEvent = daysBeforeEvent;
      // Also store computed date for sorting/display
      const d = new Date(eventDate + "T00:00:00");
      d.setDate(d.getDate() - daysBeforeEvent);
      task.date = d.toISOString().slice(0, 10);
    } else {
      task.date = date;
    }
    onSave(task);
    onClose();
  }

  return (
    <BottomSheet open={open} onClose={onClose} title={initial ? "Edit Task" : "Add Task"}>
      <div className="p-4 space-y-4 overflow-y-auto max-h-[70vh]">
        {/* Task text */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Task</label>
          <input
            autoFocus
            type="text"
            placeholder="e.g. Make Turkey Brine"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
            className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
          />
        </div>

        {/* When */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">When</label>
          <div className="flex gap-2 mb-3">
            <button
              onClick={() => setDateType("absolute")}
              className={clsx("flex-1 py-2 rounded-xl text-sm font-medium border transition-colors",
                dateType === "absolute" ? "bg-brand-50 text-brand-600 border-brand-200" : "bg-gray-50 text-gray-500 border-gray-200"
              )}
            >Specific date</button>
            <button
              onClick={() => setDateType("relative")}
              className={clsx("flex-1 py-2 rounded-xl text-sm font-medium border transition-colors",
                dateType === "relative" ? "bg-brand-50 text-brand-600 border-brand-200" : "bg-gray-50 text-gray-500 border-gray-200"
              )}
            >Before event</button>
          </div>
          {dateType === "absolute" ? (
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min={0}
                  value={daysBeforeEvent}
                  onChange={(e) => setDaysBeforeEvent(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-20 rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-brand-400"
                />
                <span className="text-sm text-gray-600">days before the event</span>
              </div>
              <p className="text-xs text-gray-400 px-1">
                {daysBeforeEvent === 0 ? "Day of the event" : `On ${relativePreviewDate}`}
              </p>
            </div>
          )}
        </div>

        {/* Time */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Time <span className="font-normal text-gray-400">(optional)</span>
          </label>
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
          />
        </div>

        {/* Recipe link */}
        {state.customRecipes.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Link a recipe <span className="font-normal text-gray-400">(optional)</span>
            </label>
            {linkedRecipe ? (
              <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-brand-50 border border-brand-200">
                <span className="text-xl">{getRecipeEmoji(linkedRecipe.title, linkedRecipe.category, linkedRecipe.emoji)}</span>
                <span className="flex-1 text-sm font-medium text-brand-700 truncate">{linkedRecipe.title}</span>
                <button onClick={() => { setLinkedRecipeId(""); setRecipeSearch(""); }} className="text-brand-400 hover:text-brand-600">
                  <X size={14} />
                </button>
              </div>
            ) : (
              <>
                <div className="relative mb-1">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <input
                    type="text"
                    value={recipeSearch}
                    onChange={(e) => setRecipeSearch(e.target.value)}
                    placeholder="Search my recipes…"
                    className="w-full pl-8 pr-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                  />
                </div>
                <div className="max-h-32 overflow-y-auto rounded-xl border border-gray-100">
                  {filteredRecipes.length === 0 ? (
                    <p className="text-xs text-gray-400 text-center py-3">No matches</p>
                  ) : filteredRecipes.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => setLinkedRecipeId(r.id)}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-brand-50 active:bg-brand-100"
                    >
                      <span className="text-base">{getRecipeEmoji(r.title, r.category, r.emoji)}</span>
                      <span className="text-sm text-gray-700 truncate">{r.title}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={!isValid}
          className="w-full py-3 bg-brand-500 text-white rounded-xl text-sm font-semibold disabled:opacity-40"
        >
          {initial ? "Save Changes" : "Add Task"}
        </button>
      </div>
    </BottomSheet>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { state, dispatch } = useAppContext();

  const plan = state.eventPlans.find((p) => p.id === id);

  // Editing header
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState("");
  const [editingDate, setEditingDate] = useState(false);
  const [dateValue, setDateValue] = useState("");

  // Sheets
  const [addDishOpen, setAddDishOpen] = useState(false);
  const [addTaskOpen, setAddTaskOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<EventTask | null>(null);
  const [confirmDeleteDish, setConfirmDeleteDish] = useState<{ id: string; title: string } | null>(null);
  const [confirmDeleteTask, setConfirmDeleteTask] = useState<{ id: string; text: string } | null>(null);
  // View + send-to-day
  const [viewingCustomRecipe, setViewingCustomRecipe] = useState<CustomRecipe | null>(null);
  const [viewingFavRecipe, setViewingFavRecipe] = useState<RecipeSummary | null>(null);
  const [sendDishEntry, setSendDishEntry] = useState<DayEntry | null>(null);
  const [sendAllOpen, setSendAllOpen] = useState(false);

  if (!plan) {
    return (
      <div className="p-8 text-center text-gray-500">
        <p className="text-sm">Event not found.</p>
        <button onClick={() => router.push("/event-planning")} className="mt-4 text-brand-500 text-sm font-medium">
          Back to Events
        </button>
      </div>
    );
  }

  const eventDate = new Date(plan.date + "T00:00:00");
  const formattedDate = eventDate.toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
  });

  // Helper: compute the effective calendar date for a task
  function getEffectiveDate(task: EventTask): string {
    if (task.date) return task.date;
    if (task.daysBeforeEvent !== undefined) {
      const d = new Date(plan!.date + "T00:00:00");
      d.setDate(d.getDate() - task.daysBeforeEvent);
      return d.toISOString().slice(0, 10);
    }
    return plan!.date;
  }

  // Helper: convert a dish to a DayEntry for DayPickerSheet
  function dishToDayEntry(dish: EventDish): DayEntry | null {
    if (dish.customRecipeId) {
      return { id: crypto.randomUUID(), type: "custom-recipe", customRecipeId: dish.customRecipeId, recipeTitle: dish.title };
    }
    if (dish.recipeId) {
      return { id: crypto.randomUUID(), type: "recipe", recipeId: dish.recipeId, recipeTitle: dish.title, recipeImage: dish.recipeImage, recipeUrl: dish.recipeUrl };
    }
    return null;
  }

  const linkedDishEntries: DayEntry[] = plan.dishes.flatMap((d) => {
    const entry = dishToDayEntry(d);
    return entry ? [entry] : [];
  });

  // Sort tasks by effective date then time
  const sortedTasks = [...plan.tasks].sort((a, b) => {
    const da = getEffectiveDate(a) + (a.time ? "T" + a.time : "T00:00");
    const db = getEffectiveDate(b) + (b.time ? "T" + b.time : "T00:00");
    return da.localeCompare(db);
  });

  // Group tasks by effective date
  const tasksByDate = sortedTasks.reduce<Record<string, EventTask[]>>((acc, task) => {
    const d = getEffectiveDate(task);
    (acc[d] ??= []).push(task);
    return acc;
  }, {});

  function startEditName() {
    setNameValue(plan!.name);
    setEditingName(true);
  }

  function saveName() {
    if (nameValue.trim()) {
      dispatch({ type: "UPDATE_EVENT_PLAN", plan: { ...plan!, name: nameValue.trim() } });
    }
    setEditingName(false);
  }

  function startEditDate() {
    setDateValue(plan!.date);
    setEditingDate(true);
  }

  function saveDate() {
    if (dateValue) {
      dispatch({ type: "UPDATE_EVENT_PLAN", plan: { ...plan!, date: dateValue } });
    }
    setEditingDate(false);
  }

  function handleAddDish(dish: Omit<EventDish, "id">) {
    dispatch({
      type: "ADD_EVENT_DISH",
      planId: plan!.id,
      dish: { ...dish, id: crypto.randomUUID() },
    });
  }

  function handleAddTask(taskData: Omit<EventTask, "id" | "completed">) {
    dispatch({
      type: "ADD_EVENT_TASK",
      planId: plan!.id,
      task: { ...taskData, id: crypto.randomUUID(), completed: false },
    });
  }

  function handleEditTask(taskData: Omit<EventTask, "id" | "completed">) {
    if (!editingTask) return;
    dispatch({
      type: "UPDATE_EVENT_TASK",
      planId: plan!.id,
      task: { ...editingTask, ...taskData },
    });
    setEditingTask(null);
  }

  function toggleTask(task: EventTask) {
    dispatch({
      type: "UPDATE_EVENT_TASK",
      planId: plan!.id,
      task: { ...task, completed: !task.completed },
    });
  }

  const completedCount = plan.tasks.filter((t) => t.completed).length;

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/event-planning")}
            className="p-1.5 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1 min-w-0">
            {editingName ? (
              <div className="flex items-center gap-2">
                <input
                  autoFocus
                  value={nameValue}
                  onChange={(e) => setNameValue(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") saveName(); if (e.key === "Escape") setEditingName(false); }}
                  className="flex-1 text-base font-bold rounded-lg border border-brand-300 px-2 py-1 focus:outline-none focus:ring-2 focus:ring-brand-400"
                />
                <button onClick={saveName} className="p-1 text-brand-500"><Check size={18} /></button>
                <button onClick={() => setEditingName(false)} className="p-1 text-gray-400"><X size={18} /></button>
              </div>
            ) : (
              <button
                onClick={startEditName}
                className="flex items-center gap-1.5 group text-left"
              >
                <h1 className="text-base font-bold text-gray-800 truncate">{plan.name}</h1>
                <Pencil size={13} className="text-gray-400 opacity-0 group-hover:opacity-100 flex-shrink-0" />
              </button>
            )}
            {editingDate ? (
              <div className="flex items-center gap-2 mt-0.5">
                <input
                  type="date"
                  autoFocus
                  value={dateValue}
                  onChange={(e) => setDateValue(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") saveDate(); if (e.key === "Escape") setEditingDate(false); }}
                  className="text-xs rounded-lg border border-brand-300 px-2 py-0.5 focus:outline-none focus:ring-2 focus:ring-brand-400"
                />
                <button onClick={saveDate} className="p-0.5 text-brand-500"><Check size={14} /></button>
                <button onClick={() => setEditingDate(false)} className="p-0.5 text-gray-400"><X size={14} /></button>
              </div>
            ) : (
              <button
                onClick={startEditDate}
                className="flex items-center gap-1 group mt-0.5"
              >
                <p className="text-xs text-gray-500">{formattedDate}</p>
                <Pencil size={11} className="text-gray-400 opacity-0 group-hover:opacity-100 flex-shrink-0" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="p-4 space-y-5">
        {/* Grocery toggle */}
        <button
          onClick={() => dispatch({ type: "TOGGLE_EVENT_GROCERIES", planId: plan.id })}
          className={clsx(
            "w-full flex items-center gap-3 px-4 py-3 rounded-2xl border transition-colors",
            plan.addedToGroceries
              ? "bg-brand-50 border-brand-200 text-brand-700"
              : "bg-white border-gray-200 text-gray-600"
          )}
        >
          <ShoppingCart size={18} className={plan.addedToGroceries ? "text-brand-500" : "text-gray-400"} />
          <div className="flex-1 text-left">
            <p className="text-sm font-medium">Add dishes to grocery list</p>
            <p className="text-xs text-gray-500 mt-0.5">
              {plan.addedToGroceries
                ? "Linked recipes will appear in your grocery list"
                : "Toggle on to include linked recipe ingredients"}
            </p>
          </div>
          <div className={clsx(
            "w-10 h-6 rounded-full flex items-center transition-colors flex-shrink-0",
            plan.addedToGroceries ? "bg-brand-500 justify-end" : "bg-gray-200 justify-start"
          )}>
            <div className="w-4 h-4 bg-white rounded-full mx-1 shadow-sm" />
          </div>
        </button>

        {/* Dishes section */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <UtensilsCrossed size={15} className="text-brand-500" />
              Dishes
              {plan.dishes.length > 0 && (
                <span className="text-xs font-normal text-gray-400">{plan.dishes.length}</span>
              )}
            </h2>
            <div className="flex items-center gap-1">
              {linkedDishEntries.length > 0 && (
                <button
                  onClick={() => setSendAllOpen(true)}
                  className="flex items-center gap-1 text-xs text-brand-500 font-medium hover:text-brand-600 px-2 py-1 rounded-lg hover:bg-brand-50"
                  title="Send all dishes to a day"
                >
                  <ChevronsDown size={13} />
                  Send all
                </button>
              )}
              <button
                onClick={() => setAddDishOpen(true)}
                className="flex items-center gap-1 text-xs text-brand-500 font-medium hover:text-brand-600 px-2 py-1 rounded-lg hover:bg-brand-50"
              >
                <Plus size={13} />
                Add dish
              </button>
            </div>
          </div>
          {plan.dishes.length === 0 ? (
            <div className="bg-gray-50 rounded-2xl px-4 py-6 text-center">
              <UtensilsCrossed size={28} className="text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No dishes yet</p>
              <button
                onClick={() => setAddDishOpen(true)}
                className="mt-2 text-xs text-brand-500 font-medium"
              >
                Add the first dish
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100 overflow-hidden">
              {plan.dishes.map((dish) => {
                const linkedCustom = dish.customRecipeId
                  ? state.customRecipes.find((r) => r.id === dish.customRecipeId)
                  : null;
                const emoji = linkedCustom
                  ? getRecipeEmoji(linkedCustom.title, linkedCustom.category, linkedCustom.emoji)
                  : dish.recipeId
                  ? getRecipeEmoji(dish.title)
                  : null;
                const entry = dishToDayEntry(dish);
                const canView = !!linkedCustom || !!dish.recipeId;

                function handleViewDish() {
                  if (linkedCustom) { setViewingCustomRecipe(linkedCustom); return; }
                  if (dish.recipeId) {
                    setViewingFavRecipe({ id: dish.recipeId, title: dish.title, image: dish.recipeImage ?? "", readyInMinutes: 0, servings: 0, sourceUrl: dish.recipeUrl });
                  }
                }

                return (
                  <div key={dish.id} className="flex items-center gap-3 px-4 py-3">
                    <button
                      onClick={canView ? handleViewDish : undefined}
                      className={clsx("w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-xl",
                        canView ? "bg-brand-50 hover:bg-brand-100 active:bg-brand-200 cursor-pointer" : "bg-gray-50 cursor-default"
                      )}
                    >
                      {emoji ?? <ChefHat size={15} className="text-gray-400" />}
                    </button>
                    <button
                      onClick={canView ? handleViewDish : undefined}
                      className={clsx("flex-1 min-w-0 text-left", canView && "cursor-pointer")}
                    >
                      <p className="text-sm font-medium text-gray-800 truncate">{dish.title}</p>
                    </button>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {entry && (
                        <button
                          onClick={() => setSendDishEntry(entry)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-brand-500 hover:bg-brand-50 transition-colors"
                          title="Send to a day"
                        >
                          <Plus size={15} />
                        </button>
                      )}
                      <button
                        onClick={() => setConfirmDeleteDish({ id: dish.id, title: dish.title })}
                        className="p-1.5 rounded-lg text-gray-300 hover:text-red-400 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Tasks / Timeline section */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <CalendarDays size={15} className="text-brand-500" />
              Timeline
              {plan.tasks.length > 0 && (
                <span className="text-xs font-normal text-gray-400">
                  {completedCount}/{plan.tasks.length}
                </span>
              )}
            </h2>
            <button
              onClick={() => setAddTaskOpen(true)}
              className="flex items-center gap-1 text-xs text-brand-500 font-medium hover:text-brand-600 px-2 py-1 rounded-lg hover:bg-brand-50"
            >
              <Plus size={13} />
              Add task
            </button>
          </div>
          {plan.tasks.length === 0 ? (
            <div className="bg-gray-50 rounded-2xl px-4 py-6 text-center">
              <CalendarDays size={28} className="text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No tasks yet</p>
              <button
                onClick={() => setAddTaskOpen(true)}
                className="mt-2 text-xs text-brand-500 font-medium"
              >
                Add the first task
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(tasksByDate).map(([dateStr, tasks]) => {
                const d = new Date(dateStr + "T00:00:00");
                const label = d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
                const daysUntil = Math.round((d.getTime() - new Date(new Date().toDateString()).getTime()) / 86400000);
                const relativePart =
                  daysUntil === 0 ? " · Today"
                  : daysUntil === 1 ? " · Tomorrow"
                  : daysUntil === -1 ? " · Yesterday"
                  : daysUntil < 0 ? ` · ${Math.abs(daysUntil)}d ago`
                  : ` · In ${daysUntil}d`;
                return (
                  <div key={dateStr}>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 px-1">
                      {label}<span className="font-normal normal-case tracking-normal text-gray-400">{relativePart}</span>
                    </p>
                    <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100 overflow-hidden">
                      {tasks.map((task) => {
                        const linkedTaskRecipe = task.customRecipeId
                          ? state.customRecipes.find((r) => r.id === task.customRecipeId)
                          : null;
                        return (
                        <div
                          key={task.id}
                          className="flex items-center gap-3 px-4 py-3"
                        >
                          <button
                            onClick={() => toggleTask(task)}
                            className="flex-shrink-0 text-gray-400 hover:text-brand-500 transition-colors"
                          >
                            {task.completed
                              ? <CheckSquare size={18} className="text-brand-500" />
                              : <Square size={18} />}
                          </button>
                          <div
                            className="flex-1 min-w-0 cursor-pointer"
                            onClick={() => { setEditingTask(task); }}
                          >
                            <p className={clsx("text-sm font-medium", task.completed ? "line-through text-gray-400" : "text-gray-800")}>
                              {task.text}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                              {task.time && (
                                <p className="text-xs text-gray-400 flex items-center gap-1">
                                  <Clock size={10} />
                                  {new Date("1970-01-01T" + task.time).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                                </p>
                              )}
                              {task.daysBeforeEvent !== undefined && (
                                <p className="text-xs text-brand-400 flex items-center gap-1">
                                  <CalendarDays size={10} />
                                  {task.daysBeforeEvent === 0 ? "Day of event" : `${task.daysBeforeEvent}d before`}
                                </p>
                              )}
                              {linkedTaskRecipe && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); setViewingCustomRecipe(linkedTaskRecipe); }}
                                  className="text-xs text-brand-500 flex items-center gap-1 hover:text-brand-700"
                                >
                                  <BookOpen size={10} />
                                  {linkedTaskRecipe.title}
                                </button>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => setConfirmDeleteTask({ id: task.id, text: task.text })}
                            className="p-1.5 rounded-lg text-gray-300 hover:text-red-400 hover:bg-red-50 transition-colors flex-shrink-0"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Sheets */}
      <AddEntrySheet
        open={addDishOpen}
        onClose={() => setAddDishOpen(false)}
        dateStr={plan.date}
        dateLabel={plan.name}
        onAddEntry={(entry) => {
          const title =
            entry.type === "text" || entry.type === "event"
              ? (entry.text ?? "")
              : (entry.recipeTitle ?? "");
          if (!title) return;
          handleAddDish({
            title,
            customRecipeId: entry.type === "custom-recipe" ? entry.customRecipeId : undefined,
            recipeId: entry.type === "recipe" ? entry.recipeId : undefined,
            recipeImage: entry.type === "recipe" ? entry.recipeImage : undefined,
            recipeUrl: entry.type === "recipe" ? entry.recipeUrl : undefined,
          });
        }}
      />
      <CustomRecipeSheet open={!!viewingCustomRecipe} onClose={() => setViewingCustomRecipe(null)} existing={viewingCustomRecipe ?? undefined} />
      <RecipeDetailSheet recipe={viewingFavRecipe} onClose={() => setViewingFavRecipe(null)} />
      {sendDishEntry && (
        <DayPickerSheet
          open={!!sendDishEntry}
          onClose={() => setSendDishEntry(null)}
          recipe={{ id: "", title: sendDishEntry.recipeTitle ?? "", image: "", readyInMinutes: 0, servings: 0 }}
          entry={sendDishEntry}
          onAdded={() => setSendDishEntry(null)}
        />
      )}
      {sendAllOpen && linkedDishEntries.length > 0 && (
        <DayPickerSheet
          open={sendAllOpen}
          onClose={() => setSendAllOpen(false)}
          recipe={{ id: "", title: plan.name, image: "", readyInMinutes: 0, servings: 0 }}
          entries={linkedDishEntries}
          onAdded={() => setSendAllOpen(false)}
        />
      )}
      <TaskSheet
        open={addTaskOpen}
        onClose={() => setAddTaskOpen(false)}
        onSave={handleAddTask}
        eventDate={plan.date}
      />
      {editingTask && (
        <TaskSheet
          open={!!editingTask}
          onClose={() => setEditingTask(null)}
          onSave={handleEditTask}
          initial={editingTask}
          eventDate={plan.date}
        />
      )}

      {/* Delete dish confirmation */}
      {confirmDeleteDish && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={() => setConfirmDeleteDish(null)}>
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-base font-semibold text-gray-800 mb-1">Remove Dish?</h2>
            <p className="text-sm text-gray-500 mb-4">&ldquo;{confirmDeleteDish.title}&rdquo; will be removed from this event.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDeleteDish(null)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600">Cancel</button>
              <button
                onClick={() => { dispatch({ type: "REMOVE_EVENT_DISH", planId: plan.id, dishId: confirmDeleteDish.id }); setConfirmDeleteDish(null); }}
                className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-medium"
              >Remove</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete task confirmation */}
      {confirmDeleteTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={() => setConfirmDeleteTask(null)}>
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-base font-semibold text-gray-800 mb-1">Delete Task?</h2>
            <p className="text-sm text-gray-500 mb-4">&ldquo;{confirmDeleteTask.text}&rdquo; will be permanently removed.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDeleteTask(null)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600">Cancel</button>
              <button
                onClick={() => { dispatch({ type: "REMOVE_EVENT_TASK", planId: plan.id, taskId: confirmDeleteTask.id }); setConfirmDeleteTask(null); }}
                className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-medium"
              >Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
