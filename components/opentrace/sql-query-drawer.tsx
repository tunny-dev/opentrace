"use client"

import { useEffect, useState } from "react"
import type { CSSProperties } from "react"
import { AlertTriangle, Check, Clipboard, Copy, Database, X } from "lucide-react"
import type { AggregatedQuery } from "@/lib/opentrace/sql-analytics"
import { buildExplainPlan, formatSql } from "@/lib/opentrace/sql-analytics"
import { SqlSyntax } from "./sql-syntax"

function formatDuration(value: number) {
  return value >= 1000 ? `${(value / 1000).toFixed(2)} s` : `${value.toFixed(value < 10 ? 1 : 0)} ms`
}

export function SqlQueryDrawer({ query, onClose }: { query: AggregatedQuery; onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<"inspector" | "explain">("inspector")
  const [formatted, setFormatted] = useState(false)
  const [copied, setCopied] = useState(false)
  const plan = buildExplainPlan(query.template)
  const hasWarning = plan.some((node) => node.severity === "warning")
  const displayedSql = formatted ? formatSql(query.template) : query.template

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose()
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [onClose])

  async function copySql() {
    try {
      await navigator.clipboard.writeText(query.template)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="detail-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <aside className="trace-detail sql-query-drawer" role="dialog" aria-modal="true" aria-labelledby="sql-query-title">
        <header className="detail-header">
          <div><div className="detail-eyebrow">GLOBAL QUERY PROFILE <span>·</span> {query.totalCalls.toLocaleString()} CALLS</div><h2 id="sql-query-title"><span className={`statement-badge statement-${query.statementType.toLowerCase()}`}>{query.statementType}</span>{query.fingerprint}</h2></div>
          <button className="icon-button detail-close" type="button" onClick={onClose} aria-label="Close SQL query details"><X /></button>
        </header>
        <div className="sql-query-summary">
          <div><span>AVG LATENCY</span><strong>{formatDuration(query.avgLatencyMs)}</strong></div>
          <div><span>P95 LATENCY</span><strong>{formatDuration(query.p95LatencyMs)}</strong></div>
          <div><span>DB IMPACT</span><strong>{query.impactPct.toFixed(1)}%</strong></div>
        </div>
        <div className="sql-drawer-tabs" role="tablist" aria-label="SQL query detail tabs">
          <button type="button" role="tab" aria-selected={activeTab === "inspector"} className={activeTab === "inspector" ? "is-active" : ""} onClick={() => setActiveTab("inspector")}><Database aria-hidden="true" />Query inspector</button>
          <button type="button" role="tab" aria-selected={activeTab === "explain"} className={activeTab === "explain" ? "is-active" : ""} onClick={() => setActiveTab("explain")}><span className="plan-tab-icon">ƒ</span>Simulated EXPLAIN</button>
        </div>

        {activeTab === "inspector" ? (
          <section className="sql-drawer-content" role="tabpanel">
            <div className="sql-content-heading"><div><span className="section-kicker">QUERY TEMPLATE</span><span className="sql-template-subtitle">Literals normalized to placeholders</span></div><div className="sql-actions"><button className="sql-tool-button" type="button" onClick={() => setFormatted((value) => !value)}>{formatted ? "Compact SQL" : "Format SQL"}</button><button className="sql-tool-button" type="button" onClick={() => void copySql()}>{copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}{copied ? "Copied" : "Copy"}</button></div></div>
            <pre className="sql-code-panel"><SqlSyntax sql={displayedSql} /></pre>

            {query.nPlusOneRoutes.length > 0 && <div className="n1-suggestion"><div className="n1-suggestion-title"><AlertTriangle aria-hidden="true" /> N+1 pattern detected</div><p>This fingerprint repeated up to {query.maxDuplicateCount} times in one request across {query.nPlusOneRoutes.length} N+1 route{query.nPlusOneRoutes.length === 1 ? "" : "s"}. Consider eager loading or a JOIN FETCH to batch related records.</p></div>}

            <div className="sql-detail-block"><div className="sql-detail-title">CALL SITE <span>DEMO FRAMEWORK TRACE</span></div><div className="call-site"><span className="call-site-dot" /><code>{query.callSite}</code><span className="call-site-hint">sampled source location</span></div></div>
            <div className="sql-detail-block"><div className="sql-detail-title">ASSOCIATED ROUTES <span>{query.routes.length}</span></div><div className="sql-route-list">{query.routes.map((route) => <span className="sql-route-chip" key={route}>{route}</span>)}</div></div>
            <div className="sql-detail-block"><div className="sql-detail-title">FINGERPRINT <button className="inline-copy" type="button" onClick={() => void copySql()} aria-label="Copy SQL fingerprint">{copied ? <Check /> : <Clipboard />}</button></div><code className="fingerprint-value">{query.fingerprint}</code></div>
          </section>
        ) : (
          <section className="sql-drawer-content" role="tabpanel">
            <div className="explain-note"><span className="explain-pill">SIMULATED PLAN</span><span>Preview only · no database connection was queried</span></div>
            {hasWarning && <div className="explain-warning"><AlertTriangle aria-hidden="true" /><div><strong>Potential full table scan</strong><span>Review the predicate and consider a selective index before production use.</span></div></div>}
            <div className="explain-tree" role="list" aria-label="Simulated query plan">
              {plan.map((node, index) => <div className={`explain-node${node.severity ? " has-warning" : ""}`} key={`${node.label}-${index}`} style={{ "--node-level": node.level } as CSSProperties} role="listitem">
                <span className="explain-tree-connector" aria-hidden="true" />
                <span className="explain-node-icon">{node.severity ? <AlertTriangle aria-hidden="true" /> : index === 0 ? <Database aria-hidden="true" /> : <span>↳</span>}</span>
                <div><strong>{node.label}</strong><span>{node.detail}</span></div>
                {node.severity && <span className="explain-node-badge">WARNING</span>}
              </div>)}
            </div>
            <div className="explain-legend"><span><i className="legend-index" />Index access</span><span><i className="legend-scan" />Sequential scan</span><span>Costs are illustrative, not DB output</span></div>
          </section>
        )}
      </aside>
    </div>
  )
}
