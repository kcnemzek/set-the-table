"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, BookOpen, ShoppingCart } from "lucide-react";
import clsx from "clsx";

const TABS = [
  { href: "/menu", label: "Menu", Icon: CalendarDays },
  { href: "/recipes", label: "Recipes", Icon: BookOpen },
  { href: "/groceries", label: "Groceries", Icon: ShoppingCart },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 safe-area-inset-bottom">
      <div className="flex">
        {TABS.map(({ href, label, Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                "flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors",
                active
                  ? "text-brand-500"
                  : "text-gray-400 hover:text-gray-600 active:text-brand-400"
              )}
            >
              <Icon
                size={24}
                strokeWidth={active ? 2.5 : 1.75}
              />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
