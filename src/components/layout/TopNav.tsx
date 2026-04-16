"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChefHat, CalendarDays, CalendarCheck, BookOpen, ShoppingCart, LogOut, Menu, HelpCircle, Sparkles } from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import Image from "next/image";
import clsx from "clsx";
import { useAppContext } from "@/store/context";
import AppMenuSheet from "./AppMenuSheet";
import HelpSheet from "./HelpSheet";

const TABS = [
  { href: "/menu", label: "Menu", Icon: CalendarDays },
  { href: "/discover", label: "Discover", Icon: Sparkles },
  { href: "/recipes", label: "My Kitchen", Icon: BookOpen },
  { href: "/groceries", label: "Groceries", Icon: ShoppingCart },
  { href: "/event-planning", label: "Events", Icon: CalendarCheck },
];

export default function TopNav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { forceSave } = useAppContext();
  const [menuOpen, setMenuOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  if (pathname.startsWith("/view")) return null;

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
                    : "text-gray-500 hover:bg-gray-200 hover:text-gray-800"
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
          <div className="flex items-center gap-2">
            <button
              onClick={() => setHelpOpen(true)}
              className="p-2 text-gray-500 hover:text-gray-600 hover:bg-gray-200 rounded-xl transition-colors"
              title="Help"
            >
              <HelpCircle size={18} />
            </button>
            <button
              onClick={() => setMenuOpen(true)}
              className="p-2 text-gray-500 hover:text-gray-600 hover:bg-gray-200 rounded-xl transition-colors"
              title="Menu"
            >
              <Menu size={18} />
            </button>
            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-gray-100 transition-colors"
              >
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
              </button>
              {profileOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
                  <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg py-1 min-w-[140px] z-50">
                    <button
                      onClick={async () => { setProfileOpen(false); await forceSave(); signOut({ callbackUrl: "/login" }); }}
                      className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 transition-colors"
                    >
                      <LogOut size={15} />
                      Sign out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </nav>
      <AppMenuSheet open={menuOpen} onClose={() => setMenuOpen(false)} />
      <HelpSheet open={helpOpen} onClose={() => setHelpOpen(false)} />
    </header>
  );
}
