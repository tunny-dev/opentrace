import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1.5 [&>svg]:pointer-events-none transition-colors select-none font-sans",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground shadow-xs hover:bg-primary/90",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive/15 text-destructive border-destructive/20 hover:bg-destructive/25",
        outline:
          "border-border bg-background text-foreground hover:bg-accent hover:text-accent-foreground",
        success:
          "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-semibold shadow-2xs",
        warning:
          "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-400 font-semibold shadow-2xs",
        info: "border-sky-500/25 bg-sky-500/10 text-sky-700 dark:text-sky-400 font-semibold shadow-2xs",
        purple:
          "border-purple-500/25 bg-purple-500/10 text-purple-700 dark:text-purple-400 font-semibold shadow-2xs",
      },
      size: {
        default: "h-5 px-2 text-xs",
        sm: "h-4.5 px-1.5 text-[10px] leading-none rounded",
        lg: "h-6 px-2.5 text-xs font-semibold",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <span
      data-slot="badge"
      className={cn(badgeVariants({ variant, size }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
