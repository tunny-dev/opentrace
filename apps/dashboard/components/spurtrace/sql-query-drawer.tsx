"use client";

import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import {
  AlertTriangle,
  Check,
  Clipboard,
  Copy,
  Database,
  ExternalLink,
  FileCode,
  Layers,
  Sparkles,
  X,
} from "lucide-react";
import type { AggregatedQuery } from "@/lib/spurtrace/sql-analytics";
import type { UserRole } from "./user-profile-menu";
import { buildExplainPlan, formatSql } from "@/lib/spurtrace/sql-analytics";
import { SqlSyntax } from "./sql-syntax";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatDuration } from "@/lib/spurtrace/format-duration";

export function SqlQueryDrawer({
  query,
  role,
  onClose,
  onOpenStudio,
}: {
  query: AggregatedQuery;
  role: UserRole;
  onClose: () => void;
  onOpenStudio?: (queryText: string) => void;
}) {
  const [activeTab, setActiveTab] = useState<"inspector" | "explain">("inspector");
  const [formatted, setFormatted] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const plan = buildExplainPlan(query.template);
  const hasWarning = plan.some((node) => node.severity === "warning");
  const displayedSql = formatted ? formatSql(query.template) : query.template;

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

  async function copySql() {
    try {
      await navigator.clipboard.writeText(query.template);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  const statementColor =
    query.statementType === "SELECT"
      ? "bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/25"
      : query.statementType === "INSERT"
        ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/25"
        : query.statementType === "UPDATE"
          ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/25"
          : "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/25";

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex justify-end transition-all duration-300",
        isClosing ? "animate-out fade-out-0 duration-250" : "animate-in fade-in-0 duration-300"
      )}
      role="presentation"
      onMouseDown={(event) => event.target === event.currentTarget && handleClose()}
    >
      <aside
        className={cn(
          "w-full sm:w-[620px] lg:w-[720px] h-full bg-card text-card-foreground border-l border-border shadow-2xl flex flex-col transition-all duration-300 ease-in-out overflow-hidden",
          isClosing ? "animate-out slide-out-to-right duration-250" : "animate-in slide-in-from-right duration-300"
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby="sql-query-title"
      >
        {/* Top Header */}
        <header className="flex items-center justify-between px-5 py-3.5 bg-muted/40 border-b border-border shrink-0 select-none">
          <div className="min-w-0 pr-3">
            <div className="text-[10px] font-semibold text-muted-foreground tracking-wider uppercase flex items-center gap-1.5 font-sans">
              <span>GLOBAL QUERY PROFILE</span>
              <span>·</span>
              <span>{query.totalCalls.toLocaleString()} CALLS</span>
            </div>
            <div className="flex items-center gap-2 mt-1 min-w-0">
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold border font-sans uppercase shrink-0 ${statementColor}`}
              >
                {query.statementType}
              </span>
              <h2
                id="sql-query-title"
                className="text-sm font-semibold text-foreground truncate font-sans"
              >
                {query.fingerprint}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onOpenStudio && (
              <Button
                type="button"
                className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer font-sans"
                size="sm"
                onClick={() => onOpenStudio(query.sampleQuery || query.template)}
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Open in Studio</span>
              </Button>
            )}
            <Button
              className="text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              variant="ghost"
              size="icon-sm"
              type="button"
              onClick={handleClose}
              aria-label="Close SQL query details"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </header>

        {/* 3 Metric KPI Cards */}
        <div className="grid grid-cols-3 gap-3 p-4 bg-muted/20 border-b border-border shrink-0">
          <div className="p-3 rounded-lg bg-card border border-border shadow-xs">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block font-sans">
              AVG LATENCY
            </span>
            <strong className="text-base font-bold text-foreground mt-0.5 block font-sans">
              {formatDuration(query.avgLatencyMs)}
            </strong>
          </div>
          <div className="p-3 rounded-lg bg-card border border-border shadow-xs">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block font-sans">
              P95 LATENCY
            </span>
            <strong className="text-base font-bold text-foreground mt-0.5 block font-sans">
              {formatDuration(query.p95LatencyMs)}
            </strong>
          </div>
          <div className="p-3 rounded-lg bg-card border border-border shadow-xs">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block font-sans">
              DB IMPACT
            </span>
            <strong className="text-base font-bold text-emerald-700 dark:text-emerald-400 mt-0.5 block font-sans">
              {query.impactPct.toFixed(1)}%
            </strong>
          </div>
        </div>

        {/* Sub-tabs header */}
        <div
          className="flex items-center gap-2 px-5 bg-card border-b border-border shrink-0 select-none"
          role="tablist"
        >
          <Button
            type="button"
            role="tab"
            variant="ghost"
            aria-selected={activeTab === "inspector"}
            className={`flex items-center gap-2 py-2.5 px-3 text-xs font-semibold border-b-2 rounded-none transition-colors cursor-pointer font-sans ${
              activeTab === "inspector"
                ? "border-emerald-600 dark:border-emerald-500 text-emerald-700 dark:text-emerald-400 bg-transparent"
                : "border-transparent text-muted-foreground hover:text-foreground hover:bg-transparent"
            }`}
            onClick={() => setActiveTab("inspector")}
          >
            <Database className="h-4 w-4" />
            <span>Query Inspector</span>
          </Button>
          <Button
            type="button"
            role="tab"
            variant="ghost"
            aria-selected={activeTab === "explain"}
            className={`flex items-center gap-2 py-2.5 px-3 text-xs font-semibold border-b-2 rounded-none transition-colors cursor-pointer font-sans ${
              activeTab === "explain"
                ? "border-emerald-600 dark:border-emerald-500 text-emerald-700 dark:text-emerald-400 bg-transparent"
                : "border-transparent text-muted-foreground hover:text-foreground hover:bg-transparent"
            }`}
            onClick={() => setActiveTab("explain")}
          >
            <FileCode className="h-4 w-4" />
            <span>Simulated EXPLAIN</span>
          </Button>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">
          {activeTab === "inspector" ? (
            <div className="flex flex-col gap-4">
              {/* Query Template Card */}
              <article className="flex flex-col rounded-lg bg-card border border-border overflow-hidden shadow-xs">
                <div className="flex items-center justify-between px-4 py-2.5 bg-muted/40 border-b border-border flex-wrap gap-2">
                  <div>
                    <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider font-sans block">
                      QUERY TEMPLATE
                    </span>
                    <span className="text-[11px] text-muted-foreground font-sans">
                      Literals normalized to placeholders
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="outline"
                      size="xs"
                      className="text-foreground hover:bg-muted text-xs font-medium font-sans"
                      type="button"
                      onClick={() => setFormatted((value) => !value)}
                    >
                      {formatted ? "Compact SQL" : "Format SQL"}
                    </Button>
                    <Button
                      variant="outline"
                      size="xs"
                      className="flex items-center gap-1 text-foreground hover:bg-muted text-xs font-medium font-sans"
                      type="button"
                      onClick={() => void copySql()}
                    >
                      {copied ? (
                        <Check className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                      <span>{copied ? "Copied" : "Copy"}</span>
                    </Button>
                  </div>
                </div>

                <div className="p-4 bg-background border-b border-border text-foreground font-sans text-xs leading-relaxed overflow-x-auto whitespace-pre-wrap">
                  <SqlSyntax sql={displayedSql} />
                </div>
              </article>

              {/* N+1 Warning Banner */}
              {query.nPlusOneRoutes.length > 0 && (
                <div className="p-3.5 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-300 flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div className="text-xs font-sans">
                    <strong className="block font-semibold">N+1 Query Pattern Detected</strong>
                    <p className="mt-1 leading-relaxed opacity-90">
                      This fingerprint repeated up to{" "}
                      <strong>{query.maxDuplicateCount} times</strong> in a single request across{" "}
                      {query.nPlusOneRoutes.length} N+1 route
                      {query.nPlusOneRoutes.length === 1 ? "" : "s"}. Consider eager loading or a
                      JOIN FETCH to batch related records.
                    </p>
                  </div>
                </div>
              )}

              {/* Call Site */}
              <div className="p-3.5 rounded-lg bg-card border border-border flex flex-col gap-1.5 shadow-xs">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider font-sans">
                  CALL SITE · DEMO FRAMEWORK TRACE
                </span>
                <div className="flex items-center gap-2 text-xs font-sans">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                  <code className="text-foreground font-sans font-semibold">{query.callSite}</code>
                  <span className="text-[11px] text-muted-foreground ml-auto">
                    sampled source location
                  </span>
                </div>
              </div>

              {/* Associated Routes */}
              <div className="p-3.5 rounded-lg bg-card border border-border flex flex-col gap-2 shadow-xs">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider font-sans">
                  ASSOCIATED ROUTES ({query.routes.length})
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {query.routes.map((route) => (
                    <span
                      key={route}
                      className="px-2.5 py-1 rounded bg-muted text-foreground border border-border text-xs font-sans font-medium"
                    >
                      {route}
                    </span>
                  ))}
                </div>
              </div>

              {/* Sample Bind Values */}
              {query.sampleBindValues && (
                <div className="p-3.5 rounded-lg bg-card border border-border flex flex-col gap-2 shadow-xs">
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider font-sans">
                    SAMPLE BIND VALUES (FIXTURE PREVIEW ·{" "}
                    {role === "Viewer" ? "MASKED" : "ADMIN VIEW"})
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {query.sampleBindValues.map((value, index) => (
                      <code
                        key={`${index}-${value}`}
                        className="px-2 py-0.5 rounded bg-muted text-foreground font-sans text-xs border border-border"
                      >
                        {role === "Viewer" ? "***" : String(value)}
                      </code>
                    ))}
                  </div>
                </div>
              )}

              {/* Fingerprint */}
              <div className="p-3.5 rounded-lg bg-card border border-border flex flex-col gap-2 shadow-xs">
                <div className="flex items-center justify-between text-[10px] font-semibold text-muted-foreground uppercase tracking-wider font-sans">
                  <span>QUERY FINGERPRINT</span>
                  <Button
                    variant="ghost"
                    size="xs"
                    className="flex items-center gap-1 text-sky-700 dark:text-sky-400 hover:underline cursor-pointer font-sans p-0 h-auto"
                    type="button"
                    onClick={() => void copySql()}
                  >
                    {copied ? <Check className="h-3 w-3" /> : <Clipboard className="h-3 w-3" />}
                    <span>Copy</span>
                  </Button>
                </div>
                <code className="p-2.5 rounded bg-muted/30 border border-border text-muted-foreground font-sans text-[11px] block overflow-x-auto leading-relaxed">
                  {query.fingerprint}
                </code>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="p-3 rounded-lg bg-muted/30 border border-border flex items-center justify-between text-xs font-sans">
                <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-semibold border border-emerald-500/25 text-[10px]">
                  SIMULATED PLAN
                </span>
                <span className="text-muted-foreground">
                  Preview only · no database connection was queried
                </span>
              </div>

              {hasWarning && (
                <div className="p-3.5 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-300 flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div className="text-xs font-sans">
                    <strong className="block font-semibold">Potential full table scan</strong>
                    <span className="text-muted-foreground">
                      Review the predicate and consider a selective index before production use.
                    </span>
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-2" role="list">
                {plan.map((node, index) => (
                  <div
                    key={`${node.label}-${index}`}
                    className={`p-3 rounded-lg border flex items-center gap-3 transition-colors ${
                      node.severity
                        ? "bg-amber-500/10 border-amber-500/30 text-foreground"
                        : "bg-card border-border text-foreground shadow-xs"
                    }`}
                    style={{ marginLeft: `${node.level * 16}px` }}
                    role="listitem"
                  >
                    <span className="text-muted-foreground shrink-0">
                      {node.severity ? (
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                      ) : index === 0 ? (
                        <Database className="h-4 w-4 text-sky-500" />
                      ) : (
                        <span className="font-sans text-xs">↳</span>
                      )}
                    </span>
                    <div className="flex flex-col min-w-0 font-sans">
                      <strong className="text-xs font-semibold text-foreground">
                        {node.label}
                      </strong>
                      <span className="text-[11px] text-muted-foreground">{node.detail}</span>
                    </div>
                    {node.severity && (
                      <span className="ml-auto px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-700 dark:text-amber-400 shrink-0">
                        WARNING
                      </span>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-4 text-[11px] text-muted-foreground pt-2 border-t border-border font-sans flex-wrap">
                <span className="flex items-center gap-1.5">
                  <i className="h-2 w-2 rounded-full bg-emerald-500" />
                  Index access
                </span>
                <span className="flex items-center gap-1.5">
                  <i className="h-2 w-2 rounded-full bg-amber-500" />
                  Sequential scan
                </span>
                <span className="ml-auto">Costs are illustrative, not DB output</span>
              </div>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
