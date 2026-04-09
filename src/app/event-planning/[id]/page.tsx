"use client";

import { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, Pencil, Check, X, Plus, Trash2, ShoppingCart,
  ChefHat, UtensilsCrossed, CalendarDays, Clock, CheckSquare, Square,
} from "lucide-react";
import clsx from "clsx";
import { useAppContext } from "@/store/context";
import BottomSheet from "@/components/shared/BottomSheet";
import type { EventDish, EventTask } from "@/types";

// ─── Add Dish Sheet ────────────────────────────────────────────────────────────

function AddDishSheet({
  open,
  onClose,
  onAdd,
  customRecipes,
}: {
  open: boolean;
  onClose: () => void;
  onAdd: (dish: Omit<EventDish, "id">) => void;
  customRecipes: { id: string; title: string }[];
}) {
  const [title, setTitle] = useState("");
  const [linkType, setLinkType] = useState<"none" | "custom">("none");
  const [selectedCustomId, setSelectedCustomId] = useState("");

  function handleAdd() {
    const trimmed = title.trim();
    if (!trimmed) return;
    const dish: Omit<EventDish, "id"> = { title: trimmed };
    if (linkType === "custom" && selectedCustomId) {
      dish.customRecipeId = selectedCustomId;
    }
    onAdd(dish);
    setTitle("");
    setLinkType("none");
    setSelectedCustomId("");
    onClose();
  }

  return (
    <BottomSheet open={open} onClose={onClose} title="Add Dish">
      <div className="p-4 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Dish name</label>
          <input
            autoFocus
            type="text"
            placeholder="e.g. Roasted Turkey"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
          />
        </div>

        {customRecipes.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Link to a recipe <span className="font-normal text-gray-400">(optional — for grocery list)</span>
            </label>
            <div className="flex gap-2 mb-2">
              <button
                onClick={() => setLinkType("none")}
                className={clsx(
                  "flex-1 py-2 rounded-xl text-sm font-medium border transition-colors",
                  linkType === "none"
                    ? "bg-brand-50 text-brand-600 border-brand-200"
                    : "bg-gray-50 text-gray-500 border-gray-200"
                )}
              >
                No link
              </button>
              <button
                onClick={() => setLinkType("custom")}
                className={clsx(
                  "flex-1 py-2 rounded-xl text-sm font-medium border transition-colors",
                  linkType === "custom"
                    ? "bg-brand-50 text-brand-600 border-brand-200"
                    : "bg-gray-50 text-gray-500 border-gray-200"
                )}
              >
                My Recipes
              </button>
            </div>
            {linkType === "custom" && (
              <select
                value={selectedCustomId}
                onChange={(e) => setSelectedCustomId(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
              >
                <option value="">Choose a recipe…</option>
                {customRecipes.map((r) => (
                  <option key={r.id} value={r.id}>{r.title}</option>
                ))}
              </select>
            )}
          </div>
        )}

        <button
          onClick={handleAdd}
          disabled={!title.trim()}
          className="w-full py-3 bg-brand-500 text-white rounded-xl text-sm font-semibold disabled:opacity-40"
        >
          Add Dish
        </button>
      </div>
    </BottomSheet>
  );
}

// ─── Add/Edit Task Sheet ───────────────────────────────────────────────────────

function TaskSheet({
  open,
  onClose,
  onSave,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (task: Omit<EventTask, "id" | "completed">) => void;
  initial?: EventTask;
}) {
  const [text, setText] = useState(initial?.text ?? "");
  const [date, setDate] = useState(initial?.date ?? "");
  const [time, setTime] = useState(initial?.time ?? "");

  // Reset when sheet opens with new initial
  useMemo(() => {
    if (open) {
      setText(initial?.text ?? "");
      setDate(initial?.date ?? "");
      setTime(initial?.time ?? "");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function handleSave() {
    if (!text.trim() || !date) return;
    onSave({ text: text.trim(), date, time: time || undefined });
    onClose();
  }

  return (
    <BottomSheet open={open} onClose={onClose} title={initial ? "Edit Task" : "Add Task"}>
      <div className="p-4 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Task</label>
          <input
            autoFocus
            type="text"
            placeholder="e.g. Brine the turkey"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
            className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
          </div>
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
        </div>
        <button
          onClick={handleSave}
          disabled={!text.trim() || !date}
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

  // Sort tasks by date then time
  const sortedTasks = [...plan.tasks].sort((a, b) => {
    const da = a.date + (a.time ? "T" + a.time : "T00:00");
    const db = b.date + (b.time ? "T" + b.time : "T00:00");
    return da.localeCompare(db);
  });

  // Group tasks by date
  const tasksByDate = sortedTasks.reduce<Record<string, EventTask[]>>((acc, task) => {
    (acc[task.date] ??= []).push(task);
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
            <button
              onClick={() => setAddDishOpen(true)}
              className="flex items-center gap-1 text-xs text-brand-500 font-medium hover:text-brand-600 px-2 py-1 rounded-lg hover:bg-brand-50"
            >
              <Plus size={13} />
              Add dish
            </button>
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
                const linkedRecipe = dish.customRecipeId
                  ? state.customRecipes.find((r) => r.id === dish.customRecipeId)
                  : null;
                return (
                  <div key={dish.id} className="flex items-center gap-3 px-4 py-3">
                    <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center flex-shrink-0">
                      <ChefHat size={15} className="text-brand-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{dish.title}</p>
                      {linkedRecipe && (
                        <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                          <ChefHat size={10} />
                          Linked: {linkedRecipe.title}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => setConfirmDeleteDish({ id: dish.id, title: dish.title })}
                      className="p-1.5 rounded-lg text-gray-300 hover:text-red-400 hover:bg-red-50 transition-colors flex-shrink-0"
                    >
                      <Trash2 size={14} />
                    </button>
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
                      {tasks.map((task) => (
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
                            {task.time && (
                              <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                                <Clock size={10} />
                                {new Date("1970-01-01T" + task.time).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                              </p>
                            )}
                          </div>
                          <button
                            onClick={() => setConfirmDeleteTask({ id: task.id, text: task.text })}
                            className="p-1.5 rounded-lg text-gray-300 hover:text-red-400 hover:bg-red-50 transition-colors flex-shrink-0"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Sheets */}
      <AddDishSheet
        open={addDishOpen}
        onClose={() => setAddDishOpen(false)}
        onAdd={handleAddDish}
        customRecipes={state.customRecipes}
      />
      <TaskSheet
        open={addTaskOpen}
        onClose={() => setAddTaskOpen(false)}
        onSave={handleAddTask}
      />
      {editingTask && (
        <TaskSheet
          open={!!editingTask}
          onClose={() => setEditingTask(null)}
          onSave={handleEditTask}
          initial={editingTask}
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
