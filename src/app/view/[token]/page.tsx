"use client";

import { useEffect, useState } from "react";
import { use } from "react";
import { ChefHat } from "lucide-react";
import ReadOnlyDayCard from "@/components/menu/ReadOnlyDayCard";
import { getNext10Days, toDateStr } from "@/lib/dates";
import type { DayEntry, CustomRecipe, Menu } from "@/types";

const STORAGE_KEY = "family-name";

interface SharedData {
  menu: Menu;
  customRecipes: CustomRecipe[];
  familyMembers: string[];
}

export default function FamilyViewPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [data, setData] = useState<SharedData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [familyName, setFamilyName] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  // Load saved name from localStorage
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

  function chooseName(name: string) {
    localStorage.setItem(STORAGE_KEY, name);
    setFamilyName(name);
  }

  if (error) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center gap-3 px-6 text-center">
        <ChefHat size={40} className="text-gray-300" />
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

  // Name picker
  if (!familyName) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center gap-6 px-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <ChefHat size={40} className="text-brand-500" />
          <h1 className="text-xl font-bold text-gray-800">What&apos;s for Dinner?</h1>
          <p className="text-sm text-gray-500">Who are you?</p>
        </div>

        {data.familyMembers.length === 0 ? (
          <p className="text-sm text-gray-400 text-center">
            No family members set up yet. Ask Mom to add you!
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

  const days = getNext10Days();
  const today = toDateStr(new Date());

  return (
    <div className="min-h-dvh bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center justify-between h-14 px-4 max-w-2xl mx-auto">
          <div className="flex items-center gap-2 font-bold text-brand-600 text-base">
            <ChefHat className="w-6 h-6" />
            <div className="flex flex-col leading-tight">
              <span>What&apos;s for Dinner?</span>
              <span className="text-[10px] font-normal text-gray-500">v{process.env.NEXT_PUBLIC_VERSION}</span>
            </div>
          </div>
          <button
            onClick={() => {
              localStorage.removeItem(STORAGE_KEY);
              setFamilyName(null);
            }}
            className="text-xs text-gray-400 hover:text-gray-600"
          >
            Not {familyName}?
          </button>
        </div>
      </header>

      {/* Menu */}
      <div className="space-y-3 px-4 py-4 max-w-2xl mx-auto">
        <h1 className="text-xl font-bold text-gray-800 mb-1">Hey {familyName}! 👋</h1>
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
