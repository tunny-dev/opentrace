"use client"

import { useState } from "react"
import { Bell, ChevronDown, Command, ExternalLink, Plus, RefreshCw, Search, Sparkles } from "lucide-react"
import { demoTraces } from "@/lib/opentrace/demo-data"
import { DashboardMetrics } from "./dashboard-metrics"
import { DashboardSidebar, type DashboardSection } from "./dashboard-sidebar"
import { LatencyChart } from "./latency-chart"
import { TraceDetailPanel } from "./trace-detail-panel"
import { TracesTable } from "./traces-table"
import type { DemoTrace } from "@/lib/opentrace/demo-data"

const sectionTitles: Record<DashboardSection, string> = {
  overview: "Overview",
  traces: "Traces",
  errors: "Errors",
  sql: "SQL analytics",
}

export function OpenTraceDashboard() {
  const [section, setSection] = useState<DashboardSection>("overview")
  const [selectedTrace, setSelectedTrace] = useState<DemoTrace | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  function refreshDashboard() {
    setRefreshing(true)
    window.setTimeout(() => setRefreshing(false), 550)
  }

  return (
    <div className="opentrace-app">
      <DashboardSidebar active={section} onNavigate={setSection} />
      <main className="dashboard-main">
        <header className="topbar">
          <div className="breadcrumb"><span>MES Production</span><span className="breadcrumb-slash">/</span><strong>{sectionTitles[section]}</strong><ChevronDown aria-hidden="true" /></div>
          <div className="topbar-actions"><div className="global-search"><Search aria-hidden="true" /><span>Search</span><kbd><Command aria-hidden="true" /> K</kbd></div><button className="icon-button topbar-icon" type="button" aria-label="Notifications are not configured in this PoC" disabled><Bell /></button><div className="topbar-divider" /><span className="environment-chip"><i />Production <ChevronDown aria-hidden="true" /></span></div>
        </header>

        <div className="dashboard-content">
          <div className="page-heading">
            <div><div className="page-eyebrow"><span className="service-dot" /> MES-PRODUCTION <span className="page-eyebrow-divider">/</span> LIVE OBSERVABILITY <span className="demo-label">POC · SAMPLE DATA</span></div><h1>{sectionTitles[section]}</h1><p>Understand what&apos;s happening across your services.</p></div>
            <div className="page-actions"><span className="last-updated"><i /> Updated just now</span><button className={`icon-button refresh-button${refreshing ? " refreshing" : ""}`} type="button" onClick={refreshDashboard} aria-label="Refresh dashboard"><RefreshCw /></button><button className="primary-button" type="button" disabled title="Alert creation is not included in this PoC"><Plus aria-hidden="true" />New alert</button></div>
          </div>

          <DashboardMetrics />

          <div className="chart-row">
            <LatencyChart />
            <section className="panel-card breakdown-panel" aria-labelledby="breakdown-title">
              <div className="panel-heading"><div><div className="section-kicker">SERVICE HEALTH</div><div className="latency-title-row"><h2 id="breakdown-title">Latency breakdown</h2></div></div><button className="more-button" type="button" aria-label="More service health options" disabled>···</button></div>
              <div className="breakdown-total"><strong>184<span>ms</span></strong><span>avg. request duration</span></div>
              <div className="composition-track" role="img" aria-label="68 percent database, 24 percent application, 8 percent external services"><i /><span /><b /></div>
              <div className="composition-list"><div><i className="composition-db" /><span>Database</span><strong>68.4%</strong><small>126 ms</small></div><div><i className="composition-app" /><span>App logic</span><strong>23.7%</strong><small>44 ms</small></div><div><i className="composition-ext" /><span>External APIs</span><strong>7.9%</strong><small>14 ms</small></div></div>
              <button className="breakdown-link" type="button" onClick={() => setSection("sql")}>Explore SQL performance <ExternalLink aria-hidden="true" /></button>
            </section>
          </div>

          <TracesTable traces={demoTraces} section={section} onSelect={setSelectedTrace} />
          <footer className="dashboard-footer"><span><i />OpenTrace collector healthy</span><span>LAST 60 MIN <b>·</b> UTC−07:00</span><span className="footer-label"><Sparkles aria-hidden="true" />PoC preview</span></footer>
        </div>
      </main>
      {selectedTrace && <TraceDetailPanel trace={selectedTrace} onClose={() => setSelectedTrace(null)} />}
    </div>
  )
}
