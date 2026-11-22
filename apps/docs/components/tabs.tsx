"use client";

import * as React from "react";
import { useState } from "react";

interface TabItem {
  id: string;
  label: string;
  content: React.ReactNode;
}

interface TabsProps {
  items: TabItem[];
  defaultTab?: string;
}

export function Tabs({ items, defaultTab }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || items[0]?.id);

  return (
    <div className="my-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-card overflow-hidden">
      {/* Tab headers */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 px-2 overflow-x-auto">
        {items.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`relative px-3.5 py-2.5 text-xs font-medium transition whitespace-nowrap ${
              activeTab === tab.id
                ? "text-zinc-900 dark:text-zinc-100 font-semibold"
                : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"
            }`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500 rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="p-4">
        {items.find((item) => item.id === activeTab)?.content}
      </div>
    </div>
  );
}
