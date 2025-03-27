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
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 max-w-screen-2xl mx-auto px-4">
          <div className="flex-1 flex items-center">
            <MobileNav />
          </div>
          <Navbar />
          <div className="flex-1" />
        </div>
      </header>
      <main className="container mx-auto px-4 py-6 overflow-x-hidden">
        {children}
      </main>
    </div>
  );
}
