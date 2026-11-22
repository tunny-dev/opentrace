"use client";

import {
  Activity,
  AlertTriangle,
  Boxes,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Command,
  Database,
  FileText,
  Gauge,
  ShieldCheck,
  TerminalSquare,
} from "lucide-react";
import { UserProfileMenu, type UserRole } from "./user-profile-menu";
import { Button } from "@/components/ui/button";

export type DashboardSection =
  "overview" | "traces" | "errors" | "sql" | "logs" | "services" | "releases" | "settings";

const navItems = [
  { id: "overview" as const, label: "Overview", icon: Gauge },
  { id: "traces" as const, label: "Traces", icon: Activity },
  { id: "errors" as const, label: "Errors", icon: AlertTriangle },
  { id: "sql" as const, label: "SQL queries", icon: Database },
  { id: "logs" as const, label: "Log Stream", icon: FileText },
];

export function DashboardSidebar({
  active,
  onNavigate,
  role,
  onRoleChange,
  onSignOut,
}: {
  active: DashboardSection;
  onNavigate: (section: DashboardSection) => void;
  role: UserRole;
  onRoleChange: (role: UserRole) => void;
  onSignOut?: () => void;
}) {
  return (
    <aside className="app-sidebar" aria-label="OpenTrace navigation">
      <div className="workspace-switcher">
        <div className="brand-mark" aria-hidden="true">
          <Activity />
        </div>
        <div className="workspace-copy">
          <strong>OpenTrace</strong>
          <span>PRODUCTION</span>
        </div>
        <Button
          variant="ghost"
          size="icon-xs"
          className="icon-button workspace-chevron"
          type="button"
          aria-label="Switch workspace"
          disabled
        >
          <ChevronDown />
        </Button>
      </div>

      <div className="project-switcher">
        <div className="project-avatar">M</div>
        <div className="project-copy">
          <strong>MES Production</strong>
          <span>production · us-east-1</span>
        </div>
        <ChevronRight className="project-arrow" aria-hidden="true" />
      </div>

      <div className="sidebar-label">OBSERVABILITY</div>
      <nav className="side-nav">
        {navItems.map(({ id, label, icon: Icon }) => (
          <Button
            key={id}
            variant="ghost"
            className={`side-nav-item h-auto w-full justify-start p-0 font-normal${active === id ? " is-active" : ""}`}
            type="button"
            aria-label={label}
            aria-current={active === id ? "page" : undefined}
            onClick={() => onNavigate(id)}
          >
            <Icon aria-hidden="true" />
            <span>{label}</span>
          </Button>
        ))}
      </nav>

      <div className="sidebar-label services-label">PLATFORM</div>
      <nav className="side-nav" aria-label="Platform">
        <Button
          variant="ghost"
          className={`side-nav-item h-auto w-full justify-start p-0 font-normal${active === "services" ? " is-active" : ""}`}
          type="button"
          aria-label="Services"
          aria-current={active === "services" ? "page" : undefined}
          onClick={() => onNavigate("services")}
        >
          <Boxes aria-hidden="true" />
          <span>Services</span>
        </Button>
        <Button
          variant="ghost"
          className={`side-nav-item h-auto w-full justify-start p-0 font-normal${active === "releases" ? " is-active" : ""}`}
          type="button"
          aria-label="Releases"
          aria-current={active === "releases" ? "page" : undefined}
          onClick={() => onNavigate("releases")}
        >
          <ShieldCheck aria-hidden="true" />
          <span>Releases</span>
        </Button>
        <Button
          variant="ghost"
          className={`side-nav-item h-auto w-full justify-start p-0 font-normal${active === "settings" ? " is-active" : ""}`}
          type="button"
          aria-label="Settings"
          aria-current={active === "settings" ? "page" : undefined}
          onClick={() => onNavigate("settings")}
        >
          <TerminalSquare aria-hidden="true" />
          <span>Settings</span>
        </Button>
      </nav>

      <div className="sidebar-bottom">
        <div className="usage-card">
          <div className="usage-heading">
            <span>INGESTION</span>
            <span>72%</span>
          </div>
          <div className="usage-track">
            <span />
          </div>
          <p>72k of 100k events this month</p>
        </div>
        <Button
          variant="ghost"
          className="side-nav-item support-item h-auto w-full justify-start p-0 font-normal"
          type="button"
          aria-label="Documentation"
          onClick={() => onNavigate("settings")}
        >
          <CircleHelp aria-hidden="true" />
          <span>System Docs</span>
        </Button>
        <UserProfileMenu
          role={role}
          onRoleChange={onRoleChange}
          onSignOut={onSignOut}
          onOpenSettings={() => onNavigate("settings")}
        />
      </div>
      <div className="sidebar-shortcut">
        <Command aria-hidden="true" />
        <span>K</span>
        <small>Search anything</small>
      </div>
    </aside>
  );
}
