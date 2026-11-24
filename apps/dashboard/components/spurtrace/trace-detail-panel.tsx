"use client";

import { useState, useEffect, useMemo } from "react";
import {
  BarChart3,
  Check,
  ChevronDown,
  ChevronUp,
  Code2,
  Copy,
  Database,
  FileCode,
  Flame,
  Layers,
  Maximize2,
  Minimize2,
  Play,
  RefreshCw,
  Search,
  Server,
  SlidersHorizontal,
  Sparkles,
  Table,
  Terminal,
  X,
} from "lucide-react";
import type { DemoTrace } from "@/lib/spurtrace/demo-data";
import { SqlStudioModal, type StudioQueryItem } from "./sql-studio-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  inlineSqlParameters,
  wrapWithStatistics,
  getRowValue,
  executeMockQuery,
  type MockExecutionResult,
} from "@/lib/spurtrace/sql-helpers";
import { cn } from "@/lib/utils";
import { formatDuration, roundDuration } from "@/lib/spurtrace/format-duration";

function TraceSqlQueryCard({
  queryItem,
  idx,
  onOpenStudio,
}: {
  queryItem: StudioQueryItem;
  idx: number;
  onOpenStudio: () => void;
}) {
  const [loadingMode, setLoadingMode] = useState<"data" | "analyze" | null>(null);
  // Do NOT execute mock query on mount - wait until user clicks [Run Query] or [Analyze Stats]
  const [result, setResult] = useState<MockExecutionResult | null>(null);
  const [resultTab, setResultTab] = useState<"data" | "analyze" | "inlined">("data");
  const [isResultOpen, setIsResultOpen] = useState(true);
  const [filterText, setFilterText] = useState("");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  function handleCopy(text: string, key: string) {
    if (!text) return;
    navigator.clipboard?.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1800);
  }

  const inlinedSql = useMemo(() => {
    return inlineSqlParameters(queryItem.sql, queryItem.paramsJson);
  }, [queryItem.sql, queryItem.paramsJson]);

  const statsExecutableSql = useMemo(() => {
    return wrapWithStatistics(inlinedSql);
  }, [inlinedSql]);

  const handleExecute = async (mode: "data" | "analyze") => {
    setLoadingMode(mode);
    try {
      const targetSql = mode === "analyze" ? statsExecutableSql : inlinedSql;
      const res = await fetch("/api/telemetry/sql/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sql: targetSql || queryItem.sql,
          maxRows: 100,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok && !data.error) {
        const rows = data.rows || [];
        const columns = data.columns || (rows.length > 0 ? Object.keys(rows[0]) : []);
        setResult({
          rows,
          rowCount: data.totalRows || rows.length,
          elapsedMs: data.executionTimeMs || 0,
          columns,
          inlinedSql: targetSql || queryItem.sql,
          stats: {
            totalLogicalReads: data.totalRows || 0,
            totalScanCount: 1,
            cpuTimeMs: 1,
            elapsedTimeMs: data.executionTimeMs || 0,
            tables: [
              {
                tableName: "Application Database",
                scanCount: 1,
                logicalReads: data.totalRows || 0,
                physicalReads: 0,
              },
            ],
            rawMessages: [],
          },
        });
      } else {
        const fallback = executeMockQuery(queryItem.sql, queryItem.paramsJson);
        setResult(fallback);
      }
    } catch {
      const fallback = executeMockQuery(queryItem.sql, queryItem.paramsJson);
      setResult(fallback);
    } finally {
      setResultTab(mode);
      setIsResultOpen(true);
      setLoadingMode(null);
    }
  };

  const paramsFormatted = useMemo(() => {
    if (!queryItem.paramsJson) return "";
    return typeof queryItem.paramsJson === "string"
      ? queryItem.paramsJson
      : JSON.stringify(queryItem.paramsJson, null, 2);
  }, [queryItem.paramsJson]);

  const filteredRows = useMemo(() => {
    if (!result?.rows) return [];
    if (!filterText.trim()) return result.rows;
    const q = filterText.toLowerCase();
    return result.rows.filter((row) =>
      Object.values(row).some((val) =>
        String(val ?? "")
          .toLowerCase()
          .includes(q)
      )
    );
  }, [result?.rows, filterText]);

  return (
    <article className="flex flex-col rounded-lg bg-card border border-border overflow-hidden shadow-xs">
      {/* Query Card Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-muted/40 border-b border-border flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <strong className="text-xs font-semibold text-foreground font-sans">
            #{idx + 1} DATABASE QUERY (SQL)
          </strong>
          <span className="text-[11px] text-muted-foreground font-sans">+0ms offset</span>
          <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25 text-[10px] font-sans font-medium">
            {formatDuration(queryItem.durationMs ?? 5)}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Run Query: Runs inline, does NOT open Studio Modal */}
          <Button
            type="button"
            size="xs"
            disabled={loadingMode !== null}
            className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white text-[11px] font-semibold transition-colors cursor-pointer shadow-xs font-sans"
            onClick={() => handleExecute("data")}
          >
            {loadingMode === "data" ? (
              <>
                <RefreshCw className="h-3 w-3 animate-spin" />
                <span>Running...</span>
              </>
            ) : (
              <>
                <Play className="h-3 w-3 fill-current" />
                <span>Run Query</span>
              </>
            )}
          </Button>

          {/* Analyze Stats: Runs inline, does NOT open Studio Modal */}
          <Button
            type="button"
            variant="outline"
            size="xs"
            disabled={loadingMode !== null}
            className="flex items-center gap-1 border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 disabled:opacity-60 text-amber-600 dark:text-amber-400 text-[11px] font-medium transition-colors cursor-pointer font-sans"
            onClick={() => handleExecute("analyze")}
          >
            {loadingMode === "analyze" ? (
              <>
                <RefreshCw className="h-3 w-3 animate-spin" />
                <span>Analyzing...</span>
              </>
            ) : (
              <>
                <BarChart3 className="h-3 w-3" />
                <span>Analyze Stats</span>
              </>
            )}
          </Button>

          <Button
            type="button"
            variant="outline"
            size="xs"
            className="flex items-center gap-1 bg-background text-muted-foreground hover:text-foreground hover:bg-muted text-[11px] transition-colors cursor-pointer font-sans"
            onClick={() => handleCopy(inlinedSql, `exec_${idx}`)}
          >
            {copiedKey === `exec_${idx}` ? (
              <Check className="h-3 w-3 text-emerald-500" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
            <span>Copy Executable</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="xs"
            className="flex items-center gap-1 bg-background text-muted-foreground hover:text-foreground hover:bg-muted text-[11px] transition-colors cursor-pointer font-sans"
            onClick={() => handleCopy(statsExecutableSql, `stats_${idx}`)}
          >
            {copiedKey === `stats_${idx}` ? (
              <Check className="h-3 w-3 text-emerald-500" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
            <span>Copy + Stats</span>
          </Button>

          {/* Studio button: ONLY this button opens Studio Modal */}
          <Button
            type="button"
            variant="outline"
            size="xs"
            className="flex items-center gap-1 border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-400 hover:bg-sky-500/20 text-[11px] font-semibold transition-colors cursor-pointer font-sans"
            onClick={onOpenStudio}
          >
            <Sparkles className="h-3 w-3" />
            <span>Studio</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="xs"
            className="flex items-center gap-1 bg-background text-muted-foreground hover:text-foreground hover:bg-muted text-[11px] transition-colors cursor-pointer font-sans"
            onClick={() => handleCopy(queryItem.sql, `sql_${idx}`)}
          >
            {copiedKey === `sql_${idx}` ? (
              <Check className="h-3 w-3 text-emerald-500" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
            <span>Copy SQL</span>
          </Button>
        </div>
      </div>

      {/* SQL Code View */}
      <div className="p-3.5 bg-slate-950 dark:bg-black/60 text-slate-100 text-xs font-sans leading-relaxed overflow-x-auto whitespace-pre-wrap border-b border-border select-text">
        {queryItem.sql}
      </div>

      {/* Parameters Card */}
      {paramsFormatted && (
        <div className="flex flex-col bg-muted/20 p-3 border-b border-border gap-2">
          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <span className="font-semibold tracking-wider flex items-center gap-1.5 text-muted-foreground font-sans">
              <SlidersHorizontal className="h-3.5 w-3.5 text-amber-500" />
              PARAMETERS &amp; QUERY VARIABLES:
            </span>
            <Button
              type="button"
              variant="ghost"
              size="xs"
              className="flex items-center gap-1 text-[11px] text-sky-600 dark:text-sky-400 hover:underline font-sans cursor-pointer h-auto p-0"
              onClick={() => handleCopy(paramsFormatted, `params_${idx}`)}
            >
              {copiedKey === `params_${idx}` ? (
                <Check className="h-3 w-3 text-emerald-500" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
              <span>Copy Params</span>
            </Button>
          </div>
          <pre className="p-2.5 rounded-md bg-slate-950 dark:bg-black/60 border border-slate-800 text-amber-400 text-xs overflow-x-auto font-sans leading-relaxed select-text">
            {paramsFormatted}
          </pre>
        </div>
      )}

      {/* Loading state indicator */}
      {loadingMode && (
        <div className="flex items-center gap-2 px-4 py-3 bg-muted/40 border-t border-border text-xs text-muted-foreground font-sans animate-pulse">
          <RefreshCw className="h-3.5 w-3.5 animate-spin text-emerald-600 dark:text-emerald-400" />
          <span>Executing query on target database sandbox...</span>
        </div>
      )}

      {/* Inline Results Box */}
      {result && (
        <div className="bg-card">
          {/* Sub-tabs header */}
          <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2 bg-muted/40 border-b border-border text-xs">
            <div className="flex items-center gap-1.5 flex-wrap">
              <Button
                type="button"
                variant="ghost"
                size="xs"
                onClick={() => setResultTab("data")}
                className={cn(
                  "font-semibold flex items-center gap-1.5 transition-colors cursor-pointer",
                  resultTab === "data"
                    ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <Table className="h-3.5 w-3.5" />
                <span>Data Results ({result.rowCount || 0})</span>
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="xs"
                onClick={() => setResultTab("analyze")}
                className={cn(
                  "font-semibold flex items-center gap-1.5 transition-colors cursor-pointer",
                  resultTab === "analyze"
                    ? "bg-amber-500 text-slate-950 font-bold shadow-xs hover:bg-amber-500/90"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <BarChart3 className="h-3.5 w-3.5" />
                <span>Performance &amp; IO Stats</span>
                {result.stats && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/20 font-sans">
                    Reads: {result.stats.totalLogicalReads}
                  </span>
                )}
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="xs"
                onClick={() => setResultTab("inlined")}
                className={cn(
                  "font-semibold flex items-center gap-1.5 transition-colors cursor-pointer",
                  resultTab === "inlined"
                    ? "bg-sky-600 hover:bg-sky-500 text-white font-semibold shadow-xs"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <FileCode className="h-3.5 w-3.5" />
                <span>Executable Script</span>
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] text-muted-foreground font-sans">
                Elapsed:{" "}
                <strong className="text-emerald-700 dark:text-emerald-400 font-bold">
                  {formatDuration(result.elapsedMs)}
                </strong>
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                onClick={() => setIsResultOpen(!isResultOpen)}
                className="text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                title={isResultOpen ? "Collapse results" : "Expand results"}
              >
                {isResultOpen ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Sub-tabs content */}
          {isResultOpen && (
            <div className="p-3.5 flex flex-col gap-3">
              {/* Data Grid Tab */}
              {resultTab === "data" && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2 text-xs flex-wrap">
                    <div className="relative flex-1 max-w-xs">
                      <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                      <Input
                        type="text"
                        value={filterText}
                        onChange={(e) => setFilterText(e.target.value)}
                        placeholder="Filter in results..."
                        className="w-full pl-8 pr-3 py-1.5 text-xs rounded-md border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500 font-sans h-8"
                      />
                    </div>
                    <div className="text-[11px] text-muted-foreground font-sans">
                      Showing {filteredRows.length} of {result.rowCount || 0} rows
                    </div>
                  </div>

                  {filteredRows.length === 0 ? (
                    <div className="rounded-md border border-border bg-background p-6 text-center text-xs text-muted-foreground font-sans">
                      No rows match the filter criteria.
                    </div>
                  ) : (
                    <div className="rounded-md border border-border overflow-x-auto max-h-72">
                      <table className="w-full text-left text-xs border-collapse font-sans">
                        <thead className="sticky top-0 z-10 bg-muted/60 border-b border-border shadow-xs">
                          <tr>
                            <th className="p-2 text-[11px] font-bold text-muted-foreground border-r border-border w-12 text-center">
                              #
                            </th>
                            {result.columns.map((col, cIdx) => (
                              <th
                                key={`${col}_${cIdx}`}
                                className="p-2 text-[11px] font-semibold text-foreground whitespace-nowrap border-r border-border"
                              >
                                {col}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {filteredRows.map((row, rIdx) => (
                            <tr key={rIdx} className="hover:bg-muted/40 transition-colors">
                              <td className="p-2 text-[11px] text-muted-foreground text-center border-r border-border">
                                {rIdx + 1}
                              </td>
                              {result.columns.map((col, cIdx) => {
                                const val = getRowValue(row, col);
                                const isNull = val === null || val === undefined;
                                return (
                                  <td
                                    key={`${col}_${cIdx}`}
                                    className="p-2 whitespace-nowrap border-r border-border text-xs text-foreground select-text"
                                  >
                                    {isNull ? (
                                      <span className="text-[10px] text-muted-foreground italic px-1 py-0.5 rounded bg-muted">
                                        NULL
                                      </span>
                                    ) : (
                                      <span>{String(val)}</span>
                                    )}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Performance & IO Stats Tab */}
              {resultTab === "analyze" && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div className="rounded-md border border-border bg-muted/20 p-3 text-center">
                      <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider font-sans">
                        LOGICAL READS
                      </div>
                      <div className="text-xl font-bold font-sans mt-0.5 text-emerald-700 dark:text-emerald-400">
                        {result.stats.totalLogicalReads.toLocaleString()}
                      </div>
                    </div>
                    <div className="rounded-md border border-border bg-muted/20 p-3 text-center">
                      <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider font-sans">
                        SCAN COUNT
                      </div>
                      <div className="text-xl font-bold font-sans mt-0.5 text-sky-600 dark:text-sky-400">
                        {result.stats.totalScanCount}
                      </div>
                    </div>
                    <div className="rounded-md border border-border bg-muted/20 p-3 text-center">
                      <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider font-sans">
                        CPU TIME
                      </div>
                      <div className="text-xl font-bold font-sans mt-0.5 text-foreground">
                        {result.stats.cpuTimeMs} ms
                      </div>
                    </div>
                    <div className="rounded-md border border-border bg-muted/20 p-3 text-center">
                      <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider font-sans">
                        ELAPSED TIME
                      </div>
                      <div className="text-xl font-bold font-sans mt-0.5 text-emerald-700 dark:text-emerald-400">
                        {result.stats.elapsedTimeMs || result.elapsedMs} ms
                      </div>
                    </div>
                  </div>

                  {result.stats.tables && result.stats.tables.length > 0 && (
                    <div className="rounded-md border border-border overflow-hidden">
                      <div className="p-2.5 bg-muted/40 border-b border-border text-xs font-semibold text-foreground flex items-center justify-between font-sans">
                        <span>Table I/O Breakdown</span>
                        <span className="text-[11px] text-muted-foreground">
                          {result.stats.tables.length} table(s) accessed
                        </span>
                      </div>
                      <table className="w-full text-left text-xs border-collapse font-sans">
                        <thead className="bg-muted/20 border-b border-border text-muted-foreground">
                          <tr>
                            <th className="p-2 font-semibold">Table</th>
                            <th className="p-2 font-semibold text-right">Scan Count</th>
                            <th className="p-2 font-semibold text-right">Logical Reads</th>
                            <th className="p-2 font-semibold text-right">Physical Reads</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {result.stats.tables.map((t, tIdx) => (
                            <tr key={tIdx} className="hover:bg-muted/30">
                              <td className="p-2 font-semibold text-foreground">{t.tableName}</td>
                              <td className="p-2 text-right text-muted-foreground">
                                {t.scanCount}
                              </td>
                              <td className="p-2 text-right font-semibold text-emerald-700 dark:text-emerald-400">
                                {t.logicalReads.toLocaleString()}
                              </td>
                              <td className="p-2 text-right text-muted-foreground">
                                {t.physicalReads}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {result.stats.rawMessages && result.stats.rawMessages.length > 0 && (
                    <details className="cursor-pointer text-[11px] text-muted-foreground font-sans">
                      <summary className="hover:text-foreground">
                        View raw SQL Server STATISTICS messages
                      </summary>
                      <pre className="mt-1.5 p-2.5 rounded-md bg-background border border-border text-[11px] font-sans text-muted-foreground whitespace-pre-wrap leading-relaxed select-text">
                        {result.stats.rawMessages.join("\n")}
                      </pre>
                    </details>
                  )}
                </div>
              )}

              {/* Executable Script Tab */}
              {resultTab === "inlined" && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-xs flex-wrap gap-2">
                    <span className="text-[11px] text-muted-foreground font-sans">
                      Parameters substituted into query. Ready for SSMS / DBeaver:
                    </span>
                    <div className="flex items-center gap-1.5">
                      <Button
                        type="button"
                        variant="outline"
                        size="xs"
                        onClick={() => handleCopy(statsExecutableSql, `tab_stats_${idx}`)}
                        className="border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 text-xs font-semibold transition-colors cursor-pointer font-sans"
                      >
                        {copiedKey === `tab_stats_${idx}` ? "Stats Copied!" : "Copy with Stats"}
                      </Button>
                      <Button
                        type="button"
                        size="xs"
                        onClick={() => handleCopy(inlinedSql, `tab_inlined_${idx}`)}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer font-sans"
                      >
                        {copiedKey === `tab_inlined_${idx}` ? "Copied!" : "Copy Script"}
                      </Button>
                    </div>
                  </div>
                  <pre className="p-3.5 rounded-md bg-slate-950 dark:bg-black/60 border border-slate-800 text-xs text-slate-100 font-sans overflow-x-auto whitespace-pre-wrap leading-relaxed select-text">
                    {inlinedSql}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </article>
  );
}

function RawStreamViewer({ trace }: { trace: DemoTrace }) {
  const [filterMode, setFilterMode] = useState<"all" | "spans" | "queries" | "meta" | "exception">("all");
  const [search, setSearch] = useState("");
  const [copied, setCopied] = useState(false);

  const sanitizedTrace = useMemo(() => {
    return {
      ...trace,
      duration: roundDuration(trace.duration),
      durationMs: roundDuration((trace as any).durationMs ?? trace.duration),
      spans: (trace.spans || []).map((s) => ({
        ...s,
        start: roundDuration(s.start),
        startOffsetMs: roundDuration((s as any).startOffsetMs ?? s.start),
        duration: roundDuration(s.duration),
        durationMs: roundDuration((s as any).durationMs ?? s.duration),
      })),
      queries: (trace.queries || []).map((q) => ({
        ...q,
        duration: roundDuration(q.duration),
        durationMs: roundDuration((q as any).durationMs ?? q.duration),
      })),
    };
  }, [trace]);

  const displayData = useMemo(() => {
    switch (filterMode) {
      case "spans":
        return sanitizedTrace.spans || [];
      case "queries":
        return sanitizedTrace.queries || [];
      case "exception":
        return (sanitizedTrace as any).exception || { message: "No unhandled exceptions in this trace." };
      case "meta":
        return {
          id: sanitizedTrace.id,
          timestamp: (sanitizedTrace as any).timestamp || (sanitizedTrace as any).createdAt,
          method: sanitizedTrace.method,
          route: sanitizedTrace.route,
          status: sanitizedTrace.status,
          duration: sanitizedTrace.duration,
          clientIp: (sanitizedTrace as any).clientIp,
          userAgent: (sanitizedTrace as any).userAgent,
          environment: (sanitizedTrace as any).environment,
          service: sanitizedTrace.service,
          sampleReason: (sanitizedTrace as any).sampleReason,
        };
      default:
        return sanitizedTrace;
    }
  }, [sanitizedTrace, filterMode]);

  const jsonString = useMemo(() => {
    return JSON.stringify(displayData, null, 2);
  }, [displayData]);

  const filteredLines = useMemo(() => {
    const lines = jsonString.split("\n");
    if (!search.trim()) return lines;
    const lower = search.toLowerCase();
    return lines.filter((l) => l.toLowerCase().includes(lower));
  }, [jsonString, search]);

  const handleCopy = () => {
    navigator.clipboard?.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col gap-3 font-sans">
      {/* Overview Metadata Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 bg-muted/40 border border-border rounded-lg text-xs font-sans">
        <div>
          <span className="text-muted-foreground block text-[10px] uppercase font-bold">Trace ID</span>
          <span className="font-mono text-[11px] text-foreground truncate block">{trace.id}</span>
        </div>
        <div>
          <span className="text-muted-foreground block text-[10px] uppercase font-bold">Endpoint</span>
          <span className="font-mono text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold truncate block">
            {trace.method} {trace.route}
          </span>
        </div>
        <div>
          <span className="text-muted-foreground block text-[10px] uppercase font-bold">Duration</span>
          <span className="font-mono text-[11px] text-foreground">{trace.duration} ms</span>
        </div>
        <div>
          <span className="text-muted-foreground block text-[10px] uppercase font-bold">Spans / Queries</span>
          <span className="font-mono text-[11px] text-foreground">
            {trace.spans?.length || 0} spans · {trace.queries?.length || 0} sql
          </span>
        </div>
      </div>

      {/* Control Bar: Filters & Search */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-card border border-border rounded-lg">
        <div className="flex items-center gap-1 flex-wrap text-xs">
          <Button
            type="button"
            size="xs"
            variant="ghost"
            onClick={() => setFilterMode("all")}
            className={cn(
              "font-sans text-[11px] cursor-pointer",
              filterMode === "all" ? "bg-emerald-600 text-white hover:bg-emerald-500 shadow-xs" : "text-muted-foreground hover:bg-muted"
            )}
          >
            All JSON
          </Button>
          <Button
            type="button"
            size="xs"
            variant="ghost"
            onClick={() => setFilterMode("spans")}
            className={cn(
              "font-sans text-[11px] cursor-pointer",
              filterMode === "spans" ? "bg-emerald-600 text-white hover:bg-emerald-500 shadow-xs" : "text-muted-foreground hover:bg-muted"
            )}
          >
            Spans ({trace.spans?.length || 0})
          </Button>
          <Button
            type="button"
            size="xs"
            variant="ghost"
            onClick={() => setFilterMode("queries")}
            className={cn(
              "font-sans text-[11px] cursor-pointer",
              filterMode === "queries" ? "bg-emerald-600 text-white hover:bg-emerald-500 shadow-xs" : "text-muted-foreground hover:bg-muted"
            )}
          >
            Queries ({trace.queries?.length || 0})
          </Button>
          <Button
            type="button"
            size="xs"
            variant="ghost"
            onClick={() => setFilterMode("meta")}
            className={cn(
              "font-sans text-[11px] cursor-pointer",
              filterMode === "meta" ? "bg-emerald-600 text-white hover:bg-emerald-500 shadow-xs" : "text-muted-foreground hover:bg-muted"
            )}
          >
            HTTP Metadata
          </Button>
          {(trace as any).exception && (
            <Button
              type="button"
              size="xs"
              variant="ghost"
              onClick={() => setFilterMode("exception")}
              className={cn(
                "font-sans text-[11px] cursor-pointer",
                filterMode === "exception" ? "bg-rose-600 text-white hover:bg-rose-500 shadow-xs" : "text-rose-500 hover:bg-rose-500/10"
              )}
            >
              Exception
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Filter keys or values..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-7 pl-8 pr-2 text-xs w-48 font-sans bg-background"
            />
          </div>
          <Button
            type="button"
            size="xs"
            variant="outline"
            onClick={handleCopy}
            className="flex items-center gap-1 font-sans text-[11px] cursor-pointer"
          >
            {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
            <span>{copied ? "Copied" : "Copy"}</span>
          </Button>
        </div>
      </div>

      {/* Structured / Max-Height Scrollable JSON viewer */}
      <div className="relative rounded-lg border border-border bg-slate-950 dark:bg-black/90 shadow-inner overflow-hidden">
        <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900 border-b border-slate-800 text-[11px] font-mono text-muted-foreground">
          <span>{search ? `Filtered: ${filteredLines.length} lines` : `${jsonString.split("\n").length} lines`}</span>
          <span>application/json</span>
        </div>
        <div className="max-h-[460px] overflow-auto p-3 text-xs font-mono text-emerald-400 select-text leading-relaxed">
          <pre className="whitespace-pre">
            {filteredLines.join("\n")}
          </pre>
        </div>
      </div>
    </div>
  );
}

export function TraceDetailPanel({ trace, onClose }: { trace: DemoTrace; onClose: () => void }) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isMaximized, setIsMaximized] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [activeTab, setActiveTab] = useState<"queries" | "waterfall" | "raw">("queries");
  const [studioOpen, setStudioOpen] = useState(false);
  const [studioQueryIndex, setStudioQueryIndex] = useState(0);

  const handleClose = () => {
    if (isClosing) return;
    setIsClosing(true);
    setTimeout(() => onClose(), 250);
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isClosing]);

  function handleCopy(text: string, key: string) {
    if (!text) return;
    navigator.clipboard?.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1800);
  }

  // Calculate durations
  const sqlTotal = trace.spans
    .filter((span) => span.kind === "db")
    .reduce((total, span) => total + span.duration, 0);
  const dbDurationMs = sqlTotal > 0 ? sqlTotal : Math.round(trace.duration * 0.15);
  const appDurationMs = Math.max(1, trace.duration - dbDurationMs);
  const dbPercent = Math.round((dbDurationMs / trace.duration) * 100);
  const appPercent = Math.max(1, 100 - dbPercent);

  // Map queries with real parameters from telemetry or discovered SQL parameter names
  const sampleQueries: StudioQueryItem[] = useMemo(() => {
    if (trace.queries.length > 0) {
      return trace.queries.map((q, i) => {
        let params: Record<string, any> = {};
        if ((q as any).parameters && typeof (q as any).parameters === "object" && Object.keys((q as any).parameters).length > 0) {
          params = (q as any).parameters;
        } else {
          // Discover parameter tokens from query text (e.g., @__userId_0, @id, @Mo)
          const rawSql = (q as any).sampleQuery || q.query || "";
          const matches = rawSql.match(/@([a-zA-Z0-9_]+)/g);
          if (matches) {
            matches.forEach((m: string) => {
              const pName = m.substring(1);
              if (!(pName in params)) {
                params[pName] = "";
              }
            });
          }
        }
        return {
          id: `q_${i}`,
          sql: (q as any).sampleQuery || q.query,
          paramsJson: params,
          durationMs: q.duration,
        };
      });
    }
    return [
      {
        id: "q_0",
        sql: "SELECT 1 AS Status;",
        paramsJson: {},
        durationMs: 1,
      },
    ];
  }, [trace]);

  const methodColor =
    trace.method === "GET"
      ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/25"
      : trace.method === "POST"
        ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/25"
        : trace.method === "DELETE"
          ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/25"
          : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25";

  const statusColor =
    trace.status >= 500
      ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/25"
      : trace.status >= 400
        ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25"
        : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/25";

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-end transition-all duration-300",
          isClosing ? "animate-out fade-out-0 duration-250" : "animate-in fade-in-0 duration-300"
        )}
        onMouseDown={(e) => e.target === e.currentTarget && handleClose()}
      >
        <aside
          className={cn(
            "flex flex-col h-full bg-card text-card-foreground border-l border-border shadow-2xl transition-all duration-300 ease-in-out overflow-hidden",
            isClosing ? "animate-out slide-out-to-right duration-250" : "animate-in slide-in-from-right duration-300",
            isMaximized ? "w-full" : "w-[1240px] max-w-[96vw]"
          )}
          role="dialog"
          aria-modal="true"
        >
          {/* Top Bar */}
          <header className="flex items-center justify-between px-5 py-3 bg-muted/40 border-b border-border shrink-0">
            <div className="flex items-center gap-2.5">
              <span
                className={`px-2 py-0.5 rounded text-xs font-bold border font-sans ${methodColor}`}
              >
                {trace.method}
              </span>
              <span
                className={`px-2 py-0.5 rounded text-xs font-bold border font-sans ${statusColor}`}
              >
                {trace.status}
              </span>
              <strong className="text-sm font-semibold text-foreground font-sans">
                {trace.route}
              </strong>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="flex items-center gap-1.5 bg-background hover:bg-muted text-xs text-muted-foreground hover:text-foreground border-border transition-colors cursor-pointer font-sans"
                onClick={() => setIsMaximized(!isMaximized)}
                title={isMaximized ? "Restore" : "Maximize"}
              >
                {isMaximized ? (
                  <Minimize2 className="h-3.5 w-3.5" />
                ) : (
                  <Maximize2 className="h-3.5 w-3.5" />
                )}
                <span>{isMaximized ? "Restore" : "Maximize"}</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="flex items-center gap-1.5 bg-background hover:bg-muted text-xs text-muted-foreground hover:text-foreground border-border transition-colors cursor-pointer font-sans"
                onClick={() => handleCopy(JSON.stringify(trace, null, 2), "json")}
                title="Copy trace JSON"
              >
                {copiedKey === "json" ? (
                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
                <span>Copy JSON</span>
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer ml-1"
                onClick={handleClose}
                title="Close drawer"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </header>

          {/* Trace Metadata line */}
          <div className="flex items-center gap-4 px-5 py-2.5 bg-muted/20 border-b border-border text-xs text-muted-foreground shrink-0 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground">Trace ID:</span>
              <Button
                type="button"
                variant="ghost"
                size="xs"
                className="text-emerald-700 dark:text-emerald-400 font-semibold hover:underline font-sans cursor-pointer h-auto p-0"
                onClick={() => handleCopy(trace.id, "trace_id")}
                title="Click to copy Trace ID"
              >
                {trace.id}
              </Button>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground">Timestamp:</span>
              <span className="text-foreground font-sans">{trace.createdAt}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground">Client IP:</span>
              <span className="text-foreground font-sans">10.1.60.56</span>
            </div>
            <div className="flex items-center gap-1.5 ml-auto">
              <span className="text-muted-foreground">Total Duration:</span>
              <strong className="text-emerald-700 dark:text-emerald-400 font-bold font-sans">
                {formatDuration(trace.duration)}
              </strong>
            </div>
          </div>

          {/* Sub-tabs header */}
          <div className="flex items-center gap-2 px-5 bg-card border-b border-border shrink-0">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={`flex items-center gap-2 py-2.5 px-3 text-xs font-semibold border-b-2 rounded-none transition-colors cursor-pointer font-sans ${
                activeTab === "queries"
                  ? "border-emerald-600 dark:border-emerald-500 text-foreground bg-transparent"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:bg-transparent"
              }`}
              onClick={() => setActiveTab("queries")}
            >
              <Database className="h-4 w-4 text-emerald-700 dark:text-emerald-400" />
              <span>Database Queries ({sampleQueries.length})</span>
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={`flex items-center gap-2 py-2.5 px-3 text-xs font-semibold border-b-2 rounded-none transition-colors cursor-pointer font-sans ${
                activeTab === "waterfall"
                  ? "border-emerald-600 dark:border-emerald-500 text-foreground bg-transparent"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:bg-transparent"
              }`}
              onClick={() => setActiveTab("waterfall")}
            >
              <Layers className="h-4 w-4 text-emerald-700 dark:text-emerald-400" />
              <span>Trace Waterfall ({trace.spans.length})</span>
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={`flex items-center gap-2 py-2.5 px-3 text-xs font-semibold border-b-2 rounded-none transition-colors cursor-pointer font-sans ${
                activeTab === "raw"
                  ? "border-emerald-600 dark:border-emerald-500 text-foreground bg-transparent"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:bg-transparent"
              }`}
              onClick={() => setActiveTab("raw")}
            >
              <Terminal className="h-4 w-4 text-purple-500" />
              <span>Raw Stream ({trace.spans.length})</span>
            </Button>
          </div>

          {/* Main Body */}
          <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-5">
            {/* Latency Distribution bar */}
            <section className="flex flex-col gap-2 p-3.5 rounded-lg bg-muted/30 border border-border">
              <div className="flex items-center justify-between text-xs font-medium">
                <span className="text-muted-foreground flex items-center gap-1.5 font-sans">
                  <Flame className="h-3.5 w-3.5 text-emerald-500" />
                  Latency Distribution (Request Layers)
                </span>
                <div className="flex items-center gap-3 text-[11px] font-sans">
                  <span className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-medium">
                    <i className="h-2 w-2 rounded-full bg-emerald-500" />
                    DB: {dbPercent}% ({formatDuration(dbDurationMs)})
                  </span>
                  <span className="flex items-center gap-1.5 text-sky-600 dark:text-sky-400 font-medium">
                    <i className="h-2 w-2 rounded-full bg-sky-500" />
                    App: {appPercent}% ({formatDuration(appDurationMs)})
                  </span>
                  <span className="text-muted-foreground">Total: {formatDuration(trace.duration)}</span>
                </div>
              </div>

              <div className="h-2.5 w-full bg-muted rounded-full overflow-hidden flex">
                <div
                  className="h-full bg-emerald-500 transition-all"
                  style={{ width: `${dbPercent}%` }}
                />
                <div
                  className="h-full bg-sky-500 transition-all"
                  style={{ width: `${appPercent}%` }}
                />
              </div>
            </section>

            {/* 4 KPI Metric Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-lg bg-card border border-border shadow-xs">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider font-sans">
                  TOTAL DURATION
                </span>
                <strong className="block text-lg font-bold text-foreground mt-1 font-sans">
                  {formatDuration(trace.duration)}
                </strong>
              </div>
              <div className="p-3.5 rounded-lg bg-card border border-border shadow-xs">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1 font-sans">
                  <Database className="h-3 w-3 text-emerald-700 dark:text-emerald-400" />
                  DATABASE TIME
                </span>
                <strong className="block text-lg font-bold text-emerald-700 dark:text-emerald-400 mt-1 font-sans">
                  {formatDuration(dbDurationMs)}{" "}
                  <small className="text-xs text-muted-foreground font-normal">
                    ({dbPercent}%)
                  </small>
                </strong>
              </div>
              <div className="p-3.5 rounded-lg bg-card border border-border shadow-xs">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1 font-sans">
                  <Server className="h-3 w-3 text-sky-600 dark:text-sky-400" />
                  SERVER LOGIC
                </span>
                <strong className="block text-lg font-bold text-sky-600 dark:text-sky-400 mt-1 font-sans">
                  {formatDuration(appDurationMs)}{" "}
                  <small className="text-xs text-muted-foreground font-normal">
                    ({appPercent}%)
                  </small>
                </strong>
              </div>
              <div className="p-3.5 rounded-lg bg-card border border-border shadow-xs">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1 font-sans">
                  <Code2 className="h-3 w-3 text-purple-500" />
                  SQL QUERIES
                </span>
                <strong className="block text-lg font-bold text-foreground mt-1 font-sans">
                  {sampleQueries.length}
                </strong>
              </div>
            </div>

            {/* Queries Tab View */}
            {activeTab === "queries" && (
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-foreground font-sans">
                      All Queries ({sampleQueries.length})
                    </span>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer font-sans"
                    onClick={() => {
                      setStudioQueryIndex(0);
                      setStudioOpen(true);
                    }}
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Open SQL Studio &amp; Debugger</span>
                  </Button>
                </div>

                {sampleQueries.map((q, idx) => (
                  <TraceSqlQueryCard
                    key={q.id ?? idx}
                    queryItem={q}
                    idx={idx}
                    onOpenStudio={() => {
                      setStudioQueryIndex(idx);
                      setStudioOpen(true);
                    }}
                  />
                ))}
              </div>
            )}

            {/* Waterfall Tab View */}
            {activeTab === "waterfall" && (
              <div className="flex flex-col gap-3">
                <div className="grid grid-cols-[1fr_90px_1.5fr] items-center gap-4 px-3 py-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider font-sans border-b border-border">
                  <span>SPAN / STEP</span>
                  <span className="text-right">DURATION</span>
                  <span>WATERFALL TIMELINE</span>
                </div>
                <div className="flex flex-col gap-2">
                  {trace.spans.map((span, index) => {
                    const leftPercent = Math.min(
                      95,
                      Math.max(0, (span.start / trace.duration) * 100)
                    );
                    const widthPercent = Math.max(
                      3,
                      Math.min(100 - leftPercent, (span.duration / trace.duration) * 100)
                    );
                    const barColor =
                      span.kind === "db"
                        ? "bg-emerald-500"
                        : span.kind === "http"
                          ? "bg-purple-500"
                          : "bg-sky-500";

                    const badgeStyle =
                      span.kind === "db"
                        ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/25"
                        : span.kind === "http"
                          ? "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/25"
                          : "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/25";

                    return (
                      <div
                        key={index}
                        className="grid grid-cols-[1fr_90px_1.5fr] items-center gap-4 bg-card border border-border rounded-lg p-3 shadow-xs hover:bg-muted/30 transition-colors"
                      >
                        <div className="flex flex-col min-w-0">
                          <strong className="text-xs font-semibold text-foreground truncate font-sans">
                            {span.name}
                          </strong>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[10px] text-muted-foreground font-sans">
                              {trace.service}
                            </span>
                            <span className="text-muted-foreground/40 text-[10px]">·</span>
                            <span
                              className={cn(
                                "text-[9px] font-semibold px-1.5 py-0.2 rounded border font-sans uppercase",
                                badgeStyle
                              )}
                            >
                              {span.kind}
                            </span>
                          </div>
                        </div>

                        <span className="text-xs font-bold text-foreground font-sans text-right">
                          {formatDuration(span.duration)}
                        </span>

                        <div className="relative h-2.5 w-full bg-muted/70 rounded-full overflow-hidden">
                          <div
                            className={cn(
                              "absolute top-0 h-full rounded-full transition-all",
                              barColor
                            )}
                            style={{
                              left: `${leftPercent}%`,
                              width: `${widthPercent}%`,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Raw Stream Tab View */}
            {activeTab === "raw" && (
              <RawStreamViewer trace={trace} />
            )}
          </div>
        </aside>
      </div>

      {/* SQL Studio & Debugger Modal */}
      <SqlStudioModal
        isOpen={studioOpen}
        onClose={() => setStudioOpen(false)}
        traceId={trace.id}
        endpoint={`${trace.method} ${trace.route}`}
        traceLatency={formatDuration(trace.duration)}
        queries={sampleQueries}
        initialQueryIndex={studioQueryIndex}
      />
    </>
  );
}
