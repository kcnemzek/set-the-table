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
    title: "🍽️ The Master Plan - Menu",
    tips: [
      { label: "Smart Scheduling", body: "Planning your week shouldn't feel like a chore. Tap + on any day to instantly pull from your curated favorites, custom notes, or high-priority events." },
      { label: "Fluid Organization", body: "Plans change, so your menu should too. Easily move meals from one night to another." },
      { label: "Events First", body: "Birthdays and holidays automatically take center stage at the top of your day, so you never miss a celebration." },
      { label: "Share the Vibe", body: "Use the Share icon to beam your daily menu to friends, family, or anyone who keeps asking \"What's for dinner?\"" },
    ],
  },
  {
    title: "📖 Your Digital Cookbook - My Kitchen",
    tips: [
      { label: "Intelligent Creation", body: "Stop manual typing. Use 'Smart Copy-Paste' for web recipes or 'Snap a Pic' to instantly digitize handwritten cards and cookbooks with AI." },
      { label: "Smart Discovery", body: "Find exactly what you’re craving in the Discover tab by filtering for specific diets, cuisines, or the ingredients already in your pantry." },
      { label: "The ✨ Sparkle Effect", body: "Feeling uninspired? Tap the Sparkle to let our AI generate a fresh group of surprise recipes that are sperfect for shaking up your entire 10-day plan." },
      { label: "The \"Heart\" Factor", body: "Spot something delicious in the Discover tab? Hit the heart to save it to your Favorites for instant access later." },
      { label: "Smart Ingredients", body: "Want to eat your famous meatballs? When you add a custom recipe, the app does the heavy lifting. Ingredients are automatically parsed and synced directly to your shopping list." },
      { label: "Share Your Recipes", body: "Did everyone love your lasagna? Share it with your friends and family with one click." },
      { label: "Save Your Tips", body: "Use tips to save how long it took to poach your chicken or soft boil your eggs." },
    ],
  },
  {
    title: "🛒 Shopping, Simplified - Groceries",
    tips: [
      { label: "Auto-Magic Lists", body: "Your grocery list builds itself. As you plan your meals, the ingredients populate in real-time. No more double-checking the pantry at 6:00 PM." },
      { label: "Aisle-by-Aisle", body: "We group your items by grocery aisle, so you can zip through the store in record time." },
      { label: "Quick-Add", body: "Need milk or paper towels? Use the + button to toss manual items onto your list in seconds." },
    ],
  },
  {
    title: "📅 Stress-Free Hosting - Event Planning",
    tips: [
      { label: "The Big Day", body: "Whether it's Easter Brunch or a birthday party, create a dedicated space for your event with linked recipes and tips." },
      { label: "To-Do Trackers", body: "Keep the chaos at bay with integrated checklists. Track everything from 'Buy flowers' to 'Pre-heat oven' directly inside your event." },
      { label: "Future Templates", body: "Don't reinvent the wheel. Save this year's Thanksgiving as a template to make next year’s planning a one-click breeze." },
    ],
  },
  {
    title: "👨‍👩‍👧 Family Sync",
    tips: [
      { label: "Real-Time Collaboration", body: "Invite your crew via the ☰ menu. Everyone stays on the same page with a shared meal plan and a live grocery list that updates for everyone...instantly." },
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
                  {section.title}
                </h3>
                <ul className="space-y-3">
                  {section.tips.map((tip) => (
                    <li key={tip.label} className="text-sm text-gray-600">
                      <span className="font-semibold text-gray-800">{tip.label}: </span>
                      {tip.body}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            <p className="text-xs text-gray-500 text-center pt-2">
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
