"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import {
  Activity,
  Search,
  Sun,
  Moon,
  Laptop,
  ExternalLink,
  Menu,
  X,
  BookOpen,
} from "lucide-react";
import { SearchDialog } from "./search-dialog";

export function Header({
  onToggleMobileSidebar,
  mobileSidebarOpen,
}: {
  onToggleMobileSidebar?: () => void;
  mobileSidebarOpen?: boolean;
}) {
  const { theme, setTheme } = useTheme();
  const [searchOpen, setSearchOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const cycleTheme = () => {
    if (theme === "dark") setTheme("light");
    else if (theme === "light") setTheme("system");
    else setTheme("dark");
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-zinc-200 dark:border-zinc-800 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Left: Mobile Toggle + Brand Logo */}
          <div className="flex items-center gap-3">
            {onToggleMobileSidebar && (
              <button
                onClick={onToggleMobileSidebar}
                className="md:hidden flex size-8 items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                aria-label="Toggle navigation"
              >
                {mobileSidebarOpen ? <X className="size-4" /> : <Menu className="size-4" />}
              </button>
            )}

            <Link href="/" className="flex items-center gap-2.5 font-bold tracking-tight">
              <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
                <Activity className="size-4" />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">SpurTrace</span>
                <span className="rounded-md bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.2 text-[10px] font-semibold text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
                  APM
                </span>
              </div>
            </Link>

            {/* Main nav links */}
            <nav className="hidden md:flex items-center gap-6 ml-8 text-xs font-medium text-zinc-600 dark:text-zinc-400">
              <Link href="/docs/getting-started/introduction" className="flex items-center gap-1.5 text-zinc-900 dark:text-zinc-100 font-semibold hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                <BookOpen className="size-3.5 text-emerald-500" />
                <span>Docs</span>
              </Link>
              <Link href="/docs/getting-started/quickstart" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
                Quickstart
              </Link>
              <Link href="/docs/backend/express" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
                Backend SDKs
              </Link>
              <Link href="/docs/frontend/overview" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
                Frontend UI
              </Link>
              <Link href="/docs/backend/dotnet-core" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
                .NET 6+
              </Link>
              <Link href="/docs/api-reference/endpoints" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
                API
              </Link>
            </nav>
          </div>

          {/* Right: Search + Theme + External Links */}
          <div className="flex items-center gap-2">
            {/* Search Trigger Button */}
            <button
              onClick={() => setSearchOpen(true)}
              className="flex h-8 w-44 sm:w-60 items-center justify-between rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 px-2.5 text-xs text-zinc-500 transition hover:border-zinc-300 dark:hover:border-zinc-700 hover:text-zinc-900 dark:hover:text-zinc-100"
            >
              <span className="flex items-center gap-2">
                <Search className="size-3.5" />
                <span className="hidden sm:inline">Search docs...</span>
                <span className="sm:hidden">Search...</span>
              </span>
              <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded border border-zinc-200 dark:border-zinc-800 bg-background px-1.5 py-0.5 text-[10px] font-mono text-zinc-400">
                ⌘K
              </kbd>
            </button>

            {/* Theme Toggle Button */}
            {mounted && (
              <button
                onClick={cycleTheme}
                aria-label="Toggle theme"
                className="flex size-8 items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                {theme === "dark" ? (
                  <Moon className="size-3.5" />
                ) : theme === "light" ? (
                  <Sun className="size-3.5" />
                ) : (
                  <Laptop className="size-3.5" />
                )}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Global Search Dialog */}
      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
}
