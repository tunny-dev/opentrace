"use client";

import { LogStreamTab } from "@/components/opentrace/log-stream-tab";
import { TelemetryToolbar } from "@/components/opentrace/telemetry-toolbar";
import { useTelemetry } from "@/lib/opentrace/telemetry-context";
import { useI18n } from "@/lib/i18n/i18n-context";

export default function LogsPage() {
  const { filteredLogs, openTraceFromLog } = useTelemetry();
  const { dict } = useI18n();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-(--ot-text)">{dict.common.logs}</h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25">
              {dict.logs.badge}
            </span>
          </div>
          <p className="text-xs text-(--ot-muted) mt-0.5">{dict.logs.subtitle}</p>
        </div>

        {/* Telemetry Control Toolbar with Environment, Service, Live Stream & Refresh */}
        <TelemetryToolbar />
      </div>

      <LogStreamTab logs={filteredLogs} onOpenTrace={openTraceFromLog} />
    </div>
  );
}
