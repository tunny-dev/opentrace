"use client";

import * as React from "react";
import { useTelemetry } from "@/lib/opentrace/telemetry-context";
import { AlertsPageContent } from "@/components/opentrace/alerts-page";
import { TelemetryToolbar } from "@/components/opentrace/telemetry-toolbar";
import { useI18n } from "@/lib/i18n/i18n-context";

export default function AlertsPage() {
  const { userRole } = useTelemetry();
  const { dict } = useI18n();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-(--ot-text)">{dict.common.alerts}</h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/25">
              {dict.alerts.badge}
            </span>
          </div>
          <p className="text-xs text-(--ot-muted) mt-0.5">{dict.alerts.subtitle}</p>
        </div>

        {/* Telemetry Control Toolbar with Environment, Service, Live Stream & Refresh */}
        <TelemetryToolbar />
      </div>

      <AlertsPageContent role={userRole} />
    </div>
  );
}
