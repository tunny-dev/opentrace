"use client";

import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DashboardMetrics } from "@/components/spurtrace/dashboard-metrics";
import { LatencyChart } from "@/components/spurtrace/latency-chart";
import { TracesTable } from "@/components/spurtrace/traces-table";
import { TelemetryToolbar } from "@/components/spurtrace/telemetry-toolbar";
import { useTelemetry } from "@/lib/spurtrace/telemetry-context";
import { useI18n } from "@/lib/i18n/i18n-context";

export default function OverviewPage() {
  const { filteredTraces, openTrace, liveStream } = useTelemetry();
  const { dict } = useI18n();

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-(--ot-text)">{dict.common.overview}</h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
              {dict.dashboard.badge}
            </span>
          </div>
          <p className="text-xs text-(--ot-muted) mt-0.5">{dict.dashboard.subtitle}</p>
        </div>

        {/* Telemetry Control Toolbar with Environment, Service, Live Stream & Refresh */}
        <TelemetryToolbar />
      </div>

      <DashboardMetrics />

      <div className="chart-row">
        <LatencyChart />
        <section className="panel-card breakdown-panel" aria-labelledby="breakdown-title">
          <div className="panel-heading">
            <div>
              <div className="section-kicker">{dict.dashboard.systemHealth}</div>
              <div className="latency-title-row">
                <h2 id="breakdown-title">Latency breakdown</h2>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon-sm"
              className="more-button cursor-pointer"
              type="button"
              aria-label="More service health options"
            >
              ···
            </Button>
          </div>
          <div className="breakdown-total">
            <strong>
              184<span>ms</span>
            </strong>
            <span>avg. request duration</span>
          </div>
          <div
            className="composition-track"
            role="img"
            aria-label="68 percent database, 24 percent application, 8 percent external services"
          >
            <i />
            <span />
            <b />
          </div>
          <div className="composition-list">
            <div>
              <i className="composition-db" />
              <span>Database</span>
              <strong>68.4%</strong>
              <small>126 ms</small>
            </div>
            <div>
              <i className="composition-app" />
              <span>App logic</span>
              <strong>23.7%</strong>
              <small>44 ms</small>
            </div>
            <div>
              <i className="composition-ext" />
              <span>External APIs</span>
              <strong>7.9%</strong>
              <small>14 ms</small>
            </div>
          </div>
          <Link href="/sql" className="breakdown-link cursor-pointer">
            {dict.sql.title} <ExternalLink aria-hidden="true" />
          </Link>
        </section>
      </div>

      <TracesTable
        traces={filteredTraces}
        section="overview"
        onSelect={openTrace}
        liveStream={liveStream}
      />
    </div>
  );
}
