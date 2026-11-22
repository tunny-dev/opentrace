"use client";

import type { Column, Table } from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";

import { useI18n } from "@/lib/i18n/i18n-context";
import { cn } from "@/lib/utils";

interface DataTableColumnHeaderProps<TData, TValue> {
  column: Column<TData, TValue>;
  title: string;
  table?: Table<TData>;
  className?: string;
}

export function DataTableColumnHeader<TData, TValue>({
  column,
  title,
  table,
  className,
}: DataTableColumnHeaderProps<TData, TValue>) {
  const { t } = useI18n();
  const align = column.columnDef.meta?.align ?? "left";
  const alignClass =
    align === "right" ? "justify-end" : align === "center" ? "justify-center" : "justify-start";

  if (!column.getCanSort()) {
    return <span className={cn("flex items-center", alignClass, className)}>{title}</span>;
  }

  const sorted = column.getIsSorted();
  const sortIndex = column.getSortIndex();
  const isMultiSort = (table?.getState().sorting.length ?? 0) > 1;

  return (
    <button
      type="button"
      onClick={column.getToggleSortingHandler()}
      title={t("table.sortHint")}
      className={cn(
        "group/sort -mx-1.5 inline-flex h-6 w-[calc(100%+0.75rem)] cursor-pointer items-center gap-1 rounded px-1.5 uppercase tracking-wider transition-colors",
        "hover:bg-foreground/5 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
        alignClass,
        sorted && "text-foreground",
        className
      )}
    >
      <span>{title}</span>
      {sorted === "asc" ? (
        <ArrowUp className="size-3 shrink-0 text-emerald-600 dark:text-emerald-500" aria-hidden="true" />
      ) : sorted === "desc" ? (
        <ArrowDown className="size-3 shrink-0 text-emerald-600 dark:text-emerald-500" aria-hidden="true" />
      ) : (
        <ChevronsUpDown
          className="size-3 shrink-0 opacity-0 transition-opacity group-hover/sort:opacity-50 group-focus-visible/sort:opacity-50"
          aria-hidden="true"
        />
      )}
      {sorted && isMultiSort && (
        <span className="flex size-3.5 items-center justify-center rounded-full bg-emerald-500/15 text-[9px] font-bold tabular-nums text-emerald-700 dark:text-emerald-400">
          {sortIndex + 1}
        </span>
      )}
    </button>
  );
}
