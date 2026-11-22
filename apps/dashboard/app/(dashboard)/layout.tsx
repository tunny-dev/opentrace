"use client";

import * as React from "react";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { Bell, ChevronDown, Command, RefreshCw, Search } from "lucide-react";

import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { OpenTraceShadcnSidebar } from "@/components/opentrace/shadcn-sidebar";
import { TraceDetailPanel } from "@/components/opentrace/trace-detail-panel";
import { LoginPage } from "@/components/opentrace/login-page";
import { ThemeToggle } from "@/components/opentrace/theme-toggle";
import { LanguageToggle } from "@/components/opentrace/language-toggle";
import { CommandSearch } from "@/components/opentrace/command-search";
import { TelemetryProvider, useTelemetry } from "@/lib/opentrace/telemetry-context";
import { useI18n } from "@/lib/i18n/i18n-context";

const pageTitles: Record<string, string> = {
  "/": "Overview",
  "/traces": "Traces",
  "/errors": "Errors",
  "/sql": "SQL Studio",
  "/alerts": "Alerts",
  "/logs": "Log Stream",
  "/services": "Services",
  "/releases": "Releases",
  "/settings": "Settings",
};

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [searchOpen, setSearchOpen] = useState(false);
  const { dict } = useI18n();

  const {
    isAuthenticated,
    login,
    signOut,
    userRole,
    setUserRole,
    selectedTrace,
    closeTrace,
    liveStream,
    toggleLiveStream,
    refreshDashboard,
    refreshing,
  } = useTelemetry();

  if (!isAuthenticated) {
    return <LoginPage onLogin={login} />;
  }

  const getPageTitle = (path: string): string => {
    switch (path) {
      case "/":
        return dict.common.overview;
      case "/traces":
        return dict.common.traces;
      case "/errors":
        return dict.common.errors;
      case "/sql":
        return dict.common.sql;
      case "/alerts":
        return dict.common.alerts;
      case "/logs":
        return dict.common.logs;
      case "/services":
        return dict.common.services;
      case "/releases":
        return dict.common.releases;
      case "/settings":
        return dict.common.settings;
      default:
        return dict.common.overview;
    }
  };

  const currentTitle = getPageTitle(pathname);

  return (
    <SidebarProvider defaultOpen={true} className="h-svh overflow-hidden">
      {/* Shadcn UI Sidebar (matching MESProductionReport AppSidebar) */}
      <OpenTraceShadcnSidebar role={userRole} onRoleChange={setUserRole} onSignOut={signOut} />

      {/* Main Content Area via official Shadcn SidebarInset */}
      <SidebarInset className="min-w-0 bg-(--ot-bg) flex flex-col h-svh overflow-hidden">
        {/* Fixed Sticky Header (matching MESProductionReport Header) */}
        <header className="sticky top-0 z-40 flex h-14 sm:h-16 shrink-0 items-center justify-between gap-3 overflow-hidden border-b border-(--ot-border) bg-(--ot-panel)/95 px-4 sm:px-6 backdrop-blur-md shadow-xs transition-colors">
          <div className="flex h-full min-w-0 items-center gap-3 sm:gap-4">
            <SidebarTrigger
              variant="outline"
              className="shrink-0 cursor-pointer max-md:scale-110"
            />
            <div className="flex h-6 shrink-0">
              <Separator orientation="vertical" />
            </div>
            <div className="flex min-w-0 items-center gap-1.5 text-xs">
              <span className="hidden shrink-0 font-medium text-muted-foreground sm:inline">
                MES Production
              </span>
              <span className="hidden shrink-0 text-muted-foreground/60 sm:inline">/</span>
              <strong className="truncate font-semibold text-foreground">{currentTitle}</strong>
            </div>

            <div className="hidden lg:flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[11px] font-semibold">
              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>App: MES-Production</span>
            </div>
          </div>

          <div className="ms-auto flex min-w-0 items-center gap-2 sm:gap-3">
            {/* Command Search trigger */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="group relative hidden h-8 min-w-0 shrink items-center justify-between rounded-md border-(--ot-border) bg-(--ot-panel) px-3 text-xs text-(--ot-muted) shadow-xs transition-all hover:bg-(--ot-panel-raised) hover:text-(--ot-text) sm:flex sm:w-40 md:w-56 lg:w-72 font-normal"
              onClick={() => setSearchOpen(true)}
              aria-label={dict.header.searchPlaceholder}
            >
              <div className="flex min-w-0 items-center gap-2">
                <Search className="h-3.5 w-3.5 shrink-0 text-(--ot-muted) transition-colors group-hover:text-(--ot-text)" />
                <span className="truncate text-[11px]">{dict.header.searchPlaceholder}</span>
              </div>
              <kbd className="ml-2 hidden shrink-0 items-center gap-0.5 rounded border border-(--ot-border) bg-(--ot-panel-raised) px-1.5 py-0.5 text-[10px] font-medium text-(--ot-muted) lg:inline-flex">
                ⌘K
              </kbd>
            </Button>

            <div className="hidden h-4 w-px shrink-0 bg-(--ot-border) sm:block" />

            {/* Language Switcher */}
            <LanguageToggle />

            {/* Theme Toggle */}
            <ThemeToggle />
          </div>
        </header>

        {/* Full-width scroll container so the scrollbar stays on the viewport edge,
            while the content is free to use the whole width on large screens. */}
        <div className="min-h-0 w-full flex-1 overflow-x-hidden overflow-y-auto">
          <main className="w-full min-w-0 p-3 sm:p-4 lg:p-6">{children}</main>
        </div>
      </SidebarInset>

      {/* Global Trace Waterfall Drawer (Image 3) */}
      {selectedTrace && <TraceDetailPanel trace={selectedTrace} onClose={closeTrace} />}

      {/* Shadcn UI Command Search Palette */}
      <CommandSearch open={searchOpen} onOpenChange={setSearchOpen} />
    </SidebarProvider>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <TelemetryProvider>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </TelemetryProvider>
  );
}
