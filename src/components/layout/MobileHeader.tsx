"use client";

import Link from "next/link";
import { ChefHat, LogOut } from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import Image from "next/image";
import { useAppContext } from "@/store/context";

export default function MobileHeader() {
  const { data: session } = useSession();
  const { forceSave } = useAppContext();

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
      <div className="flex items-center justify-between h-14 px-4">
        {/* Brand */}
        <Link
          href="/menu"
          className="flex items-center gap-2 font-bold text-brand-600 text-base"
        >
          <ChefHat className="w-6 h-6" />
          <span>Mom, What&apos;s for Dinner?</span>
        </Link>

        {/* User area */}
        {session?.user && (
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
            <button
              onClick={async () => { await forceSave(); signOut({ callbackUrl: "/login" }); }}
              className="p-2 text-gray-400 hover:text-gray-600 active:text-gray-800"
              title="Sign out"
            >
              <LogOut size={18} />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
