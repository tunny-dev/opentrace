"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, ChevronRight } from "lucide-react";
import { docsNavItems } from "@/lib/docs-data";

export function Sidebar({
  mobile = false,
  onCloseMobile,
}: {
  mobile?: boolean;
  onCloseMobile?: () => void;
}) {
  const pathname = usePathname();

  // Find which group contains the active pathname
  const activeGroupTitle = React.useMemo(() => {
    for (const group of docsNavItems) {
      if (group.items.some((item) => pathname === item.href || pathname?.startsWith(item.href))) {
        return group.title;
      }
    }
    return "Getting Started";
  }, [pathname]);

  // State: only open the active group by default
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    [activeGroupTitle]: true,
  });

  // Whenever pathname changes to a new group, expand it automatically
  useEffect(() => {
    if (activeGroupTitle) {
      setExpandedGroups((prev) => ({
        ...prev,
        [activeGroupTitle]: true,
      }));
    }
  }, [activeGroupTitle]);

  const toggleGroup = (title: string) => {
    setExpandedGroups((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  return (
    <aside
      className={`h-[calc(100vh-3.5rem)] overflow-y-auto px-4 py-6 text-xs ${
        mobile ? "w-full" : "w-64 border-r border-zinc-200 dark:border-zinc-800"
      }`}
    >
      <div className="space-y-4">
        {docsNavItems.map((group) => {
          const isExpanded = expandedGroups[group.title] ?? false;
          const Icon = group.icon;
          const hasActiveItem = group.items.some(
            (item) => pathname === item.href || pathname?.startsWith(item.href)
          );

          return (
            <div key={group.title} className="space-y-1">
              <button
                onClick={() => toggleGroup(group.title)}
                className={`flex w-full items-center justify-between rounded-md px-2 py-1.5 text-[11px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                  hasActiveItem
                    ? "text-zinc-900 dark:text-zinc-100 font-extrabold"
                    : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200"
                }`}
              >
                <div className="flex items-center gap-2">
                  {Icon && <Icon className="size-3.5 text-emerald-600 dark:text-emerald-400" />}
                  <span>{group.title}</span>
                </div>
                {isExpanded ? (
                  <ChevronDown className="size-3.5 text-zinc-400" />
                ) : (
                  <ChevronRight className="size-3.5 text-zinc-400" />
                )}
              </button>

              {isExpanded && (
                <div className="space-y-0.5 pt-1 pl-2 border-l border-zinc-200 dark:border-zinc-800 ml-2 animate-in fade-in-50 duration-150">
                  {group.items.map((item) => {
                    const isActive = pathname === item.href;

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={onCloseMobile}
                        className={`group flex items-center justify-between rounded-lg px-2.5 py-1.5 font-medium transition cursor-pointer ${
                          isActive
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold shadow-2xs"
                            : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 hover:text-zinc-900 dark:hover:text-zinc-100"
                        }`}
                      >
                        <span className="flex items-center gap-2 truncate">
                          {isActive && (
                            <span className="size-1.5 rounded-full bg-emerald-500 shrink-0" />
                          )}
                          <span className="truncate">{item.title}</span>
                        </span>
                        {item.badge && (
                          <span
                            className={`rounded px-1.5 py-0.2 text-[9px] font-semibold ${
                              isActive
                                ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                                : "bg-muted text-zinc-500"
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
}
