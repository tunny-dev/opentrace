"use client";

import * as React from "react";
import { Slider as SliderPrimitive } from "@base-ui/react/slider";
import { cn } from "@/lib/utils";

export interface SliderProps {
  className?: string;
  value?: number | number[];
  defaultValue?: number | number[];
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  onValueChange?: (value: any) => void;
  [key: string]: any;
}

export function Slider({
  className,
  value,
  defaultValue = 0,
  min = 0,
  max = 100,
  step = 1,
  disabled = false,
  onValueChange,
  ...props
}: SliderProps) {
  return (
    <SliderPrimitive.Root
      value={value}
      defaultValue={defaultValue}
      min={min}
      max={max}
      step={step}
      disabled={disabled}
      onValueChange={onValueChange}
      className={cn(
        "relative flex w-full touch-none select-none items-center py-2 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
      <SliderPrimitive.Control className="relative flex w-full items-center">
        <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
          <SliderPrimitive.Indicator className="absolute h-full bg-emerald-600 dark:bg-emerald-500 rounded-full transition-all" />
        </SliderPrimitive.Track>
        <SliderPrimitive.Thumb className="block size-4.5 rounded-full border-2 border-emerald-600 bg-white shadow-md ring-offset-background transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:pointer-events-none hover:scale-110 active:scale-95" />
      </SliderPrimitive.Control>
    </SliderPrimitive.Root>
  );
}
