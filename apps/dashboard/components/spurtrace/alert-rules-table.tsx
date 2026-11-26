"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Copy, Eye, Pause, Pencil, Play, Send, Trash2 } from "lucide-react";

import {
  DataTable,
  DataTableColumnHeader,
  type DataTableBulkAction,
  type DataTableFacetedFilter,
  type DataTableQuickFilter,
} from "@/components/ui/data-table";
import type { DataTableActionContext, DataTableRowAction } from "@/components/ui/data-table-types";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useI18n } from "@/lib/i18n/i18n-context";
import { ChannelChips, SeverityBadge } from "./alert-badges";
import {
  CHANNELS,
  SERVICES,
  SEVERITIES,
  SEVERITY_RANK,
  conditionLabel,
  enabledChannels,
  ruleLabel,
  serviceLabel,
  type AlertChannel,
  type AlertRule,
} from "./alerts-types";

interface AlertRulesTableProps {
  rules: AlertRule[];
  isAdmin: boolean;
  onToggle: (ruleId: string) => void;
  onSetEnabled: (ruleIds: string[], enabled: boolean) => void;
  onDelete: (ruleIds: string[]) => void;
  onTest: (rule: AlertRule) => void;
}

const getRowId = (rule: AlertRule) => rule.id;
const getRowClassName = (rule: AlertRule) => (rule.enabled ? undefined : "opacity-60");

export function AlertRulesTable({
  rules,
  isAdmin,
  onToggle,
  onSetEnabled,
  onDelete,
  onTest,
}: AlertRulesTableProps) {
  const { t } = useI18n();

  const getSearchText = React.useCallback(
    (rule: AlertRule) =>
      [
        ruleLabel(t, rule),
        rule.name,
        serviceLabel(t, rule.service),
        t(`alerts.metric.${rule.metric}`),
        rule.severity,
        t(`alerts.${rule.severity}`),
      ].join(" "),
    [t]
  );

  const columns = React.useMemo<ColumnDef<AlertRule, any>[]>(
    () => [
      {
        id: "enabled",
        accessorFn: (rule) => (rule.enabled ? 0 : 1),
        meta: { label: t("alerts.col.status") },
        header: ({ column, table }) => (
          <DataTableColumnHeader column={column} table={table} title={t("alerts.col.status")} />
        ),
        cell: ({ row }) => {
          const rule = row.original;
          return (
            <div className="flex items-center gap-2">
              <Switch
                checked={rule.enabled}
                onCheckedChange={() => onToggle(rule.id)}
                disabled={!isAdmin}
                aria-label={t(rule.enabled ? "alerts.action.toggleOff" : "alerts.action.toggleOn")}
              />
              <span className="text-[11px] font-medium text-muted-foreground">
                {t(rule.enabled ? "alerts.state.active" : "alerts.state.paused")}
              </span>
            </div>
          );
        },
      },
      {
        id: "rule",
        accessorFn: (rule) => ruleLabel(t, rule),
        meta: { label: t("alerts.col.rule") },
        header: ({ column, table }) => (
          <DataTableColumnHeader column={column} table={table} title={t("alerts.col.rule")} />
        ),
        cell: ({ row }) => {
          const rule = row.original;
          return (
            <div className="flex min-w-0 flex-col gap-1">
              <span className="truncate text-xs font-semibold text-foreground">
                {ruleLabel(t, rule)}
              </span>
              <Badge variant="outline" size="sm" className="w-fit text-[10px] font-medium">
                {serviceLabel(t, rule.service)}
              </Badge>
            </div>
          );
        },
      },
      {
        id: "severity",
        accessorFn: (rule) => SEVERITY_RANK[rule.severity],
        meta: { label: t("alerts.col.severity") },
        header: ({ column, table }) => (
          <DataTableColumnHeader column={column} table={table} title={t("alerts.col.severity")} />
        ),
        cell: ({ row }) => <SeverityBadge severity={row.original.severity} />,
      },
      {
        id: "condition",
        accessorFn: (rule) => rule.metric,
        meta: { label: t("alerts.col.condition") },
        header: ({ column, table }) => (
          <DataTableColumnHeader column={column} table={table} title={t("alerts.col.condition")} />
        ),
        cell: ({ row }) => (
          <span className="font-mono text-xs font-medium text-foreground">
            {conditionLabel(t, row.original)}
          </span>
        ),
      },
      {
        id: "cooldown",
        accessorKey: "cooldownMins",
        meta: { label: t("alerts.col.cooldown"), align: "right" },
        header: ({ column, table }) => (
          <DataTableColumnHeader column={column} table={table} title={t("alerts.col.cooldown")} />
        ),
        cell: ({ row }) => (
          <span className="font-mono text-xs tabular-nums text-muted-foreground">
            {row.original.cooldownMins}m
          </span>
        ),
      },
      {
        id: "channels",
        header: t("alerts.col.channels"),
        enableSorting: false,
        meta: { label: t("alerts.col.channels") },
        cell: ({ row }) => <ChannelChips channels={enabledChannels(row.original.channels)} />,
      },
      {
        id: "recipients",
        header: "Email nhận",
        enableSorting: false,
        meta: { label: "Email người nhận" },
        cell: ({ row }) => {
          const rec = row.original.recipients;
          if (!rec) return <span className="text-[11px] text-muted-foreground">-</span>;
          const list = rec.split(",").map((s) => s.trim()).filter(Boolean);
          return (
            <div className="flex flex-col gap-0.5 max-w-[180px]">
              <span className="text-xs font-mono text-sky-600 dark:text-sky-400 truncate" title={rec}>
                {list[0]}
              </span>
              {list.length > 1 && (
                <span className="text-[10px] text-muted-foreground">
                  +{list.length - 1} email khác
                </span>
              )}
            </div>
          );
        },
      },
    ],
    [t, isAdmin, onToggle]
  );

  const facetedFilters = React.useMemo<DataTableFacetedFilter<AlertRule>[]>(
    () => [
      {
        id: "severity",
        title: t("alerts.col.severity"),
        options: SEVERITIES.map((severity) => ({ label: t(`alerts.${severity}`), value: severity })),
        getValue: (rule) => rule.severity,
      },
      {
        id: "service",
        title: t("alerts.col.service"),
        options: SERVICES.map((service) => ({ label: serviceLabel(t, service), value: service })),
        getValue: (rule) => rule.service,
      },
      {
        id: "channel",
        title: t("alerts.col.channel"),
        options: CHANNELS.map((channel) => ({
          label: t(`alerts.channelName.${channel}`),
          value: channel,
        })),
        filterFn: (rule, value) => rule.channels[value as AlertChannel],
      },
    ],
    [t]
  );

  const quickFilters = React.useMemo<DataTableQuickFilter<AlertRule>[]>(
    () => [
      {
        id: "active",
        label: t("alerts.state.active"),
        color: "emerald",
        predicate: (rule) => rule.enabled,
      },
      {
        id: "paused",
        label: t("alerts.state.paused"),
        color: "default",
        predicate: (rule) => !rule.enabled,
      },
      {
        id: "critical",
        label: t("alerts.critical"),
        color: "rose",
        predicate: (rule) => rule.severity === "critical",
      },
    ],
    [t]
  );

  const bulkActions = React.useMemo<DataTableBulkAction<AlertRule>[]>(
    () =>
      isAdmin
        ? [
            {
              label: t("alerts.action.enableSelected"),
              icon: <Play />,
              onClick: (selected) =>
                onSetEnabled(
                  selected.map((rule) => rule.id),
                  true
                ),
            },
            {
              label: t("alerts.action.pauseSelected"),
              icon: <Pause />,
              onClick: (selected) =>
                onSetEnabled(
                  selected.map((rule) => rule.id),
                  false
                ),
            },
            {
              label: t("alerts.action.deleteSelected"),
              icon: <Trash2 />,
              onClick: (selected) => onDelete(selected.map((rule) => rule.id)),
            },
          ]
        : [],
    [t, isAdmin, onSetEnabled, onDelete]
  );

  const rowActions = React.useCallback(
    (rule: AlertRule, ctx: DataTableActionContext): DataTableRowAction[] => [
      {
        label: "Sửa & Xem trước Mail",
        icon: <Pencil />,
        onSelect: () => {
          window.location.href = `/telemetry/alerts/new?edit=${rule.id}`;
        },
      },
      {
        label: t("alerts.action.testTrigger"),
        icon: <Send />,
        onSelect: () => onTest(rule),
        disabled: !isAdmin,
      },
      {
        label: t(rule.enabled ? "alerts.action.pauseRule" : "alerts.action.enableRule"),
        icon: rule.enabled ? <Pause /> : <Play />,
        onSelect: () => onToggle(rule.id),
        disabled: !isAdmin,
      },
      {
        label: t("alerts.action.copyRuleName"),
        icon: <Copy />,
        onSelect: () => ctx.copy(ruleLabel(t, rule), t("alerts.action.ruleName")),
        separatorBefore: true,
      },
      {
        label: t("alerts.action.deleteRule"),
        icon: <Trash2 />,
        variant: "destructive",
        onSelect: () => onDelete([rule.id]),
        disabled: !isAdmin,
        separatorBefore: true,
      },
    ],
    [t, isAdmin, onTest, onToggle, onDelete]
  );

  return (
    <DataTable
      columns={columns}
      data={rules}
      title={t("alerts.rulesTitle")}
      description={t("alerts.rulesDesc")}
      searchPlaceholder={t("alerts.rulesSearch")}
      getSearchText={getSearchText}
      getRowId={getRowId}
      getRowClassName={getRowClassName}
      facetedFilters={facetedFilters}
      quickFilters={quickFilters}
      bulkActions={bulkActions}
      rowActions={rowActions}
      enableRowSelection={isAdmin}
      initialPageSize={10}
      exportFileName="spurtrace-alert-rules"
      emptyMessage={t("alerts.rulesEmpty")}
    />
  );
}
