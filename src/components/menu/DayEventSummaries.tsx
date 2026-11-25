"use client";

import { useRouter } from "next/navigation";
import { CalendarCheck, ChevronRight, Check } from "lucide-react";
import clsx from "clsx";
import { useAppContext } from "@/store/context";
import { getRecipeEmoji } from "@/lib/recipe-emoji";
import type { EventTask } from "@/types";

/** Returns the calendar date this task falls on, or null if it has no date.
 *  daysBeforeEvent takes priority — it's always computed fresh from the event date. */
function getTaskDate(task: EventTask, eventDate: string): string | null {
  if (task.daysBeforeEvent !== undefined) {
    const d = new Date(eventDate + "T00:00:00");
    d.setDate(d.getDate() - task.daysBeforeEvent);
    return d.toISOString().slice(0, 10);
  }
  return task.date ?? null;
}

/** "14:30" → "2:30 PM" */
function formatTaskTime(time: string): string {
  return new Date("1970-01-01T" + time).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

/** Timed tasks first (earliest → latest), then untimed tasks in their original order. */
function sortTasksByTime(tasks: EventTask[]): EventTask[] {
  return tasks
    .map((task, index) => ({ task, index }))
    .sort((a, b) => {
      const ta = a.task.time;
      const tb = b.task.time;
      if (ta && tb) return ta.localeCompare(tb) || a.index - b.index;
      if (ta) return -1;
      if (tb) return 1;
      return a.index - b.index;
    })
    .map(({ task }) => task);
}

interface DayEventSummariesProps {
  dateStr: string;
}

export default function DayEventSummaries({ dateStr }: DayEventSummariesProps) {
  const { state, dispatch } = useAppContext();
  const router = useRouter();

  const relevant = state.eventPlans
    .map((plan) => {
      const isEventDay = plan.date === dateStr;
      const tasks = sortTasksByTime(
        plan.tasks.filter((t) => getTaskDate(t, plan.date) === dateStr)
      );
      return { plan, isEventDay, tasks };
    })
    .filter(({ isEventDay, tasks }) => isEventDay || tasks.length > 0);


  if (relevant.length === 0) return null;

  return (
    <div className="my-2 space-y-2">
      {relevant.map(({ plan, isEventDay, tasks }) => {
        const showDishes = isEventDay && plan.dishes.length > 0;
        const hasTimes = tasks.some((t) => t.time);
        return (
          <div key={plan.id} className="rounded-xl border border-indigo-200 overflow-hidden bg-white">
            {/* Event header — taps to event page */}
            <button
              onClick={() => router.push(`/event-planning/${plan.id}`)}
              className="w-full flex items-center gap-2 px-3 py-2 bg-indigo-50 border-b border-indigo-100 hover:bg-indigo-100 active:bg-indigo-200 transition-colors"
            >
              <CalendarCheck size={14} className="text-indigo-500 flex-shrink-0" />
              <span className="flex-1 text-sm font-semibold text-indigo-900 text-left leading-snug">
                {plan.name}
              </span>
              <ChevronRight size={14} className="text-indigo-400 flex-shrink-0" />
            </button>

            {/* Dishes — shown only on the event day, tap navigates to event */}
            {showDishes && (
              <div className="py-1">
                {plan.dishes.map((dish) => (
                  <button
                    key={dish.id}
                    onClick={() => router.push(`/event-planning/${plan.id}`)}
                    className="w-full flex items-center gap-3 px-3 py-1.5 hover:bg-gray-50 active:bg-gray-100 transition-colors text-left"
                  >
                    <span className="flex-shrink-0 text-base leading-none w-4 text-center">
                      {(() => { const cr = state.customRecipes.find((r) => r.id === dish.customRecipeId); return getRecipeEmoji(dish.title, cr?.category, cr?.emoji); })()}
                    </span>
                    <span className="flex-1 text-sm text-gray-800">{dish.title}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Slight separator between dishes and tasks */}
            {showDishes && tasks.length > 0 && (
              <div className="px-3">
                <div className="border-t border-dashed border-gray-200" />
              </div>
            )}

            {/* Tasks due on this day, ordered by time */}
            {tasks.length > 0 && (
              <div className="py-1">
                {tasks.map((task) => (
                  <div key={task.id} className={clsx("flex items-center gap-3 px-3 py-2", task.completed && "opacity-50")}>
                    <button
                      onClick={() =>
                        dispatch({
                          type: "UPDATE_EVENT_TASK",
                          planId: plan.id,
                          task: { ...task, completed: !task.completed },
                        })
                      }
                      className={clsx(
                        "flex-shrink-0 w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors",
                        task.completed
                          ? "border-gray-400 bg-gray-400"
                          : "border-gray-300 hover:border-indigo-400"
                      )}
                      aria-label={task.completed ? "Mark incomplete" : "Mark complete"}
                    >
                      {task.completed && <Check size={9} strokeWidth={3} className="text-white" />}
                    </button>
                    <button
                      onClick={() => router.push(`/event-planning/${plan.id}`)}
                      className="flex-1 min-w-0 flex items-center gap-3 text-left py-0.5"
                    >
                      {/* Time column — only when at least one task that day has a time */}
                      {hasTimes && (
                        <span
                          className={clsx(
                            "w-16 flex-shrink-0 whitespace-nowrap text-xs font-semibold tabular-nums",
                            task.completed ? "text-gray-400" : "text-indigo-700"
                          )}
                        >
                          {task.time ? formatTaskTime(task.time) : ""}
                        </span>
                      )}
                      <span
                        className={clsx(
                          "flex-1 text-sm transition-colors",
                          task.completed ? "line-through text-gray-400" : "text-gray-800 hover:text-gray-900"
                        )}
                      >
                        {task.text}
                      </span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
