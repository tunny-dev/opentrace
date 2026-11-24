"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  AlertTriangle,
  Bell,
  Boxes,
  ChevronsUpDown,
  Code2,
  Database,
  FileText,
  Gauge,
  LogOut,
  Settings2,
  ShieldCheck,
  TerminalSquare,
  UserRound,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/i18n-context";
import { useAuthStore } from "@/lib/spurtrace/auth-store";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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

export function SpurTraceShadcnSidebar({
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
  const { user: authUser } = useAuthStore();
  const userName = authUser?.name || "Administrator";
  const userEmail = authUser?.email || "admin@senao.com";
  const userInitials = (
    userName
      .trim()
      .split(" ")
      .filter(Boolean)
      .map((w) => w[0])
      .join("")
      .slice(0, 2) || "AD"
  ).toUpperCase();
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
          <SidebarGroupLabel className="px-2 py-1 text-xs font-medium tracking-wide text-muted-foreground group-data-[collapsible=icon]:hidden">
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
                      className={`h-10 rounded-xl text-sm font-medium transition-colors group-data-[collapsible=icon]:size-10! group-data-[collapsible=icon]:justify-center ${
                        isActive
                          ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                          : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      }`}
                    >
                      <Icon className="size-4 shrink-0" />
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

        <SidebarGroup className="mt-4">
          <SidebarGroupLabel className="px-2 py-1 text-xs font-medium tracking-wide text-muted-foreground group-data-[collapsible=icon]:hidden">
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
                      className={`h-10 rounded-xl text-sm font-medium transition-colors group-data-[collapsible=icon]:size-10! group-data-[collapsible=icon]:justify-center ${
                        isActive
                          ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                          : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      }`}
                    >
                      <Icon className="size-4 shrink-0" />
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
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                type="button"
                variant="ghost"
                className="flex h-10 w-full cursor-pointer items-center justify-start gap-2.5 rounded-xl px-1 font-normal text-sidebar-foreground transition-colors hover:bg-sidebar-accent group-data-[collapsible=icon]:size-10! group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0"
                aria-label={`${dict.sidebar.signedInAs} ${userName}, ${role}`}
              >
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15 text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                  {userInitials}
                </div>
                <div className="grid min-w-0 flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                  <span className="truncate font-medium text-sidebar-foreground">{userName}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {userEmail}
                  </span>
                </div>
                <span
                  className={`ml-auto shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold group-data-[collapsible=icon]:hidden ${
                    role === "Admin"
                      ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                      : role === "Engineer"
                        ? "bg-sky-500/15 text-sky-600 dark:text-sky-400"
                        : "bg-slate-500/15 text-slate-600 dark:text-slate-400"
                  }`}
                >
                  {role}
                </span>
                <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground group-data-[collapsible=icon]:hidden" />
              </Button>
            }
          />
          <DropdownMenuContent
            side="top"
            align="start"
            sideOffset={8}
            className="w-64 rounded-2xl p-1.5"
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel className="px-3 py-2 font-normal">
                <span className="block text-sm font-medium text-popover-foreground">{userName}</span>
                <span className="block truncate text-xs text-muted-foreground">
                  {userEmail}
                </span>
              </DropdownMenuLabel>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            <DropdownMenuGroup>
              <DropdownMenuLabel>{dict.sidebar.roleSwitching}</DropdownMenuLabel>
              <DropdownMenuRadioGroup
                value={role}
                onValueChange={(value) => {
                  if (value === "Admin" || value === "Engineer" || value === "Viewer") onRoleChange(value as any);
                }}
              >
                <DropdownMenuRadioItem
                  value="Admin"
                  className="min-h-12 cursor-pointer rounded-xl py-2 pl-3 pr-8"
                >
                  <ShieldCheck className="text-emerald-500" />
                  <span className="flex flex-col gap-0.5">
                    <span className="font-medium">{dict.common.admin}</span>
                    <span className="text-xs text-muted-foreground">
                      {dict.sidebar.adminDesc || "Full SQL & settings access"}
                    </span>
                  </span>
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem
                  value="Engineer"
                  className="min-h-12 cursor-pointer rounded-xl py-2 pl-3 pr-8"
                >
                  <Code2 className="text-sky-500" />
                  <span className="flex flex-col gap-0.5">
                    <span className="font-medium">Kỹ sư (Engineer)</span>
                    <span className="text-xs text-muted-foreground">
                      Đọc traces & truy vấn SQL Studio
                    </span>
                  </span>
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem
                  value="Viewer"
                  className="min-h-12 cursor-pointer rounded-xl py-2 pl-3 pr-8"
                >
                  <UserRound className="text-slate-400" />
                  <span className="flex flex-col gap-0.5">
                    <span className="font-medium">{dict.common.viewer}</span>
                    <span className="text-xs text-muted-foreground">
                      {dict.sidebar.viewerDesc || "Masked runtime values"}
                    </span>
                  </span>
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            <DropdownMenuGroup>
              <DropdownMenuLabel>{dict.header.languageToggle}</DropdownMenuLabel>
              <DropdownMenuRadioGroup
                value={locale}
                onValueChange={(value) => {
                  if (value === "vi" || value === "en") setLocale(value);
                }}
              >
                <DropdownMenuRadioItem
                  value="vi"
                  className="min-h-10 cursor-pointer rounded-xl pl-3 pr-8"
                >
                  <span className="inline-flex size-6 items-center justify-center rounded-md bg-emerald-500/15 text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                    VI
                  </span>
                  <span>{dict.header.langVi}</span>
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem
                  value="en"
                  className="min-h-10 cursor-pointer rounded-xl pl-3 pr-8"
                >
                  <span className="inline-flex size-6 items-center justify-center rounded-md bg-sky-500/15 text-[10px] font-bold text-sky-600 dark:text-sky-400">
                    EN
                  </span>
                  <span>{dict.header.langEn}</span>
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              render={<Link href="/settings" />}
              className="min-h-10 cursor-pointer rounded-xl px-3 py-2"
            >
              <Settings2 />
              <span>{dict.common.settings}</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="min-h-10 cursor-pointer rounded-xl px-3 py-2 text-muted-foreground hover:bg-rose-500/10 hover:text-rose-700 focus:bg-rose-500/10 focus:text-rose-700 dark:hover:text-rose-400 dark:focus:text-rose-400"
              onClick={onSignOut}
            >
              <LogOut />
              <span>{dict.common.signOut}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
