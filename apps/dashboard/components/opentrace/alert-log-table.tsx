"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Copy } from "lucide-react";

import {
  DataTable,
  DataTableColumnHeader,
  type DataTableBulkAction,
  type DataTableFacetedFilter,
  type DataTableQuickFilter,
} from "@/components/ui/data-table";
import type { DataTableActionContext, DataTableRowAction } from "@/components/ui/data-table-types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/i18n-context";
import { ChannelChips, SeverityBadge } from "./alert-badges";
import {
  CHANNELS,
  SEVERITIES,
  SEVERITY_RANK,
  detailText,
  formatAgo,
  logRuleLabel,
  type AlertChannel,
  type IncidentLog,
} from "./alerts-types";

const getRowId = (log: IncidentLog) => log.id;
const INITIAL_SORTING = [{ id: "time", desc: false }];

export function AlertLogTable({ logs }: { logs: IncidentLog[] }) {
  const { t } = useI18n();

  const getSearchText = React.useCallback(
    (log: IncidentLog) =>
      [
        logRuleLabel(t, log),
        detailText(t, log.details),
        t(`alerts.${log.severity}`),
        ...log.channels.map((channel) => t(`alerts.channelFull.${channel}`)),
      ].join(" "),
    [t]
  );

  const columns = React.useMemo<ColumnDef<IncidentLog, any>[]>(
    () => [
      {
        id: "severity",
        accessorFn: (log) => SEVERITY_RANK[log.severity],
        meta: { label: t("alerts.col.severity") },
        header: ({ column, table }) => (
          <DataTableColumnHeader column={column} table={table} title={t("alerts.col.severity")} />
        ),
        cell: ({ row }) => {
          const { severity } = row.original;
          return (
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "size-2 shrink-0 rounded-full",
                  severity === "critical" ? "bg-rose-500" : "bg-amber-500"
                )}
                aria-hidden="true"
              />
              <SeverityBadge severity={severity} />
            </div>
          );
        },
      },
      {
        id: "incident",
        accessorFn: (log) => logRuleLabel(t, log),
        meta: { label: t("alerts.col.incident") },
        header: ({ column, table }) => (
          <DataTableColumnHeader column={column} table={table} title={t("alerts.col.incident")} />
        ),
        cell: ({ row }) => (
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="truncate text-xs font-semibold text-foreground">
              {logRuleLabel(t, row.original)}
            </span>
            <span className="truncate text-[11px] text-muted-foreground">
              {detailText(t, row.original.details)}
            </span>
          </div>
        ),
      },
      {
        id: "channel",
        header: t("alerts.col.channel"),
        enableSorting: false,
        meta: { label: t("alerts.col.channel") },
        cell: ({ row }) => <ChannelChips channels={row.original.channels} />,
      },
      {
        id: "delivery",
        header: t("alerts.col.delivery"),
        enableSorting: false,
        meta: { label: t("alerts.col.delivery") },
        cell: () => (
          <Badge variant="success" size="sm" className="text-[10px] font-semibold">
            {t("alerts.log.dispatched")}
          </Badge>
        ),
      },
      {
        id: "time",
        accessorKey: "minutesAgo",
        meta: { label: t("alerts.col.time"), align: "right" },
        header: ({ column, table }) => (
          <DataTableColumnHeader column={column} table={table} title={t("alerts.col.time")} />
        ),
        cell: ({ row }) => (
          <span className="text-xs tabular-nums text-muted-foreground">
            {formatAgo(t, row.original.minutesAgo)}
          </span>
        ),
      },
    ],
    [t]
  );

  const facetedFilters = React.useMemo<DataTableFacetedFilter<IncidentLog>[]>(
    () => [
      {
        id: "severity",
        title: t("alerts.col.severity"),
        options: SEVERITIES.map((severity) => ({ label: t(`alerts.${severity}`), value: severity })),
        getValue: (log) => log.severity,
      },
      {
        id: "channel",
        title: t("alerts.col.channel"),
        options: CHANNELS.map((channel) => ({
          label: t(`alerts.channelName.${channel}`),
          value: channel,
        })),
        filterFn: (log, value) => log.channels.includes(value as AlertChannel),
      },
    ],
    [t]
  );

  const quickFilters = React.useMemo<DataTableQuickFilter<IncidentLog>[]>(
    () => [
      {
        id: "critical",
        label: t("alerts.critical"),
        color: "rose",
        predicate: (log) => log.severity === "critical",
      },
      {
        id: "warning",
        label: t("alerts.warning"),
        color: "amber",
        predicate: (log) => log.severity === "warning",
      },
    ],
    [t]
  );

  const bulkActions = React.useMemo<DataTableBulkAction<IncidentLog>[]>(
    () => [
      {
        label: t("alerts.action.copyIncident"),
        icon: <Copy />,
        onClick: (selected, ctx) =>
          ctx.copy(
            selected
              .map((log) => `${logRuleLabel(t, log)} — ${detailText(t, log.details)}`)
              .join("\n"),
            t("alerts.action.incidentDetails")
          ),
      },
    ],
    [t]
  );

  const rowActions = React.useCallback(
    (log: IncidentLog, ctx: DataTableActionContext): DataTableRowAction[] => [
      {
        label: t("alerts.action.copyRuleName"),
        icon: <Copy />,
        onSelect: () => ctx.copy(logRuleLabel(t, log), t("alerts.action.ruleName")),
      },
      {
        label: t("alerts.action.copyIncident"),
        icon: <Copy />,
        onSelect: () => ctx.copy(detailText(t, log.details), t("alerts.action.incidentDetails")),
      },
    ],
    [t]
  );

  return (
    <DataTable
      columns={columns}
      data={logs}
      title={t("alerts.logTitle")}
      description={t("alerts.logDesc")}
      searchPlaceholder={t("alerts.logSearch")}
      getSearchText={getSearchText}
      getRowId={getRowId}
      facetedFilters={facetedFilters}
      quickFilters={quickFilters}
      bulkActions={bulkActions}
      rowActions={rowActions}
      initialSorting={INITIAL_SORTING}
      initialPageSize={10}
      exportFileName="opentrace-alert-log"
      emptyMessage={t("alerts.logEmpty")}
    />
  );
}
