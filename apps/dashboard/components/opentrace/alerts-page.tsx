"use client";

import * as React from "react";
import Link from "next/link";
import { ExternalLink, Mail, Plus, RotateCcw } from "lucide-react";
import { toast } from "sonner";

import type { UserRole } from "./user-profile-menu";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/i18n-context";
import { AlertLogTable } from "./alert-log-table";
import { AlertPreviewDialog, type IncidentPreview } from "./alert-preview-dialog";
import { AlertRuleDialog } from "./alert-rule-dialog";
import { AlertRulesTable } from "./alert-rules-table";
import {
  DEFAULT_ALERT_RULES,
  METRIC_UNITS,
  SEED_INCIDENT_LOGS,
  enabledChannels,
  ruleLabel,
  type AlertRule,
  type IncidentLog,
  type NewRuleDraft,
} from "./alerts-types";

export type { AlertRule, IncidentLog } from "./alerts-types";

const TEST_RECIPIENTS = "devops@example.com, alerts@example.com";

export function AlertsPageContent({ role }: { role: UserRole }) {
  const { t } = useI18n();
  const isAdmin = role === "Admin";

  const [rules, setRules] = React.useState<AlertRule[]>(DEFAULT_ALERT_RULES);
  const [logs, setLogs] = React.useState<IncidentLog[]>(SEED_INCIDENT_LOGS);
  const [isAddRuleOpen, setIsAddRuleOpen] = React.useState(false);
  const [preview, setPreview] = React.useState<IncidentPreview | null>(null);

  const rulesRef = React.useRef(rules);
  rulesRef.current = rules;

  const handleToggle = React.useCallback(
    (ruleId: string) => {
      const target = rulesRef.current.find((rule) => rule.id === ruleId);
      if (!target) return;
      const next = !target.enabled;
      setRules((prev) => prev.map((rule) => (rule.id === ruleId ? { ...rule, enabled: next } : rule)));
      toast.info(
        t(next ? "alerts.toast.ruleActive" : "alerts.toast.rulePaused", {
          name: ruleLabel(t, target),
        })
      );
    },
    [t]
  );

  const handleSetEnabled = React.useCallback(
    (ruleIds: string[], enabled: boolean) => {
      const ids = new Set(ruleIds);
      setRules((prev) => prev.map((rule) => (ids.has(rule.id) ? { ...rule, enabled } : rule)));
      toast.info(t(enabled ? "alerts.toast.rulesEnabled" : "alerts.toast.rulesPaused", { count: ruleIds.length }));
    },
    [t]
  );

  const handleDelete = React.useCallback(
    (ruleIds: string[]) => {
      const ids = new Set(ruleIds);
      const removed = rulesRef.current.filter((rule) => ids.has(rule.id));
      if (removed.length === 0) return;
      setRules((prev) => prev.filter((rule) => !ids.has(rule.id)));
      toast.success(
        removed.length === 1
          ? t("alerts.toast.ruleDeleted", { name: ruleLabel(t, removed[0]) })
          : t("alerts.toast.rulesDeleted", { count: removed.length }),
        {
          action: {
            label: t("alerts.action.undo"),
            onClick: () => setRules((prev) => [...removed, ...prev]),
          },
        }
      );
    },
    [t]
  );

  const handleResetPresets = React.useCallback(() => {
    setRules(DEFAULT_ALERT_RULES);
    toast.success(t("alerts.toast.presetsLoaded"));
  }, [t]);

  const handleCreate = React.useCallback(
    (draft: NewRuleDraft) => {
      const created: AlertRule = {
        id: `rule_${Date.now()}`,
        name: draft.name,
        service: draft.service,
        metric: draft.metric,
        threshold: Number(draft.threshold),
        unit: METRIC_UNITS[draft.metric],
        severity: draft.severity,
        channels: draft.channels,
        cooldownMins: Number(draft.cooldownMins),
        enabled: true,
      };
      setRules((prev) => [created, ...prev]);
      setIsAddRuleOpen(false);
      toast.success(t("alerts.toast.ruleCreated", { name: created.name }));
    },
    [t]
  );

  const handleTest = React.useCallback(
    (rule: AlertRule) => {
      setPreview({
        rule,
        time: new Date().toLocaleTimeString(),
        traceId: `tr_live_${Math.random().toString(36).substring(2, 10)}`,
        recipients: TEST_RECIPIENTS,
      });
      setLogs((prev) => [
        {
          id: `inc-${Date.now()}`,
          ruleName: rule.name,
          ruleNameKey: rule.nameKey,
          severity: rule.severity,
          minutesAgo: 0,
          channels: enabledChannels(rule.channels),
          details: {
            key: "alerts.log.testDetail",
            metric: rule.metric,
            threshold: rule.threshold,
            unit: rule.unit,
          },
        },
        ...prev,
      ]);
      toast.success(t("alerts.toast.testDispatched"));
    },
    [t]
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col items-start justify-between gap-3 rounded-lg border border-(--ot-border) bg-(--ot-panel) p-4 sm:flex-row sm:items-center">
        <div>
          <strong className="block text-xs font-semibold text-(--ot-text)">
            {t("alerts.engineTitle")}
          </strong>
          <p className="mt-0.5 text-[11px] text-(--ot-muted)">{t("alerts.engineDesc")}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-end sm:self-auto">
          <Link
            href="/settings"
            className="flex items-center gap-1.5 rounded-lg border border-(--ot-border) bg-(--ot-panel) px-3 py-1.5 text-xs font-medium text-(--ot-muted) transition-colors hover:text-(--ot-text)"
          >
            <Mail className="size-3.5 text-sky-600" aria-hidden="true" />
            <span>{t("alerts.configureMail")}</span>
            <ExternalLink className="size-3 opacity-60" aria-hidden="true" />
          </Link>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleResetPresets}
            disabled={!isAdmin}
            title={isAdmin ? t("alerts.factoryPresetsHint") : t("alerts.adminOnly")}
          >
            <RotateCcw className="size-3.5" aria-hidden="true" />
            <span>{t("alerts.factoryPresets")}</span>
          </Button>

          <Button
            type="button"
            size="sm"
            className="bg-emerald-700 text-white hover:bg-emerald-600 disabled:opacity-50"
            onClick={() => setIsAddRuleOpen(true)}
            disabled={!isAdmin}
            title={isAdmin ? undefined : t("alerts.adminOnly")}
          >
            <Plus className="size-3.5" aria-hidden="true" />
            <span>{t("alerts.addRule")}</span>
          </Button>
        </div>
      </div>

      <AlertRulesTable
        rules={rules}
        isAdmin={isAdmin}
        onToggle={handleToggle}
        onSetEnabled={handleSetEnabled}
        onDelete={handleDelete}
        onTest={handleTest}
      />

      <AlertLogTable logs={logs} />

      <AlertRuleDialog open={isAddRuleOpen} onOpenChange={setIsAddRuleOpen} onCreate={handleCreate} />
      <AlertPreviewDialog preview={preview} onClose={() => setPreview(null)} />
    </div>
  );
}
