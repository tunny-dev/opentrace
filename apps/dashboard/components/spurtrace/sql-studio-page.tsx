"use client";

import { useMemo, useState } from "react";
import {
  Activity,
  ArrowDown,
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Database,
  Search,
  Sparkles,
  Zap,
} from "lucide-react";
import type { DemoTrace } from "@/lib/spurtrace/demo-data";
import { useTelemetry } from "@/lib/spurtrace/telemetry-context";
import {
  aggregateQueries,
  type AggregatedQuery,
  type StatementType,
} from "@/lib/spurtrace/sql-analytics";
import { SqlQueryDrawer } from "./sql-query-drawer";
import { SqlStudioModal, type StudioQueryItem } from "./sql-studio-modal";
import type { UserRole } from "./user-profile-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatDuration } from "@/lib/spurtrace/format-duration";

const statementTypes: Array<StatementType | "ALL"> = [
  "ALL",
  "SELECT",
  "UPDATE",
  "INSERT",
  "DELETE",
  "OTHER",
];

export function SqlStudioPage({ traces, role }: { traces: DemoTrace[]; role: UserRole }) {
  const { openTraceFromLog } = useTelemetry();
  const [search, setSearch] = useState("");
  const [statementFilter, setStatementFilter] = useState<StatementType | "ALL">("ALL");
  const [sortByImpact, setSortByImpact] = useState(true);
  const [selectedQuery, setSelectedQuery] = useState<AggregatedQuery | null>(null);
  const [studioOpen, setStudioOpen] = useState(false);
  const [studioInitialQuery, setStudioInitialQuery] = useState<StudioQueryItem | null>(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const closeStudio = () => {
    setStudioOpen(false);
  };

  const queries = useMemo(() => aggregateQueries(traces), [traces]);
  const visibleQueries = useMemo(
    () =>
      queries
        .filter((query) => statementFilter === "ALL" || query.statementType === statementFilter)
        .filter((query) =>
          `${query.template} ${query.routes.join(" ")} ${query.callSite} ${query.sampleTraceId || ""}`
            .toLowerCase()
            .includes(search.trim().toLowerCase())
        )
        .sort((left, right) =>
          sortByImpact ? right.impactPct - left.impactPct : right.totalCalls - left.totalCalls
        ),
    [queries, statementFilter, search, sortByImpact]
  );

  const totalPages = Math.max(1, Math.ceil(visibleQueries.length / pageSize));
  const paginatedQueries = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return visibleQueries.slice(start, start + pageSize);
  }, [visibleQueries, currentPage, pageSize]);

  // Reset to page 1 on search or filter change
  useMemo(() => {
    setCurrentPage(1);
  }, [search, statementFilter]);

  const totalCalls = useMemo(
    () => queries.reduce((total, query) => total + query.totalCalls, 0),
    [queries]
  );
  const totalDbTime = useMemo(
    () => queries.reduce((total, query) => total + query.totalDurationMs, 0),
    [queries]
  );
  const nPlusOneCount = useMemo(
    () => queries.filter((query) => query.nPlusOneRoutes.length > 0).length,
    [queries]
  );
  const studioQueries = useMemo<StudioQueryItem[]>(
    () =>
      visibleQueries.slice(0, 5).map((q, i) => {
        const fullSql = q.sampleQuery || q.template;
        let params: Record<string, any> = {};
        if ((q as any).parameters && typeof (q as any).parameters === "object" && Object.keys((q as any).parameters).length > 0) {
          params = (q as any).parameters;
        } else {
          const matches = fullSql.match(/@([a-zA-Z0-9_]+)/g);
          if (matches) {
            matches.forEach((m) => {
              const pName = m.substring(1);
              if (!(pName in params)) params[pName] = "";
            });
          }
        }
        return {
          id: `prof_${i}`,
          sql: fullSql,
          paramsJson: params,
          durationMs: Math.round(q.avgLatencyMs),
        };
      }),
    [visibleQueries]
  );
  const studioModalQueries = useMemo(
    () => (studioInitialQuery ? [studioInitialQuery] : studioQueries),
    [studioInitialQuery, studioQueries]
  );

  function handleOpenStudioWithSql(sql: string) {
    let params: Record<string, any> = {};
    const matches = sql.match(/@([a-zA-Z0-9_]+)/g);
    if (matches) {
      matches.forEach((m) => {
        const pName = m.substring(1);
        if (!(pName in params)) params[pName] = "";
      });
    }
    setStudioInitialQuery({
      sql,
      paramsJson: params,
      durationMs: 45,
    });
    setStudioOpen(true);
  }

  return (
    <div className="sql-studio-page flex flex-col gap-4">
      {/* Workspace Context Bar */}
      <div className="sql-workspace-context flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="collector-dot" />
          <span className="text-xs text-(--ot-muted) font-sans">
            {traces.length} traces analyzed across fleet
          </span>
        </div>
        <div className="flex items-center gap-2.5">
          {role === "Viewer" && (
            <span className="sql-role-notice font-sans">VIEWER · VALUES MASKED</span>
          )}
          <Button
            type="button"
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer font-sans"
            onClick={() => {
              setStudioInitialQuery(null);
              setStudioOpen(true);
            }}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Open SQL Studio & Debugger</span>
          </Button>
        </div>
      </div>

      {/* 4 Metric KPI Cards */}
      <section className="sql-metrics-grid" aria-label="SQL profile summary">
        <article className="sql-metric-card">
          <div>
            <Database aria-hidden="true" />
            <span>FINGERPRINTS</span>
          </div>
          <strong>{queries.length}</strong>
          <small>normalized query shapes</small>
        </article>
        <article className="sql-metric-card">
          <div>
            <Activity aria-hidden="true" />
            <span>TOTAL CALLS</span>
          </div>
          <strong>{totalCalls.toLocaleString()}</strong>
          <small>across filtered traces</small>
        </article>
        <article className="sql-metric-card">
          <div>
            <Zap aria-hidden="true" />
            <span>DATABASE TIME</span>
          </div>
          <strong>{formatDuration(totalDbTime)}</strong>
          <small>estimated from fixture samples</small>
        </article>
        <article className="sql-metric-card sql-metric-warning">
          <div>
            <Activity aria-hidden="true" />
            <span>N+1 PATTERNS</span>
          </div>
          <strong>{nPlusOneCount}</strong>
          <small>fingerprints repeated per request</small>
        </article>
      </section>

      {/* Query Analytics Panel */}
      <section className="panel-card sql-analytics-panel" aria-labelledby="sql-analytics-heading">
        <header className="sql-analytics-header flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="section-kicker">QUERY ANALYTICS</div>
            <div className="table-title-row">
              <h2 id="sql-analytics-heading">Global query aggregation</h2>
              <span className="trace-count">{visibleQueries.length} fingerprints</span>
            </div>
          </div>
          <div className="sql-analytics-controls flex items-center gap-2 flex-wrap">
            {/* Shadcn Select for Statement Type */}
            <Select
              value={statementFilter}
              onValueChange={(val) => setStatementFilter(val as StatementType | "ALL")}
            >
              <SelectTrigger
                size="sm"
                className="h-7 text-xs px-2.5 rounded-md min-w-[130px] bg-background border-border text-foreground shadow-xs font-sans gap-2 cursor-pointer"
              >
                <span className="truncate">
                  {statementFilter === "ALL" ? "All statements" : statementFilter}
                </span>
              </SelectTrigger>
              <SelectContent className="bg-popover border-border text-popover-foreground text-xs shadow-md font-sans">
                {statementTypes.map((type) => (
                  <SelectItem key={type} value={type} className="text-xs cursor-pointer font-sans">
                    {type === "ALL" ? "All statements" : type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Label className="sql-search flex items-center cursor-pointer">
              <Search aria-hidden="true" />
              <Input
                aria-label="Search query fingerprints"
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search SQL or route…"
                className="font-sans border-0 bg-transparent focus-visible:ring-0 shadow-none h-7"
              />
            </Label>
          </div>
        </header>

        <div className="sql-table-scroll">
          <table className="sql-analytics-table">
            <thead>
              <tr>
                <th scope="col" className="w-12 font-sans">
                  STT
                </th>
                <th scope="col" className="font-sans">
                  QUERY TEMPLATE
                </th>
                <th scope="col" className="font-sans">
                  TRACE ID
                </th>
                <th scope="col">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="sql-sort-button font-sans h-auto p-0 hover:bg-transparent font-medium"
                    type="button"
                    onClick={() => setSortByImpact((value) => !value)}
                  >
                    {sortByImpact ? "TOTAL IMPACT" : "CALLS COUNT"}
                    {sortByImpact ? (
                      <ArrowDown aria-hidden="true" />
                    ) : (
                      <ArrowUp aria-hidden="true" />
                    )}
                  </Button>
                </th>
                <th scope="col" className="font-sans">
                  CALLS
                </th>
                <th scope="col" className="font-sans">
                  AVG / P95
                </th>
                <th scope="col" className="font-sans">
                  N+1
                </th>
                <th scope="col" className="font-sans">
                  ASSOCIATED ROUTES
                </th>
                <th scope="col">
                  <span className="sr-only">Open query details</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedQueries.map((query, idx) => (
                <tr
                  key={query.fingerprint}
                  tabIndex={0}
                  onClick={() => setSelectedQuery(query)}
                  onKeyDown={(event) => event.key === "Enter" && setSelectedQuery(query)}
                  aria-label={`Inspect ${query.statementType} query ${query.fingerprint}`}
                  className="cursor-pointer"
                >
                  <td className="text-[11px] tabular-nums text-(--ot-muted) font-sans">
                    {(currentPage - 1) * pageSize + idx + 1}
                  </td>
                  <td>
                    <div className="sql-template-cell">
                      <Badge
                        variant="outline"
                        size="sm"
                        className={cn(
                          "font-mono font-bold text-[10px] uppercase shrink-0",
                          query.statementType === "SELECT"
                            ? "border-sky-500/25 bg-sky-500/10 text-sky-600 dark:text-sky-400"
                            : query.statementType === "UPDATE"
                              ? "border-amber-500/25 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                              : query.statementType === "INSERT"
                                ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                : "border-rose-500/25 bg-rose-500/10 text-rose-600 dark:text-rose-400"
                        )}
                      >
                        {query.statementType}
                      </Badge>
                      <code className="font-sans font-medium text-xs text-foreground">
                        {query.template}
                      </code>
                      <small className="font-sans font-mono text-[10px] text-muted-foreground">
                        {query.fingerprint.slice(0, 16)}
                      </small>
                    </div>
                  </td>
                  <td onClick={(e) => e.stopPropagation()}>
                    {query.sampleTraceId ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="xs"
                        onClick={() => openTraceFromLog(query.sampleTraceId!)}
                        className="h-6 px-1.5 font-mono text-[11px] text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/25 rounded cursor-pointer"
                        title={`Trace ID: ${query.sampleTraceId} (Click để mở vết chi tiết)`}
                      >
                        #{query.sampleTraceId.slice(0, 8)}…
                      </Button>
                    ) : (
                      <span className="text-muted-foreground font-mono text-[10px]">—</span>
                    )}
                  </td>
                  <td>
                    <div className="impact-cell font-sans">
                      <strong className="font-sans font-semibold text-xs tabular-nums">
                        {query.impactPct.toFixed(1)}%
                      </strong>
                      <div className="impact-track">
                        <i style={{ width: `${Math.min(100, query.impactPct)}%` }} />
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="sql-calls-count font-sans font-mono text-xs tabular-nums">
                      {query.totalCalls.toLocaleString()}
                    </span>
                  </td>
                  <td>
                    <div className="latency-pair font-sans">
                      <strong className="font-sans font-mono text-xs tabular-nums">
                        {formatDuration(query.avgLatencyMs)}
                      </strong>
                      <small className="font-sans font-mono text-[10px] text-muted-foreground tabular-nums">
                        {formatDuration(query.p95LatencyMs)}
                      </small>
                    </div>
                  </td>
                  <td>
                    {query.nPlusOneRoutes.length > 0 ? (
                      <Badge variant="purple" size="sm" className="gap-1 font-bold">
                        <span className="size-1.5 rounded-full bg-purple-500 animate-pulse" />
                        N+1 ({query.nPlusOneRoutes.length})
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground font-sans text-xs">—</span>
                    )}
                  </td>
                  <td>
                    <div className="associated-routes font-sans">
                      {query.routes.slice(0, 2).map((route) => (
                        <span className="route-chip font-sans" key={route}>
                          {route}
                        </span>
                      ))}
                      {query.routes.length > 2 && (
                        <span className="route-more font-sans">+{query.routes.length - 2}</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <ChevronRight className="sql-row-chevron" aria-hidden="true" />
                  </td>
                </tr>
              ))}
              {visibleQueries.length === 0 && (
                <tr>
                  <td colSpan={9} className="no-sql-results font-sans">
                    No query fingerprints match these filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-2.5 border-t border-(--ot-border) bg-(--ot-panel)/50 text-xs">
          <div className="flex items-center gap-2 text-(--ot-muted)">
            <span>
              Hiển thị{" "}
              <strong className="text-(--ot-text)">
                {visibleQueries.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}
              </strong>
              {" - "}
              <strong className="text-(--ot-text)">
                {Math.min(visibleQueries.length, currentPage * pageSize)}
              </strong>{" "}
              / <strong className="text-(--ot-text)">{visibleQueries.length}</strong> câu truy vấn
            </span>

            <div className="flex items-center gap-1.5 ml-4">
              <span className="text-[11px]">Dòng:</span>
              <Select
                value={String(pageSize)}
                onValueChange={(v) => {
                  setPageSize(Number(v));
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger size="sm" className="h-6 text-xs px-2 w-[65px] bg-(--ot-panel)">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-(--ot-panel) text-xs border-(--ot-border)">
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="outline"
              size="xs"
              onClick={() => setCurrentPage(1)}
              disabled={currentPage <= 1}
              className="h-7 w-7 p-0 cursor-pointer border-(--ot-border)"
              title="Trang đầu"
            >
              <ChevronsLeft className="h-3.5 w-3.5" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="xs"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="h-7 w-7 p-0 cursor-pointer border-(--ot-border)"
              title="Trang trước"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>

            <span className="px-2 text-xs font-medium text-(--ot-muted)">
              Trang <strong className="text-(--ot-text)">{currentPage}</strong> / {totalPages}
            </span>

            <Button
              type="button"
              variant="outline"
              size="xs"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="h-7 w-7 p-0 cursor-pointer border-(--ot-border)"
              title="Trang kế"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="xs"
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage >= totalPages}
              className="h-7 w-7 p-0 cursor-pointer border-(--ot-border)"
              title="Trang cuối"
            >
              <ChevronsRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        <footer className="sql-table-footer font-sans">
          <span>Runtime bind values are never collected; parameter previews are fixture-only.</span>
          <span>
            <i /> Aggregated from {traces.length} filtered traces
          </span>
        </footer>
      </section>

      {/* Query Detail Drawer (Dark & Light Theme Adaptive) */}
      {selectedQuery && (
        <SqlQueryDrawer
          query={selectedQuery}
          role={role}
          onClose={() => setSelectedQuery(null)}
          onOpenStudio={(sql) => handleOpenStudioWithSql(sql)}
        />
      )}

      {/* Full SQL Studio modal */}
      <SqlStudioModal
        isOpen={studioOpen}
        onClose={closeStudio}
        traceId="sql_prof_auto_fleet"
        endpoint="GLOBAL SQL PROFILER"
        traceLatency={formatDuration(totalDbTime)}
        queries={studioModalQueries}
      />
    </div>
  );
}
