"use client";

import { useRouter } from "next/navigation";
import { CalendarCheck, ChevronRight, Check } from "lucide-react";
import clsx from "clsx";
import { useAppContext } from "@/store/context";
import type { EventTask } from "@/types";

/** Returns the calendar date this task falls on, or null if it has no date. */
function getTaskDate(task: EventTask, eventDate: string): string | null {
  if (task.date) return task.date;
  if (task.daysBeforeEvent !== undefined) {
    const d = new Date(eventDate + "T00:00:00");
    d.setDate(d.getDate() - task.daysBeforeEvent);
    return d.toISOString().slice(0, 10);
  }
  return null;
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
        <div key={plan.id}>
          {/* Event header — taps to event page */}
          <div className="-mx-4">
            <button
              onClick={() => router.push(`/event-planning/${plan.id}`)}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 bg-indigo-50 border-y border-indigo-100 hover:bg-indigo-100 active:bg-indigo-200 transition-colors"
            >
              <CalendarCheck size={14} className="text-indigo-400 flex-shrink-0" />
              <span className="flex-1 text-sm font-semibold text-indigo-800 text-left leading-snug">
                {plan.name}
              </span>
              <ChevronRight size={14} className="text-indigo-300 flex-shrink-0" />
            </button>
          </div>

          {/* Tasks due on this day */}
          {tasks.map((task) => (
            <div key={task.id} className={clsx("flex items-center gap-3 px-1 py-2.5", task.completed && "opacity-50")}>
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
                    ? "border-brand-400 bg-brand-400"
                    : "border-gray-300 hover:border-brand-500 hover:bg-brand-50"
                )}
                aria-label={task.completed ? "Mark incomplete" : "Mark complete"}
              >
                {task.completed && <Check size={9} strokeWidth={3} className="text-white" />}
              </button>
              <button
                onClick={() => router.push(`/event-planning/${plan.id}`)}
                className={clsx(
                  "flex-1 text-sm text-left transition-colors py-0.5",
                  task.completed ? "line-through text-gray-400" : "text-gray-600 hover:text-gray-800"
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
