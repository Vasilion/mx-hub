import * as React from "react";

import { cn } from "@/lib/utils";

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-none border border-primary/20 shadow-sm relative",
      "bg-black/40 backdrop-blur-sm",
      "before:absolute before:inset-0 before:border-t before:border-primary/20",
      "after:absolute after:top-0 after:left-0 after:h-1 after:w-24 after:bg-primary/50",
      "[clip-path:polygon(0_0,calc(100%-16px)_0,100%_16px,100%_100%,16px_100%,0_calc(100%-16px))]",
      // Glass reflection effect
      "before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/5 before:to-transparent before:pointer-events-none",
      className
    )}
    {...props}
  />
));
Card.displayName = "Card";

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex flex-col space-y-1.5 p-6 relative",
      "after:absolute after:-right-2 after:top-0 after:h-full after:w-[2px] after:bg-primary/20",
      "before:absolute before:top-0 before:right-0 before:h-8 before:w-8",
      "before:border-t before:border-r before:border-primary/20",
      className
    )}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-2xl font-mono font-semibold leading-none tracking-tight text-primary",
      "relative pl-3",
      "before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2",
      "before:h-full before:w-[2px] before:bg-primary",
      "cyber-text",
      className
    )}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn(
      "text-sm text-muted-foreground/90 font-mono",
      "relative pl-3",
      className
    )}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "p-6 pt-0 relative",
      "before:absolute before:bottom-0 before:left-4 before:right-4",
      "before:h-[1px] before:bg-gradient-to-r before:from-transparent before:via-primary/20 before:to-transparent",
      className
    )}
    {...props}
  />
));
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex items-center p-6 pt-0",
      "relative",
      "after:absolute after:bottom-4 after:right-4",
      "after:h-3 after:w-3 after:border-r after:border-b after:border-primary/20",
      className
    )}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
};
