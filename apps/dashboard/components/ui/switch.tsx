"use client";

import * as React from "react";
import { Switch as SwitchPrimitive } from "@base-ui/react/switch";
import { cn } from "@/lib/utils";

export function Switch({
  className,
  checked,
  onCheckedChange,
  disabled,
  ...props
}: {
  className?: string;
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  [key: string]: any;
}) {
  return (
    <SwitchPrimitive.Root
      checked={checked}
      onCheckedChange={(val) => onCheckedChange?.(Boolean(val))}
      disabled={disabled}
      className={cn(
        "peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors shadow-2xs outline-none",
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "data-[checked]:bg-emerald-600 dark:data-[checked]:bg-emerald-500 bg-zinc-300 dark:bg-zinc-700",
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        className={cn(
          "pointer-events-none block size-4 rounded-full bg-white shadow-lg ring-0 transition-transform",
          "data-[checked]:translate-x-4 translate-x-0"
        )}
      />
    </SwitchPrimitive.Root>
  );
}
