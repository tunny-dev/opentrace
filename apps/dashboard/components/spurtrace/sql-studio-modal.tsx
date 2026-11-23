"use client";

import { useState, useEffect, useMemo } from "react";
import {
  AlertTriangle,
  ArrowUpDown,
  BarChart3,
  Check,
  Clock,
  Code2,
  Copy,
  Database,
  Download,
  FileCode,
  Layers,
  Maximize2,
  Minimize2,
  Play,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldCheck,
  Sparkles,
  Table as TableIcon,
  Wand2,
  X,
} from "lucide-react";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import {
  inlineSqlParameters,
  wrapWithStatistics,
  uppercaseSqlKeywords,
  getRowValue,
} from "@/lib/spurtrace/sql-helpers";
import type { UserRole } from "./user-profile-menu";
import { cn } from "@/lib/utils";

export interface StudioQueryItem {
  id?: string;
  sql: string;
  paramsJson?: string | Record<string, any>;
  durationMs?: number;
  name?: string;
}

const DEFAULT_QUERY: StudioQueryItem = {
  sql: `SELECT DC001 AS MfgCode, DC002 AS MfgTypeName, DC003 AS Factory\nFROM SSFDC WITH (NOLOCK)\nWHERE ISNULL(DC003, '') LIKE '%' + ISNULL(@Factory, DC003) + '%'\nORDER BY DC001`,
  paramsJson: JSON.stringify({ Factory: "VN" }, null, 2),
  durationMs: 50,
};

function getParamsText(params: StudioQueryItem["paramsJson"]) {
  return typeof params === "string" ? params : JSON.stringify(params || {}, null, 2);
}

export function SqlStudioModal({
  isOpen,
  onClose,
  traceId = "227796e8a8afee9558ec157bfb5ea14f",
  endpoint = "GET /api/cim/get-mfg-type",
  traceLatency = "572.1 ms",
  queries = [],
  initialQueryIndex = 0,
  role = "Admin",
}: {
  isOpen: boolean;
  onClose: () => void;
  traceId?: string;
  endpoint?: string;
  traceLatency?: string;
  queries?: StudioQueryItem[];
  initialQueryIndex?: number;
  role?: UserRole;
}) {
  const queryList = useMemo(
    () => (queries.length > 0 ? queries : [DEFAULT_QUERY]),
    [queries]
  );
  const [selectedIndex, setSelectedIndex] = useState(initialQueryIndex);
  const safeIndex = Math.min(selectedIndex, Math.max(queryList.length - 1, 0));
  const currentItem = queryList[safeIndex] || DEFAULT_QUERY;

  const [sqlText, setSqlText] = useState(currentItem.sql);
  const [paramsText, setParamsText] = useState(getParamsText(currentItem.paramsJson));

  const [isMaximized, setIsMaximized] = useState(false);
  const [activeTab, setActiveTab] = useState<"grid" | "stats" | "inlined">("grid");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [executing, setExecuting] = useState(false);
  const [hasExecuted, setHasExecuted] = useState(false);
  const [searchFilter, setSearchFilter] = useState("");
  const [executionStats, setExecutionStats] = useState<any>(null);
  const [resultRows, setResultRows] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen) {
      setSelectedIndex(initialQueryIndex);
    }
  }, [isOpen, initialQueryIndex]);

  useEffect(() => {
    const item = queryList[safeIndex] || DEFAULT_QUERY;
    setSqlText(item.sql);
    setParamsText(getParamsText(item.paramsJson));
    setHasExecuted(false);
    setResultRows([]);
    setExecutionStats(null);
    setSearchFilter("");
  }, [safeIndex, queryList]);

  function handleCopy(text: string, key: string) {
    if (!text) return;
    navigator.clipboard?.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1800);
  }

  function handleUppercase() {
    setSqlText(uppercaseSqlKeywords(sqlText));
  }

  function handleFormatJson() {
    try {
      const parsed = JSON.parse(paramsText);
      setParamsText(JSON.stringify(parsed, null, 2));
    } catch {
      // invalid JSON, ignore
    }
  }

  function handleReset() {
    setSqlText(currentItem.sql);
    setParamsText(getParamsText(currentItem.paramsJson));
    setHasExecuted(false);
    setResultRows([]);
    setExecutionStats(null);
    setSearchFilter("");
  }

  const inlinedSql = useMemo(() => {
    try {
      const parsed = JSON.parse(paramsText);
      return inlineSqlParameters(sqlText, parsed);
    } catch {
      return inlineSqlParameters(sqlText, {});
    }
  }, [sqlText, paramsText]);

  const statsSql = useMemo(() => {
    return wrapWithStatistics(inlinedSql);
  }, [inlinedSql]);

  const lineCount = (sqlText.match(/\n/g) || []).length + 1;
  const charCount = sqlText.length;

  function handleRunQuery(mode: "run" | "analyze") {
    setExecuting(true);
    setTimeout(() => {
      setExecuting(false);
      setHasExecuted(true);
      if (mode === "analyze") setActiveTab("stats");
      else setActiveTab("grid");

      const sampleRows = [
        {
          MfgCode: "MFG-001",
          MfgTypeName: "Surface Mount Technology (SMT)",
          Factory: "VN-FAC1",
          ActiveLines: 12,
          YieldRate: "99.4%",
        },
        {
          MfgCode: "MFG-002",
          MfgTypeName: "Dual In-line Package (DIP)",
          Factory: "VN-FAC1",
          ActiveLines: 9,
          YieldRate: "98.9%",
        },
        {
          MfgCode: "MFG-003",
          MfgTypeName: "System Integration & Packing",
          Factory: "VN-FAC2",
          ActiveLines: 8,
          YieldRate: "99.8%",
        },
        {
          MfgCode: "MFG-004",
          MfgTypeName: "Final Quality Assurance (FQA)",
          Factory: "VN-FAC2",
          ActiveLines: 6,
          YieldRate: "100.0%",
        },
        {
          MfgCode: "MFG-005",
          MfgTypeName: "Optical Inspection (AOI)",
          Factory: "VN-FAC1",
          ActiveLines: 14,
          YieldRate: "99.2%",
        },
      ];

      setResultRows(sampleRows);
      setExecutionStats({
        durationMs: 32.4,
        compileTimeMs: 1.2,
        executionTimeMs: 31.2,
        logicalReads: 48,
        physicalReads: 0,
        scanCount: 1,
        table: "SSFDC",
      });
    }, 450);
  }

  const filteredRows = resultRows.filter((row) => {
    if (!searchFilter.trim()) return true;
    return JSON.stringify(row).toLowerCase().includes(searchFilter.toLowerCase());
  });

  const columns = resultRows.length > 0 ? Object.keys(resultRows[0]) : [];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showCloseButton={false}
        className={cn(
          "bg-card text-card-foreground border border-border p-0 flex flex-col gap-0 shadow-2xl overflow-hidden duration-200 data-open:zoom-in-100 data-closed:zoom-out-100",
          isMaximized
            ? "fixed! inset-2! top-2! left-2! translate-x-0! translate-y-0! w-[calc(100vw-16px)]! h-[calc(100vh-16px)]! max-w-none! rounded-lg"
            : "w-[97vw] max-w-[1600px] h-[92vh] max-h-[960px] rounded-lg"
        )}
      >
        <DialogTitle className="sr-only">MES SQL Studio & Debugger</DialogTitle>

        {/* Top title bar */}
        <header className="flex items-center justify-between px-4 py-2.5 bg-muted/40 border-b border-border shrink-0 select-none">
          <div className="flex items-center gap-2.5">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
              <Sparkles className="h-3.5 w-3.5" />
            </div>
            <strong className="text-sm font-semibold text-foreground font-sans">
              MES SQL Studio & Debugger
            </strong>
            <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25 font-sans">
              <ShieldCheck className="h-3 w-3" />
              Read-Only Sandbox (SELECT / DECLARE)
            </span>
          </div>

          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              className="text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              onClick={() => setIsMaximized(!isMaximized)}
              title={isMaximized ? "Restore window" : "Maximize window"}
            >
              {isMaximized ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              className="text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              onClick={onClose}
              title="Close debugger"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </header>

        {/* Trace Metadata Ribbon */}
        <div className="flex items-center gap-3 px-4 py-2 bg-muted/20 border-b border-border text-xs shrink-0 flex-wrap select-none">
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground font-sans"># Trace ID:</span>
            <code className="px-1.5 py-0.5 rounded bg-muted/60 text-foreground border border-border font-sans text-[11px]">
              {traceId}
            </code>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground font-sans">Endpoint:</span>
            <span className="px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-700 dark:text-sky-400 border border-sky-500/25 text-[11px] font-sans">
              {endpoint}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground font-sans">Queries in Trace:</span>
            <span className="px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-700 dark:text-purple-400 border border-purple-500/25 text-[11px] font-sans">
              {queryList.length} statement(s)
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground font-sans">Trace Latency:</span>
            <span className="text-emerald-700 dark:text-emerald-400 font-semibold text-[11px] font-sans">
              {traceLatency}
            </span>
          </div>
        </div>

        {/* Action Buttons Toolbar with Brand Emerald Primary Button */}
        <div className="flex items-center justify-between px-4 py-2 bg-card border-b border-border shrink-0 gap-2 flex-wrap select-none">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-xs transition-all disabled:opacity-50 cursor-pointer font-sans"
              onClick={() => handleRunQuery("run")}
              disabled={executing}
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              <span>{executing ? "Executing…" : "Run Query"}</span>
              <kbd className="ml-1 text-[9px] bg-emerald-700 text-white px-1 rounded opacity-90 font-sans">
                Ctrl+Enter
              </kbd>
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="flex items-center gap-1.5 border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 text-xs font-medium transition-colors cursor-pointer font-sans"
              onClick={() => handleRunQuery("analyze")}
              disabled={executing}
            >
              <BarChart3 className="h-3.5 w-3.5" />
              <span>Analyze Stats</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="flex items-center gap-1.5 bg-muted/60 hover:bg-muted text-foreground text-xs transition-colors cursor-pointer font-sans"
              onClick={() => handleCopy(inlinedSql, "exec")}
            >
              {copiedKey === "exec" ? (
                <Check className="h-3.5 w-3.5 text-emerald-700 dark:text-emerald-400" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
              <span>{copiedKey === "exec" ? "Copied!" : "Copy Executable"}</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="flex items-center gap-1.5 bg-muted/60 hover:bg-muted text-foreground text-xs transition-colors cursor-pointer font-sans"
              onClick={() => handleCopy(statsSql, "stats")}
            >
              {copiedKey === "stats" ? (
                <Check className="h-3.5 w-3.5 text-emerald-700 dark:text-emerald-400" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
              <span>{copiedKey === "stats" ? "Copied!" : "Copy with Stats"}</span>
            </Button>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors ml-auto cursor-pointer font-sans"
            onClick={handleReset}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset Original</span>
          </Button>
        </div>

        {/* Resizable Panels System (Exactly like MESProductionReport) */}
        <div className="flex-1 flex overflow-hidden min-h-0">
          <ResizablePanelGroup direction="horizontal" className="flex-1 min-h-0">
            {/* Panel 1: Left Trace Queries Selector */}
            <ResizablePanel
              defaultSize={22}
              minSize={15}
              maxSize={35}
              className="flex flex-col min-h-0 bg-muted/20 border-r border-border select-none"
            >
              <div className="p-3 border-b border-border text-xs font-semibold text-foreground flex items-center justify-between shrink-0">
                <span className="flex items-center gap-1.5 font-sans">
                  <Layers className="h-3.5 w-3.5 text-emerald-700 dark:text-emerald-400" /> Trace
                  Queries ({queryList.length})
                </span>
                <span className="text-[11px] font-normal text-muted-foreground font-sans">
                  Click to select
                </span>
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
                {queryList.map((q, idx) => (
                  <Button
                    key={idx}
                    type="button"
                    variant="ghost"
                    className={`w-full p-2.5 h-auto text-left rounded-lg border transition-all cursor-pointer font-normal justify-start ${
                      selectedIndex === idx
                        ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-700 dark:text-emerald-400 shadow-xs"
                        : "bg-card border-border hover:bg-muted text-foreground"
                    }`}
                    onClick={() => setSelectedIndex(idx)}
                  >
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <strong
                        className={
                          selectedIndex === idx
                            ? "text-emerald-700 dark:text-emerald-400 font-sans"
                            : "text-foreground font-sans"
                        }
                      >
                        Query #{idx + 1}
                      </strong>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-sans">
                        {q.durationMs ? `${q.durationMs}ms` : "30ms"}
                      </span>
                    </div>
                    <code className="text-[10px] text-muted-foreground line-clamp-2 font-sans block leading-snug">
                      {q.sql.slice(0, 90)}…
                    </code>
                  </Button>
                ))}
              </div>
            </ResizablePanel>

            <ResizableHandle withHandle />

            {/* Panel 2: Right side (Top: SQL Editor + Parameters | Bottom: Results Grid & Stats) */}
            <ResizablePanel defaultSize={78} className="flex flex-col min-h-0 min-w-0">
              <ResizablePanelGroup direction="vertical" className="flex-1 min-h-0">
                {/* Top Panel: SQL Editor & Parameters JSON (Horizontal split) */}
                <ResizablePanel
                  defaultSize={46}
                  minSize={25}
                  maxSize={70}
                  className="flex flex-col min-h-0 bg-background border-b border-border"
                >
                  <ResizablePanelGroup direction="horizontal" className="flex-1 min-h-0">
                    {/* T-SQL Query Editor */}
                    <ResizablePanel
                      defaultSize={70}
                      minSize={40}
                      className="flex flex-col min-h-0 min-w-0 bg-background"
                    >
                      <div className="flex items-center justify-between px-3 py-1.5 bg-muted/40 border-b border-border text-xs select-none">
                        <span className="text-[11px] font-medium text-foreground font-sans flex items-center gap-1.5">
                          <Code2 className="h-3.5 w-3.5 text-sky-500" />
                          T-SQL QUERY (SELECT / DECLARE ONLY)
                        </span>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="xs"
                            className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] bg-muted hover:bg-accent text-sky-700 dark:text-sky-400 border border-border font-semibold transition-colors cursor-pointer font-sans"
                            onClick={handleUppercase}
                          >
                            <Wand2 className="h-3 w-3" />
                            <span>UPPERCASE</span>
                          </Button>
                          <span className="text-[10px] text-muted-foreground font-sans">
                            {lineCount} LINES · {charCount} CHARS
                          </span>
                        </div>
                      </div>
                      <textarea
                        value={sqlText}
                        onChange={(e) => setSqlText(e.target.value)}
                        className="flex-1 p-3 bg-transparent text-foreground font-sans text-xs leading-relaxed outline-none resize-none placeholder:text-muted-foreground"
                        spellCheck={false}
                        placeholder="SELECT ... FROM ..."
                      />
                    </ResizablePanel>

                    <ResizableHandle withHandle />

                    {/* Parameters JSON Editor */}
                    <ResizablePanel
                      defaultSize={30}
                      minSize={20}
                      className="flex flex-col min-h-0 min-w-0 bg-background"
                    >
                      <div className="flex items-center justify-between px-3 py-1.5 bg-muted/40 border-b border-border text-xs select-none">
                        <span className="text-[11px] font-medium text-foreground font-sans flex items-center gap-1.5">
                          <Database className="h-3.5 w-3.5 text-amber-500" />
                          PARAMETERS (JSON)
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="xs"
                          className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] bg-muted hover:bg-accent text-emerald-700 dark:text-emerald-400 border border-border font-semibold transition-colors cursor-pointer font-sans"
                          onClick={handleFormatJson}
                        >
                          <span>Format</span>
                        </Button>
                      </div>
                      <textarea
                        value={paramsText}
                        onChange={(e) => setParamsText(e.target.value)}
                        className="flex-1 p-3 bg-transparent text-foreground font-sans text-xs leading-relaxed outline-none resize-none placeholder:text-muted-foreground"
                        spellCheck={false}
                        placeholder='{ "param": "value" }'
                      />
                    </ResizablePanel>
                  </ResizablePanelGroup>
                </ResizablePanel>

                <ResizableHandle withHandle />

                {/* Bottom Panel: Results Area (Data Grid | IO Stats | Inlined Script) */}
                <ResizablePanel
                  defaultSize={54}
                  minSize={25}
                  className="flex flex-col min-h-0 bg-card"
                >
                  {/* Sub-tabs header */}
                  <div className="flex items-center justify-between px-3 border-b border-border bg-muted/30 select-none shrink-0">
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 rounded-none transition-colors cursor-pointer font-sans ${
                          activeTab === "grid"
                            ? "border-emerald-600 dark:border-emerald-500 text-emerald-700 dark:text-emerald-400 font-semibold bg-transparent"
                            : "border-transparent text-muted-foreground hover:text-foreground hover:bg-transparent"
                        }`}
                        onClick={() => setActiveTab("grid")}
                      >
                        <TableIcon className="h-3.5 w-3.5" />
                        <span>Data Grid ({filteredRows.length})</span>
                      </Button>

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 rounded-none transition-colors cursor-pointer font-sans ${
                          activeTab === "stats"
                            ? "border-amber-500 text-amber-700 dark:text-amber-400 font-semibold bg-transparent"
                            : "border-transparent text-muted-foreground hover:text-foreground hover:bg-transparent"
                        }`}
                        onClick={() => setActiveTab("stats")}
                      >
                        <BarChart3 className="h-3.5 w-3.5" />
                        <span>Performance & IO Stats</span>
                      </Button>

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 rounded-none transition-colors cursor-pointer font-sans ${
                          activeTab === "inlined"
                            ? "border-sky-500 text-sky-700 dark:text-sky-400 font-semibold bg-transparent"
                            : "border-transparent text-muted-foreground hover:text-foreground hover:bg-transparent"
                        }`}
                        onClick={() => setActiveTab("inlined")}
                      >
                        <FileCode className="h-3.5 w-3.5" />
                        <span>Inlined Executable Script</span>
                      </Button>
                    </div>

                    {activeTab === "grid" && hasExecuted && (
                      <div className="flex items-center gap-1.5 my-1">
                        <Search className="h-3 w-3 text-muted-foreground" />
                        <Input
                          type="text"
                          value={searchFilter}
                          onChange={(e) => setSearchFilter(e.target.value)}
                          placeholder="Search across all returned cells…"
                          className="h-6 w-52 px-2 rounded bg-background border border-border text-[11px] text-foreground outline-none font-sans"
                        />
                      </div>
                    )}
                  </div>

                  {/* Results Tab Body */}
                  <div className="flex-1 overflow-auto p-3 bg-card min-h-0">
                    {!hasExecuted ? (
                      <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                        <Database className="h-8 w-8 text-muted-foreground/40 mb-2" />
                        <p className="text-xs font-sans">
                          Ready to execute. Click{" "}
                          <strong className="text-emerald-700 dark:text-emerald-400 font-sans">
                            [▶ Run Query]
                          </strong>{" "}
                          or press{" "}
                          <kbd className="px-1.5 py-0.5 rounded bg-muted text-foreground font-sans text-[10px] border border-border">
                            Ctrl+Enter
                          </kbd>
                          .
                        </p>
                      </div>
                    ) : activeTab === "grid" ? (
                      <div className="w-full overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse border border-border">
                          <thead>
                            <tr className="border-b border-border text-muted-foreground bg-muted/40">
                              {columns.map((col) => (
                                <th
                                  key={col}
                                  className="p-2 font-semibold font-sans text-[11px] border border-border"
                                >
                                  {col}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {filteredRows.map((row, rIdx) => (
                              <tr
                                key={rIdx}
                                className="border-b border-border hover:bg-muted/40 transition-colors"
                              >
                                {columns.map((col) => (
                                  <td
                                    key={col}
                                    className="p-2 font-sans text-[11px] text-foreground border border-border"
                                  >
                                    {getRowValue(row, col)}
                                  </td>
                                ))}
                              </tr>
                            ))}
                            {filteredRows.length === 0 && (
                              <tr>
                                <td
                                  colSpan={columns.length}
                                  className="p-4 text-center text-muted-foreground font-sans"
                                >
                                  No matching records found.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    ) : activeTab === "stats" ? (
                      <div className="flex flex-col gap-3 font-sans text-xs">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          <div className="p-2.5 rounded bg-muted/30 border border-border">
                            <span className="text-[10px] text-muted-foreground block font-sans">
                              DURATION
                            </span>
                            <strong className="text-sm text-emerald-700 dark:text-emerald-400 font-semibold font-sans">
                              {executionStats?.durationMs} ms
                            </strong>
                          </div>
                          <div className="p-2.5 rounded bg-muted/30 border border-border">
                            <span className="text-[10px] text-muted-foreground block font-sans">
                              LOGICAL READS
                            </span>
                            <strong className="text-sm text-foreground font-semibold font-sans">
                              {executionStats?.logicalReads} pages
                            </strong>
                          </div>
                          <div className="p-2.5 rounded bg-muted/30 border border-border">
                            <span className="text-[10px] text-muted-foreground block font-sans">
                              PHYSICAL READS
                            </span>
                            <strong className="text-sm text-foreground font-semibold font-sans">
                              {executionStats?.physicalReads}
                            </strong>
                          </div>
                          <div className="p-2.5 rounded bg-muted/30 border border-border">
                            <span className="text-[10px] text-muted-foreground block font-sans">
                              SCAN COUNT
                            </span>
                            <strong className="text-sm text-amber-700 dark:text-amber-400 font-semibold font-sans">
                              {executionStats?.scanCount}
                            </strong>
                          </div>
                        </div>

                        <div className="p-3 rounded bg-muted/20 border border-border text-foreground/80 whitespace-pre font-sans text-[11px]">
                          {`SQL Server Execution Times:\n  CPU time = 15 ms, elapsed time = ${executionStats?.executionTimeMs} ms.\nTable '${executionStats?.table}'. Scan count ${executionStats?.scanCount}, logical reads ${executionStats?.logicalReads}, physical reads ${executionStats?.physicalReads}.`}
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2">
                        <div className="flex justify-between items-center text-xs text-muted-foreground">
                          <span className="font-sans">
                            Executable SQL Script with inline parameter substitution:
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="xs"
                            className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer font-sans h-auto p-0"
                            onClick={() => handleCopy(inlinedSql, "inlined_tab")}
                          >
                            {copiedKey === "inlined_tab" ? (
                              <Check className="h-3 w-3" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                            <span>Copy Script</span>
                          </Button>
                        </div>
                        <pre className="p-3 rounded bg-muted/20 border border-border text-foreground font-sans text-xs overflow-x-auto whitespace-pre-wrap">
                          {inlinedSql}
                        </pre>
                      </div>
                    )}
                  </div>
                </ResizablePanel>
              </ResizablePanelGroup>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </DialogContent>
    </Dialog>
  );
}
