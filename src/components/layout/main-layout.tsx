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
        <div className="container flex h-14 items-center">
          <div className="flex flex-1 items-center justify-between">
            <div className="flex items-center gap-6">
              <MobileNav />
              <Navbar />
            </div>
          </div>
        </div>
      </header>
      <main className="container py-6">{children}</main>
    </div>
  );
}
