"use client";

import * as React from "react";
import { useState } from "react";
import Link from "next/link";
import { Header } from "@/components/header";
import { Hero3DVisual } from "@/components/hero-3d-visual";
import { HeroApmMockup } from "@/components/hero-apm-mockup";
import {
  NextJsIcon,
  ReactIcon,
  ExpressIcon,
  NestJsIcon,
  DotNetIcon,
  JavaScriptIcon,
} from "@/components/framework-icons";
import {
  Activity,
  ArrowRight,
  Check,
  Copy,
  Zap,
  Database,
  Layers,
  Shield,
  Laptop,
  Terminal,
  ExternalLink,
  ChevronRight,
  Code2,
  Sparkles,
  Server,
  Cpu,
  BarChart3,
  Flame,
} from "lucide-react";

export default function HomePage() {
  const [copiedInstall, setCopiedInstall] = useState(false);
  const [activeCodeTab, setActiveCodeTab] = useState<"express" | "dotnet" | "nestjs" | "react">("express");

  const copyInstall = () => {
    navigator.clipboard.writeText("npm i spurtrace");
    setCopiedInstall(true);
    setTimeout(() => setCopiedInstall(false), 2000);
  };

  const codeSnippets = {
    express: `import express from "express"
import { createSpurTrace, SqliteStorageAdapter } from "spurtrace"

const app = express()
const trace = createSpurTrace({
  appName: "OrderService",
  storage: new SqliteStorageAdapter({ path: "./spurtrace.sqlite" })
})

// 1 line to trace all HTTP latency & errors
app.use(trace.httpMiddleware())

// 1 line to mount full Next.js APM dashboard
app.use("/_telemetry", trace.dashboardMiddleware())`,
    dotnet: `using SpurTrace.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

// Native .NET 6+ Dependency Injection
builder.Services.AddSpurTrace(options => {
    options.AppName = "MESProductionAPI";
    options.StoragePath = "./spurtrace.sqlite";
});

var app = builder.Build();
app.UseSpurTrace();
app.UseSpurTraceDashboard("/_telemetry");
app.Run();`,
    nestjs: `import { Module, MiddlewareConsumer, NestModule } from "@nestjs/common"
import { SpurTraceModule, SpurTraceMiddleware } from "spurtrace/nestjs"

@Module({
  imports: [
    SpurTraceModule.forRoot({
      appName: "InventoryService",
      storagePath: "./spurtrace.sqlite"
    })
  ]
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(SpurTraceMiddleware).forRoutes("*")
  }
}`,
    react: `// In your React / Vite / Next.js Frontend
import { SpurTraceDashboard } from "@spurtrace/react"
import "@spurtrace/react/styles.css"

export function AdminApmTab() {
  return (
    <SpurTraceDashboard
      endpoint="http://localhost:5119/_telemetry/api"
      theme="dark"
      pollIntervalMs={3000}
    />
  )
}`,
  };

  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-emerald-500/20 selection:text-emerald-700 dark:selection:text-emerald-300">
      {/* Top Navbar */}
      <Header />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28">
        {/* Subtle developer grid pattern */}
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

        {/* Interactive Three.js 3D Ambient Visual */}
        <div className="absolute inset-0 -z-5 flex items-center justify-center opacity-30 dark:opacity-45 pointer-events-none">
          <Hero3DVisual className="w-full max-w-5xl h-[550px]" />
        </div>

        <div className="mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
          {/* Release announcement pill */}
          <Link
            href="/docs/getting-started/quickstart"
            className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300 transition-all hover:border-emerald-500/50 hover:bg-emerald-500/15 mb-8"
          >
            <span className="flex size-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>SpurTrace 1.0 is here · Embedded APM for Node.js & .NET 6+</span>
            <ChevronRight className="size-3.5 opacity-70" />
          </Link>

          {/* Master Headline */}
          <h1 className="text-4xl font-extrabold tracking-tight text-zinc-950 dark:text-zinc-50 sm:text-6xl md:text-7xl">
            The Embedded APM for <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-500 bg-clip-text text-transparent">
              Modern Web Backends
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mx-auto mt-6 max-w-2xl text-base text-zinc-600 dark:text-zinc-400 sm:text-lg leading-relaxed font-normal">
            Zero cloud lock-in. Sub-millisecond latency overhead. High-throughput SQLite WAL storage.
            Inspect live request waterfalls, SQL queries, and N+1 detection directly in your application.
          </p>

          {/* CTAs */}
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/docs/getting-started/quickstart"
              className="flex h-11 w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-zinc-950 dark:bg-zinc-100 px-6 text-sm font-semibold text-zinc-100 dark:text-zinc-950 shadow-sm transition hover:bg-zinc-800 dark:hover:bg-white"
            >
              <span>Get Started</span>
              <ArrowRight className="size-4" />
            </Link>

            <Link
              href="/docs/getting-started/introduction"
              className="flex h-11 w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-card px-6 text-sm font-semibold text-zinc-800 dark:text-zinc-200 transition hover:bg-zinc-100 dark:hover:bg-zinc-900"
            >
              <span>Documentation</span>
            </Link>
          </div>

          {/* Quick Install Snippet */}
          <div className="mt-8 inline-flex items-center gap-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-950 px-4 py-2 text-xs font-mono text-zinc-200 shadow-sm">
            <span className="text-zinc-500">$</span>
            <span>npm i spurtrace</span>
            <button
              onClick={copyInstall}
              aria-label="Copy install command"
              className="ml-2 rounded p-1 text-zinc-400 hover:text-white transition"
            >
              {copiedInstall ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
            </button>
          </div>
        </div>

        {/* Hero Visual: Interactive Mock APM Window */}
        <div className="mx-auto max-w-5xl px-4 pt-14 sm:px-6 lg:px-8">
          <HeroApmMockup />
        </div>
      </section>

      {/* Connect a Framework Section (Supabase style) */}
      <section className="border-t border-zinc-200 dark:border-zinc-800/80 py-16 sm:py-20 bg-zinc-50/50 dark:bg-zinc-950/40">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                FRAMEWORKS &amp; RUNTIMES
              </span>
              <h2 className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-950 dark:text-zinc-50">
                Connect a Framework
              </h2>
              <p className="mt-1.5 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
                Native integrations designed to drop into your existing project in under 2 minutes.
              </p>
            </div>
            <Link
              href="/docs/getting-started/quickstart"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              <span>View all guides</span>
              <ChevronRight className="size-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
            {/* 1. Next.js */}
            <Link
              href="/docs/backend/nextjs"
              className="group relative flex flex-col justify-between rounded-xl border border-zinc-200 dark:border-zinc-800 bg-card p-4 transition-all hover:border-emerald-500/50 hover:bg-zinc-100/50 dark:hover:bg-zinc-900/60 shadow-xs cursor-pointer"
            >
              <div>
                <div className="flex size-9 items-center justify-center rounded-lg bg-zinc-950 dark:bg-zinc-900 border border-zinc-800 text-white mb-3 shadow-xs">
                  <NextJsIcon className="size-5" />
                </div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  Next.js
                </h3>
                <p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400 leading-snug">
                  App Router, Route Handlers &amp; instrumentation.ts hook.
                </p>
              </div>
              <div className="mt-4 flex items-center gap-1 text-[10px] font-mono font-medium text-emerald-600 dark:text-emerald-400">
                <span>Next.js Guide</span>
                <ChevronRight className="size-3 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>

            {/* 2. React / Vite */}
            <Link
              href="/docs/frontend/react-component"
              className="group relative flex flex-col justify-between rounded-xl border border-zinc-200 dark:border-zinc-800 bg-card p-4 transition-all hover:border-emerald-500/50 hover:bg-zinc-100/50 dark:hover:bg-zinc-900/60 shadow-xs cursor-pointer"
            >
              <div>
                <div className="flex size-9 items-center justify-center rounded-lg bg-cyan-500/10 dark:bg-cyan-950/30 border border-cyan-500/20 mb-3 shadow-xs">
                  <ReactIcon className="size-5" />
                </div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  React / Vite
                </h3>
                <p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400 leading-snug">
                  Embed &lt;SpurTraceDashboard /&gt; with JSX &amp; TSX support.
                </p>
              </div>
              <div className="mt-4 flex items-center gap-1 text-[10px] font-mono font-medium text-emerald-600 dark:text-emerald-400">
                <span>React Component</span>
                <ChevronRight className="size-3 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>

            {/* 3. Express.js */}
            <Link
              href="/docs/backend/express"
              className="group relative flex flex-col justify-between rounded-xl border border-zinc-200 dark:border-zinc-800 bg-card p-4 transition-all hover:border-emerald-500/50 hover:bg-zinc-100/50 dark:hover:bg-zinc-900/60 shadow-xs cursor-pointer"
            >
              <div>
                <div className="flex size-9 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 mb-3 shadow-xs text-zinc-800 dark:text-zinc-200">
                  <ExpressIcon className="size-5" />
                </div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  Express.js
                </h3>
                <p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400 leading-snug">
                  1-line HTTP middleware &amp; automatic SQL query tracer.
                </p>
              </div>
              <div className="mt-4 flex items-center gap-1 text-[10px] font-mono font-medium text-emerald-600 dark:text-emerald-400">
                <span>Express Guide</span>
                <ChevronRight className="size-3 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>

            {/* 4. NestJS */}
            <Link
              href="/docs/backend/nestjs"
              className="group relative flex flex-col justify-between rounded-xl border border-zinc-200 dark:border-zinc-800 bg-card p-4 transition-all hover:border-emerald-500/50 hover:bg-zinc-100/50 dark:hover:bg-zinc-900/60 shadow-xs cursor-pointer"
            >
              <div>
                <div className="flex size-9 items-center justify-center rounded-lg bg-red-500/10 dark:bg-red-950/30 border border-red-500/20 mb-3 shadow-xs">
                  <NestJsIcon className="size-5" />
                </div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  NestJS
                </h3>
                <p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400 leading-snug">
                  Enterprise SpurTraceModule, interceptors &amp; decorators.
                </p>
              </div>
              <div className="mt-4 flex items-center gap-1 text-[10px] font-mono font-medium text-emerald-600 dark:text-emerald-400">
                <span>NestJS Guide</span>
                <ChevronRight className="size-3 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>

            {/* 5. .NET 6+ */}
            <Link
              href="/docs/backend/dotnet-core"
              className="group relative flex flex-col justify-between rounded-xl border border-zinc-200 dark:border-zinc-800 bg-card p-4 transition-all hover:border-emerald-500/50 hover:bg-zinc-100/50 dark:hover:bg-zinc-900/60 shadow-xs cursor-pointer"
            >
              <div>
                <div className="flex size-9 items-center justify-center rounded-lg bg-purple-500/10 dark:bg-purple-950/30 border border-purple-500/20 mb-3 shadow-xs">
                  <DotNetIcon className="size-5" />
                </div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  ASP.NET Core (.NET 6+)
                </h3>
                <p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400 leading-snug">
                  Modern C# middleware for .NET 6, 7, 8, 9 &amp; Dapper/EF.
                </p>
              </div>
              <div className="mt-4 flex items-center gap-1 text-[10px] font-mono font-medium text-emerald-600 dark:text-emerald-400">
                <span>.NET Guide</span>
                <ChevronRight className="size-3 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>

            {/* 6. Vanilla JS / TS */}
            <Link
              href="/docs/frontend/vanilla-js"
              className="group relative flex flex-col justify-between rounded-xl border border-zinc-200 dark:border-zinc-800 bg-card p-4 transition-all hover:border-emerald-500/50 hover:bg-zinc-100/50 dark:hover:bg-zinc-900/60 shadow-xs cursor-pointer"
            >
              <div>
                <div className="flex size-9 items-center justify-center rounded-lg bg-amber-500/10 dark:bg-amber-950/30 border border-amber-500/20 mb-3 shadow-xs">
                  <JavaScriptIcon className="size-5 rounded" />
                </div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  Vanilla JS / CDN
                </h3>
                <p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400 leading-snug">
                  mountSpurTrace() for Vue, Svelte, or traditional HTML.
                </p>
              </div>
              <div className="mt-4 flex items-center gap-1 text-[10px] font-mono font-medium text-emerald-600 dark:text-emerald-400">
                <span>Vanilla Guide</span>
                <ChevronRight className="size-3 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Use a Client Library or Storage Engine (Supabase style) */}
      <section className="border-t border-zinc-200 dark:border-zinc-800/80 py-16 sm:py-20 bg-background">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              LIBRARIES &amp; STORAGE
            </span>
            <h2 className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-950 dark:text-zinc-50">
              Use a Client Library or Database
            </h2>
            <p className="mt-1.5 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
              Choose your language SDK or connect to your existing enterprise database engine.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link
              href="/docs/getting-started/quickstart"
              className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-card p-5 transition-all hover:border-emerald-500/50 hover:bg-zinc-50 dark:hover:bg-zinc-900/60 shadow-xs cursor-pointer"
            >
              <div className="flex items-center gap-2 mb-2 font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">
                <Terminal className="size-4" />
                <span>JavaScript / TypeScript</span>
              </div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">npm i spurtrace</h3>
              <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Core APM runtime with async context propagation, SQLite WAL adapter, and middleware engine.
              </p>
            </Link>

            <Link
              href="/docs/backend/dotnet-core"
              className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-card p-5 transition-all hover:border-emerald-500/50 hover:bg-zinc-50 dark:hover:bg-zinc-900/60 shadow-xs cursor-pointer"
            >
              <div className="flex items-center gap-2 mb-2 font-mono text-xs font-bold text-purple-600 dark:text-purple-400">
                <Cpu className="size-4" />
                <span>.NET 6 / 7 / 8 / 9</span>
              </div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">SpurTrace.AspNetCore</h3>
              <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                NuGet package for high-throughput C# ASP.NET Core Web APIs, Dapper, and EF Core tracking.
              </p>
            </Link>

            <Link
              href="/docs/storage/database-setup"
              className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-card p-5 transition-all hover:border-emerald-500/50 hover:bg-zinc-50 dark:hover:bg-zinc-900/60 shadow-xs cursor-pointer"
            >
              <div className="flex items-center gap-2 mb-2 font-mono text-xs font-bold text-amber-600 dark:text-amber-400">
                <Database className="size-4" />
                <span>Database Setup</span>
              </div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">SQLite · Postgres · MSSQL</h3>
              <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Zero-setup SQLite WAL mode, or connect to central PostgreSQL or Microsoft SQL Server.
              </p>
            </Link>
          </div>
        </div>
      </section>

      {/* Feature Bento Grid */}
      <section className="border-t border-zinc-200 dark:border-zinc-800 py-16 sm:py-24 bg-zinc-50/50 dark:bg-zinc-950/50">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50 sm:text-3xl">
              Engineered for Speed, Simplicity, and Privacy
            </h2>
            <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Everything you need to monitor, diagnose, and optimize high-throughput production services without SaaS complexity.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {/* Bento Card 1 */}
            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-card p-6 flex flex-col justify-between hover:border-zinc-300 dark:hover:border-zinc-700 transition">
              <div>
                <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 mb-4">
                  <Database className="size-5" />
                </div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">Local SQLite WAL Storage</h3>
                <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  No Elasticsearch clusters or external cloud bills. High-concurrency WAL mode allows thousands of writes per second without blocking reads.
                </p>
              </div>
              <div className="mt-6 font-mono text-[11px] text-zinc-500 dark:text-zinc-400 bg-muted/60 p-2.5 rounded-lg">
                PRAGMA journal_mode = WAL;
              </div>
            </div>

            {/* Bento Card 2 */}
            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-card p-6 flex flex-col justify-between hover:border-zinc-300 dark:hover:border-zinc-700 transition">
              <div>
                <div className="flex size-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 mb-4">
                  <Flame className="size-5" />
                </div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">Automated SQL N+1 Detection</h3>
                <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Queries are automatically fingerprinted and stripped of sensitive parameters. Repeated executions in a single request trigger instant N+1 alerts.
                </p>
              </div>
              <div className="mt-6 font-mono text-[11px] text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-lg font-bold">
                ⚠ N+1 Detected: 12x identical query
              </div>
            </div>

            {/* Bento Card 3 */}
            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-card p-6 flex flex-col justify-between hover:border-zinc-300 dark:hover:border-zinc-700 transition">
              <div>
                <div className="flex size-10 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 mb-4">
                  <Laptop className="size-5" />
                </div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">Native Frontend Component</h3>
                <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Embed <code className="font-mono text-zinc-900 dark:text-zinc-100">&lt;SpurTraceDashboard /&gt;</code> natively into React, Vite, or Next.js, or mount with Vanilla JS. No clunky iframes required.
                </p>
              </div>
              <div className="mt-6 font-mono text-[11px] text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 p-2.5 rounded-lg">
                import &#123; SpurTraceDashboard &#125; from &quot;@spurtrace/react&quot;;
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Code Showcase by Framework */}
      <section className="py-16 sm:py-24 border-t border-zinc-200 dark:border-zinc-800">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50 sm:text-3xl">
              Integrate in Seconds Across Your Stack
            </h2>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Native middleware packages tailored for Node.js frameworks and modern .NET 6+.
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-950 overflow-hidden shadow-xl">
            {/* Framework Switcher Header */}
            <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900/60 px-4">
              <div className="flex gap-2 py-2 overflow-x-auto">
                <button
                  onClick={() => setActiveCodeTab("express")}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    activeCodeTab === "express"
                      ? "bg-zinc-800 text-emerald-400 shadow-xs"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  Express.js
                </button>
                <button
                  onClick={() => setActiveCodeTab("dotnet")}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    activeCodeTab === "dotnet"
                      ? "bg-zinc-800 text-emerald-400 shadow-xs"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  .NET 6 / 7 / 8 / 9
                </button>
                <button
                  onClick={() => setActiveCodeTab("nestjs")}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    activeCodeTab === "nestjs"
                      ? "bg-zinc-800 text-emerald-400 shadow-xs"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  NestJS
                </button>
                <button
                  onClick={() => setActiveCodeTab("react")}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    activeCodeTab === "react"
                      ? "bg-zinc-800 text-emerald-400 shadow-xs"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  React Component (FE)
                </button>
              </div>

              <Link
                href={`/docs/${
                  activeCodeTab === "express"
                    ? "backend/express"
                    : activeCodeTab === "dotnet"
                    ? "backend/dotnet-core"
                    : activeCodeTab === "nestjs"
                    ? "backend/nestjs"
                    : "frontend/react-component"
                }`}
                className="hidden sm:flex items-center gap-1 text-[11px] font-medium text-emerald-400 hover:underline"
              >
                <span>Read Full Guide</span>
                <ChevronRight className="size-3" />
              </Link>
            </div>

            {/* Code Body */}
            <div className="p-5 font-mono text-xs leading-relaxed overflow-x-auto text-zinc-200">
              <pre>{codeSnippets[activeCodeTab]}</pre>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-zinc-200 dark:border-zinc-800 bg-card py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex size-6 items-center justify-center rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
                <Activity className="size-3.5" />
              </div>
              <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">SpurTrace</span>
              <span className="text-xs text-zinc-500">· Embedded APM & Observability</span>
            </div>

            <div className="flex items-center gap-6 text-xs text-zinc-600 dark:text-zinc-400">
              <Link href="/docs/getting-started/introduction" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition">
                Documentation
              </Link>
              <Link href="/docs/getting-started/quickstart" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition">
                Quickstart
              </Link>
              <Link href="/docs/frontend/overview" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition">
                Frontend SDK
              </Link>
              <Link href="/docs/backend/dotnet-core" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition">
                .NET 6+
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
