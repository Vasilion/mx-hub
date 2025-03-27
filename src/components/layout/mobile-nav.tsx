"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Menu,
  X,
  Home,
  Dumbbell,
  StickyNote,
  Settings,
  Mountain,
  Timer,
  ClipboardCheck,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

const routes = [
  {
    href: "/",
    label: "Home",
    icon: Home,
  },
  {
    href: "/workouts",
    label: "Workouts",
    icon: Dumbbell,
  },
  {
    href: "/notes",
    label: "Notes",
    icon: StickyNote,
  },
  {
    href: "/suspension",
    label: "Suspension",
    icon: Settings,
  },
  {
    href: "/tracks",
    label: "Tracks",
    icon: Mountain,
  },
  {
    href: "/lap-times",
    label: "Lap Times",
    icon: Timer,
  },
  {
    href: "/checklist",
    label: "Riding Checklist",
    icon: ClipboardCheck,
  },
];

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 right-4 block lg:hidden"
        onClick={toggleMenu}
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </Button>

      {/* Full screen overlay */}
      <div
        className={cn(
          "fixed inset-0 z-50 bg-white dark:bg-gray-950 transition-transform duration-300 lg:hidden border-l",
          isOpen ? "translate-x-0" : "translate-x-full"
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
              {routes.map((route) => {
                const Icon = route.icon;
                return (
                  <Link
                    key={route.href}
                    href={route.href}
                    onClick={handleLinkClick}
                    className={cn(
                      "text-lg font-medium transition-colors hover:text-primary px-4 py-3 rounded-md flex items-center gap-3",
                      pathname === route.href
                        ? "text-primary bg-primary/10"
                        : "text-muted-foreground hover:bg-gray-100 dark:hover:bg-gray-800"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    {route.label}
                  </Link>
                );
              })}
              <div className="h-0.5 w-full bg-destructive/50 my-2" />
              <Button
                variant="ghost"
                className="text-lg font-medium text-muted-foreground hover:text-destructive px-4 py-3 rounded-md flex items-center gap-3 justify-start"
                onClick={handleLogout}
              >
                <LogOut className="h-5 w-5" />
                Logout
              </Button>
            </nav>
          </div>
        </div>
      </div>
    </>
  );
}
