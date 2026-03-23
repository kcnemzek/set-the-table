"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChefHat, CalendarDays, BookOpen, ShoppingCart } from "lucide-react";
import clsx from "clsx";

const TABS = [
  { href: "/menu", label: "Menu", Icon: CalendarDays },
  { href: "/recipes", label: "Recipes", Icon: BookOpen },
  { href: "/groceries", label: "Groceries", Icon: ShoppingCart },
];

export default function TopNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
      <nav className="max-w-5xl mx-auto px-6 flex items-center justify-between h-16">
        {/* Brand */}
        <Link
          href="/menu"
          className="flex items-center gap-2 font-bold text-brand-600 text-lg hover:text-brand-700 transition-colors"
        >
          <ChefHat className="w-7 h-7" />
          <span>Mom, What&apos;s for Dinner?</span>
        </Link>

        {/* Tabs */}
        <div className="flex items-center gap-1">
          {TABS.map(({ href, label, Icon }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={clsx(
                  "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors",
                  active
                    ? "bg-brand-50 text-brand-700"
                    : "text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                )}
              >
                <Icon size={17} strokeWidth={active ? 2.5 : 1.75} />
                {label}
              </Link>
            );
          })}
        </div>
      </nav>
    </header>
  );
}
