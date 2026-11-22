"use client";

import * as React from "react";
import {
  ArrowDown,
  Globe,
  Server,
  Cpu,
  Database,
  Monitor,
  Zap,
  Activity,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

export function ArchitectureDiagram() {
  return (
    <div className="my-8 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-card p-4 sm:p-7 shadow-xs">
      <div className="flex flex-col items-center gap-4 text-center max-w-2xl mx-auto mb-6">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
          <Zap className="size-3.5" />
          End-to-End Non-Blocking Pipeline
        </span>
        <h3 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          SpurTrace Zero-Overhead Telemetry Lifecycle
        </h3>
        <p className="text-xs text-zinc-600 dark:text-zinc-400">
          Requests are measured with nanosecond precision without blocking the event loop or database queries.
        </p>
      </div>

      <div className="flex flex-col items-center gap-3">
        {/* Stage 1: Client Request */}
        <div className="w-full max-w-xl rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <Globe className="size-4" />
              </div>
              <div className="text-left">
                <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100">1. Client / Frontend Request</div>
                <div className="text-[11px] text-zinc-500 dark:text-zinc-400 font-mono">React, Vite, Vue, Mobile, or cURL</div>
              </div>
            </div>
            <span className="rounded bg-zinc-200 dark:bg-zinc-800 px-2 py-0.5 text-[10px] font-mono text-zinc-700 dark:text-zinc-300">
              HTTP GET / POST
            </span>
          </div>
        </div>

        {/* Down Arrow */}
        <div className="flex items-center justify-center text-emerald-500 py-1">
          <div className="flex items-center gap-1.5 rounded-full border border-zinc-200 dark:border-zinc-800 bg-background px-3 py-0.5 text-[10px] font-mono text-zinc-500">
            <ArrowDown className="size-3 text-emerald-500 animate-bounce" />
            <span>traceparent Context Header</span>
          </div>
        </div>

        {/* Stage 2: Backend Application Pipeline */}
        <div className="w-full max-w-xl rounded-xl border-2 border-emerald-500/30 bg-emerald-500/5 p-4.5 sm:p-5 relative">
          <div className="flex items-center justify-between border-b border-emerald-500/20 pb-3 mb-3">
            <div className="flex items-center gap-2.5">
              <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                <Server className="size-4" />
              </div>
              <div className="text-left">
                <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                  2. Backend Middleware Pipeline
                </div>
                <div className="text-[11px] text-zinc-600 dark:text-zinc-400">
                  Express · NestJS · Next.js · ASP.NET Core (.NET 6+)
                </div>
              </div>
            </div>
            <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
              &lt; 0.05ms Overhead
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs text-left">
            <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-background p-2.5 space-y-1">
              <div className="font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-cyan-500" />
                Context Binding
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-snug">
                AsyncLocalStorage / AsyncLocal&lt;T&gt; generates TraceID (UUIDv4) and start timestamp.
              </p>
            </div>

            <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-background p-2.5 space-y-1">
              <div className="font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-emerald-500" />
                SQL & Spans
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-snug">
                Query sanitization, fingerprinting, and automatic N+1 loop detection.
              </p>
            </div>

            <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-background p-2.5 space-y-1">
              <div className="font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-amber-500" />
                Tail Sampling
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-snug">
                100% of errors &amp; slow requests kept; adaptive sampling on healthy 200 OKs.
              </p>
            </div>
          </div>
        </div>

        {/* Down Arrow */}
        <div className="flex items-center justify-center text-emerald-500 py-1">
          <div className="flex items-center gap-1.5 rounded-full border border-zinc-200 dark:border-zinc-800 bg-background px-3 py-0.5 text-[10px] font-mono text-zinc-500">
            <ArrowDown className="size-3 text-emerald-500" />
            <span>Enqueue to RAM Buffer (Non-blocking)</span>
          </div>
        </div>

        {/* Stage 3: Async Batch Worker */}
        <div className="w-full max-w-xl rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex size-8 items-center justify-center rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                <Cpu className="size-4" />
              </div>
              <div className="text-left">
                <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100">3. Background Worker Thread</div>
                <div className="text-[11px] text-zinc-500 dark:text-zinc-400 font-mono">Worker Pool · 1,500ms flush or 500 records</div>
              </div>
            </div>
            <span className="rounded bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20 px-2 py-0.5 text-[10px] font-mono font-bold">
              Memory &lt; 15MB
            </span>
          </div>
        </div>

        {/* Down Arrow */}
        <div className="flex items-center justify-center text-emerald-500 py-1">
          <div className="flex items-center gap-1.5 rounded-full border border-zinc-200 dark:border-zinc-800 bg-background px-3 py-0.5 text-[10px] font-mono text-zinc-500">
            <ArrowDown className="size-3 text-emerald-500" />
            <span>Batch Transaction (Disk Write)</span>
          </div>
        </div>

        {/* Stage 4: Storage Engine & UI */}
        <div className="w-full max-w-xl grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 p-3.5 text-left">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="flex size-7 items-center justify-center rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                <Database className="size-3.5" />
              </div>
              <div>
                <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100">4. Storage Engine</div>
                <div className="text-[10px] font-mono text-zinc-500">SQLite WAL / MSSQL</div>
              </div>
            </div>
            <p className="text-[11px] text-zinc-600 dark:text-zinc-400">
              Lock-free concurrent reads, automatic 7-day partition pruning.
            </p>
          </div>

          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 p-3.5 text-left">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="flex size-7 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <Monitor className="size-3.5" />
              </div>
              <div>
                <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100">5. Embedded APM UI</div>
                <div className="text-[10px] font-mono text-zinc-500">Mounted at /_telemetry</div>
              </div>
            </div>
            <p className="text-[11px] text-zinc-600 dark:text-zinc-400">
              Native Next.js dashboard, latency charts, SQL studio, error drill-down.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
