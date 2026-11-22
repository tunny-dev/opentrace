"use client";

import * as React from "react";
import { useEffect, useRef, useId } from "react";
import { CheckCircle2, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { ApmWaterfallCanvas } from "./apm-waterfall-canvas";

const SERVICES = ["EDGE", "MES-API", "ORDER", "INVENTORY", "DB"] as const;

type Metric = {
  label: string;
  value: string;
  unit?: string;
  delta: string;
  hint: string;
  color: string;
  series: number[];
};

const METRICS: Metric[] = [
  {
    label: "Trace Throughput",
    value: "1,284",
    unit: "/ min",
    delta: "↑ 8.2%",
    hint: "312 spans/s sampled",
    color: "#10b981",
    series: [18, 22, 20, 26, 24, 30, 28, 34, 32, 38, 36, 42],
  },
  {
    label: "p95 Latency",
    value: "186",
    unit: "ms",
    delta: "↓ 9.4%",
    hint: "SLO < 250 ms",
    color: "#0ea5e9",
    series: [242, 234, 238, 226, 230, 218, 214, 220, 204, 198, 192, 186],
  },
  {
    label: "Error Rate",
    value: "0.42",
    unit: "%",
    delta: "↓ 0.08 pp",
    hint: "SLO < 0.50%",
    color: "#8b5cf6",
    series: [0.64, 0.6, 0.62, 0.57, 0.55, 0.58, 0.52, 0.53, 0.48, 0.46, 0.44, 0.42],
  },
];

function Sparkline({ data, color }: { data: number[]; color: string }) {
  const gradientId = `spark-${useId().replace(/:/g, "")}`;
  const width = 100;
  const height = 24;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * width;
    const y = height - 2 - ((value - min) / range) * (height - 4);
    return [x, y] as const;
  });

  const line = points
    .map(([x, y], index) => `${index === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`)
    .join(" ");
  const area = `${line} L${width},${height} L0,${height} Z`;
  const [lastX, lastY] = points[points.length - 1];

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className="mt-1.5 h-6 w-full overflow-visible"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.32" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gradientId})`} />
      <path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      <circle cx={lastX} cy={lastY} r="1.6" fill={color} />
    </svg>
  );
}

function MetricTile({ metric }: { metric: Metric }) {
  return (
    <div className="relative overflow-hidden rounded-md border border-slate-200/70 bg-slate-50/70 p-2.5 text-left backdrop-blur-sm transition-colors duration-200 hover:border-emerald-500/35 hover:bg-white/80 dark:border-white/[0.07] dark:bg-white/[0.03] dark:hover:bg-white/[0.06] lg:p-3">
      <div className="flex items-center justify-between gap-1.5">
        <span className="truncate text-[10px] font-medium text-slate-500 dark:text-slate-400 lg:text-[11px]">
          {metric.label}
        </span>
        <span className="shrink-0 text-[10px] font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
          {metric.delta}
        </span>
      </div>

      <div className="mt-1 flex items-baseline gap-1">
        <span className="text-base font-bold tracking-tight tabular-nums text-slate-900 dark:text-white lg:text-lg">
          {metric.value}
        </span>
        {metric.unit ? (
          <span className="text-[10px] font-normal tabular-nums text-slate-400 dark:text-slate-500">
            {metric.unit}
          </span>
        ) : null}
      </div>

      <Sparkline data={metric.series} color={metric.color} />

      <span className="block truncate text-[10px] tabular-nums text-slate-500 dark:text-slate-400">
        {metric.hint}
      </span>
    </div>
  );
}

export function ApmTelemetryCard({ className }: { className?: string }) {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const reduceMotion = useRef(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    reduceMotion.current = query.matches;
    const onChange = () => {
      reduceMotion.current = query.matches;
    };
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const el = cardRef.current;
    if (!el || event.pointerType === "touch" || reduceMotion.current) return;
    const rect = el.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    el.style.setProperty("--spot-x", `${(x * 100).toFixed(2)}%`);
    el.style.setProperty("--spot-y", `${(y * 100).toFixed(2)}%`);
    el.style.setProperty("--tilt-x", `${((0.5 - y) * 4).toFixed(2)}deg`);
    el.style.setProperty("--tilt-y", `${((x - 0.5) * 5).toFixed(2)}deg`);
    el.style.setProperty("--card-lift", "-2px");
  };

  const handlePointerLeave = () => {
    const el = cardRef.current;
    if (!el) return;
    el.style.setProperty("--tilt-x", "0deg");
    el.style.setProperty("--tilt-y", "0deg");
    el.style.setProperty("--card-lift", "0px");
    el.style.setProperty("--spot-x", "50%");
    el.style.setProperty("--spot-y", "50%");
  };

  return (
    <div
      ref={cardRef}
      data-slot="apm-telemetry-card"
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className={cn(
        "group relative overflow-hidden rounded-lg border border-slate-200/90 bg-white/90 shadow-xl shadow-slate-900/5 backdrop-blur-md transition-[transform,border-color,box-shadow] duration-200 ease-out will-change-transform hover:border-emerald-500/40 hover:shadow-2xl hover:shadow-emerald-500/10 dark:border-white/10 dark:bg-white/[0.04] dark:shadow-2xl",
        className
      )}
      style={{
        transform:
          "translateY(var(--card-lift, 0px)) perspective(1100px) rotateX(var(--tilt-x, 0deg)) rotateY(var(--tilt-y, 0deg))",
      }}
    >
      {/* Ambient wash + live three.js trace waterfall */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-linear-to-br from-emerald-500/[0.06] via-transparent to-sky-500/[0.05]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden [mask-image:radial-gradient(140%_120%_at_50%_118%,black_32%,transparent_78%)]"
      >
        <ApmWaterfallCanvas className="absolute inset-0 opacity-60 transition-[transform,opacity] duration-500 ease-out group-hover:scale-[1.04] group-hover:opacity-90 dark:opacity-90 dark:mix-blend-screen" />
      </div>
      {/* Cursor spotlight */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background:
            "radial-gradient(320px circle at var(--spot-x, 50%) var(--spot-y, 50%), rgba(16, 185, 129, 0.16), transparent 64%)",
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-linear-to-r from-transparent via-emerald-500/70 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"
      />

      <div className="relative z-10 p-4 lg:p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-200/80 pb-3 dark:border-white/10">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="relative flex size-2 shrink-0">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-500/70 dark:bg-emerald-400/70" />
                <span className="relative inline-flex size-2 rounded-full bg-emerald-500 dark:bg-emerald-400" />
              </span>
              <span className="truncate text-xs font-semibold tracking-wide text-slate-800 dark:text-white">
                Production Trace Stream
              </span>
              <span className="hidden shrink-0 text-[10px] font-medium uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500 sm:inline">
                OpenTrace APM
              </span>
            </div>
            <p className="mt-1 truncate pl-4 text-[10px] text-slate-500 dark:text-slate-400">
              us-east-1 · Production · 6 services · live ingest
            </p>
          </div>

          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-medium text-emerald-600 backdrop-blur-xs dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-400">
            <span className="size-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400" />
            All Systems Normal
          </span>
        </div>

        {/* KPIs */}
        <div className="mt-3.5 grid grid-cols-3 gap-2.5 lg:gap-3">
          {METRICS.map((metric) => (
            <MetricTile key={metric.label} metric={metric} />
          ))}
        </div>

        {/* Request path */}
        <div className="mt-3.5 flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-t border-slate-200/80 pt-3 dark:border-white/10">
          <div className="flex flex-wrap items-center gap-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
            {SERVICES.map((service, index) => (
              <React.Fragment key={service}>
                {index > 0 ? (
                  <ChevronRight
                    className="size-3 text-slate-400/80 dark:text-slate-500"
                    aria-hidden="true"
                  />
                ) : null}
                <span
                  className={cn(
                    "rounded px-2 py-0.5 font-semibold transition-colors",
                    service === "EDGE" &&
                      "bg-emerald-500/15 text-emerald-700 dark:bg-emerald-500/25 dark:text-emerald-300",
                    service === "DB" &&
                      "bg-teal-500/15 text-teal-700 dark:bg-teal-500/20 dark:text-teal-300",
                    service !== "EDGE" &&
                      service !== "DB" &&
                      "bg-slate-200/80 text-slate-700 dark:bg-white/10 dark:text-white"
                  )}
                >
                  {service}
                </span>
              </React.Fragment>
            ))}
          </div>

          <span className="inline-flex shrink-0 items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="size-3.5" aria-hidden="true" />
            p95 within SLO
          </span>
        </div>
      </div>
    </div>
  );
}
