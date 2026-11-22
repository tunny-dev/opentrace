"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { List, MessageSquare, ExternalLink, Code2 } from "lucide-react";

export interface TocItem {
  id: string;
  title: string;
  level: number;
}

export function TableOfContents({ items }: { items: TocItem[] }) {
  const [activeId, setActiveId] = useState<string>(items[0]?.id || "");

  useEffect(() => {
    const handleScroll = () => {
      const headings = items
        .map((item) => document.getElementById(item.id))
        .filter((el): el is HTMLElement => Boolean(el));

      const scrollPosition = window.scrollY + 120;

      for (let i = headings.length - 1; i >= 0; i--) {
        const heading = headings[i];
        if (heading.offsetTop <= scrollPosition) {
          setActiveId(heading.id);
          return;
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [items]);

  if (!items || items.length === 0) return null;

  return (
    <div className="space-y-6 text-xs">
      <div className="space-y-2.5">
        <div className="flex items-center gap-2 font-semibold text-zinc-900 dark:text-zinc-100">
          <List className="size-3.5 text-zinc-400" />
          <span>On this page</span>
        </div>

        <nav className="space-y-1.5 border-l border-zinc-200 dark:border-zinc-800 pl-3">
          {items.map((item) => {
            const isActive = activeId === item.id;

            return (
              <a
                key={item.id}
                href={`#${item.id}`}
                className={`block transition truncate ${
                  item.level === 3 ? "pl-3 text-[11px]" : "text-xs"
                } ${
                  isActive
                    ? "font-semibold text-emerald-600 dark:text-emerald-400 -ml-[13px] border-l-2 border-emerald-500 pl-3"
                    : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
                }`}
              >
                {item.title}
              </a>
            );
          })}
        </nav>
      </div>

      <div className="space-y-2 border-t border-zinc-200 dark:border-zinc-800 pt-4 text-[11px] text-zinc-500 dark:text-zinc-400">
        <a
          href="https://github.com/TunnyProject/opentrace"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
        >
          <Code2 className="size-3.5" />
          <span>Edit this page on GitHub</span>
        </a>
        <a
          href="https://github.com/TunnyProject/opentrace/issues"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
        >
          <MessageSquare className="size-3.5" />
          <span>Submit feedback or issue</span>
        </a>
      </div>
    </div>
  );
}
