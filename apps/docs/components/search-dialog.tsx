"use client";

import * as React from "react";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, FileText, ArrowRight, CornerDownLeft, X, Hash } from "lucide-react";
import { docsNavItems } from "@/lib/docs-data";

export function SearchDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Flatten searchable items from docsNavItems
  const allItems = React.useMemo(() => {
    return docsNavItems.flatMap((group) =>
      group.items.map((item) => ({
        group: group.title,
        title: item.title,
        href: item.href,
        description: item.description,
        keywords: item.keywords || [],
      }))
    );
  }, []);

  const results = React.useMemo(() => {
    if (!query.trim()) return allItems.slice(0, 8);
    const q = query.toLowerCase();
    return allItems.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.group.toLowerCase().includes(q) ||
        item.keywords.some((k) => k.toLowerCase().includes(q))
    );
  }, [allItems, query]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
    }
  }, [open]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        onOpenChange(!open);
      }
      if (!open) return;

      if (e.key === "Escape") {
        onOpenChange(false);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
      } else if (e.key === "Enter" && results[selectedIndex]) {
        e.preventDefault();
        router.push(results[selectedIndex].href);
        onOpenChange(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onOpenChange, results, selectedIndex, router]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-xs pt-[14vh] p-4">
      <div
        className="relative w-full max-w-xl rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-background shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 border-b border-zinc-200 dark:border-zinc-800 px-4 py-3">
          <Search className="size-4.5 text-zinc-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search documentation, guides, and APIs..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm placeholder:text-zinc-400 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="rounded p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
            >
              <X className="size-3.5" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded border border-zinc-200 dark:border-zinc-800 bg-muted px-1.5 py-0.5 text-[10px] font-mono text-zinc-500">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-[380px] overflow-y-auto p-2">
          {results.length === 0 ? (
            <div className="py-12 text-center text-xs text-zinc-500">
              No results found for &ldquo;<span className="font-semibold">{query}</span>&rdquo;
            </div>
          ) : (
            <div className="space-y-1">
              {results.map((item, index) => {
                const isSelected = index === selectedIndex;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => onOpenChange(false)}
                    className={`flex items-center justify-between rounded-xl p-3 transition text-xs ${
                      isSelected
                        ? "bg-zinc-100 dark:bg-zinc-800/80 text-zinc-900 dark:text-zinc-100"
                        : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
                    }`}
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="mt-0.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-muted/60 p-1.5 text-zinc-500 shrink-0">
                        <FileText className="size-3.5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                            {item.title}
                          </span>
                          <span className="rounded bg-muted px-1.5 py-0.2 text-[10px] text-zinc-500 shrink-0">
                            {item.group}
                          </span>
                        </div>
                        <p className="mt-0.5 text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                          {item.description}
                        </p>
                      </div>
                    </div>

                    <div className="ml-2 flex items-center text-zinc-400 shrink-0">
                      {isSelected ? (
                        <span className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                          Select <CornerDownLeft className="size-3" />
                        </span>
                      ) : (
                        <ArrowRight className="size-3 opacity-40" />
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="flex items-center justify-between border-t border-zinc-200 dark:border-zinc-800 bg-muted/30 px-4 py-2.5 text-[11px] text-zinc-400">
          <div className="flex items-center gap-2">
            <span>Navigation:</span>
            <kbd className="rounded bg-muted px-1 py-0.2 font-mono text-[9px]">↑</kbd>
            <kbd className="rounded bg-muted px-1 py-0.2 font-mono text-[9px]">↓</kbd>
          </div>
          <div>
            <span>Press</span>{" "}
            <kbd className="rounded bg-muted px-1 py-0.2 font-mono text-[9px]">ENTER</kbd> to open
          </div>
        </div>
      </div>
    </div>
  );
}
