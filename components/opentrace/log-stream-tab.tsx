"use client"

import { useMemo, useState } from "react"
import { ArrowDownUp, ChevronDown, FileText, Search, Terminal } from "lucide-react"
import type { DemoLog } from "@/lib/opentrace/demo-logs"

export type LogViewMode = "terminal" | "table"
type QuickFilter = "all" | "sql" | "slow" | "error" | "warn" | "info" | "debug"
type WrapMode = "nowrap" | "wrap" | "pretty"

const quickFilters: Array<{ id: QuickFilter; label: string }> = [
  { id: "all", label: "All Logs" },
  { id: "sql", label: '[layer="SQL"]' },
  { id: "slow", label: "[duration >= 1s]" },
  { id: "error", label: '[level="error"]' },
  { id: "warn", label: '[level="warn"]' },
  { id: "info", label: '[level="info"]' },
  { id: "debug", label: '[level="debug"]' },
]

const JSON_TOKENS = /"(?:\\.|[^"\\])*"(?=\s*:)|"(?:\\.|[^"\\])*"|\b(?:true|false|null)\b|-?\d+(?:\.\d+)?|[{}[\],:]/g

function formatTimestamp(timestamp: string) {
  return new Date(timestamp).toISOString().replace("T", " ").replace("Z", "")
}

function JsonPayload({ value }: { value: string }) {
  let prettyJson: string
  try {
    prettyJson = JSON.stringify(JSON.parse(value), null, 2)
  } catch {
    return <>{value}</>
  }

  const fragments: Array<{ value: string; className?: string }> = []
  let cursor = 0
  for (const match of prettyJson.matchAll(JSON_TOKENS)) {
    const token = match[0]
    const index = match.index ?? cursor
    if (index > cursor) fragments.push({ value: prettyJson.slice(cursor, index) })
    const isKey = token.startsWith('"') && /^\s*:/.test(prettyJson.slice(index + token.length))
    const className = isKey
      ? "json-key"
      : token.startsWith('"')
        ? "json-string"
        : /^-?\d/.test(token)
          ? "json-number"
          : /^[{}[\],:]$/.test(token)
            ? "json-punctuation"
            : "json-literal"
    fragments.push({ value: token, className })
    cursor = index + token.length
  }
  if (cursor < prettyJson.length) fragments.push({ value: prettyJson.slice(cursor) })

  return <>{fragments.map((fragment, index) => fragment.className
    ? <span className={fragment.className} key={`${index}-${fragment.value}`}>{fragment.value}</span>
    : <span key={`${index}-${fragment.value}`}>{fragment.value}</span>)}</>
}

function LogLevelBadge({ level }: { level: DemoLog["level"] }) {
  return <span className={`log-level-badge log-level-${level}`}><i />{level.toUpperCase()}</span>
}

export function LogStreamTab({ logs, onOpenTrace }: { logs: DemoLog[]; onOpenTrace: (traceId: string) => void }) {
  const [viewMode, setViewMode] = useState<LogViewMode>("terminal")
  const [quickFilter, setQuickFilter] = useState<QuickFilter>("all")
  const [search, setSearch] = useState("")
  const [newestFirst, setNewestFirst] = useState(true)
  const [wrapMode, setWrapMode] = useState<WrapMode>("nowrap")

  const visibleLogs = useMemo(() => logs
    .filter((log) => {
      if (quickFilter === "sql" && log.layer !== "SQL") return false
      if (quickFilter === "slow" && (log.durationMs ?? 0) < 1000) return false
      if (["error", "warn", "info", "debug"].includes(quickFilter) && log.level !== quickFilter) return false
      const query = search.trim().toLowerCase()
      const content = `${log.message} ${log.rawPayload ?? ""} ${log.source} ${log.traceId} ${log.layer}`.toLowerCase()
      return !query || content.includes(query)
    })
    .sort((left, right) => newestFirst
      ? new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime()
      : new Date(left.timestamp).getTime() - new Date(right.timestamp).getTime()),
  [logs, quickFilter, search, newestFirst])

  function renderPayload(log: DemoLog) {
    if (wrapMode === "pretty" && log.rawPayload) return <JsonPayload value={log.rawPayload} />
    return log.rawPayload ?? log.message
  }

  return (
    <section className="logs-explorer" aria-labelledby="logs-heading">
      <div className="logs-heading">
        <div><div className="section-kicker">SYSTEM EVENTS / RAW EXPLORER</div><div className="logs-title-row"><h2 id="logs-heading">Log Stream</h2><span className="logs-sample-pill">SIMULATED DATA</span></div><p>Correlate application, SQL, and exception logs with request traces.</p></div>
        <div className="log-view-switch" role="group" aria-label="Log view mode">
          <button type="button" className={viewMode === "terminal" ? "is-active" : ""} aria-pressed={viewMode === "terminal"} onClick={() => setViewMode("terminal")}><Terminal aria-hidden="true" />Logs</button>
          <button type="button" className={viewMode === "table" ? "is-active" : ""} aria-pressed={viewMode === "table"} onClick={() => setViewMode("table")}><FileText aria-hidden="true" />Table</button>
        </div>
      </div>

      <section className="panel-card logs-panel">
        <div className="logs-filter-bar" role="group" aria-label="Quick log filters">
          {quickFilters.map((filter) => <button key={filter.id} type="button" className={quickFilter === filter.id ? "is-active" : ""} aria-pressed={quickFilter === filter.id} onClick={() => setQuickFilter(filter.id)}>{filter.label}</button>)}
        </div>
        <div className="logs-toolbar">
          <label className="logs-search"><Search aria-hidden="true" /><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search in log lines…" aria-label="Search in log lines" /></label>
          <div className="logs-toolbar-actions">
            <button className="log-sort-button" type="button" onClick={() => setNewestFirst((value) => !value)}><ArrowDownUp aria-hidden="true" />{newestFirst ? "Newest logs first" : "Oldest logs first"}</button>
            <label className="wrap-mode-select"><span className="sr-only">Wrap lines</span><select value={wrapMode} onChange={(event) => setWrapMode(event.target.value as WrapMode)} aria-label="Wrap lines">
              <option value="nowrap">Disable line wrapping</option>
              <option value="wrap">Enable line wrapping</option>
              <option value="pretty">Enable line wrapping and prettify JSON</option>
            </select><ChevronDown aria-hidden="true" /></label>
          </div>
          <span className="logs-result-count">{visibleLogs.length} LINES</span>
        </div>

        {viewMode === "terminal" ? (
          <div className={`logs-terminal logs-wrap-${wrapMode}`} role="log" aria-label="Raw log stream" aria-live="polite">
            {visibleLogs.map((log) => <div className="log-line" key={log.id}>
              <span className="log-line-marker" aria-hidden="true" />
              <time className="log-timestamp" dateTime={log.timestamp}>{formatTimestamp(log.timestamp)}</time>
              <LogLevelBadge level={log.level} />
              <button className="log-trace-id" type="button" onClick={() => onOpenTrace(log.traceId)} aria-label={`Open trace ${log.traceId}`}>[{log.traceId}]</button>
              <span className="log-source">{log.source}</span>
              <pre className="log-payload">{renderPayload(log)}</pre>
            </div>)}
            {visibleLogs.length === 0 && <div className="logs-empty">No log lines match these filters.</div>}
          </div>
        ) : (
          <div className="logs-grid-scroll">
            <table className="logs-data-table">
              <thead><tr><th scope="col">TIMESTAMP</th><th scope="col">LEVEL</th><th scope="col">TRACE ID</th><th scope="col">SOURCE</th><th scope="col">MESSAGE</th></tr></thead>
              <tbody>{visibleLogs.map((log) => <tr key={log.id}>
                <td><time dateTime={log.timestamp}>{formatTimestamp(log.timestamp)}</time></td>
                <td><LogLevelBadge level={log.level} /></td>
                <td><button className="log-trace-id" type="button" onClick={() => onOpenTrace(log.traceId)}>{log.traceId}</button></td>
                <td><span className="log-source">{log.source}</span><small className="log-layer">{log.layer}</small></td>
                <td className="log-table-message">{log.message}</td>
              </tr>)}
              {visibleLogs.length === 0 && <tr><td colSpan={5} className="logs-empty">No log lines match these filters.</td></tr>}</tbody>
            </table>
          </div>
        )}
        <footer className="logs-panel-footer"><span><i className="collector-dot" />Raw log explorer · trace IDs open the request waterfall</span><span>DEMO FIXTURE</span></footer>
      </section>
    </section>
  )
}
