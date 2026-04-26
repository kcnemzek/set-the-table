"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, CalendarCheck, ChefHat, ShoppingCart, Sparkles, Settings } from "lucide-react";
import clsx from "clsx";

const TABS = [
  { href: "/menu", label: "Menu", Icon: CalendarDays },
  { href: "/discover", label: "Discover", Icon: Sparkles },
  { href: "/recipes", label: "My Kitchen", Icon: ChefHat },
  { href: "/groceries", label: "Groceries", Icon: ShoppingCart },
  { href: "/event-planning", label: "Events", Icon: CalendarCheck },
  { href: "/settings", label: "Settings", Icon: Settings },
];

export default function BottomNav() {
  const pathname = usePathname();

  if (pathname.startsWith("/view") || pathname.startsWith("/login")) return null;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#162D5A] border-t border-white/10 safe-area-inset-bottom">
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
                  ? "text-white"
                  : "text-blue-300 hover:text-blue-100 active:text-white"
              )}
            >
              <Icon size={24} strokeWidth={active ? 2.5 : 1.75} />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
