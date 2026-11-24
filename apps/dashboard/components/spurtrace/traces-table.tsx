"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Copy, Link2, ListFilter, Terminal } from "lucide-react";

import type { DemoSpan, DemoTrace } from "@/lib/spurtrace/demo-data";
import {
  DataTable,
  DataTableColumnHeader,
  type DataTableBulkAction,
  type DataTableFacetedFilter,
  type DataTableQuickFilter,
} from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { CopyButton } from "@/components/ui/copy-button";
import { cn } from "@/lib/utils";
import { formatDuration } from "@/lib/spurtrace/format-duration";

const STATE_RANK: Record<DemoTrace["state"], number> = { error: 0, slow: 1, success: 2 };

const SPAN_COLOR: Record<DemoSpan["kind"], string> = {
  middleware: "bg-purple-500",
  app: "bg-emerald-500",
  db: "bg-sky-500",
  http: "bg-amber-500",
};

const METHOD_CLASS: Record<string, string> = {
  GET: "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  POST: "border-sky-500/25 bg-sky-500/10 text-sky-700 dark:text-sky-400",
  PUT: "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  PATCH: "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  DELETE: "border-rose-500/25 bg-rose-500/10 text-rose-700 dark:text-rose-400",
};

function hasNPlusOne(trace: DemoTrace) {
  return trace.queries.some((query) => query.duplicateCount > 2);
}

function getSearchText(trace: DemoTrace) {
  return [
    trace.id,
    trace.method,
    trace.route,
    trace.status,
    trace.state,
    trace.service,
    trace.environment,
    ...trace.queries.map((query) => query.query),
  ].join(" ");
}

function toCurl(trace: DemoTrace) {
  return `curl -X ${trace.method} "$BASE_URL${trace.route}"`;
}

const FACETED_FILTERS: DataTableFacetedFilter<DemoTrace>[] = [
  {
    id: "method",
    title: "Method",
    options: [
      { label: "GET", value: "GET", colorClass: "font-mono text-[11px] font-semibold text-emerald-700 dark:text-emerald-400" },
      { label: "POST", value: "POST", colorClass: "font-mono text-[11px] font-semibold text-sky-700 dark:text-sky-400" },
      { label: "PUT", value: "PUT", colorClass: "font-mono text-[11px] font-semibold text-amber-700 dark:text-amber-400" },
      { label: "PATCH", value: "PATCH", colorClass: "font-mono text-[11px] font-semibold text-amber-700 dark:text-amber-400" },
      { label: "DELETE", value: "DELETE", colorClass: "font-mono text-[11px] font-semibold text-rose-700 dark:text-rose-400" },
    ],
    getValue: (trace) => trace.method.toUpperCase(),
  },
  {
    id: "state",
    title: "Status",
    options: [
      { label: "OK", value: "success" },
      { label: "Slow (≥ 1s)", value: "slow" },
      { label: "Error", value: "error" },
    ],
    getValue: (trace) => trace.state,
  },
];

const QUICK_FILTERS: DataTableQuickFilter<DemoTrace>[] = [
  {
    id: "slow",
    label: "Slow (>1s)",
    color: "amber",
    predicate: (trace) => trace.state === "slow" || trace.duration >= 1000,
  },
  { id: "errors", label: "Errors", color: "rose", predicate: (trace) => trace.state === "error" },
  { id: "n_plus_one", label: "N+1 loop", color: "purple", predicate: hasNPlusOne },
];

const INITIAL_SORTING = [{ id: "duration", desc: true }];
const INITIAL_COLUMN_VISIBILITY = { index: false, service: false };

function Waterfall({ trace }: { trace: DemoTrace }) {
  const total = Math.max(
    trace.duration,
    ...trace.spans.map((span) => span.start + span.duration),
    1
  );
  return (
    <div
      className="relative h-2 w-28 overflow-hidden rounded-full bg-muted"
      role="img"
      aria-label={`${trace.spans.length} spans over ${formatDuration(trace.duration)}`}
      title={`${trace.spans.length} spans · ${formatDuration(trace.duration)}`}
    >
      {trace.spans.map((span, index) => (
        <span
          key={`${span.name}-${index}`}
          className={cn("absolute inset-y-0 rounded-full opacity-85", SPAN_COLOR[span.kind])}
          style={{
            left: `${(span.start / total) * 100}%`,
            width: `${Math.max((span.duration / total) * 100, 2)}%`,
          }}
        />
      ))}
    </div>
  );
}

export function TracesTable({
  traces,
  section,
  onSelect,
  liveStream,
  isLoading = false,
}: {
  traces: DemoTrace[];
  section: string;
  onSelect: (trace: DemoTrace) => void;
  liveStream: boolean;
  isLoading?: boolean;
}) {
  const title =
    section === "errors"
      ? "Error traces"
      : section === "sql"
        ? "Slow & duplicate queries"
        : section === "overview"
          ? "Recent traces"
          : "All traces";

  const data = React.useMemo(
    () =>
      traces.filter((trace) => {
        if (section === "errors" && trace.state !== "error") return false;
        if (section === "sql" && !trace.queries.some((q) => q.slow || q.duplicateCount > 2)) {
          return false;
        }
        return true;
      }),
    [traces, section]
  );

  const columns = React.useMemo<ColumnDef<DemoTrace, any>[]>(
    () => [
      {
        id: "index",
        header: "#",
        size: 48,
        enableSorting: false,
        meta: { label: "Row number", align: "center" },
        cell: ({ row }) => (
          <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
            {row.index + 1}
          </span>
        ),
      },
      {
        id: "status",
        accessorFn: (trace) => STATE_RANK[trace.state],
        meta: { label: "Status" },
        header: ({ column, table }) => (
          <DataTableColumnHeader column={column} table={table} title="Status" />
        ),
        cell: ({ row }) => {
          const trace = row.original;
          const ok = trace.state === "success";
          const slow = trace.state === "slow";
          return (
            <div className="flex items-center gap-2">
              <Badge
                variant={ok ? "success" : slow ? "warning" : "destructive"}
                size="sm"
                className="gap-1 font-semibold tracking-wide"
              >
                <span
                  className={cn(
                    "size-1.5 shrink-0 rounded-full",
                    ok ? "bg-emerald-500" : slow ? "bg-amber-500" : "bg-rose-500",
                    trace.isLive && "animate-pulse"
                  )}
                />
                {ok ? "OK" : slow ? "SLOW" : "ERROR"}
              </Badge>
              <span className="font-mono text-xs tabular-nums text-muted-foreground">
                {trace.status}
              </span>
            </div>
          );
        },
      },
      {
        id: "request",
        accessorKey: "route",
        meta: { label: "Request" },
        header: ({ column, table }) => (
          <DataTableColumnHeader column={column} table={table} title="Request" />
        ),
        cell: ({ row }) => {
          const trace = row.original;
          return (
            <div className="flex min-w-0 items-center gap-2.5">
              <Badge
                variant="outline"
                size="sm"
                className={cn(
                  "w-14 shrink-0 font-mono text-[10px] font-bold uppercase",
                  METHOD_CLASS[trace.method] ?? METHOD_CLASS.GET
                )}
              >
                {trace.method}
              </Badge>
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="truncate text-xs font-medium text-foreground transition-colors group-hover/row:text-emerald-700 dark:group-hover/row:text-emerald-400">
                  {trace.route}
                </span>
                <span className="truncate font-mono text-[10px] text-muted-foreground">
                  {trace.id}
                </span>
              </div>
            </div>
          );
        },
      },
      {
        id: "service",
        accessorKey: "service",
        meta: { label: "Service" },
        header: ({ column, table }) => (
          <DataTableColumnHeader column={column} table={table} title="Service" />
        ),
        cell: ({ row }) => (
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-medium text-foreground">{row.original.service}</span>
            <span className="text-[10px] capitalize text-muted-foreground">
              {row.original.environment}
            </span>
          </div>
        ),
      },
      {
        id: "duration",
        accessorKey: "duration",
        sortDescFirst: true,
        meta: { label: "Duration", align: "right" },
        header: ({ column, table }) => (
          <DataTableColumnHeader column={column} table={table} title="Duration" />
        ),
        cell: ({ row }) => {
          const { duration } = row.original;
          return (
            <span
              className={cn(
                "font-mono text-xs font-medium tabular-nums",
                duration >= 1000
                  ? "font-bold text-amber-700 dark:text-amber-400"
                  : duration >= 400
                    ? "text-orange-700 dark:text-orange-400"
                    : "text-foreground"
              )}
            >
              {formatDuration(duration)}
            </span>
          );
        },
      },
      {
        id: "waterfall",
        header: "Waterfall",
        enableSorting: false,
        meta: { label: "Waterfall" },
        cell: ({ row }) => <Waterfall trace={row.original} />,
      },
      {
        id: "sql",
        accessorKey: "sqlCount",
        sortDescFirst: true,
        meta: { label: "SQL", align: "right" },
        header: ({ column, table }) => (
          <DataTableColumnHeader column={column} table={table} title="SQL" />
        ),
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-1.5">
            {hasNPlusOne(row.original) && (
              <Badge variant="purple" size="sm" className="h-4 px-1 text-[9px] font-bold">
                N+1
              </Badge>
            )}
            <span className="font-mono text-xs font-medium tabular-nums text-foreground">
              {row.original.sqlCount}
            </span>
          </div>
        ),
      },
      {
        id: "when",
        accessorKey: "createdAt",
        sortDescFirst: true,
        meta: { label: "When", align: "right" },
        header: ({ column, table }) => (
          <DataTableColumnHeader column={column} table={table} title="When" />
        ),
        cell: ({ row }) => (
          <span className="text-xs tabular-nums text-muted-foreground">{row.original.ageLabel}</span>
        ),
      },
    ],
    []
  );

  const bulkActions = React.useMemo<DataTableBulkAction<DemoTrace>[]>(
    () => [
      {
        label: "Copy trace IDs",
        icon: <Copy />,
        onClick: (rows, ctx) => ctx.copy(rows.map((trace) => trace.id).join("\n"), `${rows.length} trace IDs`),
      },
      {
        label: "Copy routes",
        icon: <Link2 />,
        onClick: (rows, ctx) =>
          ctx.copy([...new Set(rows.map((trace) => trace.route))].join("\n"), "Routes"),
      },
    ],
    []
  );

  const rowActions = React.useCallback(
    (trace: DemoTrace, ctx: Parameters<NonNullable<React.ComponentProps<typeof DataTable<DemoTrace>>["rowActions"]>>[1]) => [
      { label: "Copy trace ID", icon: <Copy />, onSelect: () => ctx.copy(trace.id, "Trace ID") },
      { label: "Copy route", icon: <Link2 />, onSelect: () => ctx.copy(trace.route, "Route") },
      { label: "Copy as cURL", icon: <Terminal />, onSelect: () => ctx.copy(toCurl(trace), "cURL command") },
      {
        label: "Filter by this route",
        icon: <ListFilter />,
        onSelect: () => ctx.setSearch(trace.route),
        separatorBefore: true,
      },
    ],
    []
  );

  const getRowId = React.useCallback((trace: DemoTrace) => trace.id, []);
  const getRowClassName = React.useCallback(
    (trace: DemoTrace) => (trace.isLive ? "is-live-row" : undefined),
    []
  );

  return (
    <DataTable
      columns={columns}
      data={data}
      title={title}
      badge={
        liveStream ? (
          <Badge variant="success" size="sm" className="gap-1 font-semibold">
            <span className="size-1.5 animate-pulse rounded-full bg-emerald-500" />
            Live
          </Badge>
        ) : null
      }
      searchPlaceholder="Search route, trace ID or SQL…"
      getSearchText={getSearchText}
      getRowId={getRowId}
      facetedFilters={FACETED_FILTERS}
      quickFilters={QUICK_FILTERS}
      bulkActions={bulkActions}
      rowActions={rowActions}
      initialSorting={INITIAL_SORTING}
      initialColumnVisibility={INITIAL_COLUMN_VISIBILITY}
      exportFileName="spurtrace-traces"
      emptyMessage="No traces recorded yet."
      isLoading={isLoading}
      onRowClick={onSelect}
      getRowClassName={getRowClassName}
    />
  );
}
