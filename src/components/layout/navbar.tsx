"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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

export function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="hidden lg:flex items-center space-x-6">
      {routes.map((route) => (
        <Link
          key={route.href}
          href={route.href}
          className={cn(
            "text-sm font-medium transition-colors hover:text-primary",
            pathname === route.href ? "text-primary" : "text-muted-foreground"
          )}
        >
          {route.label}
        </Link>
      ))}
    </nav>
  );
}
