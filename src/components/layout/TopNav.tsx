"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChefHat, CalendarDays, BookOpen, ShoppingCart, LogOut } from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import Image from "next/image";
import clsx from "clsx";
import { useAppContext } from "@/store/context";

const TABS = [
  { href: "/menu", label: "Menu", Icon: CalendarDays },
  { href: "/recipes", label: "Recipes", Icon: BookOpen },
  { href: "/groceries", label: "Groceries", Icon: ShoppingCart },
];

export default function TopNav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { forceSave } = useAppContext();

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
      <nav className="max-w-5xl mx-auto px-6 flex items-center justify-between h-16">
        {/* Brand */}
        <Link
          href="/menu"
          className="flex items-center gap-2 font-bold text-brand-600 text-lg hover:text-brand-700 transition-colors"
        >
          <ChefHat className="w-7 h-7" />
          <div className="flex flex-col leading-tight">
            <span>Mom, What&apos;s for Dinner?</span>
            <span className="text-[10px] font-normal text-gray-500">v{process.env.NEXT_PUBLIC_VERSION}</span>
          </div>
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

        {/* User area */}
        {session?.user && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              {session.user.image && (
                <Image
                  src={session.user.image}
                  alt={session.user.name ?? "User"}
                  width={32}
                  height={32}
                  className="rounded-full"
                />
              )}
              <span className="text-sm text-gray-600 hidden lg:block">
                {session.user.name?.split(" ")[0]}
              </span>
            </div>
            <button
              onClick={async () => { await forceSave(); signOut({ callbackUrl: "/login" }); }}
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
              title="Sign out"
            >
              <LogOut size={16} />
              <span className="hidden lg:inline">Sign out</span>
            </button>
          </div>
        )}
      </nav>
    </header>
  );
}
