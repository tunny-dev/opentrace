"use client";

import { useTheme as useNextTheme } from "next-themes";
import { useCallback } from "react";

export function useTheme() {
  const { theme, resolvedTheme, setTheme } = useNextTheme();

  const toggleTheme = useCallback(() => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  }, [resolvedTheme, setTheme]);

  return {
    theme,
    resolvedTheme: resolvedTheme || "dark",
    setTheme,
    toggleTheme,
  };
}

export default useTheme;
