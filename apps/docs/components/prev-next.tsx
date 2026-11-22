"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface NavTarget {
  title: string;
  href: string;
}

export function PreviousNextNavigation({
  prev,
  next,
}: {
  prev?: NavTarget | null;
  next?: NavTarget | null;
}) {
  return (
    <div className="mt-12 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-t border-zinc-200 dark:border-zinc-800 pt-6">
      {prev ? (
        <Link
          href={prev.href}
          className="group flex flex-col items-start rounded-lg border border-zinc-200 dark:border-zinc-800 p-4 transition hover:border-emerald-500/40 hover:bg-zinc-50 dark:hover:bg-zinc-900/40 sm:w-1/2"
        >
          <div className="flex items-center gap-1 text-[11px] font-medium text-zinc-500 group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
            <ChevronLeft className="size-3" />
            <span>Previous</span>
          </div>
          <span className="mt-1 text-sm font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
            {prev.title}
          </span>
        </Link>
      ) : (
        <div className="sm:w-1/2" />
      )}

      {next ? (
        <Link
          href={next.href}
          className="group flex flex-col items-end rounded-lg border border-zinc-200 dark:border-zinc-800 p-4 transition hover:border-emerald-500/40 hover:bg-zinc-50 dark:hover:bg-zinc-900/40 sm:w-1/2 text-right"
        >
          <div className="flex items-center gap-1 text-[11px] font-medium text-zinc-500 group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
            <span>Next</span>
            <ChevronRight className="size-3" />
          </div>
          <span className="mt-1 text-sm font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
            {next.title}
          </span>
        </Link>
      ) : (
        <div className="sm:w-1/2" />
      )}
    </div>
  );
}
