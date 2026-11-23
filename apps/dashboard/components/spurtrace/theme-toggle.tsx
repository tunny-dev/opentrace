"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div
        className={`flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card/80 text-muted-foreground ${className ?? ""}`}
      >
        <Moon className="h-4 w-4" />
      </div>
    );
  }

  const isDark = resolvedTheme === "dark" || theme === "dark";
  const label = isDark ? "Switch to light mode" : "Switch to dark mode";

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label={label}
            onClick={() => setTheme(isDark ? "light" : "dark")}
            className={`group h-8 w-8 cursor-pointer rounded-lg border-border bg-card/80 text-muted-foreground shadow-xs transition-all duration-200 hover:border-emerald-500/40 hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:border-emerald-500/35 dark:hover:bg-emerald-500/15 dark:hover:text-emerald-400 ${className ?? ""}`}
          >
            {isDark ? (
              <Sun className="h-4 w-4 text-amber-500 transition-transform duration-300 ease-out group-hover:rotate-45 dark:text-amber-400" />
            ) : (
              <Moon className="h-4 w-4 text-sky-600 transition-transform duration-300 ease-out group-hover:-rotate-12 dark:text-sky-400" />
            )}
          </Button>
        }
      />
      <TooltipContent side="bottom" align="end">
        {label}
      </TooltipContent>
    </Tooltip>
  );
}
