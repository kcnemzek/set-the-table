"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, CalendarCheck, BookOpen, ShoppingCart, LogOut, HelpCircle, Sparkles, Settings } from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import Image from "next/image";
import clsx from "clsx";
import { useAppContext } from "@/store/context";
import HelpSheet from "./HelpSheet";
import setthetableIcon from "@/app/setthetable_nobg.png";

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
  const [helpOpen, setHelpOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  if (pathname.startsWith("/view")) return null;

  return (
    <header className="sticky top-0 z-40 bg-[#162D5A] border-b border-white/10 shadow-sm">
      <nav className="max-w-5xl mx-auto px-6 flex items-center justify-between h-16">
        {/* Brand */}
        <Link
          href="/menu"
          className="flex items-center gap-2 font-bold text-white text-lg hover:text-white/80 transition-colors"
        >
          <Image src={setthetableIcon} alt="Set the Table" width={32} height={33} className="rounded-sm" />
          <div className="flex flex-col leading-tight">
            <span style={{ fontFamily: "'Inter', sans-serif", letterSpacing: "-0.022em" }}>
              <span style={{ fontWeight: 300 }}>SetThe</span><span style={{ fontWeight: 700 }}>Table</span>
            </span>
            <span className="text-[10px] font-normal text-blue-200">Dinner is set.</span>
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
                    ? "bg-white/10 text-white"
                    : "text-blue-200 hover:bg-white/10 hover:text-white"
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
              className="p-2 text-blue-200 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
              title="Help"
            >
              <HelpCircle size={18} />
            </button>
            <Link
              href="/settings"
              className={clsx(
                "p-2 rounded-xl transition-colors",
                pathname.startsWith("/settings")
                  ? "text-white bg-white/10"
                  : "text-blue-200 hover:text-white hover:bg-white/10"
              )}
              title="Settings"
            >
              <Settings size={18} />
            </Link>
            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-white/10 transition-colors"
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
                <span className="text-sm text-blue-200 hidden lg:block">
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
      <HelpSheet open={helpOpen} onClose={() => setHelpOpen(false)} />
    </header>
  );
}
