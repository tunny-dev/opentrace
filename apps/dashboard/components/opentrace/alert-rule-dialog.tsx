"use client";

import * as React from "react";
import { Bell } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useI18n } from "@/lib/i18n/i18n-context";
import {
  COOLDOWN_OPTIONS,
  FORM_METRICS,
  SERVICES,
  SEVERITIES,
  CHANNELS,
  serviceLabel,
  type AlertChannel,
  type AlertMetric,
  type AlertSeverity,
  type NewRuleDraft,
} from "./alerts-types";

const INITIAL_DRAFT: NewRuleDraft = {
  name: "",
  service: SERVICES[0],
  metric: "p95_latency",
  threshold: 400,
  severity: "warning",
  channels: { email: true, teams: true, inApp: true },
  cooldownMins: 15,
};

const CHANNEL_LABEL_KEY: Record<AlertChannel, string> = {
  email: "alerts.modal.chanEmail",
  teams: "alerts.modal.chanTeams",
  inApp: "alerts.modal.chanInApp",
};

const TRIGGER_CLASS = "h-8 w-full text-xs";

interface AlertRuleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (draft: NewRuleDraft) => void;
}

export function AlertRuleDialog({ open, onOpenChange, onCreate }: AlertRuleDialogProps) {
  const { t } = useI18n();
  const [draft, setDraft] = React.useState<NewRuleDraft>(INITIAL_DRAFT);

  React.useEffect(() => {
    if (open) setDraft(INITIAL_DRAFT);
  }, [open]);

  function update<K extends keyof NewRuleDraft>(key: K, value: NewRuleDraft[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!draft.name.trim()) return;
    onCreate({ ...draft, name: draft.name.trim() });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="size-4 text-sky-600" aria-hidden="true" />
            {t("alerts.modal.createTitle")}
          </DialogTitle>
          <DialogDescription>{t("alerts.modal.createDesc")}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Field>
            <FieldLabel htmlFor="new-rule-name" className="text-xs">
              {t("alerts.modal.ruleName")}
            </FieldLabel>
            <Input
              id="new-rule-name"
              type="text"
              required
              autoFocus
              placeholder={t("alerts.modal.ruleNamePlaceholder")}
              value={draft.name}
              onChange={(event) => update("name", event.target.value)}
              className="h-8 text-xs"
            />
          </Field>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="new-rule-service" className="text-xs">
                {t("alerts.modal.targetService")}
              </FieldLabel>
              <Select
                value={draft.service}
                onValueChange={(value) => update("service", value ?? SERVICES[0])}
              >
                <SelectTrigger id="new-rule-service" className={TRIGGER_CLASS}>
                  <SelectValue>{(value: string) => serviceLabel(t, value)}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {SERVICES.map((service) => (
                    <SelectItem key={service} value={service}>
                      {serviceLabel(t, service)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field>
              <FieldLabel htmlFor="new-rule-severity" className="text-xs">
                {t("alerts.modal.severityLevel")}
              </FieldLabel>
              <Select
                value={draft.severity}
                onValueChange={(value) => update("severity", (value as AlertSeverity) ?? "warning")}
              >
                <SelectTrigger id="new-rule-severity" className={TRIGGER_CLASS}>
                  <SelectValue>
                    {(value: string) => t(`alerts.severityOption.${value}`, value)}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {SEVERITIES.map((severity) => (
                    <SelectItem key={severity} value={severity}>
                      {t(`alerts.severityOption.${severity}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="new-rule-metric" className="text-xs">
                {t("alerts.modal.metricCondition")}
              </FieldLabel>
              <Select
                value={draft.metric}
                onValueChange={(value) => update("metric", (value as AlertMetric) ?? "p95_latency")}
              >
                <SelectTrigger id="new-rule-metric" className={TRIGGER_CLASS}>
                  <SelectValue>
                    {(value: string) => t(`alerts.metricOption.${value}`, value)}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {FORM_METRICS.map((metric) => (
                    <SelectItem key={metric} value={metric}>
                      {t(`alerts.metricOption.${metric}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field>
              <FieldLabel htmlFor="new-rule-threshold" className="text-xs">
                {t("alerts.modal.thresholdValue")}
              </FieldLabel>
              <Input
                id="new-rule-threshold"
                type="number"
                required
                min={0}
                step="any"
                value={draft.threshold}
                onChange={(event) => update("threshold", Number(event.target.value))}
                className="h-8 text-xs"
              />
            </Field>
          </div>

          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 text-xs font-medium text-foreground">
              {t("alerts.modal.dispatchChannels")}
            </legend>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              {CHANNELS.map((channel) => (
                <Label
                  key={channel}
                  htmlFor={`chan-${channel}`}
                  className="flex cursor-pointer items-center gap-1.5 text-xs font-normal"
                >
                  <Checkbox
                    id={`chan-${channel}`}
                    checked={draft.channels[channel]}
                    onCheckedChange={(checked) =>
                      update("channels", { ...draft.channels, [channel]: Boolean(checked) })
                    }
                  />
                  <span>{t(CHANNEL_LABEL_KEY[channel])}</span>
                </Label>
              ))}
            </div>
          </fieldset>

          <Field>
            <FieldLabel htmlFor="new-rule-cooldown" className="text-xs">
              {t("alerts.modal.cooldown")}
            </FieldLabel>
            <Select
              value={String(draft.cooldownMins)}
              onValueChange={(value) => update("cooldownMins", Number(value ?? 15))}
            >
              <SelectTrigger id="new-rule-cooldown" className={TRIGGER_CLASS}>
                <SelectValue>
                  {(value: string) => t(`alerts.cooldownOption.${value}`, value)}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {COOLDOWN_OPTIONS.map((minutes) => (
                  <SelectItem key={minutes} value={String(minutes)}>
                    {t(`alerts.cooldownOption.${minutes}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <DialogFooter>
            <Button type="button" variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
              {t("alerts.modal.cancel")}
            </Button>
            <Button type="submit" size="sm">
              {t("alerts.modal.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
