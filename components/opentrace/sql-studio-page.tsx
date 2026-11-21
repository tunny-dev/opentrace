"use client"

import { useMemo, useState } from "react"
import { Activity, ArrowDown, ArrowUp, ChevronRight, Database, Search, Zap } from "lucide-react"
import type { DemoTrace } from "@/lib/opentrace/demo-data"
import { aggregateQueries, type AggregatedQuery, type StatementType } from "@/lib/opentrace/sql-analytics"
import { SqlQueryDrawer } from "./sql-query-drawer"

const statementTypes: Array<StatementType | "ALL"> = ["ALL", "SELECT", "UPDATE", "INSERT", "DELETE", "OTHER"]

function formatDuration(value: number) {
  return value >= 1000 ? `${(value / 1000).toFixed(2)} s` : `${value.toFixed(value < 10 ? 1 : 0)} ms`
}

export function SqlStudioPage({ traces }: { traces: DemoTrace[] }) {
  const [search, setSearch] = useState("")
  const [statementFilter, setStatementFilter] = useState<StatementType | "ALL">("ALL")
  const [sortByImpact, setSortByImpact] = useState(true)
  const [selectedQuery, setSelectedQuery] = useState<AggregatedQuery | null>(null)

  const queries = useMemo(() => aggregateQueries(traces), [traces])
  const visibleQueries = useMemo(() => queries
    .filter((query) => statementFilter === "ALL" || query.statementType === statementFilter)
    .filter((query) => `${query.template} ${query.routes.join(" ")} ${query.callSite}`.toLowerCase().includes(search.trim().toLowerCase()))
    .sort((left, right) => sortByImpact
      ? right.impactPct - left.impactPct
      : right.totalCalls - left.totalCalls),
  [queries, statementFilter, search, sortByImpact])

  const totalCalls = queries.reduce((total, query) => total + query.totalCalls, 0)
  const totalDbTime = queries.reduce((total, query) => total + query.totalDurationMs, 0)
  const nPlusOneCount = queries.filter((query) => query.nPlusOneRoutes.length > 0).length

  return (
    <div className="sql-studio-page">
      <div className="sql-workspace-context">
        <div className="section-kicker">DATABASE / GLOBAL PROFILER <span className="demo-label">SAMPLE DATA</span></div>
        <div className="sql-studio-status"><span className="collector-dot" />{traces.length} traces analyzed</div>
      </div>

      <section className="sql-metrics-grid" aria-label="SQL profile summary">
        <article className="sql-metric-card"><div><Database aria-hidden="true" /><span>FINGERPRINTS</span></div><strong>{queries.length}</strong><small>normalized query shapes</small></article>
        <article className="sql-metric-card"><div><Activity aria-hidden="true" /><span>TOTAL CALLS</span></div><strong>{totalCalls.toLocaleString()}</strong><small>across filtered traces</small></article>
        <article className="sql-metric-card"><div><Zap aria-hidden="true" /><span>DATABASE TIME</span></div><strong>{formatDuration(totalDbTime)}</strong><small>estimated from fixture samples</small></article>
        <article className="sql-metric-card sql-metric-warning"><div><Activity aria-hidden="true" /><span>N+1 PATTERNS</span></div><strong>{nPlusOneCount}</strong><small>fingerprints repeated per request</small></article>
      </section>

      <section className="panel-card sql-analytics-panel" aria-labelledby="sql-analytics-heading">
        <header className="sql-analytics-header">
          <div><div className="section-kicker">QUERY ANALYTICS</div><div className="table-title-row"><h2 id="sql-analytics-heading">Global query aggregation</h2><span className="trace-count">{visibleQueries.length} fingerprints</span></div></div>
          <div className="sql-analytics-controls">
            <label className="sql-type-select"><span className="sr-only">Filter by statement type</span><select value={statementFilter} onChange={(event) => setStatementFilter(event.target.value as StatementType | "ALL")}>
              {statementTypes.map((type) => <option key={type} value={type}>{type === "ALL" ? "All statements" : type}</option>)}
            </select></label>
            <label className="sql-search"><Search aria-hidden="true" /><input aria-label="Search query fingerprints" type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search SQL or route…" /></label>
          </div>
        </header>
        <div className="sql-table-scroll">
          <table className="sql-analytics-table">
            <thead><tr>
              <th scope="col">QUERY TEMPLATE</th>
              <th scope="col"><button className="sql-sort-button" type="button" onClick={() => setSortByImpact((value) => !value)}>{sortByImpact ? "TOTAL IMPACT" : "CALLS COUNT"}{sortByImpact ? <ArrowDown aria-hidden="true" /> : <ArrowUp aria-hidden="true" />}</button></th>
              <th scope="col">CALLS</th>
              <th scope="col">AVG / P95</th>
              <th scope="col">N+1</th>
              <th scope="col">ASSOCIATED ROUTES</th>
              <th scope="col"><span className="sr-only">Open query details</span></th>
            </tr></thead>
            <tbody>
              {visibleQueries.map((query) => <tr key={query.fingerprint} tabIndex={0} onClick={() => setSelectedQuery(query)} onKeyDown={(event) => event.key === "Enter" && setSelectedQuery(query)} aria-label={`Inspect ${query.statementType} query ${query.fingerprint}`}>
                <td><div className="sql-template-cell"><span className={`statement-badge statement-${query.statementType.toLowerCase()}`}>{query.statementType}</span><code>{query.template}</code><small>{query.fingerprint.slice(0, 16)}</small></div></td>
                <td><div className="impact-cell"><strong>{query.impactPct.toFixed(1)}%</strong><div className="impact-track"><i style={{ width: `${Math.min(100, query.impactPct)}%` }} /></div></div></td>
                <td><span className="sql-calls-count">{query.totalCalls.toLocaleString()}</span></td>
                <td><div className="latency-pair"><strong>{formatDuration(query.avgLatencyMs)}</strong><small>{formatDuration(query.p95LatencyMs)}</small></div></td>
                <td>{query.nPlusOneRoutes.length > 0 ? <span className="n1-alert-badge"><i />N+1 <b>{query.nPlusOneRoutes.length}</b></span> : <span className="no-n1">—</span>}</td>
                <td><div className="associated-routes">{query.routes.slice(0, 2).map((route) => <span className="route-chip" key={route}>{route}</span>)}{query.routes.length > 2 && <span className="route-more">+{query.routes.length - 2}</span>}</div></td>
                <td><ChevronRight className="sql-row-chevron" aria-hidden="true" /></td>
              </tr>)}
              {visibleQueries.length === 0 && <tr><td colSpan={7} className="no-sql-results">No query fingerprints match these filters.</td></tr>}
            </tbody>
          </table>
        </div>
        <footer className="sql-table-footer"><span>Templates are normalized; values and bind parameters are not retained.</span><span><i /> Aggregated from {traces.length} filtered traces</span></footer>
      </section>
      {selectedQuery && <SqlQueryDrawer query={selectedQuery} onClose={() => setSelectedQuery(null)} />}
    </div>
  )
}
