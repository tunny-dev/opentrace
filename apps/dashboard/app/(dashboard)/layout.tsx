"use client";

import * as React from "react";
import { useState } from "react";
import { Search } from "lucide-react";

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
import { SpurTraceShadcnSidebar } from "@/components/spurtrace/shadcn-sidebar";
import { TraceDetailPanel } from "@/components/spurtrace/trace-detail-panel";
import { LoginPage } from "@/components/spurtrace/login-page";
import { ThemeToggle } from "@/components/spurtrace/theme-toggle";
import { LanguageToggle } from "@/components/spurtrace/language-toggle";
import { CommandSearch } from "@/components/spurtrace/command-search";
import { TelemetryProvider, useTelemetry } from "@/lib/spurtrace/telemetry-context";
import { useI18n } from "@/lib/i18n/i18n-context";

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
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

  return (
    <SidebarProvider defaultOpen={true} className="h-svh overflow-hidden">
      {/* Shadcn UI Sidebar (matching MESProductionReport AppSidebar) */}
      <SpurTraceShadcnSidebar role={userRole} onRoleChange={setUserRole} onSignOut={signOut} />

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
            <span className="truncate text-xs font-medium text-muted-foreground sm:text-sm">
              MES Production
            </span>
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

            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="h-8 w-8 shrink-0 cursor-pointer sm:hidden"
              onClick={() => setSearchOpen(true)}
              aria-label={dict.header.searchPlaceholder}
            >
              <Search />
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
          <main className="w-full min-w-0 p-4 sm:p-6">{children}</main>
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
