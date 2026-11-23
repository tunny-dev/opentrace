"use client";

import { TracesTable } from "@/components/spurtrace/traces-table";
import { TelemetryToolbar } from "@/components/spurtrace/telemetry-toolbar";
import { useTelemetry } from "@/lib/spurtrace/telemetry-context";
import { useI18n } from "@/lib/i18n/i18n-context";

export default function ErrorsPage() {
  const { filteredTraces, openTrace, liveStream } = useTelemetry();
  const { dict } = useI18n();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-(--ot-text)">{dict.common.errors}</h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/25">
              {dict.errors.badge}
            </span>
          </div>
          <p className="text-xs text-(--ot-muted) mt-0.5">{dict.errors.subtitle}</p>
        </div>

        {/* Telemetry Control Toolbar with Environment, Service, Live Stream & Refresh */}
        <TelemetryToolbar />
      </div>

      <TracesTable
        traces={filteredTraces}
        section="errors"
        onSelect={openTrace}
        liveStream={liveStream}
      />
    </div>
  );
}
