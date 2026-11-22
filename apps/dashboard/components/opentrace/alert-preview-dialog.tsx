"use client";

import * as React from "react";
import Link from "next/link";
import { Mail } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/i18n-context";
import {
  conditionLabel,
  ruleLabel,
  serviceLabel,
  unitLabel,
  type AlertRule,
} from "./alerts-types";

export interface IncidentPreview {
  rule: AlertRule;
  time: string;
  traceId: string;
  recipients: string;
}

const CLUSTER = "MES-Production (VN-EMS-P)";
const ENVIRONMENT = "Production (us-east-1)";
const SENDER = "alerts@example.com via Microsoft 365";

function MetaRow({ label, value, valueClassName }: { label: string; value: string; valueClassName?: string }) {
  return (
    <div className="flex flex-wrap gap-x-1.5">
      <span className="text-muted-foreground">{label}:</span>
      <span className={cn("font-medium text-foreground", valueClassName)}>{value}</span>
    </div>
  );
}

function Fact({ label, value, valueClassName }: { label: string; value: string; valueClassName?: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-muted-foreground">{label}</span>
      <strong className={cn("text-foreground", valueClassName)}>{value}</strong>
    </div>
  );
}

export function AlertPreviewDialog({
  preview,
  onClose,
}: {
  preview: IncidentPreview | null;
  onClose: () => void;
}) {
  const { t } = useI18n();

  return (
    <Dialog open={preview !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        {preview && (
          <>
            <DialogHeader>
              <DialogTitle className="flex flex-wrap items-center gap-2 pr-8">
                <Mail className="size-4 text-sky-600" aria-hidden="true" />
                {t("alerts.preview.title")}
                <Badge variant="success" size="sm" className="text-[10px] font-bold">
                  {t("alerts.preview.delivered")}
                </Badge>
              </DialogTitle>
            </DialogHeader>

            <div className="flex flex-col gap-1 rounded-md border bg-muted/40 p-3 text-xs">
              <MetaRow label={t("alerts.preview.from")} value={SENDER} />
              <MetaRow label={t("alerts.preview.to")} value={preview.recipients} />
              <MetaRow
                label={t("alerts.preview.subject")}
                value={ruleLabel(t, preview.rule)}
                valueClassName="font-bold text-rose-700 dark:text-rose-400"
              />
              <MetaRow label={t("alerts.preview.time")} value={preview.time} />
            </div>

            <div className="flex flex-col gap-3 rounded-lg border p-4">
              <div className="flex items-center gap-2">
                <span className="size-2.5 shrink-0 animate-pulse rounded-full bg-rose-500" aria-hidden="true" />
                <strong className="text-xs uppercase tracking-wide text-foreground">
                  {t("alerts.preview.heading", { name: ruleLabel(t, preview.rule) })}
                </strong>
              </div>

              <p className="text-xs leading-relaxed text-muted-foreground">
                {t("alerts.preview.body", {
                  cluster: CLUSTER,
                  metric: t(`alerts.metric.${preview.rule.metric}`),
                  limit: `${preview.rule.threshold} ${unitLabel(t, preview.rule.unit)}`,
                })}
              </p>

              <div className="grid grid-cols-1 gap-3 rounded-md bg-muted/40 p-3 text-[11px] sm:grid-cols-2">
                <Fact
                  label={t("alerts.preview.impactedService")}
                  value={serviceLabel(t, preview.rule.service)}
                />
                <Fact
                  label={t("alerts.col.condition")}
                  value={conditionLabel(t, preview.rule)}
                  valueClassName="font-mono"
                />
                <Fact
                  label={t("alerts.preview.triggerTraceId")}
                  value={preview.traceId}
                  valueClassName="font-mono text-sky-700 dark:text-sky-400"
                />
                <Fact label={t("alerts.preview.environment")} value={ENVIRONMENT} />
                <Fact
                  label={t("alerts.preview.cooldownMute")}
                  value={t("alerts.preview.minutes", { n: preview.rule.cooldownMins })}
                />
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <Link
                  href="/traces"
                  onClick={onClose}
                  className={cn(buttonVariants({ size: "sm" }), "flex-1")}
                >
                  {t("alerts.preview.openTrace")}
                </Link>
                <Button type="button" variant="outline" size="sm" onClick={onClose}>
                  {t("alerts.preview.dismiss")}
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
