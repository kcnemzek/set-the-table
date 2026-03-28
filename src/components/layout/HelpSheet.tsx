"use client";

import { useState } from "react";
import clsx from "clsx";
import BottomSheet from "@/components/shared/BottomSheet";

interface HelpSheetProps {
  open: boolean;
  onClose: () => void;
}

const SECTIONS = [
  {
    emoji: "📅",
    title: "Menu",
    tips: [
      "Tap + on any day to add a meal — choose from your recipes, favorites, a note, or a special event.",
      "Drag the handle on any meal to reorder it within a day.",
      "Tap a recipe or note to open and edit it.",
      "Use the share icon on a day to send the menu to someone.",
      "Events (like birthdays or holidays) always appear at the top of the day.",
    ],
  },
  {
    emoji: "📖",
    title: "Recipes",
    tips: [
      "Custom recipes are yours — add ingredients and they'll show up in your grocery list automatically.",
      "Set a category on a custom recipe if the auto-detection from the title gets it wrong.",
      "Heart any recipe on the Discover tab to save it to Favorites.",
      "Tap a custom recipe to view or edit it.",
    ],
  },
  {
    emoji: "🛒",
    title: "Groceries",
    tips: [
      "Your grocery list is built automatically from recipes on the menu — just plan your week and it populates.",
      "Tap an item to check it off as you shop.",
      "Use the + button to add items manually for things not in a recipe.",
      "Items are grouped by aisle to make shopping faster.",
    ],
  },
  {
    emoji: "👨‍👩‍👧",
    title: "Family & Sharing",
    tips: [
      "Use the menu icon (☰) to manage family members or share a day's menu.",
      "Anyone you invite shares the same meal plan and grocery list in real time.",
    ],
  },
];

type Tab = "tips" | "feedback";
type FeedbackType = "Bug" | "Enhancement";
type SubmitState = "idle" | "submitting" | "success" | "error";

export default function HelpSheet({ open, onClose }: HelpSheetProps) {
  const [tab, setTab] = useState<Tab>("tips");
  const [type, setType] = useState<FeedbackType>("Bug");
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [submitState, setSubmitState] = useState<SubmitState>("idle");

  async function handleSubmit() {
    if (!message.trim()) return;
    setSubmitState("submitting");
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, name, message }),
      });
      if (!res.ok) throw new Error();
      setSubmitState("success");
      setMessage("");
      setName("");
    } catch {
      setSubmitState("error");
    }
  }

  function handleClose() {
    setSubmitState("idle");
    onClose();
  }

  return (
    <BottomSheet open={open} onClose={handleClose} title="Help">
      {/* Tabs */}
      <div className="flex border-b border-gray-200 px-4">
        {(["tips", "feedback"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={clsx(
              "px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors",
              tab === t
                ? "border-brand-500 text-brand-600"
                : "border-transparent text-gray-500 hover:text-gray-600"
            )}
          >
            {t === "tips" ? "💡 Tips" : "💬 Feedback"}
          </button>
        ))}
      </div>

      <div className="p-4 pb-8">
        {tab === "tips" && (
          <div className="space-y-6">
            {SECTIONS.map((section) => (
              <div key={section.title}>
                <h3 className="text-sm font-semibold text-gray-800 mb-2">
                  {section.emoji} {section.title}
                </h3>
                <ul className="space-y-2">
                  {section.tips.map((tip) => (
                    <li key={tip} className="flex gap-2 text-sm text-gray-600">
                      <span className="text-brand-400 mt-0.5 flex-shrink-0">•</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            <p className="text-xs text-gray-400 text-center pt-2">
              Mom, What&apos;s for Dinner? v{process.env.NEXT_PUBLIC_VERSION}
            </p>
          </div>
        )}

        {tab === "feedback" && (
          <div className="space-y-3">
            {submitState === "success" ? (
              <div className="rounded-xl bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
                Thanks! Your feedback was submitted.
              </div>
            ) : (
              <>
                <div className="flex gap-2">
                  {(["Bug", "Enhancement"] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setType(t)}
                      className={clsx(
                        "flex-1 py-2 rounded-xl text-sm font-medium border transition-colors",
                        type === t
                          ? "bg-brand-500 text-white border-brand-500"
                          : "bg-white text-gray-500 border-gray-200"
                      )}
                    >
                      {t === "Bug" ? "🐛 Bug" : "✨ Enhancement"}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name (optional)"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                />
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={type === "Bug" ? "What went wrong?" : "What would you like to see?"}
                  rows={4}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 resize-none"
                />
                {submitState === "error" && (
                  <p className="text-xs text-red-500">Something went wrong — please try again.</p>
                )}
                <button
                  onClick={handleSubmit}
                  disabled={!message.trim() || submitState === "submitting"}
                  className="w-full py-3 bg-brand-500 text-white rounded-xl text-sm font-semibold disabled:opacity-40 active:bg-brand-600"
                >
                  {submitState === "submitting" ? "Submitting…" : "Submit"}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </BottomSheet>
  );
}
