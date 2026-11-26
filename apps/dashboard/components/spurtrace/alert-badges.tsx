"use client";

import * as React from "react";
import { Bell, Mail, MessageSquare, type LucideIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/i18n-context";
import type { AlertChannel, AlertSeverity } from "./alerts-types";

const SEVERITY_VARIANT = {
  critical: "destructive",
  warning: "warning",
  info: "info",
} as const;

export function SeverityBadge({ severity }: { severity: AlertSeverity }) {
  const { t } = useI18n();
  return (
    <Badge
      variant={SEVERITY_VARIANT[severity]}
      size="sm"
      className="text-[10px] font-bold uppercase tracking-wider"
    >
      {t(`alerts.${severity}`)}
    </Badge>
  );
}

const CHANNEL_STYLE: Record<AlertChannel, { icon: LucideIcon; className: string }> = {
  email: { icon: Mail, className: "bg-sky-500/10 text-sky-700 dark:text-sky-400" },
  inApp: { icon: Bell, className: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" },
};

export function ChannelChips({ channels }: { channels: AlertChannel[] }) {
  const { t } = useI18n();
  if (channels.length === 0) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }
  return (
    <div className="flex flex-wrap items-center gap-1">
      {channels.map((channel) => {
        const { icon: Icon, className } = CHANNEL_STYLE[channel];
        return (
          <span
            key={channel}
            className={cn(
              "inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium",
              className
            )}
          >
            <Icon className="size-3" aria-hidden="true" />
            {t(`alerts.channelName.${channel}`)}
          </span>
        );
      })}
    </div>
  );
}
