"use client";

import { useMemo } from "react";
import { ArrowUpRight, CircleHelp } from "lucide-react";
import { useTelemetry } from "@/lib/spurtrace/telemetry-context";

const width = 740;
const height = 190;
const plot = { left: 42, top: 14, right: 14, bottom: 30 };
const chartHeight = height - plot.top - plot.bottom;
const chartWidth = width - plot.left - plot.right;

export function LatencyChart() {
  const { filteredTraces } = useTelemetry();

  const { series, maxValue, overallP50, overallP95, p50Change, p95Change, yTicks } =
    useMemo(() => {
      if (filteredTraces.length === 0) {
        const emptySeries = Array.from({ length: 7 }, (_, i) => ({
          time: `${i * 10}m`,
          p50: 0,
          p95: 0,
          label: `${i * 10}m`,
        }));
        return {
          series: emptySeries,
          maxValue: 100,
          overallP50: 0,
          overallP95: 0,
          p50Change: "0%",
          p95Change: "0%",
          yTicks: [0, 50, 100],
        };
      }

      // Compute overall percentiles
      const allSorted = [...filteredTraces].map((t) => t.duration).sort((a, b) => a - b);
      const overallP50 = allSorted[Math.floor(allSorted.length * 0.5)] || 0;
      const overallP95 = allSorted[Math.floor(allSorted.length * 0.95)] || 0;

      // Split into halves for trends
      const half = Math.floor(filteredTraces.length / 2);
      const recent = filteredTraces.slice(0, half).map((t) => t.duration).sort((a, b) => a - b);
      const older = filteredTraces.slice(half).map((t) => t.duration).sort((a, b) => a - b);

      const recentP50 = recent[Math.floor(recent.length * 0.5)] || overallP50;
      const olderP50 = older[Math.floor(older.length * 0.5)] || overallP50;
      const p50Diff =
        olderP50 > 0 ? Number((((recentP50 - olderP50) / olderP50) * 100).toFixed(1)) : 0;
      const p50Change = `${p50Diff >= 0 ? "+" : "−"}${Math.abs(p50Diff)}%`;

      const recentP95 = recent[Math.floor(recent.length * 0.95)] || overallP95;
      const olderP95 = older[Math.floor(older.length * 0.95)] || overallP95;
      const p95Diff =
        olderP95 > 0 ? Number((((recentP95 - olderP95) / olderP95) * 100).toFixed(1)) : 0;
      const p95Change = `${p95Diff >= 0 ? "+" : "−"}${Math.abs(p95Diff)}%`;

      // Build time buckets (12 buckets)
      const times = filteredTraces
        .map((t) => new Date(t.createdAt).getTime())
        .filter(Number.isFinite);
      const minTime = Math.min(...times);
      const maxTime = Math.max(...times);
      const span = Math.max(60 * 1000, maxTime - minTime);
      const bucketCount = 12;

      const buckets: Array<{ time: string; p50: number; p95: number; label: string }> = [];
      let maxValFound = 0;

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
          const p50 = sorted[Math.floor(sorted.length * 0.5)] || 0;
          const p95 = sorted[Math.floor(sorted.length * 0.95)] || 0;
          if (p95 > maxValFound) maxValFound = p95;
          buckets.push({ time: timeLabel, p50, p95, label: timeLabel });
        } else {
          // fallback to running overall
          buckets.push({ time: timeLabel, p50: overallP50, p95: overallP95, label: timeLabel });
          if (overallP95 > maxValFound) maxValFound = overallP95;
        }
      }

      const maxValue = Math.max(100, Math.ceil((maxValFound * 1.25) / 50) * 50);
      const step = maxValue / 3;
      const yTicks = [0, Math.round(step), Math.round(step * 2), Math.round(maxValue)];

      return {
        series: buckets,
        maxValue,
        overallP50: Math.round(overallP50),
        overallP95: Math.round(overallP95),
        p50Change,
        p95Change,
        yTicks,
      };
    }, [filteredTraces]);

  function linePath(key: "p50" | "p95") {
    if (series.length < 2) return "";
    return series
      .map((point, index) => {
        const x = plot.left + (index / (series.length - 1)) * chartWidth;
        const val = point[key];
        const y = plot.top + chartHeight - (val / maxValue) * chartHeight;
        return `${index === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");
  }

  function areaPath() {
    if (series.length < 2) return "";
    return `${linePath("p95")} L${plot.left + chartWidth},${plot.top + chartHeight} L${plot.left},${plot.top + chartHeight} Z`;
  }

  return (
    <section className="panel-card latency-panel" aria-labelledby="latency-title">
      <div className="panel-heading">
        <div>
          <div className="section-kicker">
            REQUEST PERFORMANCE <CircleHelp aria-label="Latency percentile chart" />
          </div>
          <div className="latency-title-row">
            <h2 id="latency-title">Latency over time</h2>
            <span className="panel-badge">LIVE METRICS</span>
          </div>
        </div>
        <span className="select-button chart-selector">P50 / P95</span>
      </div>
      <div className="chart-summary">
        <div>
          <span className="summary-number">
            {overallP50}
            <span>ms</span>
          </span>
          <span className="summary-caption">
            P50 <b>{p50Change}</b>
          </span>
        </div>
        <div>
          <span className="summary-number">
            {overallP95}
            <span>ms</span>
          </span>
          <span className="summary-caption">
            P95 <b>{p95Change}</b>
          </span>
        </div>
        <div className="chart-legend">
          <span>
            <i className="legend-p50" />
            P50
          </span>
          <span>
            <i className="legend-p95" />
            P95
          </span>
        </div>
      </div>
      <div className="chart-wrap">
        <svg
          className="latency-chart"
          viewBox={`0 0 ${width} ${height}`}
          role="img"
          aria-label="P50 and P95 request latency trends over the recorded traces"
        >
          {yTicks.map((value) => {
            const y = plot.top + chartHeight - (value / maxValue) * chartHeight;
            return (
              <g key={value}>
                <line
                  x1={plot.left}
                  x2={plot.left + chartWidth}
                  y1={y}
                  y2={y}
                  className="chart-grid"
                />
                <text x={plot.left - 9} y={y + 3} className="axis-label" textAnchor="end">
                  {value}
                </text>
              </g>
            );
          })}
          {series.length >= 2 && <path d={areaPath()} className="chart-area" />}
          {series.length >= 2 && <path d={linePath("p95")} className="chart-line-p95" />}
          {series.length >= 2 && <path d={linePath("p50")} className="chart-line-p50" />}
          {series.map((point, index) => {
            if (index % 3 !== 0 && index !== series.length - 1) return null;
            const x = plot.left + (index / (series.length - 1)) * chartWidth;
            return (
              <text
                key={`${point.label}_${index}`}
                x={x}
                y={height - 8}
                className="axis-label"
                textAnchor="middle"
              >
                {point.label}
              </text>
            );
          })}
        </svg>
      </div>
      <div className="chart-footer">
        <span>Computed from live telemetry traces</span>
        <span className="chart-link">
          Real latency distribution <ArrowUpRight aria-hidden="true" />
        </span>
      </div>
    </section>
  );
}
