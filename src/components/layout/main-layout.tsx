"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { Navbar } from "./navbar";
import { MobileNav } from "./mobile-nav";

export function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [pathname]);

  return (
    <div className="min-h-screen bg-background hud-grid">
      {/* Decorative corner elements */}
      <div className="fixed top-0 left-0 w-32 h-32 border-l-2 border-t-2 border-primary/30" />
      <div className="fixed top-0 right-0 w-32 h-32 border-r-2 border-t-2 border-primary/30" />
      <div className="fixed bottom-0 left-0 w-32 h-32 border-l-2 border-b-2 border-primary/30" />
      <div className="fixed bottom-0 right-0 w-32 h-32 border-r-2 border-b-2 border-primary/30" />

      <header className="sticky top-0 z-50 w-full border-b border-primary/20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 max-w-screen-2xl mx-auto px-4">
          <div className="flex-1 flex items-center">
            <MobileNav />
          </div>
          <Navbar />
          <div className="flex-1" />
        </div>
        {/* Decorative header line */}
        <div className="h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
      </header>

      <main className="container mx-auto px-4 py-6 overflow-x-hidden relative">
        {/* Location indicator inspired by the image */}
        <div className="absolute top-0 right-4 text-xs text-primary/70 font-mono">
          LOCATION {pathname.replace("/", "").toUpperCase() || "HOME"} ::
        </div>

        {/* Content wrapper with subtle animation */}
        <div className="animate-in fade-in duration-500">{children}</div>

        {/* Decorative bottom line */}
        <div className="fixed bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
      </main>
    </div>
  );
}
