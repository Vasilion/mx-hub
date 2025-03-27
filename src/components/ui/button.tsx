import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 relative overflow-hidden",
  {
    variants: {
      variant: {
        default:
          "bg-primary/90 text-primary-foreground shadow hover:bg-primary/80 after:absolute after:inset-0 after:bg-gradient-to-r after:from-transparent after:via-white/10 after:to-transparent after:translate-x-[-200%] hover:after:translate-x-[200%] after:transition-transform after:duration-300",
        destructive:
          "bg-destructive/90 text-destructive-foreground shadow-sm hover:bg-destructive/80 after:absolute after:inset-0 after:bg-gradient-to-r after:from-transparent after:via-white/10 after:to-transparent after:translate-x-[-200%] hover:after:translate-x-[200%] after:transition-transform after:duration-300",
        outline:
          "border border-input bg-transparent shadow-sm hover:bg-accent hover:text-accent-foreground before:absolute before:inset-0 before:bg-gradient-to-r before:from-primary/10 before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity",
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80 after:absolute after:inset-0 after:bg-gradient-to-r after:from-transparent after:via-white/5 after:to-transparent after:translate-x-[-200%] hover:after:translate-x-[200%] after:transition-transform after:duration-300",
        ghost:
          "hover:bg-accent hover:text-accent-foreground before:absolute before:inset-0 before:bg-gradient-to-r before:from-primary/10 before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
