"use client";

import * as React from "react";
import { ColumnDef } from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";

import type { DemoTrace } from "@/lib/opentrace/demo-data";
import {
  DataTable,
  DataTableFacetedFilter,
  DataTableQuickFilter,
} from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

function formatDuration(value: number) {
  return value >= 1000 ? `${(value / 1000).toFixed(2)} s` : `${Math.round(value)} ms`;
}

export function TracesTable({
  traces,
  section,
  onSelect,
  liveStream,
}: {
  traces: DemoTrace[];
  section: string;
  onSelect: (trace: DemoTrace) => void;
  liveStream: boolean;
}) {
  const title =
    section === "errors"
      ? "Error traces"
      : section === "sql"
        ? "Slow & duplicate queries"
        : section === "overview"
          ? "Recent traces"
          : "All traces";

  // Filter dataset by section first if needed
  const data = React.useMemo(() => {
    return traces.filter((trace) => {
      if (section === "errors" && trace.state !== "error") return false;
      if (
        section === "sql" &&
        !trace.queries.some((query) => query.slow || query.duplicateCount > 2)
      ) {
        return false;
      }
      return true;
    });
  }, [traces, section]);

  // Columns definition
  const columns = React.useMemo<ColumnDef<DemoTrace>[]>(
    () => [
      // STT Index Column
      {
        id: "stt",
        header: "STT",
        cell: ({ row, table }) => {
          const { pageIndex, pageSize } = table.getState().pagination;
          return (
            <div className="text-center">
              <span className="text-muted-foreground/70 tabular-nums font-mono text-[11px]">
                {pageIndex * pageSize + row.index + 1}
              </span>
            </div>
          );
        },
        enableSorting: false,
        size: 48,
      },
      // STATUS Column
      {
        accessorKey: "state",
        id: "status",
        header: ({ column }) => (
          <button
            type="button"
            className="flex items-center gap-1 font-semibold uppercase tracking-wider text-[10px] text-muted-foreground hover:text-foreground cursor-pointer font-sans"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            STATUS
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className="h-3 w-3 text-emerald-500" />
            ) : column.getIsSorted() === "desc" ? (
              <ArrowDown className="h-3 w-3 text-emerald-500" />
            ) : (
              <ArrowUpDown className="h-3 w-3 opacity-40" />
            )}
          </button>
        ),
        cell: ({ row }) => {
          const trace = row.original;
          const isOk = trace.state === "success";
          const isSlow = trace.state === "slow";
          const variant = isOk ? "success" : isSlow ? "warning" : "destructive";
          const dotColor = isOk ? "bg-emerald-500" : isSlow ? "bg-amber-500" : "bg-rose-500";
          const label = isOk ? "OK" : isSlow ? "SLOW" : "ERROR";

          return (
            <div className="flex items-center gap-2 font-sans">
              <Badge variant={variant} size="sm" className="gap-1 font-semibold tracking-wide">
                <span
                  className={cn(
                    "size-1.5 rounded-full shrink-0",
                    dotColor,
                    trace.isLive && "animate-pulse"
                  )}
                />
                {label}
              </Badge>
              <span className="font-mono text-xs text-muted-foreground tabular-nums">
                {trace.status}
              </span>
            </div>
          );
        },
      },
      // REQUEST Column
      {
        accessorKey: "route",
        id: "request",
        header: ({ column }) => (
          <button
            type="button"
            className="flex items-center gap-1 font-semibold uppercase tracking-wider text-[10px] text-muted-foreground hover:text-foreground cursor-pointer font-sans"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            REQUEST
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className="h-3 w-3 text-emerald-500" />
            ) : column.getIsSorted() === "desc" ? (
              <ArrowDown className="h-3 w-3 text-emerald-500" />
            ) : (
              <ArrowUpDown className="h-3 w-3 opacity-40" />
            )}
          </button>
        ),
        cell: ({ row }) => {
          const trace = row.original;
          const methodClass =
            trace.method === "GET"
              ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              : trace.method === "POST"
                ? "border-sky-500/25 bg-sky-500/10 text-sky-600 dark:text-sky-400"
                : trace.method === "PATCH" || trace.method === "PUT"
                  ? "border-amber-500/25 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                  : "border-rose-500/25 bg-rose-500/10 text-rose-600 dark:text-rose-400";

          return (
            <div className="flex items-center gap-2.5 font-sans min-w-0">
              <Badge
                variant="outline"
                size="sm"
                className={cn("font-mono font-bold text-[10px] uppercase shrink-0", methodClass)}
              >
                {trace.method}
              </Badge>
              <div className="min-w-0 flex flex-col gap-0.5">
                <span className="truncate font-medium text-xs text-foreground group-hover:text-emerald-500 transition-colors">
                  {trace.route}
                </span>
                <span className="font-mono text-[10px] text-muted-foreground/80 truncate">
                  {trace.id}
                </span>
              </div>
            </div>
          );
        },
      },
      // DURATION Column
      {
        accessorKey: "duration",
        id: "duration",
        header: ({ column }) => (
          <button
            type="button"
            className="flex items-center gap-1 font-semibold uppercase tracking-wider text-[10px] text-muted-foreground hover:text-foreground cursor-pointer font-sans"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            DURATION
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className="h-3 w-3 text-emerald-500" />
            ) : column.getIsSorted() === "desc" ? (
              <ArrowDown className="h-3 w-3 text-emerald-500" />
            ) : (
              <ArrowUpDown className="h-3 w-3 opacity-40" />
            )}
          </button>
        ),
        cell: ({ row }) => {
          const trace = row.original;
          return (
            <span
              className={cn(
                "font-mono text-xs tabular-nums font-medium",
                trace.duration >= 1000
                  ? "text-amber-600 dark:text-amber-400 font-bold"
                  : "text-foreground"
              )}
            >
              {formatDuration(trace.duration)}
            </span>
          );
        },
      },
      // WATERFALL Column
      {
        id: "waterfall",
        header: "WATERFALL",
        enableSorting: false,
        cell: ({ row }) => {
          const trace = row.original;
          return (
            <div
              className="flex items-center gap-0.5 h-2.5 w-24 bg-muted/40 rounded px-0.5 overflow-hidden border border-border/40"
              title={`${trace.spans.length} spans, ${trace.duration}ms`}
            >
              <span
                className="h-1.5 rounded-xs bg-emerald-500/80 transition-all"
                style={{ width: `${Math.min(95, Math.max(15, trace.duration / 25))}%` }}
              />
              <span
                className="h-1.5 rounded-xs bg-sky-500/80 transition-all"
                style={{ width: `${Math.min(75, Math.max(10, trace.sqlCount * 3))}%` }}
              />
              <span
                className="h-1.5 rounded-xs bg-purple-500/80 transition-all"
                style={{ width: `${Math.min(45, Math.max(8, trace.duration / 70))}%` }}
              />
            </div>
          );
        },
      },
      // SQL Count Column
      {
        accessorKey: "sqlCount",
        id: "sql",
        header: ({ column }) => (
          <button
            type="button"
            className="flex items-center gap-1 font-semibold uppercase tracking-wider text-[10px] text-muted-foreground hover:text-foreground cursor-pointer font-sans"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            SQL
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className="h-3 w-3 text-emerald-500" />
            ) : column.getIsSorted() === "desc" ? (
              <ArrowDown className="h-3 w-3 text-emerald-500" />
            ) : (
              <ArrowUpDown className="h-3 w-3 opacity-40" />
            )}
          </button>
        ),
        cell: ({ row }) => {
          const trace = row.original;
          const hasNPlusOne = trace.queries.some((q) => q.duplicateCount > 2);
          return (
            <div className="flex items-center gap-1.5 font-sans">
              <span className="font-mono text-xs tabular-nums font-medium text-foreground">
                {trace.sqlCount}
              </span>
              {hasNPlusOne && (
                <Badge variant="purple" size="sm" className="font-bold text-[9px] px-1 py-0 h-4">
                  N+1
                </Badge>
              )}
            </div>
          );
        },
      },
      // WHEN Column
      {
        accessorKey: "createdAt",
        id: "when",
        header: ({ column }) => (
          <button
            type="button"
            className="flex items-center gap-1 font-semibold uppercase tracking-wider text-[10px] text-muted-foreground hover:text-foreground cursor-pointer font-sans"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            WHEN
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className="h-3 w-3 text-emerald-500" />
            ) : column.getIsSorted() === "desc" ? (
              <ArrowDown className="h-3 w-3 text-emerald-500" />
            ) : (
              <ArrowUpDown className="h-3 w-3 opacity-40" />
            )}
          </button>
        ),
        cell: ({ row }) => {
          return (
            <span className="text-xs text-muted-foreground tabular-nums whitespace-nowrap font-sans">
              {row.original.ageLabel}
            </span>
          );
        },
      },
    ],
    []
  );

  // Faceted filters definition
  const facetedFilters: DataTableFacetedFilter[] = [
    {
      id: "method",
      title: "All methods",
      options: [
        {
          label: "GET",
          value: "GET",
          colorClass: "font-semibold text-emerald-600 dark:text-emerald-400",
        },
        {
          label: "POST",
          value: "POST",
          colorClass: "font-semibold text-sky-600 dark:text-sky-400",
        },
        {
          label: "PATCH",
          value: "PATCH",
          colorClass: "font-semibold text-amber-600 dark:text-amber-400",
        },
        {
          label: "DELETE",
          value: "DELETE",
          colorClass: "font-semibold text-rose-600 dark:text-rose-400",
        },
      ],
      filterFn: (row: DemoTrace, val: string) => row.method.toUpperCase() === val.toUpperCase(),
    },
    {
      id: "state",
      title: "All statuses",
      options: [
        { label: "OK (200-299)", value: "success" },
        { label: "Slow (≥1000ms)", value: "slow" },
        { label: "Errors (500)", value: "error" },
      ],
      filterFn: (row: DemoTrace, val: string) => row.state === val,
    },
  ];

  // Quick filters definition
  const quickFilters: DataTableQuickFilter<DemoTrace>[] = [
    {
      id: "slow",
      label: "Slow (>1s)",
      color: "amber",
      predicate: (row) => row.state === "slow" || row.duration >= 1000,
    },
    {
      id: "errors",
      label: "Errors",
      color: "rose",
      predicate: (row) => row.state === "error",
    },
    {
      id: "n_plus_one",
      label: "N+1 Loop",
      color: "purple",
      predicate: (row) => row.queries.some((q) => q.duplicateCount > 2),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={data}
      title={title}
      kicker="REQUEST EXPLORER (REUSABLE TANSTACK TABLE)"
      badge={
        liveStream ? (
          <Badge variant="success" size="sm" className="gap-1 font-semibold">
            <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live Ingestion
          </Badge>
        ) : null
      }
      searchPlaceholder="Search by route, trace ID, or SQL…"
      facetedFilters={facetedFilters}
      quickFilters={quickFilters}
      defaultSorting={[{ id: "duration", desc: true }]}
      exportFilenamePrefix="opentrace-traces"
      onRowClick={onSelect}
      getRowClassName={(row) => (row.isLive ? "is-live-row" : undefined)}
    />
  );
}
