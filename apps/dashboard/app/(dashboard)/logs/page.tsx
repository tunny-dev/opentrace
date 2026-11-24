"use client";

import Link from "next/link";
import { LogStreamTab } from "@/components/spurtrace/log-stream-tab";
import { TelemetryToolbar } from "@/components/spurtrace/telemetry-toolbar";
import { useTelemetry } from "@/lib/spurtrace/telemetry-context";
import { useI18n } from "@/lib/i18n/i18n-context";
import { buttonVariants } from "@/components/ui/button";
import { ExternalLink, Layers, Activity } from "lucide-react";

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
            <Link
              href="/system-logs"
              className={buttonVariants({
                variant: "outline",
                size: "sm",
                className:
                  "h-7 text-xs gap-1.5 ml-1 border-cyan-500/30 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-500/10 transition font-medium cursor-pointer",
              })}
            >
              <Layers className="h-3.5 w-3.5 text-cyan-500" />
              <span>MES System Logs</span>
              <ExternalLink className="h-3 w-3 opacity-60" />
            </Link>
          </div>
          <p className="text-xs text-(--ot-muted) mt-0.5">{dict.logs.subtitle}</p>
        </div>

        {/* Telemetry Control Toolbar with Environment, Service, Live Stream & Refresh */}
        <div className="flex items-center gap-2">
          <Link
            href="/system-logs"
            className={buttonVariants({
              variant: "outline",
              size: "sm",
              className:
                "hidden lg:inline-flex h-8 text-xs gap-1.5 border-cyan-500/30 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-500/10 transition font-medium cursor-pointer",
            })}
          >
            <Activity className="h-3.5 w-3.5 text-cyan-500" />
            <span>System Trace Explorer</span>
          </Link>
          <TelemetryToolbar />
        </div>
      </div>

      <LogStreamTab logs={filteredLogs} onOpenTrace={openTraceFromLog} />
    </div>
  );
}
