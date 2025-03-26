"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

const routes = [
  {
    href: "/",
    label: "Home",
  },
  {
    href: "/workouts",
    label: "Workouts",
  },
  {
    href: "/notes",
    label: "Notes",
  },
  {
    href: "/suspension",
    label: "Suspension",
  },
  {
    href: "/tracks",
    label: "Tracks",
  },
  {
    href: "/lap-times",
    label: "Lap Times",
  },
  {
    href: "/checklist",
    label: "Riding Checklist",
  },
];

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const toggleMenu = () => {
    setIsOpen(!isOpen);
    // Prevent body scroll when menu is open
    document.body.style.overflow = !isOpen ? "hidden" : "unset";
  };

  const handleLinkClick = () => {
    setIsOpen(false);
    document.body.style.overflow = "unset";
    // Scroll to top of page
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="block lg:hidden"
        onClick={toggleMenu}
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </Button>

      {/* Full screen overlay */}
      <div
        className={cn(
          "fixed inset-0 z-50 bg-white dark:bg-gray-950 transition-transform duration-300 lg:hidden border-r",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex min-h-screen flex-col">
          <div className="flex items-center justify-between px-4 h-14 border-b bg-white dark:bg-gray-950">
            <span className="text-lg font-semibold">Menu</span>
            <Button variant="ghost" size="icon" onClick={toggleMenu}>
              <X className="h-6 w-6" />
            </Button>
          </div>
          <div className="flex-1 overflow-auto py-4 bg-white dark:bg-gray-950">
            <nav className="container flex flex-col space-y-4">
              {routes.map((route) => (
                <Link
                  key={route.href}
                  href={route.href}
                  onClick={handleLinkClick}
                  className={cn(
                    "text-lg font-medium transition-colors hover:text-primary px-4 py-3 rounded-md",
                    pathname === route.href
                      ? "text-primary bg-primary/10"
                      : "text-muted-foreground hover:bg-gray-100 dark:hover:bg-gray-800"
                  )}
                >
                  {route.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </div>
    </>
  );
}
