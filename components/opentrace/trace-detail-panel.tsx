"use client"

import { useEffect, useState } from "react"
import { Check, Copy, X } from "lucide-react"
import type { DemoTrace } from "@/lib/opentrace/demo-data"

function formatDuration(value: number) {
  return value >= 1000 ? `${(value / 1000).toFixed(2)} s` : `${value.toFixed(value < 10 ? 1 : 0)} ms`
}

export function TraceDetailPanel({ trace, onClose }: { trace: DemoTrace; onClose: () => void }) {
  const [copiedQuery, setCopiedQuery] = useState<number | null>(null)

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose()
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [onClose])

  async function copyQuery(query: string, index: number) {
    try {
      await navigator.clipboard.writeText(query)
      setCopiedQuery(index)
      window.setTimeout(() => setCopiedQuery(null), 1600)
    } catch {
      setCopiedQuery(null)
    }
  }

  const sqlTotal = trace.spans.filter((span) => span.kind === "db").reduce((total, span) => total + span.duration, 0)
  const externalTotal = trace.spans.filter((span) => span.kind === "http").reduce((total, span) => total + span.duration, 0)
  const appTotal = Math.max(0, trace.duration - sqlTotal - externalTotal)
  const breakdown = [
    { label: "Application", value: appTotal, color: "var(--mint)" },
    { label: "Database", value: sqlTotal, color: "var(--blue)" },
    { label: "External", value: externalTotal, color: "var(--violet)" },
  ]
  const visibleBreakdown = breakdown.filter((item) => item.value > 0)

  return (
    <div className="detail-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <aside className="trace-detail" role="dialog" aria-modal="true" aria-labelledby="detail-title">
        <header className="detail-header">
          <div><div className="detail-eyebrow">TRACE DETAIL <span>·</span> {trace.id}</div><h2 id="detail-title"><span className="method-chip">{trace.method}</span> {trace.route}</h2></div>
          <button className="icon-button detail-close" type="button" onClick={onClose} aria-label="Close trace details"><X /></button>
        </header>
        <div className="detail-metadata">
          <span className={`detail-status status-${trace.state}`}><i />{trace.status} {trace.state}</span>
          <span><b>{formatDuration(trace.duration)}</b> total</span>
          <span>{trace.sqlCount} queries</span>
          <span>{new Date(trace.createdAt).toLocaleTimeString()}</span>
        </div>

        {trace.exception && <section className="detail-section exception-card"><div className="exception-title">{trace.exception.name}<span>ERROR GROUP</span></div><p>{trace.exception.message}</p><code>{trace.exception.signature}</code></section>}

        <section className="detail-section">
          <div className="detail-section-title"><h3>Latency breakdown</h3><span>{formatDuration(trace.duration)}</span></div>
          <div className="breakdown-bar" role="img" aria-label={visibleBreakdown.map(({ label, value }) => `${label} ${Math.round(value / trace.duration * 100)} percent`).join(", ")}>
            {visibleBreakdown.map(({ label, value, color }) => <span key={label} style={{ width: `${Math.max(2, value / trace.duration * 100)}%`, background: color }} />)}
          </div>
          <div className="breakdown-legend">{visibleBreakdown.map(({ label, value, color }) => <span key={label}><i style={{ background: color }} />{label}<b>{Math.round(value / trace.duration * 100)}%</b></span>)}</div>
        </section>

        <section className="detail-section">
          <div className="detail-section-title"><h3>Trace waterfall</h3><span>{trace.spans.length} spans</span></div>
          <div className="waterfall-axis"><span>SPAN</span><span>DURATION</span><span>WATERFALL</span></div>
          <div className="waterfall-list">
            {trace.spans.map((span, index) => {
              const spanWidth = Math.max(3, span.duration / trace.duration * 100)
              const startOffset = span.start / trace.duration * 100
              return <div className="waterfall-row" key={`${span.name}-${index}`}>
                <div className="waterfall-name"><span className={`span-icon span-${span.kind}`}>{span.kind === "db" ? "DB" : span.kind === "http" ? "↗" : span.kind === "middleware" ? "◇" : "ƒ"}</span><span>{span.name}</span></div>
                <span className="waterfall-duration">{formatDuration(span.duration)}</span>
                <div className="waterfall-track"><i className={`waterfall-bar bar-${span.kind}`} style={{ left: `${startOffset}%`, width: `${spanWidth}%` }} /></div>
              </div>
            })}
          </div>
        </section>

        <section className="detail-section sql-section">
          <div className="detail-section-title"><div><h3>SQL studio</h3><span className="subtle-count">{trace.sqlCount} statements · {formatDuration(sqlTotal)}</span></div><span>FINGERPRINTED</span></div>
          <div className="query-list">
            {trace.queries.map((query, index) => <article className="query-card" key={`${query.fingerprint}-${index}`}>
              <div className="query-meta"><span className="query-kind">SELECT</span><span>{formatDuration(query.duration)}</span>{query.slow && <span className="query-warning">SLOW</span>}{query.duplicateCount > 2 && <span className="query-warning">N+1 · {query.duplicateCount}×</span>}<button type="button" className="copy-button" aria-label="Copy SQL query" onClick={() => void copyQuery(query.query, index)}>{copiedQuery === index ? <Check /> : <Copy />}{copiedQuery === index && <span>Copied</span>}</button></div>
              <pre>{query.query}</pre>
              <div className="query-fingerprint"><span>FP</span>{query.fingerprint}<span className="rows-count">{query.rows ?? 0} rows</span></div>
            </article>)}
          </div>
        </section>

        <section className="detail-section breadcrumb-section">
          <div className="detail-section-title"><h3>Breadcrumbs</h3><span className="subtle-count">3 events</span></div>
          <div className="breadcrumb-line"><i className="crumb-dot crumb-blue" /><span>Request received</span><time>+0 ms</time></div>
          <div className="breadcrumb-line"><i className="crumb-dot crumb-mint" /><span>Database query completed</span><time>+{Math.round(sqlTotal)} ms</time></div>
          {trace.exception && <div className="breadcrumb-line"><i className="crumb-dot crumb-red" /><span>Exception captured</span><time>+{trace.duration} ms</time></div>}
        </section>
      </aside>
    </div>
  )
}
