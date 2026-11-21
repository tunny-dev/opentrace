"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Bell, ChevronDown, Command, ExternalLink, Plus, RefreshCw, Search, Sparkles } from "lucide-react"
import { demoTraces, type DemoEnvironment, type DemoService, type DemoTrace } from "@/lib/opentrace/demo-data"
import { demoLogs } from "@/lib/opentrace/demo-logs"
import { DashboardMetrics } from "./dashboard-metrics"
import { DashboardSidebar, type DashboardSection } from "./dashboard-sidebar"
import { LogStreamTab } from "./log-stream-tab"
import { LatencyChart } from "./latency-chart"
import { SqlStudioPage } from "./sql-studio-page"
import { TraceDetailPanel } from "./trace-detail-panel"
import { TracesTable } from "./traces-table"
import type { UserRole } from "./user-profile-menu"

const sectionTitles: Record<DashboardSection, string> = {
  overview: "Overview",
  traces: "Traces",
  errors: "Errors",
  sql: "SQL Studio",
  logs: "Log Stream",
}

const environments: DemoEnvironment[] = ["production", "staging", "development"]
const services: DemoService[] = ["MES-API", "Order-Service", "Inventory-Worker"]

function isDashboardSection(value: string | null): value is DashboardSection {
  return value === "overview" || value === "traces" || value === "errors" || value === "sql" || value === "logs"
}

function buildLiveTrace(sequence: number, environment: DemoEnvironment, service: DemoService | "all"): DemoTrace {
  const matching = demoTraces.filter((trace) => service === "all" || trace.service === service)
  const template = matching[sequence % matching.length] ?? demoTraces[sequence % demoTraces.length]
  const timestamp = new Date()
  const failed = sequence % 9 === 0
  const duration = Math.round(24 + Math.random() * 240)
  const route = template.route

  return {
    ...template,
    id: `tr_live_${timestamp.getTime().toString(36)}`,
    createdAt: timestamp.toISOString(),
    ageLabel: "now",
    environment,
    service: service === "all" ? template.service : service,
    isLive: true,
    duration,
    status: failed ? 500 : 200,
    state: failed ? "error" : "success",
    sqlCount: template.queries.length,
    exception: failed ? { name: "LiveSampleError", message: "Simulated intermittent dependency failure", signature: "livesampleerror: simulated intermittent dependency failure" } : undefined,
    spans: template.spans.map((span, index) => ({
      ...span,
      duration: index === 0 ? duration : Math.min(duration, Math.max(2, Math.round(duration * 0.36))),
    })),
    queries: template.queries.map((query) => ({ ...query, slow: false, slowCount: 0, duplicateCount: 1 })),
    route,
  }
}

function updateQueryState(values: Record<string, string | null>, replace = false) {
  const url = new URL(window.location.href)
  for (const [key, value] of Object.entries(values)) {
    if (value === null || value === "") url.searchParams.delete(key)
    else url.searchParams.set(key, value)
  }
  window.history[replace ? "replaceState" : "pushState"]({}, "", `${url.pathname}${url.search}${url.hash}`)
}

export function OpenTraceDashboard() {
  const [section, setSection] = useState<DashboardSection>("overview")
  const [traces, setTraces] = useState<DemoTrace[]>(demoTraces)
  const [selectedTrace, setSelectedTrace] = useState<DemoTrace | null>(null)
  const [environment, setEnvironment] = useState<DemoEnvironment>("production")
  const [service, setService] = useState<DemoService | "all">("all")
  const [liveStream, setLiveStream] = useState(false)
  const [userRole, setUserRole] = useState<UserRole>("Admin")
  const [refreshing, setRefreshing] = useState(false)
  const traceRef = useRef<DemoTrace[]>(demoTraces)
  const liveSequence = useRef(0)

  useEffect(() => {
    traceRef.current = traces
  }, [traces])

  useEffect(() => {
    const syncFromLocation = () => {
      const params = new URLSearchParams(window.location.search)
      const tab = params.get("tab")
      const env = params.get("env")
      const selectedService = params.get("service")
      const traceId = params.get("traceId")
      setSection(isDashboardSection(tab) ? tab : traceId ? "traces" : "overview")
      setEnvironment(environments.includes(env as DemoEnvironment) ? env as DemoEnvironment : "production")
      setService(services.includes(selectedService as DemoService) ? selectedService as DemoService : "all")
      setLiveStream(params.get("live") === "1")
      setSelectedTrace(traceId ? traceRef.current.find((trace) => trace.id === traceId) ?? null : null)
    }

    syncFromLocation()
    window.addEventListener("popstate", syncFromLocation)
    return () => window.removeEventListener("popstate", syncFromLocation)
  }, [])

  useEffect(() => {
    if (!liveStream) return
    const interval = window.setInterval(() => {
      liveSequence.current += 1
      const nextTrace = buildLiveTrace(liveSequence.current, environment, service)
      setTraces((current) => [nextTrace, ...current].slice(0, 100))
    }, 4000)
    return () => window.clearInterval(interval)
  }, [liveStream, environment, service])

  const filteredTraces = useMemo(() => traces.filter((trace) =>
    trace.environment === environment && (service === "all" || trace.service === service),
  ), [traces, environment, service])
  const filteredLogs = useMemo(() => demoLogs.filter((log) =>
    log.environment === environment && (service === "all" || log.service === service),
  ), [environment, service])

  function navigateSection(nextSection: DashboardSection) {
    setSection(nextSection)
    setSelectedTrace(null)
    updateQueryState({ tab: nextSection, traceId: null })
  }

  function openTrace(trace: DemoTrace) {
    setSection("traces")
    setSelectedTrace(trace)
    updateQueryState({ tab: "traces", traceId: trace.id })
  }

  function openTraceFromLog(traceId: string) {
    const trace = traceRef.current.find((item) => item.id === traceId)
    if (trace) openTrace(trace)
  }

  function closeTrace() {
    setSelectedTrace(null)
    updateQueryState({ traceId: null }, true)
  }

  function changeEnvironment(nextEnvironment: DemoEnvironment) {
    setEnvironment(nextEnvironment)
    updateQueryState({ env: nextEnvironment })
  }

  function changeService(nextService: DemoService | "all") {
    setService(nextService)
    updateQueryState({ service: nextService === "all" ? null : nextService })
  }

  function toggleLiveStream() {
    const nextValue = !liveStream
    setLiveStream(nextValue)
    updateQueryState({ live: nextValue ? "1" : null })
  }

  function refreshDashboard() {
    setRefreshing(true)
    window.setTimeout(() => setRefreshing(false), 550)
  }

  return (
    <div className="opentrace-app">
      <DashboardSidebar active={section} onNavigate={navigateSection} role={userRole} onRoleChange={setUserRole} />
      <main className="dashboard-main">
        <header className="topbar">
          <div className="breadcrumb"><span>MES Production</span><span className="breadcrumb-slash">/</span><strong>{sectionTitles[section]}</strong><ChevronDown aria-hidden="true" /></div>
          <div className="topbar-actions">
            <div className="global-search"><Search aria-hidden="true" /><span>Search</span><kbd><Command aria-hidden="true" /> K</kbd></div>
            <button className="icon-button topbar-icon" type="button" aria-label="Notifications are not configured in this PoC" disabled><Bell /></button>
            <div className="topbar-divider" />
            <label className="environment-control"><span className="sr-only">Environment</span><i /><select value={environment} onChange={(event) => changeEnvironment(event.target.value as DemoEnvironment)} aria-label="Environment">
              {environments.map((value) => <option key={value} value={value}>{value[0].toUpperCase() + value.slice(1)}</option>)}
            </select><ChevronDown aria-hidden="true" /></label>
            <label className="service-control"><span className="sr-only">Service</span><select value={service} onChange={(event) => changeService(event.target.value as DemoService | "all")} aria-label="Service">
              <option value="all">All services</option>{services.map((value) => <option key={value} value={value}>{value}</option>)}
            </select><ChevronDown aria-hidden="true" /></label>
            <button className={`live-toggle${liveStream ? " is-live" : ""}`} type="button" aria-label={liveStream ? "Stop simulated live stream" : "Start simulated live stream"} title="Simulated in the browser; this PoC does not open a server-sent events connection" aria-pressed={liveStream} onClick={toggleLiveStream}>
              <i className="live-indicator" /><span>Live stream</span><small>{liveStream ? "ON" : "SSE"}</small>
            </button>
          </div>
        </header>

        <div className="dashboard-content">
          <div className="page-heading">
            <div><div className="page-eyebrow"><span className="service-dot" /> MES-PRODUCTION <span className="page-eyebrow-divider">/</span> LIVE OBSERVABILITY <span className="demo-label">POC · SAMPLE DATA</span></div><h1>{sectionTitles[section]}</h1><p>{section === "sql" ? "Fingerprint-level database performance across routes." : "Understand what's happening across your services."}</p></div>
            <div className="page-actions"><span className="last-updated"><i className={liveStream ? "is-pulsing" : ""} />{liveStream ? "Receiving simulated events" : "Updated just now"}</span><button className={`icon-button refresh-button${refreshing ? " refreshing" : ""}`} type="button" onClick={refreshDashboard} aria-label="Refresh dashboard"><RefreshCw /></button><button className="primary-button" type="button" disabled title="Alert creation is not included in this PoC"><Plus aria-hidden="true" />New alert</button></div>
          </div>

          {section === "logs" ? <LogStreamTab logs={filteredLogs} onOpenTrace={openTraceFromLog} /> : section === "sql" ? <SqlStudioPage traces={filteredTraces} role={userRole} /> : (
            <>
              <DashboardMetrics />
              <div className="chart-row">
                <LatencyChart />
                <section className="panel-card breakdown-panel" aria-labelledby="breakdown-title">
                  <div className="panel-heading"><div><div className="section-kicker">SERVICE HEALTH</div><div className="latency-title-row"><h2 id="breakdown-title">Latency breakdown</h2></div></div><button className="more-button" type="button" aria-label="More service health options" disabled>···</button></div>
                  <div className="breakdown-total"><strong>184<span>ms</span></strong><span>avg. request duration</span></div>
                  <div className="composition-track" role="img" aria-label="68 percent database, 24 percent application, 8 percent external services"><i /><span /><b /></div>
                  <div className="composition-list"><div><i className="composition-db" /><span>Database</span><strong>68.4%</strong><small>126 ms</small></div><div><i className="composition-app" /><span>App logic</span><strong>23.7%</strong><small>44 ms</small></div><div><i className="composition-ext" /><span>External APIs</span><strong>7.9%</strong><small>14 ms</small></div></div>
                  <button className="breakdown-link" type="button" onClick={() => navigateSection("sql")}>Explore SQL performance <ExternalLink aria-hidden="true" /></button>
                </section>
              </div>
              <TracesTable traces={filteredTraces} section={section} onSelect={openTrace} liveStream={liveStream} />
            </>
          )}
          <footer className="dashboard-footer"><span><i />OpenTrace collector healthy</span><span>LAST 60 MIN <b>·</b> UTC−07:00</span><span className="footer-label"><Sparkles aria-hidden="true" />PoC preview</span></footer>
        </div>
      </main>
      {selectedTrace && <TraceDetailPanel trace={selectedTrace} onClose={closeTrace} />}
    </div>
  )
}
