"use client"

import { useMemo, useState } from "react"
import { ArrowDown, ArrowUp, ChevronDown, Search } from "lucide-react"
import type { DemoTrace } from "@/lib/opentrace/demo-data"
import type { DashboardSection } from "./dashboard-sidebar"

function formatDuration(value: number) {
  return value >= 1000 ? `${(value / 1000).toFixed(2)} s` : `${Math.round(value)} ms`
}

export function TracesTable({
  traces,
  section,
  onSelect,
}: {
  traces: DemoTrace[]
  section: DashboardSection
  onSelect: (trace: DemoTrace) => void
}) {
  const title = section === "errors" ? "Error traces" : section === "sql" ? "Slow & duplicate queries" : section === "overview" ? "Recent traces" : "All traces"
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [descending, setDescending] = useState(true)
  const visibleTraces = useMemo(() => traces
    .filter((trace) => {
      if (section === "errors" && trace.state !== "error") return false
      if (section === "sql" && !trace.queries.some((query) => query.slow || query.duplicateCount > 2)) return false
      if (statusFilter !== "all" && trace.state !== statusFilter) return false
      const searchText = search.trim().toLowerCase()
      return !searchText || `${trace.method} ${trace.route} ${trace.id} ${trace.queries.map((query) => query.fingerprint).join(" ")}`.toLowerCase().includes(searchText)
    })
    .sort((left, right) => descending ? right.duration - left.duration : left.duration - right.duration),
  [traces, section, statusFilter, search, descending])

  return (
    <section className="panel-card traces-panel" aria-labelledby="traces-heading">
      <div className="table-heading">
        <div><div className="section-kicker">REQUEST EXPLORER</div><div className="table-title-row"><h2 id="traces-heading">{title}</h2><span className="trace-count">{visibleTraces.length} traces</span></div></div>
        <div className="table-actions"><label className="filter-select"><span className="sr-only">Filter traces by status</span><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="all">All statuses</option><option value="success">Success</option><option value="slow">Slow</option><option value="error">Errors</option></select></label><span className="filter-button range-label">Last 60 minutes <ChevronDown aria-hidden="true" /></span></div>
      </div>
      <div className="table-controls">
        <label className="trace-search"><Search aria-hidden="true" /><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by route, trace ID, or SQL…" aria-label="Search traces" /></label>
        <div className="table-sort"><span>Sort by</span><button type="button" onClick={() => setDescending((value) => !value)}>Duration {descending ? <ArrowDown aria-hidden="true" /> : <ArrowUp aria-hidden="true" />}</button></div>
      </div>
      <div className="trace-table-scroll">
        <table className="trace-table">
          <thead><tr><th scope="col">STATUS</th><th scope="col">REQUEST</th><th scope="col">DURATION</th><th scope="col">WATERFALL</th><th scope="col">SQL</th><th scope="col">WHEN</th></tr></thead>
          <tbody>
            {visibleTraces.map((trace) => <tr key={trace.id} tabIndex={0} onClick={() => onSelect(trace)} onKeyDown={(event) => event.key === "Enter" && onSelect(trace)} aria-label={`Open ${trace.method} ${trace.route} trace`}>
              <td><span className={`trace-status status-${trace.state}`}><i />{trace.state === "success" ? "OK" : trace.state === "slow" ? "SLOW" : "ERROR"}</span><span className="status-code">{trace.status}</span></td>
              <td><div className="request-cell"><span className={`method method-${trace.method.toLowerCase()}`}>{trace.method}</span><div><strong>{trace.route}</strong><small>{trace.id}</small></div></div></td>
              <td><span className={`duration-cell${trace.state === "slow" ? " duration-slow" : ""}`}>{formatDuration(trace.duration)}</span></td>
              <td><div className="mini-waterfall" aria-label={`${trace.spans.length} spans`}><span style={{ width: `${Math.min(96, Math.max(15, trace.duration / 25))}%` }} /><i style={{ width: `${Math.min(72, Math.max(10, trace.sqlCount * 2))}%` }} /><b style={{ width: `${Math.min(38, Math.max(8, trace.duration / 70))}%` }} /></div></td>
              <td><span className="sql-count">{trace.sqlCount}</span>{trace.queries.some((query) => query.duplicateCount > 2) && <span className="n-plus-one">N+1</span>}</td>
              <td className="time-cell">{trace.ageLabel}</td>
            </tr>)}
            {visibleTraces.length === 0 && <tr><td colSpan={6} className="no-traces">No traces match this view.</td></tr>}
          </tbody>
        </table>
      </div>
      <footer className="table-footer"><span>Showing <strong>{visibleTraces.length}</strong> representative traces from the PoC fixture set</span><span className="sample-footnote">SAMPLE DATA</span></footer>
    </section>
  )
}
