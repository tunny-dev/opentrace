"use client";

import { useMemo, useState } from "react";
import {
  Activity,
  ArrowUpRight,
  BarChart3,
  CircleHelp,
  Clock,
  Database,
  Layers,
  Zap,
} from "lucide-react";
import { useTelemetry } from "@/lib/spurtrace/telemetry-context";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Button } from "@/components/ui/button";

const percentileConfig: ChartConfig = {
  p50: {
    label: "P50 Median",
    color: "#10b981",
  },
  p95: {
    label: "P95 Tail",
    color: "#f59e0b",
  },
  p99: {
    label: "P99 Critical",
    color: "#ef4444",
  },
};

const statusConfig: ChartConfig = {
  status2xx: {
    label: "2xx OK",
    color: "#10b981",
  },
  status4xx: {
    label: "4xx Client Err",
    color: "#f59e0b",
  },
  status5xx: {
    label: "5xx Server Err",
    color: "#ef4444",
  },
};

const breakdownConfig: ChartConfig = {
  dbTime: {
    label: "Database Time (SQL)",
    color: "#06b6d4",
  },
  appTime: {
    label: "App Processing Time",
    color: "#8b5cf6",
  },
};

export function LatencyChart() {
  const { filteredTraces } = useTelemetry();
  const [activeMetric, setActiveMetric] = useState<"percentiles" | "status" | "breakdown">(
    "percentiles"
  );

  const {
    series,
    overallP50,
    overallP95,
    overallP99,
    p50Change,
    p95Change,
    total2xx,
    total4xx,
    total5xx,
    avgDbMs,
    avgAppMs,
  } = useMemo(() => {
    if (filteredTraces.length === 0) {
      const emptySeries = Array.from({ length: 8 }, (_, i) => ({
        time: `${i * 5}m`,
        p50: 0,
        p95: 0,
        p99: 0,
        status2xx: 0,
        status4xx: 0,
        status5xx: 0,
        dbTime: 0,
        appTime: 0,
      }));
      return {
        series: emptySeries,
        overallP50: 0,
        overallP95: 0,
        overallP99: 0,
        p50Change: "0%",
        p95Change: "0%",
        total2xx: 0,
        total4xx: 0,
        total5xx: 0,
        avgDbMs: 0,
        avgAppMs: 0,
      };
    }

    // Overall percentiles calculation
    const allSorted = [...filteredTraces].map((t) => t.duration).sort((a, b) => a - b);
    const overallP50 = Math.round(allSorted[Math.floor(allSorted.length * 0.5)] || 0);
    const overallP95 = Math.round(allSorted[Math.floor(allSorted.length * 0.95)] || 0);
    const overallP99 = Math.round(allSorted[Math.floor(allSorted.length * 0.99)] || 0);

    // Split for trend calculations
    const half = Math.floor(filteredTraces.length / 2);
    const recent = filteredTraces.slice(0, half).map((t) => t.duration).sort((a, b) => a - b);
    const older = filteredTraces.slice(half).map((t) => t.duration).sort((a, b) => a - b);

    const recentP50 = recent[Math.floor(recent.length * 0.5)] || overallP50;
    const olderP50 = older[Math.floor(older.length * 0.5)] || overallP50;
    const p50Diff = olderP50 > 0 ? Number((((recentP50 - olderP50) / olderP50) * 100).toFixed(1)) : 0;
    const p50Change = `${p50Diff >= 0 ? "+" : "−"}${Math.abs(p50Diff)}%`;

    const recentP95 = recent[Math.floor(recent.length * 0.95)] || overallP95;
    const olderP95 = older[Math.floor(older.length * 0.95)] || overallP95;
    const p95Diff = olderP95 > 0 ? Number((((recentP95 - olderP95) / olderP95) * 100).toFixed(1)) : 0;
    const p95Change = `${p95Diff >= 0 ? "+" : "−"}${Math.abs(p95Diff)}%`;

    // Totals by HTTP code
    let total2xx = 0;
    let total4xx = 0;
    let total5xx = 0;
    let totalDbMs = 0;
    let totalDurationMs = 0;

    filteredTraces.forEach((t) => {
      const code = t.status || 200;
      if (code >= 500) total5xx++;
      else if (code >= 400) total4xx++;
      else total2xx++;

      const traceDbTime = (t.queries || []).reduce((sum, q) => sum + (q.duration || 0), 0);
      totalDbMs += traceDbTime;
      totalDurationMs += t.duration;
    });

    const avgDbMs = Math.round(totalDbMs / filteredTraces.length);
    const avgAppMs = Math.max(1, Math.round((totalDurationMs - totalDbMs) / filteredTraces.length));

    // Time-sliced buckets (12 slices)
    const times = filteredTraces
      .map((t) => new Date(t.createdAt).getTime())
      .filter(Number.isFinite);
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    const span = Math.max(60 * 1000, maxTime - minTime);
    const bucketCount = 12;

    const buckets = [];
    for (let i = 0; i < bucketCount; i++) {
      const bStart = minTime + (span * i) / bucketCount;
      const bEnd = minTime + (span * (i + 1)) / bucketCount;
      const inBucket = filteredTraces.filter((t) => {
        const tm = new Date(t.createdAt).getTime();
        return tm >= bStart && tm <= bEnd;
      });

      const labelDate = new Date(bStart);
      const timeLabel = labelDate.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });

      if (inBucket.length > 0) {
        const sorted = inBucket.map((t) => t.duration).sort((a, b) => a - b);
        const p50 = Math.round(sorted[Math.floor(sorted.length * 0.5)] || 0);
        const p95 = Math.round(sorted[Math.floor(sorted.length * 0.95)] || 0);
        const p99 = Math.round(sorted[Math.floor(sorted.length * 0.99)] || 0);

        let s2 = 0;
        let s4 = 0;
        let s5 = 0;
        let bDb = 0;
        let bTotal = 0;

        inBucket.forEach((t) => {
          const code = t.status || 200;
          if (code >= 500) s5++;
          else if (code >= 400) s4++;
          else s2++;
          const traceDb = (t.queries || []).reduce((sum, q) => sum + (q.duration || 0), 0);
          bDb += traceDb;
          bTotal += t.duration;
        });

        const bAvgDb = Math.round(bDb / inBucket.length);
        const bAvgApp = Math.max(1, Math.round((bTotal - bDb) / inBucket.length));

        buckets.push({
          time: timeLabel,
          p50,
          p95,
          p99,
          status2xx: s2,
          status4xx: s4,
          status5xx: s5,
          dbTime: bAvgDb,
          appTime: bAvgApp,
        });
      } else {
        buckets.push({
          time: timeLabel,
          p50: overallP50,
          p95: overallP95,
          p99: overallP99,
          status2xx: 0,
          status4xx: 0,
          status5xx: 0,
          dbTime: avgDbMs,
          appTime: avgAppMs,
        });
      }
    }

    return {
      series: buckets,
      overallP50,
      overallP95,
      overallP99,
      p50Change,
      p95Change,
      total2xx,
      total4xx,
      total5xx,
      avgDbMs,
      avgAppMs,
    };
  }, [filteredTraces]);

  return (
    <section className="panel-card latency-panel flex flex-col justify-between" aria-labelledby="latency-title">
      <div className="panel-heading flex-wrap gap-2">
        <div>
          <div className="section-kicker flex items-center gap-1.5">
            <span>OBSERVABILITY METRICS</span>
            <span className="inline-block size-1.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <div className="latency-title-row">
            <h2 id="latency-title" className="text-sm font-bold text-(--ot-text)">
              {activeMetric === "percentiles" && "Latency Percentiles (P50, P95, P99)"}
              {activeMetric === "status" && "Traffic & HTTP Status Codes (2xx, 4xx, 5xx)"}
              {activeMetric === "breakdown" && "App Processing vs Database Time"}
            </h2>
            <span className="panel-badge text-[10px]">GRAFANA GRADE</span>
          </div>
        </div>

        {/* Metric Selector Pills */}
        <div className="flex items-center gap-1 bg-(--ot-panel-raised) p-1 rounded-lg border border-(--ot-border)">
          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={() => setActiveMetric("percentiles")}
            className={`h-6 px-2 text-[11px] font-semibold transition-all cursor-pointer rounded-md ${
              activeMetric === "percentiles"
                ? "bg-emerald-600 text-white shadow-xs hover:bg-emerald-600"
                : "text-(--ot-muted) hover:text-(--ot-text)"
            }`}
          >
            <Clock className="h-3 w-3 mr-1" /> Percentiles
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={() => setActiveMetric("status")}
            className={`h-6 px-2 text-[11px] font-semibold transition-all cursor-pointer rounded-md ${
              activeMetric === "status"
                ? "bg-blue-600 text-white shadow-xs hover:bg-blue-600"
                : "text-(--ot-muted) hover:text-(--ot-text)"
            }`}
          >
            <BarChart3 className="h-3 w-3 mr-1" /> HTTP Status
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={() => setActiveMetric("breakdown")}
            className={`h-6 px-2 text-[11px] font-semibold transition-all cursor-pointer rounded-md ${
              activeMetric === "breakdown"
                ? "bg-purple-600 text-white shadow-xs hover:bg-purple-600"
                : "text-(--ot-muted) hover:text-(--ot-text)"
            }`}
          >
            <Layers className="h-3 w-3 mr-1" /> App vs DB
          </Button>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="chart-summary border-y border-(--ot-border) py-2 my-2">
        {activeMetric === "percentiles" && (
          <>
            <div>
              <span className="summary-number text-emerald-600 dark:text-emerald-400 font-mono">
                {overallP50}
                <span className="text-xs ml-0.5">ms</span>
              </span>
              <span className="summary-caption">
                P50 Median <b>{p50Change}</b>
              </span>
            </div>
            <div>
              <span className="summary-number text-amber-500 font-mono">
                {overallP95}
                <span className="text-xs ml-0.5">ms</span>
              </span>
              <span className="summary-caption">
                P95 Tail <b>{p95Change}</b>
              </span>
            </div>
            <div>
              <span className="summary-number text-rose-500 font-mono">
                {overallP99}
                <span className="text-xs ml-0.5">ms</span>
              </span>
              <span className="summary-caption">
                P99 Spike <small className="text-muted-foreground font-normal">(99% fast)</small>
              </span>
            </div>
          </>
        )}

        {activeMetric === "status" && (
          <>
            <div>
              <span className="summary-number text-emerald-600 dark:text-emerald-400 font-mono">
                {total2xx}
              </span>
              <span className="summary-caption">
                2xx OK <b className="text-emerald-600">Success</b>
              </span>
            </div>
            <div>
              <span className="summary-number text-amber-500 font-mono">
                {total4xx}
              </span>
              <span className="summary-caption">
                4xx Client <b className="text-amber-500">Warning</b>
              </span>
            </div>
            <div>
              <span className="summary-number text-rose-500 font-mono">
                {total5xx}
              </span>
              <span className="summary-caption">
                5xx Server <b className="text-rose-500">Error</b>
              </span>
            </div>
          </>
        )}

        {activeMetric === "breakdown" && (
          <>
            <div>
              <span className="summary-number text-cyan-500 font-mono">
                {avgDbMs}
                <span className="text-xs ml-0.5">ms</span>
              </span>
              <span className="summary-caption">
                Database (SQL) <small className="text-muted-foreground">avg / req</small>
              </span>
            </div>
            <div>
              <span className="summary-number text-purple-500 font-mono">
                {avgAppMs}
                <span className="text-xs ml-0.5">ms</span>
              </span>
              <span className="summary-caption">
                App Execution <small className="text-muted-foreground">avg / req</small>
              </span>
            </div>
            <div>
              <span className="summary-number text-emerald-500 font-mono">
                {avgDbMs + avgAppMs}
                <span className="text-xs ml-0.5">ms</span>
              </span>
              <span className="summary-caption">
                Total Latency <small className="text-muted-foreground">combined</small>
              </span>
            </div>
          </>
        )}

        <div className="chart-legend ml-auto flex items-center gap-3 text-xs">
          {activeMetric === "percentiles" && (
            <>
              <span className="flex items-center gap-1.5 text-[11px] text-(--ot-muted)">
                <span className="size-2 rounded-full bg-emerald-500" /> P50
              </span>
              <span className="flex items-center gap-1.5 text-[11px] text-(--ot-muted)">
                <span className="size-2 rounded-full bg-amber-500" /> P95
              </span>
              <span className="flex items-center gap-1.5 text-[11px] text-(--ot-muted)">
                <span className="size-2 rounded-full bg-rose-500" /> P99
              </span>
            </>
          )}
          {activeMetric === "status" && (
            <>
              <span className="flex items-center gap-1.5 text-[11px] text-(--ot-muted)">
                <span className="size-2 rounded-full bg-emerald-500" /> 2xx
              </span>
              <span className="flex items-center gap-1.5 text-[11px] text-(--ot-muted)">
                <span className="size-2 rounded-full bg-amber-500" /> 4xx
              </span>
              <span className="flex items-center gap-1.5 text-[11px] text-(--ot-muted)">
                <span className="size-2 rounded-full bg-rose-500" /> 5xx
              </span>
            </>
          )}
          {activeMetric === "breakdown" && (
            <>
              <span className="flex items-center gap-1.5 text-[11px] text-(--ot-muted)">
                <span className="size-2 rounded-full bg-cyan-500" /> DB (SQL)
              </span>
              <span className="flex items-center gap-1.5 text-[11px] text-(--ot-muted)">
                <span className="size-2 rounded-full bg-purple-500" /> App Logic
              </span>
            </>
          )}
        </div>
      </div>

      {/* Recharts + Shadcn Chart Container */}
      <div className="w-full h-[180px] pt-1">
        {activeMetric === "percentiles" && (
          <ChartContainer config={percentileConfig} className="h-full w-full aspect-auto">
            <AreaChart data={series} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="p50Grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="p95Grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
              <XAxis dataKey="time" tickLine={false} axisLine={false} tickMargin={6} fontSize={10} />
              <YAxis tickLine={false} axisLine={false} tickMargin={6} fontSize={10} unit="ms" />
              <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
              <Area
                type="monotone"
                dataKey="p99"
                stroke="#ef4444"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                fill="none"
              />
              <Area
                type="monotone"
                dataKey="p95"
                stroke="#f59e0b"
                strokeWidth={2}
                fill="url(#p95Grad)"
              />
              <Area
                type="monotone"
                dataKey="p50"
                stroke="#10b981"
                strokeWidth={2}
                fill="url(#p50Grad)"
              />
            </AreaChart>
          </ChartContainer>
        )}

        {activeMetric === "status" && (
          <ChartContainer config={statusConfig} className="h-full w-full aspect-auto">
            <BarChart data={series} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
              <XAxis dataKey="time" tickLine={false} axisLine={false} tickMargin={6} fontSize={10} />
              <YAxis tickLine={false} axisLine={false} tickMargin={6} fontSize={10} />
              <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
              <Bar dataKey="status2xx" stackId="status" fill="#10b981" radius={[0, 0, 0, 0]} />
              <Bar dataKey="status4xx" stackId="status" fill="#f59e0b" radius={[0, 0, 0, 0]} />
              <Bar dataKey="status5xx" stackId="status" fill="#ef4444" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ChartContainer>
        )}

        {activeMetric === "breakdown" && (
          <ChartContainer config={breakdownConfig} className="h-full w-full aspect-auto">
            <AreaChart data={series} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="dbGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id="appGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
              <XAxis dataKey="time" tickLine={false} axisLine={false} tickMargin={6} fontSize={10} />
              <YAxis tickLine={false} axisLine={false} tickMargin={6} fontSize={10} unit="ms" />
              <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
              <Area
                type="monotone"
                dataKey="appTime"
                stackId="time"
                stroke="#8b5cf6"
                strokeWidth={2}
                fill="url(#appGrad)"
              />
              <Area
                type="monotone"
                dataKey="dbTime"
                stackId="time"
                stroke="#06b6d4"
                strokeWidth={2}
                fill="url(#dbGrad)"
              />
            </AreaChart>
          </ChartContainer>
        )}
      </div>

      <div className="chart-footer flex items-center justify-between text-[11px] text-(--ot-muted) pt-2 border-t border-(--ot-border)">
        <span>Dữ liệu đo đạc trực tiếp từ telemetry pipeline · Tần số 3.5s SSE</span>
        <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
          Grafana APM Specifications <ArrowUpRight className="h-3 w-3" />
        </span>
      </div>
    </section>
  );
}
