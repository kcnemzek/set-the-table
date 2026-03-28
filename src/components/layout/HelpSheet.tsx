"use client";

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

export default function HelpSheet({ open, onClose }: HelpSheetProps) {
  return (
    <BottomSheet open={open} onClose={onClose} title="Tips & Help">
      <div className="p-4 space-y-6 pb-8">
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
    </BottomSheet>
  );
}
