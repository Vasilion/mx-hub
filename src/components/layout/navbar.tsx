"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import {
  Home,
  Dumbbell,
  StickyNote,
  Settings,
  Mountain,
  Timer,
  ClipboardCheck,
  LogOut,
} from "lucide-react";

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

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <nav className="hidden lg:flex items-center">
      <div className="flex items-center space-x-6">
        {routes.map((route) => {
          const Icon = route.icon;
          return (
            <Link
              key={route.href}
              href={route.href}
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary flex items-center gap-2",
                pathname === route.href
                  ? "text-primary"
                  : "text-muted-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {route.label}
            </Link>
          );
        })}
      </div>
      <div className="mx-6 h-6 w-0.5 bg-destructive/50" />
      <Button
        variant="ghost"
        className="text-sm font-medium text-muted-foreground hover:text-destructive flex items-center gap-2"
        onClick={handleLogout}
      >
        <LogOut className="h-4 w-4" />
        Logout
      </Button>
    </nav>
  );
}
