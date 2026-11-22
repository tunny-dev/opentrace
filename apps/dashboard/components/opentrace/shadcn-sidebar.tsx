"use client";

import * as React from "react";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  AlertTriangle,
  Bell,
  BookOpen,
  Boxes,
  Check,
  Database,
  FileText,
  Gauge,
  LogOut,
  ShieldCheck,
  TerminalSquare,
  UserRound,
  Settings2,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/i18n-context";
import { Button } from "@/components/ui/button";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import type { UserRole } from "./user-profile-menu";

export function OpenTraceShadcnSidebar({
  role,
  onRoleChange,
  onSignOut,
}: {
  role: UserRole;
  onRoleChange: (role: UserRole) => void;
  onSignOut?: () => void;
}) {
  const pathname = usePathname();
  const { dict, locale, setLocale } = useI18n();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const observabilityItems = [
    { href: "/", label: dict.common.overview, icon: Gauge },
    { href: "/traces", label: dict.common.traces, icon: Activity },
    { href: "/errors", label: dict.common.errors, icon: AlertTriangle },
    { href: "/sql", label: dict.common.sql, icon: Database },
    { href: "/alerts", label: dict.common.alerts, icon: Bell },
    { href: "/logs", label: dict.common.logs, icon: FileText },
  ];

  const platformItems = [
    { href: "/releases", label: dict.common.releases, icon: ShieldCheck },
    { href: "/settings", label: dict.common.settings, icon: TerminalSquare },
  ];

  useEffect(() => {
    if (!userMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [userMenuOpen]);

  return (
    <Sidebar collapsible="icon" variant="sidebar">
      <SidebarHeader className="h-14 w-full shrink-0 justify-center border-b border-(--ot-border) px-3 py-0 group-data-[collapsible=icon]:px-0 sm:h-16">
        <Link
          href="/"
          aria-label="Home"
          className="flex h-full w-full min-w-0 items-center gap-2.5 rounded-md outline-none group-data-[collapsible=icon]:justify-center"
        >
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400">
            <Activity className="size-4.5" />
          </div>
          <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
            <div className="flex items-center gap-1.5 leading-none">
              <span className="block truncate text-sm font-bold tracking-tight text-sidebar-foreground">
                SpurTrace
              </span>
              <span className="text-[8px] font-semibold px-1 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                {dict.sidebar.versionBadge}
              </span>
            </div>
            <span className="block truncate text-[10px] text-muted-foreground mt-0.5">
              {dict.common.fleetName}
            </span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent className="gap-1 px-2 group-data-[collapsible=icon]:px-1 py-2">
        <SidebarGroup>
          <SidebarGroupLabel className="text-[9px] font-semibold tracking-wider text-muted-foreground px-2 py-1 group-data-[collapsible=icon]:hidden">
            {dict.sidebar.observabilityGroup}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {observabilityItems.map((item) => {
                const isActive =
                  pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
                const Icon = item.icon;
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      render={<Link href={item.href} />}
                      isActive={isActive}
                      tooltip={item.label}
                      onClick={(e) => {
                        if (isActive) e.preventDefault();
                      }}
                      className={`h-9 font-medium rounded-lg transition-colors group-data-[collapsible=icon]:size-9! group-data-[collapsible=icon]:justify-center ${
                        isActive
                          ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 font-semibold shadow-xs"
                          : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      }`}
                    >
                      <Icon
                        className={`size-4.5 shrink-0 ${
                          isActive
                            ? "text-emerald-700 dark:text-emerald-400"
                            : "text-muted-foreground"
                        }`}
                      />
                      <span className="truncate group-data-[collapsible=icon]:hidden text-xs">
                        {item.label}
                      </span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-2">
          <SidebarGroupLabel className="text-[9px] font-semibold tracking-wider text-muted-foreground px-2 py-1 group-data-[collapsible=icon]:hidden">
            {dict.sidebar.platformGroup}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {platformItems.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href);
                const Icon = item.icon;
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      render={<Link href={item.href} />}
                      isActive={isActive}
                      tooltip={item.label}
                      onClick={(e) => {
                        if (isActive) e.preventDefault();
                      }}
                      className={`h-9 font-medium rounded-lg transition-colors group-data-[collapsible=icon]:size-9! group-data-[collapsible=icon]:justify-center ${
                        isActive
                          ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 font-semibold shadow-xs"
                          : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      }`}
                    >
                      <Icon
                        className={`size-4.5 shrink-0 ${
                          isActive
                            ? "text-emerald-700 dark:text-emerald-400"
                            : "text-muted-foreground"
                        }`}
                      />
                      <span className="truncate group-data-[collapsible=icon]:hidden text-xs">
                        {item.label}
                      </span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="w-full p-2 gap-1.5 border-t border-sidebar-border group-data-[collapsible=icon]:p-1.5">
        <div className="rounded-lg border border-(--ot-border) bg-(--ot-panel-raised) p-2.5 group-data-[collapsible=icon]:hidden mb-1">
          <div className="flex justify-between text-[9px] text-(--ot-muted) font-semibold mb-1">
            <span>{dict.sidebar.ingestionLabel || "INGESTION"}</span>
            <span className="text-emerald-700 dark:text-emerald-400 font-bold">72%</span>
          </div>
          <div className="h-1.5 w-full bg-slate-200 dark:bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full" style={{ width: "72%" }} />
          </div>
          <p className="text-[9px] text-(--ot-muted) mt-1">72k of 100k events</p>
        </div>

        <div
          className="relative group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center"
          ref={menuRef}
        >
          <Button
            type="button"
            variant="outline"
            className="flex items-center gap-2.5 w-full p-1.5 h-auto rounded-lg border-sidebar-border bg-sidebar hover:bg-sidebar-accent transition-colors group-data-[collapsible=icon]:size-9! group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:justify-center cursor-pointer font-normal justify-start"
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            title="Alex Kim (Admin)"
            aria-label="User profile options"
          >
            <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
              AK
            </div>
            <div className="grid min-w-0 flex-1 text-left text-xs leading-tight group-data-[collapsible=icon]:hidden">
              <span className="truncate font-semibold text-sidebar-foreground">Alex Kim</span>
              <span className="truncate text-[10px] text-muted-foreground">
                alex.kim@opentrace.dev
              </span>
            </div>
            <span
              className={`ml-auto text-[8px] font-bold px-1.5 py-0.5 rounded group-data-[collapsible=icon]:hidden ${
                role === "Admin"
                  ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25"
                  : "bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/25"
              }`}
            >
              {role}
            </span>
          </Button>

          {userMenuOpen && (
            <div className="absolute bottom-full left-0 mb-2 w-60 rounded-lg bg-popover border border-border p-1.5 shadow-2xl z-50 animate-in fade-in slide-in-from-bottom-2">
              <div className="p-2 border-b border-border mb-1">
                <strong className="block text-xs font-semibold text-popover-foreground">
                  Alex Kim
                </strong>
                <span className="block text-[10px] text-muted-foreground">
                  alex.kim@opentrace.dev
                </span>
              </div>
              <div className="px-2 py-1 text-[8px] font-bold text-muted-foreground uppercase tracking-wider">
                {dict.sidebar.roleSwitching}
              </div>
              <Button
                type="button"
                variant="ghost"
                className="flex items-center gap-2 w-full px-2 py-1.5 h-auto rounded text-left text-xs hover:bg-accent text-foreground transition-colors cursor-pointer justify-start font-normal bg-transparent"
                onClick={() => {
                  onRoleChange("Admin");
                  setUserMenuOpen(false);
                }}
              >
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                <div className="flex flex-col">
                  <span className="font-medium text-foreground">{dict.common.admin}</span>
                  <span className="text-[9px] text-muted-foreground">
                    {dict.sidebar.adminDesc || "Full SQL & settings access"}
                  </span>
                </div>
                {role === "Admin" && <Check className="ml-auto h-3 w-3 text-emerald-500" />}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="flex items-center gap-2 w-full px-2 py-1.5 h-auto rounded text-left text-xs hover:bg-accent text-foreground transition-colors cursor-pointer justify-start font-normal bg-transparent"
                onClick={() => {
                  onRoleChange("Viewer");
                  setUserMenuOpen(false);
                }}
              >
                <UserRound className="h-3.5 w-3.5 text-sky-500" />
                <div className="flex flex-col">
                  <span className="font-medium text-foreground">{dict.common.viewer}</span>
                  <span className="text-[9px] text-muted-foreground">
                    {dict.sidebar.viewerDesc || "Masked runtime values"}
                  </span>
                </div>
                {role === "Viewer" && <Check className="ml-auto h-3 w-3 text-sky-500" />}
              </Button>

              <div className="h-px bg-border my-1.5" />

              <div className="px-2 py-1 text-[8px] font-bold text-muted-foreground uppercase tracking-wider">
                {dict.header.languageToggle}
              </div>
              <div className="grid grid-cols-2 gap-1 px-1 mb-1">
                <Button
                  type="button"
                  variant="ghost"
                  className={`flex items-center justify-center gap-1.5 px-2 py-1.5 h-auto rounded text-xs transition-colors cursor-pointer font-normal ${
                    locale === "vi"
                      ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-semibold border border-emerald-500/30"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent border border-transparent bg-transparent"
                  }`}
                  onClick={() => setLocale("vi")}
                >
                  <span className="text-[10px] font-bold px-1 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                    VI
                  </span>
                  <span className="text-[11px]">Tiếng Việt</span>
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className={`flex items-center justify-center gap-1.5 px-2 py-1.5 h-auto rounded text-xs transition-colors cursor-pointer font-normal ${
                    locale === "en"
                      ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-semibold border border-emerald-500/30"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent border border-transparent bg-transparent"
                  }`}
                  onClick={() => setLocale("en")}
                >
                  <span className="text-[10px] font-bold px-1 rounded bg-sky-500/15 text-sky-600 dark:text-sky-400">
                    EN
                  </span>
                  <span className="text-[11px]">English</span>
                </Button>
              </div>

              <div className="h-px bg-border my-1" />
              <Link
                href="/settings"
                className="flex items-center gap-2 px-2 py-1.5 rounded text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                onClick={() => setUserMenuOpen(false)}
              >
                <Settings2 className="h-3.5 w-3.5" />
                <span>{dict.common.settings}</span>
              </Link>
              <Button
                type="button"
                variant="ghost"
                className="flex items-center gap-2 w-full px-2 py-1.5 h-auto rounded text-xs text-red-500 hover:bg-red-500/10 hover:text-red-600 transition-colors cursor-pointer justify-start font-normal bg-transparent"
                onClick={() => {
                  setUserMenuOpen(false);
                  if (onSignOut) onSignOut();
                }}
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>{dict.common.signOut}</span>
              </Button>
            </div>
          )}
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
