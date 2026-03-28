"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChefHat, LogOut, Menu, HelpCircle } from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import Image from "next/image";
import { useAppContext } from "@/store/context";
import AppMenuSheet from "./AppMenuSheet";
import HelpSheet from "./HelpSheet";

export default function MobileHeader() {
  const { data: session } = useSession();
  const { forceSave } = useAppContext();
  const [menuOpen, setMenuOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const pathname = usePathname();

  if (pathname.startsWith("/view")) return null;

  return (
    <>
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
      <div className="flex items-center justify-between h-14 px-4">
        {/* Brand */}
        <Link
          href="/menu"
          className="flex items-center gap-2 font-bold text-brand-600 text-base"
        >
          <ChefHat className="w-6 h-6" />
          <div className="flex flex-col leading-tight">
            <span>Mom, What&apos;s for Dinner?</span>
            <span className="text-[10px] font-normal text-gray-500">v{process.env.NEXT_PUBLIC_VERSION}</span>
          </div>
        </Link>

        {/* User area */}
        {session?.user && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => setHelpOpen(true)}
              className="p-2 text-gray-500 hover:text-gray-600 active:text-gray-800"
              title="Help"
            >
              <HelpCircle size={18} />
            </button>
            <button
              onClick={() => setMenuOpen(true)}
              className="p-2 text-gray-500 hover:text-gray-600 active:text-gray-800"
              title="Menu"
            >
              <Menu size={18} />
            </button>
            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="p-1"
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
              </button>
              {profileOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
                  <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg py-1 min-w-[140px] z-50">
                    <button
                      onClick={async () => { setProfileOpen(false); await forceSave(); signOut({ callbackUrl: "/login" }); }}
                      className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 active:bg-gray-100 transition-colors"
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
      </div>
    </header>

    <AppMenuSheet open={menuOpen} onClose={() => setMenuOpen(false)} />
    <HelpSheet open={helpOpen} onClose={() => setHelpOpen(false)} />
    </>
  );
}
