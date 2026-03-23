"use client";

import Link from "next/link";
import { ChefHat } from "lucide-react";

export default function MobileHeader() {
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

        {/* Right side — settings/user icons will go here */}
        <div className="flex items-center gap-1">
          {/* placeholder for future icons */}
        </div>
      </div>
    </header>
  );
}
