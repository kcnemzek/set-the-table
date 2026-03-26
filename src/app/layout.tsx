import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppProvider } from "@/store/context";
import BottomNav from "@/components/layout/BottomNav";
import TopNav from "@/components/layout/TopNav";
import MobileHeader from "@/components/layout/MobileHeader";
import SessionWrapper from "@/components/layout/SessionWrapper";

export const metadata: Metadata = {
  title: "Mom, What's for Dinner?",
  description: "Simple meal planning for the week ahead",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "What's for Dinner",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0055b2",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <SessionWrapper>
          <AppProvider>
            {/* Mobile header — mobile only */}
            <div className="md:hidden">
              <MobileHeader />
            </div>
            {/* Top nav — desktop only */}
            <div className="hidden md:block">
              <TopNav />
            </div>
            {/* pb-20 on mobile for bottom nav, none on desktop */}
            <main className="min-h-[100dvh] pb-20 md:pb-0 max-w-5xl md:mx-auto">
              {children}
            </main>
            {/* Bottom nav — mobile only */}
            <BottomNav />
          </AppProvider>
        </SessionWrapper>
      </body>
    </html>
  );
}
