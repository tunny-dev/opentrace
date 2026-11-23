import type { TranslateFn } from "@/lib/i18n/i18n-context";

export type AlertSeverity = "critical" | "warning" | "info";
export type AlertChannel = "email" | "teams" | "inApp";
export type AlertMetric =
  | "p95_latency"
  | "error_rate"
  | "slow_sql"
  | "n_plus_one"
  | "5xx_count"
  | "heartbeat_timeout";

export interface AlertRule {
  id: string;
  /** Free-form name typed by the user. Ignored for display when `nameKey` is set. */
  name: string;
  /** Translation key for built-in presets so they follow the active language. */
  nameKey?: string;
  service: string;
  metric: AlertMetric;
  threshold: number;
  unit: string;
  severity: AlertSeverity;
  channels: Record<AlertChannel, boolean>;
  cooldownMins: number;
  enabled: boolean;
}

export interface IncidentDetail {
  key: "alerts.log.seedException" | "alerts.log.seedSlowSql" | "alerts.log.testDetail";
  metric?: AlertMetric;
  threshold?: number;
  unit?: string;
}

export interface IncidentLog {
  id: string;
  ruleName: string;
  ruleNameKey?: string;
  severity: AlertSeverity;
  minutesAgo: number;
  channels: AlertChannel[];
  details: IncidentDetail;
}

export interface NewRuleDraft {
  name: string;
  service: string;
  metric: AlertMetric;
  threshold: number;
  severity: AlertSeverity;
  channels: Record<AlertChannel, boolean>;
  cooldownMins: number;
}

export const ALL_SERVICES = "All Services";
export const SERVICES = [ALL_SERVICES, "MES-API", "Order-Service", "Inventory-Worker"];
export const CHANNELS: AlertChannel[] = ["email", "teams", "inApp"];
export const SEVERITIES: AlertSeverity[] = ["critical", "warning", "info"];
export const SEVERITY_RANK: Record<AlertSeverity, number> = { critical: 0, warning: 1, info: 2 };
export const FORM_METRICS: AlertMetric[] = [
  "p95_latency",
  "error_rate",
  "slow_sql",
  "n_plus_one",
  "5xx_count",
];
export const COOLDOWN_OPTIONS = [5, 15, 30, 60];

export const METRIC_UNITS: Record<AlertMetric, string> = {
  p95_latency: "ms",
  error_rate: "%",
  slow_sql: "ms",
  n_plus_one: "statements",
  "5xx_count": "exceptions",
  heartbeat_timeout: "secs",
};

export const DEFAULT_ALERT_RULES: AlertRule[] = [
  {
    id: "rule-1",
    name: "[CRITICAL] MES-API HTTP 500 & Unhandled Exceptions",
    nameKey: "alerts.seed.rule1",
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
    nameKey: "alerts.seed.rule2",
    service: ALL_SERVICES,
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
    nameKey: "alerts.seed.rule3",
    service: ALL_SERVICES,
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
    nameKey: "alerts.seed.rule4",
    service: ALL_SERVICES,
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
    nameKey: "alerts.seed.rule5",
    service: ALL_SERVICES,
    metric: "n_plus_one",
    threshold: 5,
    unit: "statements",
    severity: "warning",
    channels: { email: false, teams: true, inApp: true },
    cooldownMins: 30,
    enabled: true,
  },
];

export const SEED_INCIDENT_LOGS: IncidentLog[] = [
  {
    id: "inc-1",
    ruleName: DEFAULT_ALERT_RULES[0].name,
    ruleNameKey: DEFAULT_ALERT_RULES[0].nameKey,
    severity: "critical",
    minutesAgo: 10,
    channels: ["email", "teams"],
    details: { key: "alerts.log.seedException" },
  },
  {
    id: "inc-2",
    ruleName: DEFAULT_ALERT_RULES[3].name,
    ruleNameKey: DEFAULT_ALERT_RULES[3].nameKey,
    severity: "warning",
    minutesAgo: 60,
    channels: ["email"],
    details: { key: "alerts.log.seedSlowSql" },
  },
];

export function ruleLabel(t: TranslateFn, rule: Pick<AlertRule, "name" | "nameKey">) {
  return rule.nameKey ? t(rule.nameKey, rule.name) : rule.name;
}

export function logRuleLabel(t: TranslateFn, log: Pick<IncidentLog, "ruleName" | "ruleNameKey">) {
  return log.ruleNameKey ? t(log.ruleNameKey, log.ruleName) : log.ruleName;
}

export function serviceLabel(t: TranslateFn, service: string) {
  return service === ALL_SERVICES ? t("alerts.allServices") : service;
}

export function unitLabel(t: TranslateFn, unit: string) {
  return t(`alerts.unit.${unit}`, unit);
}

const UNITS_IMPLIED_BY_METRIC = new Set(["exceptions", "statements"]);

export function formatThreshold(t: TranslateFn, threshold: number, unit: string) {
  if (UNITS_IMPLIED_BY_METRIC.has(unit)) return String(threshold);
  if (unit === "%") return `${threshold}%`;
  return `${threshold} ${unitLabel(t, unit)}`;
}

export function conditionLabel(t: TranslateFn, rule: AlertRule) {
  return `${t(`alerts.metric.${rule.metric}`)} > ${formatThreshold(t, rule.threshold, rule.unit)}`;
}

export function formatAgo(t: TranslateFn, minutes: number) {
  if (minutes <= 0) return t("alerts.log.justNow");
  if (minutes < 60) return t("alerts.log.minutesAgo", { n: minutes });
  return t("alerts.log.hoursAgo", { n: Math.floor(minutes / 60) });
}

export function detailText(t: TranslateFn, detail: IncidentDetail) {
  return t(detail.key, {
    metric: detail.metric ? t(`alerts.metric.${detail.metric}`) : "",
    threshold: detail.threshold ?? "",
    unit: detail.unit ?? "",
  });
}

export function enabledChannels(channels: Record<AlertChannel, boolean>) {
  return CHANNELS.filter((channel) => channels[channel]);
}
