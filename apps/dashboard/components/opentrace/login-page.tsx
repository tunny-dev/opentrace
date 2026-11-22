"use client";

import { useState, type FormEvent } from "react";
import {
  Activity,
  ArrowRight,
  Database,
  Eye,
  EyeOff,
  Info,
  Lock,
  ShieldCheck,
  TrendingUp,
  User,
} from "lucide-react";
import type { UserRole } from "./user-profile-menu";
import { ApmTelemetryCard } from "./apm-telemetry-card";
import { LanguageToggle } from "./language-toggle";
import { useI18n } from "@/lib/i18n/i18n-context";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/opentrace/theme-toggle";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldLabel } from "@/components/ui/field";

export function LoginPage({ onLogin }: { onLogin: (role: UserRole, username: string) => void }) {
  const { dict } = useI18n();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("••••••••");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loadingRole, setLoadingRole] = useState<UserRole | null>(null);

  function handleDirectLogin(role: UserRole, user: string) {
    setLoadingRole(role);
    setTimeout(() => {
      onLogin(role, user);
    }, 300);
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (loadingRole) return;
    const role: UserRole =
      username.toLowerCase().includes("viewer") || username.toLowerCase().includes("guest")
        ? "Viewer"
        : "Admin";
    handleDirectLogin(role, username.trim() || "admin");
  }

  return (
    <div className="relative flex h-screen max-h-screen w-full flex-col lg:flex-row overflow-hidden bg-background text-foreground transition-colors duration-300">
      {/* ================= LEFT HERO ASIDE (Enterprise APM & SMT Showcase) ================= */}
      <aside className="relative hidden lg:flex lg:w-[48%] xl:w-[52%] shrink-0 flex-col justify-between overflow-hidden bg-linear-to-br from-emerald-50/70 via-slate-50 to-blue-50/50 dark:from-[#060910] dark:via-[#090d16] dark:to-[#070b12] p-6 lg:p-8 xl:p-12 text-slate-900 dark:text-white select-none border-r border-border transition-colors duration-300">
        {/* Ambient Glow Orbs */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-28 -left-28 size-96 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-28 -right-28 size-96 rounded-full bg-sky-400/10 dark:bg-sky-500/15 blur-3xl"
        />
        {/* Radial Matrix Grid */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(rgba(100,116,139,0.18)_1px,transparent_1px)] dark:bg-[radial-gradient(rgba(255,255,255,0.07)_1px,transparent_1px)] [background-size:24px_24px]"
        />

        {/* Top Header */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-linear-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 shadow-xs">
              <Activity className="size-5" />
            </div>
            <div>
              <span className="block text-sm font-bold tracking-wider text-slate-900 dark:text-white uppercase">
                OpenTrace
              </span>
              <span className="block text-[11px] font-medium text-slate-500 dark:text-slate-400">
                Enterprise APM Observability
              </span>
            </div>
          </div>

          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 dark:border-emerald-500/40 dark:bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400 backdrop-blur-xs">
            <span className="size-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
            <span>Live APM Telemetry</span>
          </div>
        </div>

        {/* Center Hero Content */}
        <div className="relative z-10 my-auto py-4 xl:py-6">
          <h1 className="text-2xl lg:text-3xl xl:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
            Production Monitoring & Real-Time APM Platform
          </h1>
          <p className="mt-2.5 text-xs lg:text-sm xl:text-base text-slate-600 dark:text-slate-300/90 leading-relaxed max-w-xl">
            Unified distributed waterfalls, sub-millisecond SQL diagnostics, automated Outlook
            alerts, and real-time service-level telemetry.
          </p>

          {/* Live OpenTrace APM telemetry (three.js trace waterfall background) */}
          <ApmTelemetryCard className="mt-5 lg:mt-6" />

          {/* 3 Features Cards */}
          <div className="mt-5 lg:mt-6 grid grid-cols-1 sm:grid-cols-3 gap-2.5 lg:gap-3">
            <div className="flex items-start gap-2.5 rounded-lg border border-slate-200/70 dark:border-white/5 bg-white/60 dark:bg-white/[0.02] p-2.5 transition-all duration-200 hover:bg-white dark:hover:bg-white/[0.04]">
              <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg border border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <Activity className="size-4" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-slate-900 dark:text-white">
                  Distributed Traces
                </h4>
                <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                  Waterfall spans & p95 latency resolution across services.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 rounded-lg border border-slate-200/70 dark:border-white/5 bg-white/60 dark:bg-white/[0.02] p-2.5 transition-all duration-200 hover:bg-white dark:hover:bg-white/[0.04]">
              <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg border border-sky-500/20 bg-sky-500/10 text-sky-600 dark:text-sky-400">
                <Database className="size-4" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-slate-900 dark:text-white">
                  SQL Studio & N+1
                </h4>
                <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                  Fingerprint profiling, loops detection, & query plans.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 rounded-lg border border-slate-200/70 dark:border-white/5 bg-white/60 dark:bg-white/[0.02] p-2.5 transition-all duration-200 hover:bg-white dark:hover:bg-white/[0.04]">
              <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg border border-violet-500/20 bg-violet-500/10 text-violet-600 dark:text-violet-400">
                <ShieldCheck className="size-4" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-slate-900 dark:text-white">
                  Outlook & Teams
                </h4>
                <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                  Automated incident gateway with SMTP & webhook delivery.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 border-t border-slate-200/80 dark:border-white/10 pt-3 lg:pt-4">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-emerald-500 dark:bg-emerald-400" />
            <span className="truncate">Production Telemetry Stream • MES Cluster Connected</span>
          </div>
          <span className="font-semibold text-slate-700 dark:text-slate-300 ml-2">
            v2.14.0-enterprise
          </span>
        </div>
      </aside>

      {/* ================= RIGHT SIGN-IN FORM PANEL ================= */}
      <main className="relative flex flex-1 flex-col justify-between overflow-y-auto overflow-x-hidden p-6 sm:p-10 lg:p-12 xl:p-14 bg-linear-to-b from-white via-slate-50/70 to-emerald-50/20 dark:from-[#0c0f17] dark:via-[#090d14] dark:to-[#07090f] transition-colors duration-300">
        {/* Ambient Center Glow */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-96 rounded-full bg-emerald-500/5 dark:bg-emerald-500/10 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(rgba(100,116,139,0.12)_1px,transparent_1px)] dark:bg-[radial-gradient(rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:24px_24px]"
        />

        {/* Top Controls */}
        <div className="relative z-10 flex items-center justify-between w-full">
          <div className="flex lg:hidden items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
              <Activity className="size-4" />
            </div>
            <span className="text-sm font-bold tracking-tight text-foreground uppercase">
              OpenTrace
            </span>
          </div>
          <div className="hidden lg:block" />

          <div className="flex items-center gap-2 rounded-lg border border-border/80 bg-background/80 p-1 shadow-xs backdrop-blur-md">
            <span className="text-[11px] font-medium text-muted-foreground px-2">
              us-east-1 · Production
            </span>
            <div className="h-4 w-px bg-border" />
            <LanguageToggle />
            <ThemeToggle />
          </div>
        </div>

        {/* Center Form Card */}
        <div className="relative z-10 my-auto w-full max-w-sm sm:max-w-md mx-auto py-6">
          <div className="text-left">
            <div className="inline-flex size-11 items-center justify-center rounded-lg bg-linear-to-br from-emerald-500/15 to-teal-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 mb-3.5 shadow-xs">
              <TrendingUp className="size-5" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              {dict.auth.title}
            </h2>
            <p className="mt-1.5 text-xs sm:text-sm text-muted-foreground leading-relaxed">
              {dict.auth.subtitle}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-7 space-y-4">
            <Field>
              <FieldLabel
                htmlFor="username"
                className="text-xs sm:text-sm font-medium text-foreground block"
              >
                {dict.auth.emailLabel}
              </FieldLabel>
              <div className="relative mt-1.5">
                <Input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin or viewer"
                  className="h-11 sm:h-12 w-full pl-10 pr-3.5 text-sm rounded-md bg-background/90 border border-border focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all placeholder:text-muted-foreground"
                />
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
              </div>
            </Field>

            <Field>
              <div className="flex items-center justify-between">
                <FieldLabel
                  htmlFor="password"
                  className="text-xs sm:text-sm font-medium text-foreground"
                >
                  {dict.auth.passwordLabel}
                </FieldLabel>
                <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                  demo: admin / viewer
                </span>
              </div>
              <div className="relative mt-1.5">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-11 sm:h-12 w-full pl-10 pr-11 text-sm rounded-md bg-background/90 border border-border focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all placeholder:text-muted-foreground"
                />
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </Button>
              </div>
            </Field>

            <div className="flex items-center justify-between pt-1">
              <Label
                htmlFor="remember-me"
                className="flex items-center gap-2 cursor-pointer select-none text-xs text-muted-foreground"
              >
                <Checkbox
                  id="remember-me"
                  checked={remember}
                  onCheckedChange={(checked) => setRemember(Boolean(checked))}
                />
                <span>{dict.auth.rememberMe}</span>
              </Label>
            </div>

            <Button
              type="submit"
              disabled={Boolean(loadingRole)}
              className="mt-6 h-11 sm:h-12 w-full rounded-md bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 !text-white font-semibold text-sm shadow-md shadow-emerald-600/20 hover:shadow-lg hover:shadow-emerald-600/30 hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {loadingRole ? (
                <>
                  <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>{dict.common.loading}</span>
                </>
              ) : (
                <>
                  <span>{dict.auth.signInBtn}</span>
                  <ArrowRight className="size-4" />
                </>
              )}
            </Button>
          </form>

          {/* 1-Click Fast Demo Access Section */}
          <div className="mt-6 pt-5 border-t border-border/80">
            <span className="block text-center text-[11px] font-semibold tracking-wider text-muted-foreground uppercase mb-3">
              {dict.auth.quickDemoLogin}
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleDirectLogin("Admin", "Alex Kim (Admin)")}
                className="h-auto flex flex-col items-start p-3 rounded-lg border border-border bg-card/60 hover:bg-card hover:border-emerald-500/40 text-left transition-all cursor-pointer group shadow-xs whitespace-normal"
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-xs font-semibold text-foreground group-hover:text-emerald-500 transition-colors">
                    Workspace Admin
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
                    FULL ACCESS
                  </span>
                </div>
                <span className="text-[11px] text-muted-foreground mt-1 line-clamp-1 font-normal">
                  Full SQL Studio execution & alert management
                </span>
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => handleDirectLogin("Viewer", "Guest Viewer")}
                className="h-auto flex flex-col items-start p-3 rounded-lg border border-border bg-card/60 hover:bg-card hover:border-sky-500/40 text-left transition-all cursor-pointer group shadow-xs whitespace-normal"
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-xs font-semibold text-foreground group-hover:text-sky-500 transition-colors">
                    Viewer Mode
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/25">
                    DATA MASKED
                  </span>
                </div>
                <span className="text-[11px] text-muted-foreground mt-1 line-clamp-1 font-normal">
                  Read-only telemetry with sensitive params hidden
                </span>
              </Button>
            </div>
          </div>

          {/* Security Note Banner */}
          <div className="mt-6 flex items-start gap-2.5 rounded-lg border border-border/80 bg-card/50 p-3.5 text-xs text-muted-foreground backdrop-blur-xs">
            <Info className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
            <p className="leading-relaxed">
              Managed by Zustand persistent session. Access privileges are checked on client
              navigation and API calls.
            </p>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="relative z-10 pt-4 text-center text-xs text-muted-foreground/80">
          <span>
            © {new Date().getFullYear()} OpenTrace Observability • Enterprise APM & Plant IT
            Security
          </span>
        </div>
      </main>
    </div>
  );
}
