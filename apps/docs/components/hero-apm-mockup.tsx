"use client";

import * as React from "react";
import { useState } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Database,
  Flame,
  Layers,
  Search,
  ExternalLink,
  Clock,
  Filter,
} from "lucide-react";

interface MockTrace {
  id: string;
  method: "GET" | "POST" | "PUT";
  path: string;
  status: number;
  duration: string;
  service: string;
  dbQueries: number;
  hasNPlusOne?: boolean;
  hasError?: boolean;
  spans: { name: string; time: string; pct: number; color: string; detail?: string }[];
}

const mockTraces: MockTrace[] = [
  {
    id: "tr_4f81",
    method: "GET",
    path: "/api/orders/42",
    status: 200,
    duration: "14.8 ms",
    service: "OrderService",
    dbQueries: 2,
    spans: [
      { name: "middleware", time: "1.8 ms", pct: 15, color: "bg-cyan-500", detail: "auth & rate-limit" },
      { name: "sql (dapper)", time: "8.9 ms", pct: 60, color: "bg-emerald-500", detail: "SELECT * FROM orders WHERE id = ?" },
      { name: "app-logic", time: "4.1 ms", pct: 25, color: "bg-purple-500", detail: "dto mapping & json serialize" },
    ],
  },
  {
    id: "tr_9e2b",
    method: "GET",
    path: "/api/mes/production-line/report",
    status: 200,
    duration: "284 ms",
    service: "MESProductionAPI",
    dbQueries: 16,
    hasNPlusOne: true,
    spans: [
      { name: "middleware", time: "2.1 ms", pct: 5, color: "bg-cyan-500" },
      { name: "sql (dapper)", time: "260 ms", pct: 85, color: "bg-amber-500", detail: "N+1 LOOP: 16x queries in foreach loop" },
      { name: "render", time: "21.9 ms", pct: 10, color: "bg-purple-500" },
    ],
  },
  {
    id: "tr_11ca",
    method: "POST",
    path: "/api/inventory/reserve",
    status: 500,
    duration: "6.4 ms",
    service: "InventoryService",
    dbQueries: 1,
    hasError: true,
    spans: [
      { name: "middleware", time: "1.1 ms", pct: 20, color: "bg-cyan-500" },
      { name: "sql (prisma)", time: "3.2 ms", pct: 50, color: "bg-emerald-500", detail: "BEGIN TRANSACTION" },
      { name: "exception", time: "2.1 ms", pct: 30, color: "bg-red-500", detail: "InsufficientStockException: SKU-901" },
    ],
  },
];

export function HeroApmMockup() {
  const [activeTab, setActiveTab] = useState<"traces" | "waterfall" | "sql">("traces");
  const [selectedTraceId, setSelectedTraceId] = useState<string>("tr_4f81");

  const selectedTrace = mockTraces.find((t) => t.id === selectedTraceId) || mockTraces[0];

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-950 text-zinc-100 shadow-2xl transition-all">
      {/* Window Title Bar */}
      <div className="flex h-11 items-center justify-between border-b border-zinc-800/80 bg-zinc-900/90 px-4">
        <div className="flex items-center gap-2">
          <span className="size-3 rounded-full bg-red-500/80" />
          <span className="size-3 rounded-full bg-amber-500/80" />
          <span className="size-3 rounded-full bg-emerald-500/80" />
          <div className="ml-3 hidden sm:flex items-center gap-2 rounded-md bg-zinc-950/60 px-2.5 py-1 text-xs font-mono text-zinc-400 border border-zinc-800">
            <span className="text-zinc-600">URL:</span>
            <span className="text-emerald-400 font-medium">http://localhost:4175/_telemetry</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
            <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-semibold">STORAGE CONNECTED (WAL)</span>
          </div>
        </div>
      </div>

      {/* APM Sub-Navigation Header */}
      <div className="flex flex-wrap items-center justify-between border-b border-zinc-800 bg-zinc-950/90 px-4 py-2 gap-2">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab("traces")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition cursor-pointer ${
              activeTab === "traces"
                ? "bg-zinc-800 text-zinc-100 shadow-xs"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
            }`}
          >
            <Activity className="size-3.5 text-emerald-400" />
            <span>Live Traces</span>
            <span className="rounded bg-zinc-700/60 px-1.5 py-0.2 text-[10px] text-zinc-300 font-mono">3</span>
          </button>

          <button
            onClick={() => setActiveTab("waterfall")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition cursor-pointer ${
              activeTab === "waterfall"
                ? "bg-zinc-800 text-zinc-100 shadow-xs"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
            }`}
          >
            <Layers className="size-3.5 text-cyan-400" />
            <span>Waterfall Spans</span>
          </button>

          <button
            onClick={() => setActiveTab("sql")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition cursor-pointer ${
              activeTab === "sql"
                ? "bg-zinc-800 text-zinc-100 shadow-xs"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
            }`}
          >
            <Database className="size-3.5 text-amber-400" />
            <span>SQL Studio</span>
            <span className="rounded bg-amber-500/20 px-1.5 py-0.2 text-[10px] text-amber-300 font-mono font-bold">
              N+1 Alert
            </span>
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
          <span className="text-[11px] text-zinc-500">Service:</span>
          <span className="rounded bg-zinc-900 border border-zinc-800 px-2 py-0.5 text-zinc-300 text-[11px]">
            MESProductionAPI
          </span>
        </div>
      </div>

      {/* Metric Cards Banner */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3 p-4 border-b border-zinc-800/80 bg-zinc-900/30 sm:grid-cols-4">
        <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-2.5 sm:p-3 text-left">
          <div className="text-[10px] sm:text-[11px] font-mono text-zinc-400 flex items-center justify-between">
            <span>P50 LATENCY</span>
            <span className="text-emerald-400">⚡ Fast</span>
          </div>
          <div className="mt-1 text-base sm:text-xl font-bold font-mono text-zinc-100">12.4 ms</div>
        </div>

        <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-2.5 sm:p-3 text-left">
          <div className="text-[10px] sm:text-[11px] font-mono text-zinc-400 flex items-center justify-between">
            <span>P95 LATENCY</span>
            <span className="text-emerald-400">99.8% OK</span>
          </div>
          <div className="mt-1 text-base sm:text-xl font-bold font-mono text-emerald-400">24.8 ms</div>
        </div>

        <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-2.5 sm:p-3 text-left">
          <div className="text-[10px] sm:text-[11px] font-mono text-zinc-400 flex items-center justify-between">
            <span>ERROR RATE</span>
            <span className="text-amber-400">1.8%</span>
          </div>
          <div className="mt-1 text-base sm:text-xl font-bold font-mono text-amber-400">1.8%</div>
        </div>

        <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-2.5 sm:p-3 text-left">
          <div className="text-[10px] sm:text-[11px] font-mono text-zinc-400 flex items-center justify-between">
            <span>RETENTION</span>
            <span className="text-cyan-400">WAL</span>
          </div>
          <div className="mt-1 text-base sm:text-xl font-bold font-mono text-cyan-400">7 Days</div>
        </div>
      </div>

      {/* Dynamic Content Views */}
      <div className="p-4 sm:p-5 text-left">
        {activeTab === "traces" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span className="font-mono text-[11px] uppercase tracking-wider text-zinc-500 font-semibold">
                Recent Requests (Click to inspect waterfall)
              </span>
              <span className="text-[11px] font-mono text-zinc-500">Live polling: 3s</span>
            </div>

            <div className="space-y-2">
              {mockTraces.map((trace) => {
                const isSelected = trace.id === selectedTraceId;
                return (
                  <div
                    key={trace.id}
                    onClick={() => setSelectedTraceId(trace.id)}
                    className={`group flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl border p-3 font-mono text-xs transition cursor-pointer ${
                      isSelected
                        ? "border-emerald-500/50 bg-emerald-500/5 shadow-xs"
                        : "border-zinc-800/80 bg-zinc-900/40 hover:border-zinc-700 hover:bg-zinc-900/80"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                          trace.method === "GET"
                            ? "bg-cyan-500/20 text-cyan-400"
                            : "bg-purple-500/20 text-purple-400"
                        }`}
                      >
                        {trace.method}
                      </span>
                      <span className="font-semibold text-zinc-100 group-hover:text-emerald-400 transition">
                        {trace.path}
                      </span>
                      {trace.hasNPlusOne && (
                        <span className="inline-flex items-center gap-1 rounded bg-amber-500/20 px-1.5 py-0.5 text-[9px] font-bold text-amber-300">
                          <AlertTriangle className="size-2.5" />
                          N+1 ALERT
                        </span>
                      )}
                      {trace.hasError && (
                        <span className="inline-flex items-center gap-1 rounded bg-red-500/20 px-1.5 py-0.5 text-[9px] font-bold text-red-300">
                          ERR
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-[11px]">
                      <span className="text-zinc-500">{trace.dbQueries} queries</span>
                      <span
                        className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                          trace.status === 200
                            ? "bg-emerald-500/20 text-emerald-400"
                            : trace.status === 500
                            ? "bg-red-500/20 text-red-400"
                            : "bg-zinc-800 text-zinc-300"
                        }`}
                      >
                        {trace.status}
                      </span>
                      <span className="font-bold text-zinc-200">{trace.duration}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick selected trace preview bar */}
            <div className="mt-3 rounded-xl border border-zinc-800/90 bg-zinc-900/80 p-3.5 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-zinc-400">
                  Execution Spans for <strong className="text-emerald-400">{selectedTrace.path}</strong>
                </span>
                <span className="text-zinc-500 text-[10px]">{selectedTrace.id}</span>
              </div>
              <div className="space-y-1.5 font-mono text-[11px]">
                {selectedTrace.spans.map((span, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-zinc-400">
                    <span className="w-24 shrink-0 text-zinc-500 truncate">{span.name}</span>
                    <div className="h-2 rounded-full overflow-hidden bg-zinc-800 flex-1 max-w-xs">
                      <div className={`h-full rounded-full ${span.color}`} style={{ width: `${span.pct}%` }} />
                    </div>
                    <span className="font-semibold text-zinc-300">{span.time}</span>
                    {span.detail && <span className="text-[10px] text-zinc-500 truncate hidden sm:inline">({span.detail})</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "waterfall" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2 text-xs font-mono">
              <div>
                <span className="text-zinc-500">Trace: </span>
                <strong className="text-emerald-400 font-bold">{selectedTrace.method} {selectedTrace.path}</strong>
              </div>
              <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-emerald-400 text-[11px] font-bold">
                Total: {selectedTrace.duration}
              </span>
            </div>

            <div className="space-y-3 font-mono text-xs">
              {selectedTrace.spans.map((span, i) => (
                <div key={i} className="rounded-lg border border-zinc-800/80 bg-zinc-900/50 p-2.5 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-zinc-200">{span.name}</span>
                    <span className="text-emerald-400 font-bold">{span.time}</span>
                  </div>
                  <div className="h-2 rounded-full bg-zinc-800 overflow-hidden">
                    <div className={`h-full rounded-full ${span.color}`} style={{ width: `${span.pct}%` }} />
                  </div>
                  {span.detail && (
                    <div className="text-[11px] text-zinc-400 font-mono bg-zinc-950/60 p-1.5 rounded border border-zinc-800/60">
                      {span.detail}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "sql" && (
          <div className="space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between text-zinc-400">
              <span className="text-xs uppercase font-semibold text-zinc-500">
                SQL Fingerprinting &amp; N+1 Detector
              </span>
              <span className="rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 text-[10px] font-bold">
                1 Warning Detected
              </span>
            </div>

            <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-amber-300 flex items-center gap-1.5">
                  <AlertTriangle className="size-3.5 text-amber-400" />
                  N+1 Query Detected (16 Executions)
                </span>
                <span className="text-[10px] font-mono text-zinc-400">MESProductionLineService.cs:112</span>
              </div>
              <div className="rounded bg-zinc-950 p-2.5 text-zinc-300 text-[11px] overflow-x-auto border border-zinc-800">
                <code>SELECT * FROM MES_PRODUCTION_LOG WHERE LineId = ? AND ShiftId = ?</code>
              </div>
              <p className="text-[11px] text-zinc-400 font-sans">
                Executed 16 times during a single HTTP GET request. Consider batching with <code className="font-mono text-emerald-400">WHERE LineId IN (...)</code>.
              </p>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-3 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-zinc-200">Normalized Fingerprint (Safe from SQL Injection)</span>
                <span className="text-emerald-400 font-bold">8.9 ms</span>
              </div>
              <div className="rounded bg-zinc-950 p-2 text-zinc-300 text-[11px] overflow-x-auto border border-zinc-800">
                <code>SELECT * FROM orders WHERE id = ?</code>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
