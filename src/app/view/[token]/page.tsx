"use client";

import { useEffect, useState, useRef } from "react";
import { use } from "react";
import { ChefHat, Plus, Trash2, ShoppingCart, CalendarDays } from "lucide-react";
import ReadOnlyDayCard from "@/components/menu/ReadOnlyDayCard";
import { getNext10Days, toDateStr } from "@/lib/dates";
import type { DayEntry, CustomRecipe, Menu, FamilyGroceryItem } from "@/types";

const STORAGE_KEY = "family-name";

interface SharedDataInvite {
  type: "invite";
  memberName: string;
  menu: Menu;
  customRecipes: CustomRecipe[];
}

interface SharedDataShared {
  type: "shared";
  menu: Menu;
  customRecipes: CustomRecipe[];
  familyMembers: string[];
}

type SharedData = SharedDataInvite | SharedDataShared;

export default function FamilyViewPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [data, setData] = useState<SharedData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [familyName, setFamilyName] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  const [activeTab, setActiveTab] = useState<"menu" | "groceries">("menu");

  // Grocery state (invite-token only)
  const [groceries, setGroceries] = useState<FamilyGroceryItem[]>([]);
  const [newItem, setNewItem] = useState("");
  const [addingItem, setAddingItem] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load saved name from localStorage (for shared/legacy links only)
  useEffect(() => {
    setFamilyName(localStorage.getItem(STORAGE_KEY));
    setLoaded(true);
  }, []);

  // Fetch shared data
  useEffect(() => {
    fetch(`/api/shared/${token}`)
      .then((r) => {
        if (!r.ok) throw new Error("Invalid link");
        return r.json();
      })
      .then(setData)
      .catch((e) => setError(e.message));
  }, [token]);

  // Fetch grocery list for invite-token links
  useEffect(() => {
    if (!data || data.type !== "invite") return;
    fetch(`/api/shared/${token}/grocery`)
      .then((r) => r.ok ? r.json() : { items: [] })
      .then(({ items }) => setGroceries(items ?? []));
  }, [data, token]);

  async function handleAddItem() {
    const name = newItem.trim();
    if (!name || addingItem) return;
    setAddingItem(true);
    try {
      const res = await fetch(`/api/shared/${token}/grocery`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (res.ok) {
        const { item } = await res.json();
        setGroceries((prev) => [...prev, item]);
        setNewItem("");
        inputRef.current?.focus();
      }
    } finally {
      setAddingItem(false);
    }
  }

  async function handleRemoveItem(id: string) {
    await fetch(`/api/shared/${token}/grocery/${id}`, { method: "DELETE" });
    setGroceries((prev) => prev.filter((i) => i.id !== id));
  }

  function chooseName(name: string) {
    localStorage.setItem(STORAGE_KEY, name);
    setFamilyName(name);
  }

  if (error) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center gap-3 px-6 text-center">
        <ChefHat size={40} className="text-gray-500" />
        <p className="text-gray-500 text-sm">This link doesn&apos;t seem to work.<br />Ask for a new one!</p>
      </div>
    );
  }

  if (!loaded || !data) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <div className="w-6 h-6 rounded-full border-2 border-brand-400 border-t-transparent animate-spin" />
      </div>
    );
  }

  const days = getNext10Days();
  const today = toDateStr(new Date());

  // ─── Invite-token view (per-member, with grocery list) ────────────────────

  if (data.type === "invite") {
    return (
      <div className="min-h-dvh bg-gray-100 flex flex-col">
        {/* Sticky header */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 pt-3 pb-0">
          <h1 className="text-lg font-bold text-gray-800 mb-3">Hey {data.memberName}! 👋</h1>
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-0">
            <button
              onClick={() => setActiveTab("menu")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === "menu" ? "bg-white text-gray-800 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <CalendarDays size={14} />
              Menu
            </button>
            <button
              onClick={() => setActiveTab("groceries")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === "groceries" ? "bg-white text-gray-800 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <ShoppingCart size={14} />
              Groceries
              {groceries.length > 0 && (
                <span className="ml-0.5 text-xs text-brand-500 font-semibold">{groceries.length}</span>
              )}
            </button>
          </div>
        </div>

        {/* Tab content */}
        <div className="flex-1 px-4 py-4 max-w-2xl mx-auto w-full">
          {activeTab === "menu" && (
            <div className="space-y-3">
              {days.map((dateStr) => (
                <ReadOnlyDayCard
                  key={dateStr}
                  dateStr={dateStr}
                  isToday={dateStr === today}
                  entries={(data.menu[dateStr] ?? []) as DayEntry[]}
                />
              ))}
            </div>
          )}

          {activeTab === "groceries" && (
            <div>
              <p className="text-xs text-gray-500 mb-3">
                Add anything you&apos;d like — it&apos;ll show up on the family grocery list.
              </p>

              {/* Add input */}
              <div className="flex gap-2 mb-4">
                <input
                  ref={inputRef}
                  type="text"
                  value={newItem}
                  onChange={(e) => setNewItem(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddItem()}
                  placeholder="Add an item…"
                  spellCheck
                  autoCorrect="on"
                  autoCapitalize="sentences"
                  className="flex-1 px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-brand-400"
                />
                <button
                  onClick={handleAddItem}
                  disabled={!newItem.trim() || addingItem}
                  className="p-2.5 rounded-xl bg-brand-500 text-white hover:bg-brand-600 active:bg-brand-700 disabled:opacity-40 transition-colors"
                >
                  <Plus size={16} />
                </button>
              </div>

              {/* Item list */}
              {groceries.length > 0 ? (
                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                  {groceries.map((item, i) => (
                    <div
                      key={item.id}
                      className={`flex items-center gap-3 px-4 py-3 ${i > 0 ? "border-t border-gray-50" : ""} ${item.checked ? "bg-gray-50" : ""}`}
                    >
                      {/* Shopped indicator */}
                      <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${item.checked ? "bg-brand-500 border-brand-500" : "border-gray-200"}`}>
                        {item.checked && (
                          <svg viewBox="0 0 10 8" className="w-2 h-2 text-white" fill="none">
                            <path d="M1 4l2.5 2.5L9 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </div>
                      <span className={`flex-1 text-sm ${item.checked ? "text-gray-400 line-through" : "text-gray-800"}`}>
                        {item.name}
                      </span>
                      {item.checked && (
                        <span className="text-xs text-brand-500 font-medium">Shopped!</span>
                      )}
                      {!item.checked && item.addedBy !== data.memberName && (
                        <span className="text-xs text-gray-400">{item.addedBy}</span>
                      )}
                      {!item.checked && item.addedBy === data.memberName && (
                        <button
                          onClick={() => handleRemoveItem(item.id)}
                          className="text-gray-400 hover:text-red-400 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400 text-center py-8">No items yet</p>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─── Shared (read-only) view ──────────────────────────────────────────────

  // Name picker for shared links
  if (!familyName) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center gap-6 px-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <ChefHat size={40} className="text-brand-500" />
          <h1 className="text-xl font-bold text-gray-800">What&apos;s for Dinner?</h1>
          <p className="text-sm text-gray-500">Who are you?</p>
        </div>

        {data.familyMembers.length === 0 ? (
          <p className="text-sm text-gray-500 text-center">
            No family members set up yet. Ask for your personal invite link!
          </p>
        ) : (
          <div className="flex flex-col gap-3 w-full max-w-xs">
            {data.familyMembers.map((name) => (
              <button
                key={name}
                onClick={() => chooseName(name)}
                className="w-full py-4 rounded-2xl bg-brand-500 text-white font-semibold text-lg hover:bg-brand-600 active:bg-brand-700 transition-colors shadow-sm"
              >
                {name}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-gray-100">
      <div className="space-y-3 px-4 py-4 max-w-2xl mx-auto">
        <div className="flex items-baseline gap-3 mb-1">
          <h1 className="text-xl font-bold text-gray-800">Hey {familyName}! 👋</h1>
          <button
            onClick={() => {
              localStorage.removeItem(STORAGE_KEY);
              setFamilyName(null);
            }}
            className="text-xs text-gray-500 hover:text-gray-600"
          >
            Not {familyName}?
          </button>
        </div>
        {days.map((dateStr) => (
          <ReadOnlyDayCard
            key={dateStr}
            dateStr={dateStr}
            isToday={dateStr === today}
            entries={(data.menu[dateStr] ?? []) as DayEntry[]}
          />
        ))}
      </div>
    </div>
  );
}
