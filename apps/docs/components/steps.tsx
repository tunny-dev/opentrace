"use client";

import * as React from "react";

export function Steps({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative my-6 space-y-8 pl-8 border-l border-zinc-200 dark:border-zinc-800 ml-4">
      {children}
    </div>
  );
}

export function Step({
  number,
  title,
  children,
}: {
  number: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative group">
      {/* Number circle badge, cleanly centered over the parent border-l */}
      <div className="absolute -left-[45px] top-0 flex size-6 items-center justify-center rounded-full border border-zinc-300 dark:border-zinc-700 bg-background text-xs font-bold text-zinc-900 dark:text-zinc-100 shadow-xs ring-4 ring-background">
        {number}
      </div>
      <div className="space-y-3">
        <h4 className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
          {title}
        </h4>
        <div className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed space-y-3">
          {children}
        </div>
      </div>
    </div>
  );
}
