"use client";

import { useMemo } from "react";
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

  const breakdown = useMemo(() => {
    if (filteredTraces.length === 0) {
      return {
        avgDuration: 0,
        dbPct: 0,
        appPct: 100,
        extPct: 0,
        avgDbMs: 0,
        avgAppMs: 0,
        avgExtMs: 0,
      };
    }
    let totalDur = 0;
    let totalDb = 0;
    let totalExt = 0;
    let totalApp = 0;

    for (const trace of filteredTraces) {
      totalDur += trace.duration;
      const dbTime =
        (trace.spans || [])
          .filter((s) => s.kind === "db")
          .reduce((sum, s) => sum + s.duration, 0) ||
        (trace.queries || []).reduce((sum, q) => sum + q.duration, 0);
      const extTime = (trace.spans || [])
        .filter((s) => s.kind === "http")
        .reduce((sum, s) => sum + s.duration, 0);
      const appTime = Math.max(0, trace.duration - dbTime - extTime);

      totalDb += dbTime;
      totalExt += extTime;
      totalApp += appTime;
    }

    const n = filteredTraces.length;
    const avgDuration = Math.round(totalDur / n);
    const dbPct = totalDur > 0 ? Number(((totalDb / totalDur) * 100).toFixed(1)) : 0;
    const extPct = totalDur > 0 ? Number(((totalExt / totalDur) * 100).toFixed(1)) : 0;
    const appPct = totalDur > 0 ? Number(Math.max(0, 100 - dbPct - extPct).toFixed(1)) : 100;

    return {
      avgDuration,
      dbPct,
      appPct,
      extPct,
      avgDbMs: Math.round(totalDb / n),
      avgAppMs: Math.round(totalApp / n),
      avgExtMs: Math.round(totalExt / n),
    };
  }, [filteredTraces]);

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
              {breakdown.avgDuration}
              <span>ms</span>
            </strong>
            <span>avg. request duration</span>
          </div>
          <div
            className="composition-track"
            role="img"
            aria-label={`${breakdown.dbPct}% database, ${breakdown.appPct}% application, ${breakdown.extPct}% external services`}
          >
            <i style={{ width: `${breakdown.dbPct}%` }} />
            <span style={{ width: `${breakdown.appPct}%` }} />
            <b style={{ width: `${breakdown.extPct}%` }} />
          </div>
          <div className="composition-list">
            <div>
              <i className="composition-db" />
              <span>Database</span>
              <strong>{breakdown.dbPct}%</strong>
              <small>{breakdown.avgDbMs} ms</small>
            </div>
            <div>
              <i className="composition-app" />
              <span>App logic</span>
              <strong>{breakdown.appPct}%</strong>
              <small>{breakdown.avgAppMs} ms</small>
            </div>
            <div>
              <i className="composition-ext" />
              <span>External APIs</span>
              <strong>{breakdown.extPct}%</strong>
              <small>{breakdown.avgExtMs} ms</small>
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
