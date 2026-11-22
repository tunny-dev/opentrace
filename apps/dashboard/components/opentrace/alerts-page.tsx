"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Bell,
  Check,
  ExternalLink,
  History,
  Mail,
  MessageSquare,
  Plus,
  RotateCcw,
  Send,
  Trash2,
  X,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import type { UserRole } from "./user-profile-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldLabel } from "@/components/ui/field";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface AlertRule {
  id: string;
  name: string;
  service: string;
  metric:
    "p95_latency" | "error_rate" | "slow_sql" | "n_plus_one" | "5xx_count" | "heartbeat_timeout";
  threshold: number;
  unit: string;
  severity: "critical" | "warning" | "info";
  channels: {
    email: boolean;
    teams: boolean;
    inApp: boolean;
  };
  cooldownMins: number;
  enabled: boolean;
}

export interface IncidentLog {
  id: string;
  ruleName: string;
  severity: "critical" | "warning" | "info";
  timestamp: string;
  status: string;
  channel: string;
  details: string;
}

const defaultAlertRules: AlertRule[] = [
  {
    id: "rule-1",
    name: "[CRITICAL] MES-API HTTP 500 & Unhandled Exceptions",
    service: "MES-API",
    metric: "5xx_count",
    threshold: 1,
    unit: "exceptions",
    severity: "critical",
    channels: { email: true, teams: true, inApp: true },
    cooldownMins: 15,
    enabled: true,
  },
  {
    id: "rule-2",
    name: "[WARNING] High Latency Spike P95 (> 500ms)",
    service: "All Services",
    metric: "p95_latency",
    threshold: 500,
    unit: "ms",
    severity: "warning",
    channels: { email: true, teams: true, inApp: false },
    cooldownMins: 15,
    enabled: true,
  },
  {
    id: "rule-3",
    name: "[CRITICAL] Production Error Rate Spike (> 1.0%)",
    service: "All Services",
    metric: "error_rate",
    threshold: 1.0,
    unit: "%",
    severity: "critical",
    channels: { email: true, teams: true, inApp: true },
    cooldownMins: 10,
    enabled: true,
  },
  {
    id: "rule-4",
    name: "[DB] CIM SSFDC Slow SQL Execution (> 300ms)",
    service: "All Services",
    metric: "slow_sql",
    threshold: 300,
    unit: "ms",
    severity: "warning",
    channels: { email: true, teams: false, inApp: true },
    cooldownMins: 30,
    enabled: true,
  },
  {
    id: "rule-5",
    name: "[CODE] Database N+1 Query Loop (> 5 duplicates)",
    service: "All Services",
    metric: "n_plus_one",
    threshold: 5,
    unit: "statements",
    severity: "warning",
    channels: { email: false, teams: true, inApp: true },
    cooldownMins: 30,
    enabled: true,
  },
];

export function AlertsPageContent({ role }: { role: UserRole }) {
  const isAdmin = role === "Admin";
  const [alertRules, setAlertRules] = useState<AlertRule[]>(defaultAlertRules);
  const [isAddRuleOpen, setIsAddRuleOpen] = useState(false);
  const [testIncidentPreview, setTestIncidentPreview] = useState<{
    rule: AlertRule;
    time: string;
    traceId: string;
    subject: string;
    recipients: string;
  } | null>(null);

  // New Rule Form Draft
  const [newRuleName, setNewRuleName] = useState("");
  const [newRuleService, setNewRuleService] = useState("All Services");
  const [newRuleMetric, setNewRuleMetric] = useState<AlertRule["metric"]>("p95_latency");
  const [newRuleThreshold, setNewRuleThreshold] = useState(400);
  const [newRuleSeverity, setNewRuleSeverity] = useState<AlertRule["severity"]>("warning");
  const [newRuleEmail, setNewRuleEmail] = useState(true);
  const [newRuleTeams, setNewRuleTeams] = useState(true);
  const [newRuleInApp, setNewRuleInApp] = useState(true);
  const [newRuleCooldown, setNewRuleCooldown] = useState(15);

  // Incident Dispatch History Log
  const [incidentLogs, setIncidentLogs] = useState<IncidentLog[]>([
    {
      id: "inc-1",
      ruleName: "[CRITICAL] MES-API HTTP 500 & Unhandled Exceptions",
      severity: "critical",
      timestamp: "10 minutes ago",
      status: "Dispatched (250 OK)",
      channel: "Outlook SMTP + MS Teams",
      details: "Simulated exception in GET /api/cim/get-mfg-type",
    },
    {
      id: "inc-2",
      ruleName: "[DB] CIM SSFDC Slow SQL Execution (> 300ms)",
      severity: "warning",
      timestamp: "1 hour ago",
      status: "Dispatched (250 OK)",
      channel: "Outlook SMTP",
      details: "Query on SSFDC took 572ms on Production line 2",
    },
  ]);

  // Toggle Rule
  function handleToggleRule(ruleId: string) {
    setAlertRules((prev) =>
      prev.map((r) => {
        if (r.id === ruleId) {
          const next = !r.enabled;
          toast.info(`Alert rule "${r.name}" is now ${next ? "ACTIVE" : "PAUSED"}`);
          return { ...r, enabled: next };
        }
        return r;
      })
    );
  }

  // Delete Rule
  function handleDeleteRule(ruleId: string) {
    const target = alertRules.find((r) => r.id === ruleId);
    setAlertRules((prev) => prev.filter((r) => r.id !== ruleId));
    toast.success(`Deleted rule: ${target?.name || ruleId}`);
  }

  // Reset to Factory Presets
  function handleResetFactoryPresets() {
    setAlertRules(defaultAlertRules);
    toast.success("Loaded Senao MES Factory Alert Presets (5 active policies)");
  }

  // Save New Custom Rule
  function handleAddNewRule(e: React.FormEvent) {
    e.preventDefault();
    if (!newRuleName.trim()) return;

    const unitMap: Record<AlertRule["metric"], string> = {
      p95_latency: "ms",
      error_rate: "%",
      slow_sql: "ms",
      n_plus_one: "statements",
      "5xx_count": "exceptions",
      heartbeat_timeout: "secs",
    };

    const created: AlertRule = {
      id: `rule_${Date.now()}`,
      name: newRuleName.trim(),
      service: newRuleService,
      metric: newRuleMetric,
      threshold: Number(newRuleThreshold),
      unit: unitMap[newRuleMetric],
      severity: newRuleSeverity,
      channels: {
        email: newRuleEmail,
        teams: newRuleTeams,
        inApp: newRuleInApp,
      },
      cooldownMins: Number(newRuleCooldown),
      enabled: true,
    };

    setAlertRules((prev) => [created, ...prev]);
    setNewRuleName("");
    setIsAddRuleOpen(false);
    toast.success(`Created alert policy: ${created.name}`);
  }

  // Trigger individual rule test dispatch
  function handleTriggerRuleTest(rule: AlertRule) {
    const traceId = `tr_live_${Math.random().toString(36).substring(2, 10)}`;
    const nowStr = new Date().toLocaleTimeString();
    setTestIncidentPreview({
      rule,
      time: nowStr,
      traceId,
      subject: `🚨 [${rule.severity.toUpperCase()}] ${rule.name}`,
      recipients: "devops@example.com, alerts@example.com",
    });

    const newLog: IncidentLog = {
      id: `inc-${Date.now()}`,
      ruleName: rule.name,
      severity: rule.severity,
      timestamp: "Just now",
      status: "Dispatched (250 OK)",
      channel: [
        rule.channels.email ? "Outlook SMTP" : null,
        rule.channels.teams ? "MS Teams Webhook" : null,
        rule.channels.inApp ? "In-App" : null,
      ]
        .filter(Boolean)
        .join(" + "),
      details: `Triggered by test execution: ${rule.metric} exceeded threshold ${rule.threshold}${rule.unit}`,
    };
    setIncidentLogs((prev) => [newLog, ...prev]);
    toast.success(`Simulated incident dispatched to Outlook & Teams!`);
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Top Banner Toolbar: Add Rule & Factory Presets */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-lg bg-(--ot-panel) border border-(--ot-border)">
        <div>
          <strong className="text-xs text-(--ot-text) block font-semibold">
            Senao MES Production Alert Engine
          </strong>
          <p className="text-[11px] text-(--ot-muted) mt-0.5">
            Real-time threshold evaluation for 5xx errors, P95 latency spikes, slow SQL queries, and
            N+1 loop patterns.
          </p>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <Link
            href="/settings"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-(--ot-muted) hover:text-(--ot-text) bg-(--ot-panel) border border-(--ot-border) transition-colors cursor-pointer"
          >
            <Mail className="h-3.5 w-3.5 text-blue-500" />
            <span>Configure Mail Gateway</span>
            <ExternalLink className="h-3 w-3 opacity-60" />
          </Link>

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-(--ot-muted) hover:text-(--ot-text) bg-(--ot-panel) border-(--ot-border) transition-colors cursor-pointer"
            onClick={handleResetFactoryPresets}
            disabled={!isAdmin}
            title="Reset to recommended MES production monitoring rules"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Factory Presets</span>
          </Button>

          <Button
            type="button"
            size="sm"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow transition-all cursor-pointer disabled:opacity-50"
            onClick={() => setIsAddRuleOpen(true)}
            disabled={!isAdmin}
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Alert Rule</span>
          </Button>
        </div>
      </div>

      {/* Alert Rules List */}
      <section className="panel-card settings-section-card">
        <header className="settings-section-header">
          <div className="settings-header-icon">
            <Bell />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-(--ot-text)">
              Active Alert Rules & Trigger Conditions
            </h3>
            <p className="text-xs text-(--ot-muted)">
              Policies actively evaluating live telemetry streams and dispatching incident
              notifications.
            </p>
          </div>
        </header>

        <div className="flex flex-col gap-2.5">
          {alertRules.map((rule) => {
            const severityBadge =
              rule.severity === "critical"
                ? "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30"
                : rule.severity === "warning"
                  ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30"
                  : "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30";

            return (
              <div
                key={rule.id}
                className={`flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-lg border transition-all gap-3 ${
                  rule.enabled
                    ? "bg-(--ot-panel) border-(--ot-border) shadow-xs"
                    : "bg-(--ot-panel)/50 border-(--ot-border)/50 opacity-60"
                }`}
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="mt-0.5 shrink-0">
                    <Switch
                      checked={rule.enabled}
                      onCheckedChange={() => isAdmin && handleToggleRule(rule.id)}
                      disabled={!isAdmin}
                      aria-label={rule.enabled ? "Click to Pause" : "Click to Enable"}
                    />
                  </div>

                  <div className="flex flex-col gap-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-semibold text-(--ot-text)">{rule.name}</span>
                      <Badge
                        variant={
                          rule.severity === "critical"
                            ? "destructive"
                            : rule.severity === "warning"
                              ? "warning"
                              : "info"
                        }
                        size="sm"
                        className="font-bold text-[10px] uppercase tracking-wider"
                      >
                        {rule.severity.toUpperCase()}
                      </Badge>
                      <Badge variant="outline" size="sm" className="text-[10px] font-medium">
                        {rule.service}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-(--ot-text)">
                      <span>
                        Condition:{" "}
                        <strong className="text-(--ot-text)">
                          {rule.metric} &gt; {rule.threshold} {rule.unit}
                        </strong>
                      </span>
                      <span>·</span>
                      <span>Cooldown: {rule.cooldownMins}m</span>
                      <span>·</span>
                      <div className="flex items-center gap-1.5">
                        <span>Channels:</span>
                        {rule.channels.email && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-medium">
                            <Mail className="h-3 w-3" aria-hidden="true" /> Outlook
                          </span>
                        )}
                        {rule.channels.teams && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400 text-[10px] font-medium">
                            <MessageSquare className="h-3 w-3" aria-hidden="true" /> Teams
                          </span>
                        )}
                        {rule.channels.inApp && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-medium">
                            <Bell className="h-3 w-3" aria-hidden="true" /> In-App
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-(--ot-panel) hover:bg-(--ot-panel-raised) border-(--ot-border) text-(--ot-text) transition-colors cursor-pointer"
                    onClick={() => handleTriggerRuleTest(rule)}
                    disabled={!isAdmin}
                    title="Simulate incident trigger & preview dispatched email"
                  >
                    <Send className="h-3 w-3 text-sky-500" />
                    <span>Test Trigger</span>
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="p-1.5 rounded-lg text-(--ot-text) hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                    onClick={() => isAdmin && handleDeleteRule(rule.id)}
                    disabled={!isAdmin}
                    title="Delete rule"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Incident Dispatch History Log */}
      <section className="panel-card settings-section-card">
        <header className="settings-section-header">
          <div className="settings-header-icon">
            <History />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-(--ot-text)">
              Recent Alert Dispatch & Delivery Audit Log
            </h3>
            <p className="text-xs text-(--ot-muted)">
              Historical record of incidents triggered and delivered to Outlook & Teams.
            </p>
          </div>
        </header>

        <div className="flex flex-col gap-2">
          {incidentLogs.map((log) => (
            <div
              key={log.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg bg-(--ot-panel) border border-(--ot-border) gap-2 text-xs"
            >
              <div className="flex items-center gap-2.5">
                <span
                  className={`h-2.5 w-2.5 rounded-full ${
                    log.severity === "critical" ? "bg-rose-500 animate-ping" : "bg-amber-400"
                  }`}
                />
                <div>
                  <strong className="text-(--ot-text) block text-xs">{log.ruleName}</strong>
                  <span className="text-[11px] text-(--ot-muted)">{log.details}</span>
                </div>
              </div>
              <div className="flex items-center gap-3 self-end sm:self-auto text-xs text-(--ot-text)">
                <span>{log.channel}</span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-semibold text-[10px]">
                  {log.status}
                </span>
                <span>{log.timestamp}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* MODAL: ADD ALERT RULE FORM */}
      {isAddRuleOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="relative w-full max-w-lg rounded-lg bg-(--ot-panel) border border-(--ot-border) p-6 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-(--ot-border) pb-3">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-blue-500" />
                <h3 className="text-sm font-bold text-(--ot-text)">Create Custom Alert Policy</h3>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                className="p-1 rounded-md text-(--ot-muted) hover:text-(--ot-text) cursor-pointer"
                onClick={() => setIsAddRuleOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <form onSubmit={handleAddNewRule} className="flex flex-col gap-3.5">
              <Field>
                <FieldLabel
                  htmlFor="new-rule-name"
                  className="text-[11px] font-medium text-(--ot-muted)"
                >
                  Rule Policy Name
                </FieldLabel>
                <Input
                  id="new-rule-name"
                  type="text"
                  required
                  placeholder="e.g. [PROD] High P95 Latency on MES-API"
                  value={newRuleName}
                  onChange={(e) => setNewRuleName(e.target.value)}
                  className="h-8 bg-(--ot-panel) border border-(--ot-border) rounded-md px-2.5 text-xs text-(--ot-text)"
                />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field>
                  <FieldLabel
                    htmlFor="new-rule-service"
                    className="text-[11px] font-medium text-(--ot-muted)"
                  >
                    Target Service
                  </FieldLabel>
                  <Select
                    value={newRuleService}
                    onValueChange={(val) => setNewRuleService(val ?? "All Services")}
                  >
                    <SelectTrigger id="new-rule-service" className="w-full h-8 bg-(--ot-panel) border border-(--ot-border) rounded-md px-2 text-xs text-(--ot-text)">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border text-popover-foreground text-xs shadow-md">
                      <SelectItem value="All Services">All Services</SelectItem>
                      <SelectItem value="MES-API">MES-API</SelectItem>
                      <SelectItem value="Order-Service">Order-Service</SelectItem>
                      <SelectItem value="Inventory-Worker">Inventory-Worker</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>

                <Field>
                  <FieldLabel
                    htmlFor="new-rule-severity"
                    className="text-[11px] font-medium text-(--ot-muted)"
                  >
                    Severity Level
                  </FieldLabel>
                  <Select
                    value={newRuleSeverity}
                    onValueChange={(val) => setNewRuleSeverity((val as any) ?? "warning")}
                  >
                    <SelectTrigger id="new-rule-severity" className="w-full h-8 bg-(--ot-panel) border border-(--ot-border) rounded-md px-2 text-xs text-(--ot-text)">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border text-popover-foreground text-xs shadow-md">
                      <SelectItem value="critical">Critical (P1 - Immediate pager)</SelectItem>
                      <SelectItem value="warning">Warning (P2 - Attention)</SelectItem>
                      <SelectItem value="info">Info (P3 - Informational)</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field>
                  <FieldLabel
                    htmlFor="new-rule-metric"
                    className="text-[11px] font-medium text-(--ot-muted)"
                  >
                    Metric Condition
                  </FieldLabel>
                  <Select
                    value={newRuleMetric}
                    onValueChange={(val) => setNewRuleMetric((val as any) ?? "p95_latency")}
                  >
                    <SelectTrigger id="new-rule-metric" className="w-full h-8 bg-(--ot-panel) border border-(--ot-border) rounded-md px-2 text-xs text-(--ot-text)">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border text-popover-foreground text-xs shadow-md">
                      <SelectItem value="p95_latency">P95 Latency (&gt; Threshold)</SelectItem>
                      <SelectItem value="error_rate">Error Rate % (&gt; Threshold)</SelectItem>
                      <SelectItem value="slow_sql">Slow SQL Query ms (&gt; Threshold)</SelectItem>
                      <SelectItem value="n_plus_one">N+1 Queries (&gt; Threshold)</SelectItem>
                      <SelectItem value="5xx_count">5xx Exceptions (&gt; Count)</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>

                <Field>
                  <FieldLabel
                    htmlFor="new-rule-threshold"
                    className="text-[11px] font-medium text-(--ot-muted)"
                  >
                    Threshold Value
                  </FieldLabel>
                  <Input
                    id="new-rule-threshold"
                    type="number"
                    required
                    value={newRuleThreshold}
                    onChange={(e) => setNewRuleThreshold(Number(e.target.value))}
                    className="h-8 bg-(--ot-panel) border border-(--ot-border) rounded-md px-2.5 text-xs text-(--ot-text)"
                  />
                </Field>
              </div>

              <div>
                <span className="block text-[11px] font-medium text-(--ot-muted) mb-1.5">
                  Dispatch Channels
                </span>
                <div className="flex items-center gap-4">
                  <Label
                    htmlFor="chan-email"
                    className="flex items-center gap-1.5 text-xs text-(--ot-text) cursor-pointer font-normal"
                  >
                    <Checkbox
                      id="chan-email"
                      checked={newRuleEmail}
                      onCheckedChange={(checked) => setNewRuleEmail(Boolean(checked))}
                    />
                    <span>Outlook Email</span>
                  </Label>
                  <Label
                    htmlFor="chan-teams"
                    className="flex items-center gap-1.5 text-xs text-(--ot-text) cursor-pointer font-normal"
                  >
                    <Checkbox
                      id="chan-teams"
                      checked={newRuleTeams}
                      onCheckedChange={(checked) => setNewRuleTeams(Boolean(checked))}
                    />
                    <span>MS Teams Webhook</span>
                  </Label>
                  <Label
                    htmlFor="chan-inapp"
                    className="flex items-center gap-1.5 text-xs text-(--ot-text) cursor-pointer font-normal"
                  >
                    <Checkbox
                      id="chan-inapp"
                      checked={newRuleInApp}
                      onCheckedChange={(checked) => setNewRuleInApp(Boolean(checked))}
                    />
                    <span>In-App Banner</span>
                  </Label>
                </div>
              </div>

              <Field>
                <FieldLabel
                  htmlFor="new-rule-cooldown"
                  className="text-[11px] font-medium text-(--ot-muted)"
                >
                  Cooldown Silence Period (Minutes)
                </FieldLabel>
                <Select
                  value={String(newRuleCooldown)}
                  onValueChange={(val) => setNewRuleCooldown(Number(val ?? 15))}
                >
                  <SelectTrigger id="new-rule-cooldown" className="w-full h-8 bg-(--ot-panel) border border-(--ot-border) rounded-md px-2 text-xs text-(--ot-text)">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border text-popover-foreground text-xs shadow-md">
                    <SelectItem value="5">5 minutes</SelectItem>
                    <SelectItem value="15">15 minutes (Standard recommendation)</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="60">60 minutes</SelectItem>
                  </SelectContent>
                </Select>
              </Field>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-(--ot-border)">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="px-3 py-1.5 rounded-md text-xs text-(--ot-muted) hover:text-(--ot-text) cursor-pointer"
                  onClick={() => setIsAddRuleOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="px-4 py-1.5 rounded-md text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow cursor-pointer"
                >
                  Save Policy
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: SIMULATED INCIDENT & DISPATCHED EMAIL PREVIEW */}
      {testIncidentPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="relative w-full max-w-xl rounded-lg bg-(--ot-panel) border border-(--ot-border) shadow-2xl flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-(--ot-border) bg-(--ot-panel)">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-blue-500" />
                <h3 className="text-xs font-bold text-(--ot-text)">
                  Outlook Email Dispatch Preview
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                  250 OK Delivered
                </span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                className="p-1 rounded-md text-(--ot-muted) hover:text-(--ot-text) cursor-pointer"
                onClick={() => setTestIncidentPreview(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="p-5 flex flex-col gap-3 max-h-[80vh] overflow-y-auto">
              <div className="flex flex-col gap-1 p-3 rounded-md bg-(--ot-panel) border border-(--ot-border) text-xs">
                <div>
                  <span className="text-(--ot-muted)">From: </span>
                  <span className="text-(--ot-text) font-semibold">
                    alerts@example.com via Microsoft 365
                  </span>
                </div>
                <div>
                  <span className="text-(--ot-muted)">To: </span>
                  <span className="text-(--ot-muted)">{testIncidentPreview.recipients}</span>
                </div>
                <div>
                  <span className="text-(--ot-muted)">Subject: </span>
                  <span className="text-rose-600 dark:text-rose-400 font-bold">
                    {testIncidentPreview.subject}
                  </span>
                </div>
                <div>
                  <span className="text-(--ot-muted)">Time: </span>
                  <span className="text-(--ot-muted)">{testIncidentPreview.time}</span>
                </div>
              </div>

              <div className="p-4 rounded-lg border border-(--ot-border) bg-(--ot-panel) flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-rose-500 animate-pulse" />
                  <strong className="text-xs text-(--ot-text) uppercase tracking-wide">
                    OpenTrace Alert: {testIncidentPreview.rule.name}
                  </strong>
                </div>

                <p className="text-xs text-(--ot-muted) leading-relaxed">
                  An incident condition was detected on cluster{" "}
                  <strong>MES-Production (VN-EMS-P)</strong>. Metric threshold for{" "}
                  <code>{testIncidentPreview.rule.metric}</code> exceeded limit of{" "}
                  <strong>
                    {testIncidentPreview.rule.threshold} {testIncidentPreview.rule.unit}
                  </strong>
                  .
                </p>

                <div className="grid grid-cols-2 gap-2 p-3 rounded bg-(--ot-panel) text-[11px]">
                  <div>
                    <span className="text-(--ot-text) block">Impacted Service:</span>
                    <strong className="text-(--ot-text)">{testIncidentPreview.rule.service}</strong>
                  </div>
                  <div>
                    <span className="text-(--ot-text) block">Trigger Trace ID:</span>
                    <strong className="text-sky-600 dark:text-sky-400">
                      {testIncidentPreview.traceId}
                    </strong>
                  </div>
                  <div>
                    <span className="text-(--ot-text) block">Environment:</span>
                    <strong className="text-(--ot-text)">Production (us-east-1)</strong>
                  </div>
                  <div>
                    <span className="text-(--ot-text) block">Cooldown Mute:</span>
                    <strong className="text-(--ot-text)">
                      {testIncidentPreview.rule.cooldownMins} minutes
                    </strong>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <Button
                    type="button"
                    size="sm"
                    className="flex-1 py-1.5 rounded-md bg-blue-600 text-white text-xs font-semibold text-center hover:bg-blue-700 transition-colors cursor-pointer"
                    onClick={() => {
                      setTestIncidentPreview(null);
                    }}
                  >
                    Open Trace in OpenTrace Waterfall & SQL Studio
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="px-3 py-1.5 rounded-md bg-(--ot-panel) border-(--ot-border) text-xs text-(--ot-muted) hover:text-(--ot-text) cursor-pointer"
                    onClick={() => setTestIncidentPreview(null)}
                  >
                    Dismiss
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
