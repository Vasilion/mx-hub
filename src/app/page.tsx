"use client";

import { MainLayout } from "@/components/layout/main-layout";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  CheckSquare,
  Timer,
  Settings,
  ClipboardList,
  ArrowRight,
  Mountain,
  Dumbbell,
  SlidersHorizontal,
  Notebook,
} from "lucide-react";
import Link from "next/link";

interface NavigationTile {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  color: string;
}

const navigationTiles: NavigationTile[] = [
  {
    title: "Riding Checklist",
    description: "Track your pre-ride checks and moto maintenance",
    icon: <CheckSquare className="h-6 w-6" />,
    href: "/checklist",
    color: "bg-blue-500/10 text-blue-500",
  },
  {
    title: "Lap Times",
    description: "Record and analyze your lap times",
    icon: <Timer className="h-6 w-6" />,
    href: "/lap-times",
    color: "bg-red-500/10 text-red-500",
  },
  {
    title: "Tracks",
    description: "Manage your favorite tracks and conditions",
    icon: <Mountain className="h-6 w-6" />,
    href: "/tracks",
    color: "bg-green-500/10 text-green-500",
  },
  {
    title: "Workouts",
    description: "Plan and track your training sessions",
    icon: <Dumbbell className="h-6 w-6" />,
    href: "/workouts",
    color: "bg-purple-500/10 text-purple-500",
  },
  {
    title: "Suspension",
    description: "Track suspension settings and changes",
    icon: <SlidersHorizontal className="h-6 w-6" />,
    href: "/suspension",
    color: "bg-yellow-500/10 text-yellow-500",
  },
  {
    title: "Notes",
    description: "Keep track of riding tips and improvements",
    icon: <Notebook className="h-6 w-6" />,
    href: "/notes",
    color: "bg-orange-500/10 text-orange-500",
  },
];

export default function HomePage() {
  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8">Welcome to MX Hub</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {navigationTiles.map((tile) => (
            <Link key={tile.href} href={tile.href} className="block group">
              <Card className="p-6 h-full transition-all duration-200 hover:shadow-lg hover:-translate-y-1">
                <div className="flex items-start space-x-4">
                  <div className={cn("p-2 rounded-lg", tile.color)}>
                    {tile.icon}
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold mb-2 group-hover:text-primary">
                      {tile.title}
                    </h2>
                    <p className="text-muted-foreground">{tile.description}</p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground/50 transition-transform duration-200 group-hover:translate-x-1 group-hover:text-primary" />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </MainLayout>
  );
}
