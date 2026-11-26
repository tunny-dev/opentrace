"use client";

import { useMemo } from "react";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Clock3,
  Database,
  Gauge,
  TriangleAlert,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/i18n-context";
import { useTelemetry } from "@/lib/spurtrace/telemetry-context";
import { formatDuration } from "@/lib/spurtrace/format-duration";

export function DashboardMetrics() {
  const { isVietnamese } = useI18n();
  const { filteredTraces } = useTelemetry();

  const metrics = useMemo(() => {
    const totalRequests = filteredTraces.length;
    let formattedRequests = `${totalRequests}`;
    if (totalRequests >= 1000) {
      formattedRequests = `${(totalRequests / 1000).toFixed(1)}k`;
    }

    const half = Math.floor(filteredTraces.length / 2);
    const recentTraces = filteredTraces.slice(0, half);
    const olderTraces = filteredTraces.slice(half);

    // 1. Requests trend
    const reqDiff =
      olderTraces.length > 0
        ? Math.round(((recentTraces.length - olderTraces.length) / olderTraces.length) * 100)
        : 0;
    const reqChange = `${reqDiff >= 0 ? "+" : "−"}${Math.abs(reqDiff)}%`;

    // 2. Error rate
    const errorCount = filteredTraces.filter(
      (t) => t.status >= 400 || t.state === "error" || t.exception
    ).length;
    const errorRateVal = totalRequests > 0 ? (errorCount / totalRequests) * 100 : 0;
    const formattedErrorRate = `${errorRateVal.toFixed(2)}%`;

    const recentErrors = recentTraces.filter(
      (t) => t.status >= 400 || t.state === "error" || t.exception
    ).length;
    const olderErrors = olderTraces.filter(
      (t) => t.status >= 400 || t.state === "error" || t.exception
    ).length;
    const recentErrRate = recentTraces.length > 0 ? (recentErrors / recentTraces.length) * 100 : 0;
    const olderErrRate = olderTraces.length > 0 ? (olderErrors / olderTraces.length) * 100 : 0;
    const errDiff = Number((recentErrRate - olderErrRate).toFixed(2));
    const errChange = `${errDiff >= 0 ? "+" : "−"}${Math.abs(errDiff)}%`;

    // 3 & 4. P95 & P99 Latency
    const sorted = [...filteredTraces].map((t) => t.duration).sort((a, b) => a - b);
    const p95Val = sorted.length > 0 ? sorted[Math.floor(sorted.length * 0.95)] : 0;
    const formattedP95 = formatDuration(p95Val);

    const recentSorted = [...recentTraces].map((t) => t.duration).sort((a, b) => a - b);
    const olderSorted = [...olderTraces].map((t) => t.duration).sort((a, b) => a - b);
    const recentP95 =
      recentSorted.length > 0 ? recentSorted[Math.floor(recentSorted.length * 0.95)] : 0;
    const olderP95 =
      olderSorted.length > 0 ? olderSorted[Math.floor(olderSorted.length * 0.95)] : 0;
    const p95Diff =
      olderP95 > 0 ? Number((((recentP95 - olderP95) / olderP95) * 100).toFixed(1)) : 0;
    const p95Change = `${p95Diff >= 0 ? "+" : "−"}${Math.abs(p95Diff)}%`;

    const p99Val = sorted.length > 0 ? sorted[Math.floor(sorted.length * 0.99)] : 0;
    const formattedP99 = formatDuration(p99Val);
    const recentP99 =
      recentSorted.length > 0 ? recentSorted[Math.floor(recentSorted.length * 0.99)] : 0;
    const olderP99 =
      olderSorted.length > 0 ? olderSorted[Math.floor(olderSorted.length * 0.99)] : 0;
    const p99Diff =
      olderP99 > 0 ? Number((((recentP99 - olderP99) / olderP99) * 100).toFixed(1)) : 0;
    const p99Change = `${p99Diff >= 0 ? "+" : "−"}${Math.abs(p99Diff)}%`;

    // 5. DB Time
    let totalDurationSum = 0;
    let totalDbSum = 0;
    for (const trace of filteredTraces) {
      totalDurationSum += trace.duration;
      const dbSpans = (trace.spans || []).filter((s) => s.kind === "db");
      const dbSpanTime = dbSpans.reduce((s, span) => s + span.duration, 0);
      const queryTime = (trace.queries || []).reduce((s, q) => s + q.duration, 0);
      totalDbSum += Math.max(dbSpanTime, queryTime);
    }
    const dbTimePct =
      totalDurationSum > 0 ? Number(((totalDbSum / totalDurationSum) * 100).toFixed(1)) : 0;
    const formattedDbTime = `${dbTimePct}%`;

    let recentDur = 0,
      recentDb = 0;
    for (const trace of recentTraces) {
      recentDur += trace.duration;
      const dbSpans = (trace.spans || []).filter((s) => s.kind === "db");
      recentDb += Math.max(
        dbSpans.reduce((s, span) => s + span.duration, 0),
        (trace.queries || []).reduce((s, q) => s + q.duration, 0)
      );
    }
    let olderDur = 0,
      olderDb = 0;
    for (const trace of olderTraces) {
      olderDur += trace.duration;
      const dbSpans = (trace.spans || []).filter((s) => s.kind === "db");
      olderDb += Math.max(
        dbSpans.reduce((s, span) => s + span.duration, 0),
        (trace.queries || []).reduce((s, q) => s + q.duration, 0)
      );
    }
    const recentDbPct = recentDur > 0 ? (recentDb / recentDur) * 100 : 0;
    const olderDbPct = olderDur > 0 ? (olderDb / olderDur) * 100 : 0;
    const dbDiff = Number((recentDbPct - olderDbPct).toFixed(1));
    const dbChange = `${dbDiff >= 0 ? "+" : "−"}${Math.abs(dbDiff)}%`;

    return [
      {
        label: isVietnamese ? "LƯU LƯỢNG YÊU CẦU" : "REQUESTS",
        value: formattedRequests,
        change: reqChange,
        direction: reqDiff >= 0 ? "up" : "down",
        icon: Gauge,
        description: isVietnamese ? "khoảng thời gian hiện tại" : "in current window",
        good: reqDiff >= 0,
      },
      {
        label: isVietnamese ? "TỶ LỆ LỖI" : "ERROR RATE",
        value: formattedErrorRate,
        change: errChange,
        direction: errDiff >= 0 ? "up" : "down",
        icon: TriangleAlert,
        description: isVietnamese ? "trên tổng số trace" : "of recorded traces",
        good: errDiff <= 0,
      },
      {
        label: isVietnamese ? "ĐỘ TRỄ P95" : "P95 LATENCY",
        value: formattedP95,
        change: p95Change,
        direction: p95Diff >= 0 ? "up" : "down",
        icon: Clock3,
        description: isVietnamese ? "phân vị 95th" : "95th percentile",
        good: p95Diff <= 0,
      },
      {
        label: isVietnamese ? "ĐỘ TRỄ P99" : "P99 LATENCY",
        value: formattedP99,
        change: p99Change,
        direction: p99Diff >= 0 ? "up" : "down",
        icon: Activity,
        description: isVietnamese ? "phân vị 99th" : "99th percentile",
        good: p99Diff <= 0,
      },
      {
        label: isVietnamese ? "THỜI GIAN CSDL" : "DB TIME",
        value: formattedDbTime,
        change: dbChange,
        direction: dbDiff >= 0 ? "up" : "down",
        icon: Database,
        description: isVietnamese ? "trên tổng thời gian" : "of total request time",
        good: dbDiff <= 0,
      },
    ];
  }, [filteredTraces, isVietnamese]);

  return (
    <section className="metrics-grid" aria-label="Service performance summary">
      {metrics.map(({ label, value, change, direction, icon: Icon, description, good }) => {
        const positive = (direction === "down" && good) || (direction === "up" && good);
        return (
          <article className="metric-card" key={label}>
            <div className="metric-top">
              <span>{label}</span>
              <Icon aria-hidden="true" />
            </div>
            <div className="metric-value">{value}</div>
            <div className="metric-bottom">
              <span className={`metric-change${positive ? " change-good" : ""}`}>
                {direction === "up" ? (
                  <ArrowUpRight aria-hidden="true" />
                ) : (
                  <ArrowDownRight aria-hidden="true" />
                )}
                {change}
              </span>
              <span className="metric-description">{description}</span>
            </div>
          </article>
        );
      })}
    </section>
  );
}
