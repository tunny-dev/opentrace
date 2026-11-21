"use client"

import {
  Activity,
  AlertTriangle,
  Boxes,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Command,
  Database,
  Gauge,
  Settings2,
  ShieldCheck,
  TerminalSquare,
} from "lucide-react"

export type DashboardSection = "overview" | "traces" | "errors" | "sql"

const navItems = [
  { id: "overview" as const, label: "Overview", icon: Gauge },
  { id: "traces" as const, label: "Traces", icon: Activity, count: "1.2k" },
  { id: "errors" as const, label: "Errors", icon: AlertTriangle, count: "3" },
  { id: "sql" as const, label: "SQL queries", icon: Database },
]

export function DashboardSidebar({
  active,
  onNavigate,
}: {
  active: DashboardSection
  onNavigate: (section: DashboardSection) => void
}) {
  return (
    <aside className="app-sidebar" aria-label="OpenTrace navigation">
      <div className="workspace-switcher">
        <div className="brand-mark" aria-hidden="true"><Activity /></div>
        <div className="workspace-copy"><strong>opentrace</strong><span>DEVELOPMENT</span></div>
        <button className="icon-button workspace-chevron" type="button" aria-label="Switch workspace" disabled><ChevronDown /></button>
      </div>

      <div className="project-switcher">
        <div className="project-avatar">M</div>
        <div className="project-copy"><strong>MES Production</strong><span>production · us-east-1</span></div>
        <ChevronRight className="project-arrow" aria-hidden="true" />
      </div>

      <div className="sidebar-label">OBSERVABILITY</div>
      <nav className="side-nav">
        {navItems.map(({ id, label, icon: Icon, count }) => (
          <button
            key={id}
            className={`side-nav-item${active === id ? " is-active" : ""}`}
            type="button"
            aria-current={active === id ? "page" : undefined}
            onClick={() => onNavigate(id)}
          >
            <Icon aria-hidden="true" />
            <span>{label}</span>
            {count && <span className="nav-count">{count}</span>}
          </button>
        ))}
      </nav>

      <div className="sidebar-label services-label">PLATFORM</div>
      <nav className="side-nav" aria-label="Platform">
        <button className="side-nav-item" type="button" disabled title="Not included in this PoC"><Boxes aria-hidden="true" /><span>Services</span><span className="nav-count">4</span></button>
        <button className="side-nav-item" type="button" disabled title="Not included in this PoC"><ShieldCheck aria-hidden="true" /><span>Releases</span></button>
        <button className="side-nav-item" type="button" disabled title="Not included in this PoC"><TerminalSquare aria-hidden="true" /><span>Settings</span></button>
      </nav>

      <div className="sidebar-bottom">
        <div className="usage-card">
          <div className="usage-heading"><span>INGESTION</span><span>72%</span></div>
          <div className="usage-track"><span /></div>
          <p>72k of 100k events this month</p>
        </div>
        <button className="side-nav-item support-item" type="button" disabled title="Documentation is in opentrace/ARCHITECTURE.md"><CircleHelp aria-hidden="true" /><span>Documentation</span></button>
        <div className="user-row"><div className="user-avatar">AK</div><div className="user-copy"><strong>Alex Kim</strong><span>Workspace admin</span></div><Settings2 aria-hidden="true" /></div>
      </div>
      <div className="sidebar-shortcut"><Command aria-hidden="true" /><span>K</span><small>Search anything</small></div>
    </aside>
  )
}
