"use client";

import { useMemo, useState } from "react";
import { ArrowDownUp, ChevronDown, FileText, Search, Terminal } from "lucide-react";
import type { DemoLog } from "@/lib/opentrace/demo-logs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export type LogViewMode = "terminal" | "table";
type QuickFilter = "all" | "sql" | "slow" | "error" | "warn" | "info" | "debug";
type WrapMode = "nowrap" | "wrap";

const quickFilters: Array<{ id: QuickFilter; label: string }> = [
  { id: "all", label: "All Logs" },
  { id: "sql", label: '[layer="SQL"]' },
  { id: "slow", label: "[duration >= 1s]" },
  { id: "error", label: '[level="error"]' },
  { id: "warn", label: '[level="warn"]' },
  { id: "info", label: '[level="info"]' },
  { id: "debug", label: '[level="debug"]' },
];

const JSON_TOKENS =
  /"(?:\\.|[^"\\])*"(?=\s*:)|"(?:\\.|[^"\\])*"|\b(?:true|false|null)\b|-?\d+(?:\.\d+)?|[{}[\],:]/g;

function formatTimestamp(timestamp: string) {
  return new Date(timestamp).toISOString().replace("T", " ").replace("Z", "");
}

function JsonPayload({ value }: { value: string }) {
  let prettyJson: string;
  try {
    prettyJson = JSON.stringify(JSON.parse(value), null, 2);
  } catch {
    return <>{value}</>;
  }

  const fragments: Array<{ value: string; className?: string }> = [];
  let cursor = 0;
  for (const match of prettyJson.matchAll(JSON_TOKENS)) {
    const token = match[0];
    const index = match.index ?? cursor;
    if (index > cursor) fragments.push({ value: prettyJson.slice(cursor, index) });
    const isKey = token.startsWith('"') && /^\s*:/.test(prettyJson.slice(index + token.length));
    const className = isKey
      ? "json-key"
      : token.startsWith('"')
        ? "json-string"
        : /^-?\d/.test(token)
          ? "json-number"
          : /^[{}[\],:]$/.test(token)
            ? "json-punctuation"
            : "json-literal";
    fragments.push({ value: token, className });
    cursor = index + token.length;
  }
  if (cursor < prettyJson.length) fragments.push({ value: prettyJson.slice(cursor) });

  return (
    <>
      {fragments.map((fragment, index) =>
        fragment.className ? (
          <span className={fragment.className} key={`${index}-${fragment.value}`}>
            {fragment.value}
          </span>
        ) : (
          <span key={`${index}-${fragment.value}`}>{fragment.value}</span>
        )
      )}
    </>
  );
}

function LogLevelBadge({ level }: { level: DemoLog["level"] }) {
  const isErr = level === "error";
  const isWarn = level === "warn";
  const isInfo = level === "info";
  const variant = isErr ? "destructive" : isWarn ? "warning" : isInfo ? "info" : "secondary";
  const dotColor = isErr
    ? "bg-rose-500"
    : isWarn
      ? "bg-amber-500"
      : isInfo
        ? "bg-sky-500"
        : "bg-neutral-400";

  return (
    <Badge
      variant={variant}
      size="sm"
      className="gap-1 font-mono font-bold tracking-wider text-[10px]"
    >
      <span className={cn("size-1.5 rounded-full shrink-0", dotColor)} />
      {level.toUpperCase()}
    </Badge>
  );
}

export function LogStreamTab({
  logs,
  onOpenTrace,
}: {
  logs: DemoLog[];
  onOpenTrace: (traceId: string) => void;
}) {
  const [viewMode, setViewMode] = useState<LogViewMode>("terminal");
  const [quickFilter, setQuickFilter] = useState<QuickFilter>("all");
  const [search, setSearch] = useState("");
  const [newestFirst, setNewestFirst] = useState(true);
  const [wrapMode, setWrapMode] = useState<WrapMode>("nowrap");

  const visibleLogs = useMemo(
    () =>
      logs
        .filter((log) => {
          if (quickFilter === "sql" && log.layer !== "SQL") return false;
          if (quickFilter === "slow" && (log.durationMs ?? 0) < 1000) return false;
          if (["error", "warn", "info", "debug"].includes(quickFilter) && log.level !== quickFilter)
            return false;
          const query = search.trim().toLowerCase();
          const content =
            `${log.message} ${log.rawPayload ?? ""} ${log.source} ${log.traceId} ${log.layer}`.toLowerCase();
          return !query || content.includes(query);
        })
        .sort((left, right) =>
          newestFirst
            ? new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime()
            : new Date(left.timestamp).getTime() - new Date(right.timestamp).getTime()
        ),
    [logs, quickFilter, search, newestFirst]
  );

  function renderPayload(log: DemoLog) {
    return log.rawPayload ?? log.message;
  }

  return (
    <section className="logs-explorer" aria-labelledby="logs-heading">
      <div className="logs-heading">
        <div>
          <div className="section-kicker">SYSTEM EVENTS / RAW EXPLORER</div>
          <div className="logs-title-row">
            <h2 id="logs-heading">Log Stream</h2>
            <span className="logs-sample-pill">SIMULATED DATA</span>
          </div>
          <p>Correlate application, SQL, and exception logs with request traces.</p>
        </div>
        <div className="log-view-switch" role="group" aria-label="Log view mode">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={`h-auto p-0 ${viewMode === "terminal" ? "is-active" : ""}`}
            aria-pressed={viewMode === "terminal"}
            onClick={() => setViewMode("terminal")}
          >
            <Terminal aria-hidden="true" />
            Logs
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={`h-auto p-0 ${viewMode === "table" ? "is-active" : ""}`}
            aria-pressed={viewMode === "table"}
            onClick={() => setViewMode("table")}
          >
            <FileText aria-hidden="true" />
            Table
          </Button>
        </div>
      </div>

      <section className="panel-card logs-panel">
        <div className="logs-filter-bar" role="group" aria-label="Quick log filters">
          {quickFilters.map((filter) => (
            <Button
              key={filter.id}
              type="button"
              variant="ghost"
              size="sm"
              className={`h-auto p-0 ${quickFilter === filter.id ? "is-active" : ""}`}
              aria-pressed={quickFilter === filter.id}
              onClick={() => setQuickFilter(filter.id)}
            >
              {filter.label}
            </Button>
          ))}
        </div>
        <div className="logs-toolbar">
          <Label className="logs-search flex items-center gap-1.5 cursor-pointer">
            <Search aria-hidden="true" className="size-4 shrink-0" />
            <Input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search in log lines…"
              aria-label="Search in log lines"
              className="h-7 text-xs border-0 bg-transparent focus-visible:ring-0 focus-visible:border-0 shadow-none px-1"
            />
          </Label>
          <div className="logs-toolbar-actions">
            <Button
              className="h-7 px-2.5 text-xs font-sans gap-1.5 border border-border bg-background hover:bg-muted text-foreground cursor-pointer shadow-2xs"
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setNewestFirst((value) => !value)}
            >
              <ArrowDownUp aria-hidden="true" className="size-3.5 text-muted-foreground" />
              <span>{newestFirst ? "Newest logs first" : "Oldest logs first"}</span>
            </Button>
            <div className="flex items-center">
              <Select value={wrapMode} onValueChange={(val) => setWrapMode(val as WrapMode)}>
                <SelectTrigger
                  size="sm"
                  className="h-7 text-xs bg-background border-border text-foreground shadow-xs font-sans gap-2 w-auto min-w-[170px] cursor-pointer"
                >
                  <span className="truncate">
                    {wrapMode === "wrap" ? "Enable line wrapping" : "Disable line wrapping"}
                  </span>
                </SelectTrigger>
                <SelectContent className="bg-popover border-border text-popover-foreground text-xs shadow-md font-sans">
                  <SelectItem value="nowrap" className="text-xs cursor-pointer">
                    Disable line wrapping
                  </SelectItem>
                  <SelectItem value="wrap" className="text-xs cursor-pointer">
                    Enable line wrapping
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <span className="logs-result-count">{visibleLogs.length} LINES</span>
        </div>

        {viewMode === "terminal" ? (
          <div className="rounded-lg border border-border overflow-hidden bg-card text-card-foreground shadow-2xs">
            {/* Terminal Column Header for clean alignment at 100% zoom */}
            <div className="hidden sm:flex items-center gap-3 border-b border-border bg-muted/60 dark:bg-zinc-900/90 px-4 py-2.5 font-mono text-[10px] uppercase font-bold text-muted-foreground tracking-wider select-none">
              <span className="w-4 shrink-0 text-muted-foreground/60">#</span>
              <span className="w-[166px] shrink-0">Timestamp (UTC)</span>
              <span className="w-[64px] shrink-0 text-center">Level</span>
              <span className="w-[124px] shrink-0">Trace ID</span>
              <span className="w-[140px] shrink-0">Source / Service</span>
              <span className="flex-1">Message / Raw Payload</span>
            </div>

            <div
              className={`logs-terminal logs-wrap-${wrapMode}`}
              role="log"
              aria-label="Raw log stream"
              aria-live="polite"
            >
              {visibleLogs.map((log) => (
                <div className="log-line" key={log.id}>
                  <span className="log-line-marker" aria-hidden="true" />
                  <time className="log-timestamp" dateTime={log.timestamp}>
                    {formatTimestamp(log.timestamp)}
                  </time>
                  <LogLevelBadge level={log.level} />
                  <Button
                    className="log-trace-id h-auto p-0 bg-transparent hover:bg-transparent"
                    variant="ghost"
                    type="button"
                    onClick={() => onOpenTrace(log.traceId)}
                    aria-label={`Open trace ${log.traceId}`}
                  >
                    [{log.traceId}]
                  </Button>
                  <span className="log-source">{log.source}</span>
                  <pre className="log-payload">{renderPayload(log)}</pre>
                </div>
              ))}
              {visibleLogs.length === 0 && (
                <div className="logs-empty">No log lines match these filters.</div>
              )}
            </div>
          </div>
        ) : (
          <div className="logs-grid-scroll border border-border rounded-lg overflow-x-auto bg-card shadow-2xs">
            <table className="logs-data-table w-full border-collapse font-sans text-left text-xs">
              <thead className="bg-muted/50 border-b border-border text-[10px] uppercase font-bold tracking-wider text-muted-foreground select-none">
                <tr>
                  <th scope="col" className="w-12 text-center p-2.5">
                    STT
                  </th>
                  <th scope="col" className="w-40 p-2.5">
                    TIMESTAMP (UTC)
                  </th>
                  <th scope="col" className="w-20 text-center p-2.5">
                    LEVEL
                  </th>
                  <th scope="col" className="w-32 p-2.5">
                    TRACE ID
                  </th>
                  <th scope="col" className="w-36 p-2.5">
                    SOURCE / LAYER
                  </th>
                  <th scope="col" className="p-2.5 min-w-[280px]">
                    MESSAGE / RAW PAYLOAD
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {visibleLogs.map((log, idx) => (
                  <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                    <td className="text-[11px] tabular-nums text-muted-foreground text-center p-2.5">
                      {idx + 1}
                    </td>
                    <td className="p-2.5 font-mono text-[11px] text-muted-foreground whitespace-nowrap">
                      <time dateTime={log.timestamp}>{formatTimestamp(log.timestamp)}</time>
                    </td>
                    <td className="p-2.5 text-center">
                      <LogLevelBadge level={log.level} />
                    </td>
                    <td className="p-2.5 font-mono text-xs">
                      <Button
                        className="log-trace-id h-auto p-0 bg-transparent hover:bg-transparent font-semibold text-emerald-600 dark:text-emerald-400 cursor-pointer"
                        variant="ghost"
                        type="button"
                        onClick={() => onOpenTrace(log.traceId)}
                      >
                        [{log.traceId}]
                      </Button>
                    </td>
                    <td className="p-2.5">
                      <div className="font-semibold text-foreground text-xs">{log.source}</div>
                      <small className="text-[10px] text-muted-foreground font-mono">{log.layer}</small>
                    </td>
                    <td
                      className={`p-2.5 font-mono text-xs ${
                        wrapMode === "nowrap"
                          ? "whitespace-nowrap overflow-x-auto truncate max-w-xl"
                          : "whitespace-pre-wrap break-words max-w-3xl"
                      }`}
                    >
                      <span>{log.rawPayload ?? log.message}</span>
                    </td>
                  </tr>
                ))}
                {visibleLogs.length === 0 && (
                  <tr>
                    <td colSpan={6} className="logs-empty text-center p-8 text-muted-foreground">
                      No log lines match these filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
        <footer className="logs-panel-footer">
          <span>
            <i className="collector-dot" />
            Raw log explorer · trace IDs open the request waterfall
          </span>
          <span>DEMO FIXTURE</span>
        </footer>
      </section>
    </section>
  );
}
