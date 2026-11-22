"use client";

import * as React from "react";
import { Checkbox as CheckboxPrimitive } from "@base-ui/react/checkbox";
import { Check, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

export function Checkbox({
  className,
  checked,
  indeterminate,
  onCheckedChange,
  disabled,
  ...props
}: {
  className?: string;
  checked?: boolean | "indeterminate";
  indeterminate?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  [key: string]: any;
}) {
  const isIndeterminate = indeterminate || checked === "indeterminate";
  const isChecked = checked === true;

  return (
    <CheckboxPrimitive.Root
      checked={isIndeterminate ? false : isChecked}
      indeterminate={isIndeterminate}
      onCheckedChange={(val) => onCheckedChange?.(Boolean(val))}
      disabled={disabled}
      className={cn(
        "peer size-4 shrink-0 rounded-[4px] border border-border shadow-xs transition-all outline-none cursor-pointer flex items-center justify-center",
        "focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "data-[checked]:bg-emerald-600 data-[checked]:text-white data-[checked]:border-emerald-600",
        "dark:data-[checked]:bg-emerald-600 dark:data-[checked]:text-white dark:data-[checked]:border-emerald-600",
        "data-[indeterminate]:bg-emerald-600 data-[indeterminate]:text-white data-[indeterminate]:border-emerald-600",
        "bg-background hover:bg-muted/60",
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator className="flex items-center justify-center text-current">
        {isIndeterminate ? (
          <Minus className="size-3 stroke-3" />
        ) : (
          <Check className="size-3 stroke-3" />
        )}
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}
