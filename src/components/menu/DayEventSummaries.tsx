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

interface DayEventSummariesProps {
  dateStr: string;
}

export default function DayEventSummaries({ dateStr }: DayEventSummariesProps) {
  const { state, dispatch } = useAppContext();
  const router = useRouter();

  const relevant = state.eventPlans
    .map((plan) => {
      const isEventDay = plan.date === dateStr;
      const tasks = plan.tasks.filter(
        (t) => getTaskDate(t, plan.date) === dateStr
      );
      return { plan, isEventDay, tasks };
    })
    .filter(({ isEventDay, tasks }) => isEventDay || tasks.length > 0);


  if (relevant.length === 0) return null;

  return (
    <div className="mb-1">
      {relevant.map(({ plan, tasks }) => (
        <div key={plan.id} className="-mx-4 border-y border-indigo-200 mb-1 last:mb-0">
          {/* Event header — taps to event page */}
          <button
            onClick={() => router.push(`/event-planning/${plan.id}`)}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 bg-indigo-100 border-b border-indigo-200 hover:bg-indigo-200 active:bg-indigo-300 transition-colors"
          >
            <CalendarCheck size={14} className="text-indigo-500 flex-shrink-0" />
            <span className="flex-1 text-sm font-semibold text-gray-900 text-left leading-snug">
              {plan.name}
            </span>
            <ChevronRight size={14} className="text-indigo-400 flex-shrink-0" />
          </button>

          {/* Dishes — shown only on the event day, tap navigates to event */}
          {plan.date === dateStr && plan.dishes.map((dish) => (
            <button
              key={dish.id}
              onClick={() => router.push(`/event-planning/${plan.id}`)}
              className="w-full flex items-center gap-3 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 active:bg-indigo-200 transition-colors text-left"
            >
              <span className="flex-shrink-0 text-base leading-none w-4 text-center">
                {(() => { const cr = state.customRecipes.find((r) => r.id === dish.customRecipeId); return getRecipeEmoji(dish.title, cr?.category, cr?.emoji); })()}
              </span>
              <span className="flex-1 text-sm text-gray-800">{dish.title}</span>
            </button>
          ))}

          {/* Tasks due on this day */}
          {tasks.map((task) => (
            <div key={task.id} className={clsx("flex items-center gap-3 px-4 py-2.5 bg-indigo-50", task.completed && "opacity-50")}>
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
                    ? "border-indigo-400 bg-indigo-400"
                    : "border-indigo-300 hover:border-indigo-500"
                )}
                aria-label={task.completed ? "Mark incomplete" : "Mark complete"}
              >
                {task.completed && <Check size={9} strokeWidth={3} className="text-white" />}
              </button>
              <button
                onClick={() => router.push(`/event-planning/${plan.id}`)}
                className={clsx(
                  "flex-1 text-sm text-left transition-colors py-0.5",
                  task.completed ? "line-through text-gray-400" : "text-gray-800 hover:text-gray-900"
                )}
              >
                {task.text}
              </button>
            </div>
          ))}
        </div>
      ))}

      {/* Separator before user-added entries */}
      <div className="-mx-4 border-b border-gray-100 mt-1" />
    </div>
  );
}
