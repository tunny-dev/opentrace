import * as React from "react";
import { CodeBlock } from "@/components/code-block";
import { Callout } from "@/components/callout";
import { Steps, Step } from "@/components/steps";
import { Cards, Card } from "@/components/cards";
import { Tabs } from "@/components/tabs";
import { FileTree } from "@/components/file-tree";
import { ArchitectureDiagram } from "@/components/architecture-diagram";
import {
  Server,
  Zap,
  Database,
  Layers,
  Shield,
  Laptop,
  CheckCircle2,
  Cpu,
  Globe,
  Terminal,
  Code2,
  Box,
} from "lucide-react";

export interface DocContentRecord {
  title: string;
  description: string;
  group: string;
  lastUpdated: string;
  badge?: string;
  toc: { id: string; title: string; level: number }[];
  content: React.ReactNode;
}

export const docsContentMap: Record<string, DocContentRecord> = {
  // 1. Introduction
  "getting-started/introduction": {
    title: "Introduction to SpurTrace",
    description: "An embedded, lightweight APM and observability platform with zero cloud lock-in.",
    group: "Getting Started",
    lastUpdated: "November 2026",
    badge: "Core",
    toc: [
      { id: "what-is-opentrace", title: "What is SpurTrace?", level: 2 },
      { id: "core-pillars", title: "Core Architectural Pillars", level: 2 },
      { id: "comparison", title: "SpurTrace vs Traditional APM", level: 2 },
      { id: "next-steps", title: "Next Steps", level: 2 },
    ],
    content: (
      <div className="space-y-6">
        <h2 id="what-is-opentrace" className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          What is SpurTrace?
        </h2>
        <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
          <strong>SpurTrace</strong> is an open-source, developer-friendly Application Performance Monitoring (APM)
          and telemetry suite designed for modern web applications and microservices. Unlike heavyweight commercial
          APM solutions that require complex host agents, cloud billing accounts, and sending confidential data outside,
          SpurTrace embeds directly into your backend service and stores traces locally in high-performance SQLite (WAL mode)
          or your existing database.
        </p>

        <Callout type="tip" title="Designed for Internal Enterprise & Factory Networks">
          SpurTrace keeps 100% of telemetry data within your infrastructure. No external network requests are made,
          making it ideal for internal MES, ERP, banking, and high-security enterprise environments.
        </Callout>

        <h2 id="core-pillars" className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 pt-4">
          Core Architectural Pillars
        </h2>
        <Cards cols={3}>
          <Card
            title="Sub-Millisecond Overhead"
            description="Telemetry records are buffered in memory and written via an asynchronous worker thread. HTTP requests never block."
            href="/docs/getting-started/architecture"
            iconName="zap"
          />
          <Card
            title="Embedded Dashboard UI"
            description="A modern, high-density dashboard served directly by your backend middleware without running a separate frontend server."
            href="/docs/frontend/overview"
            iconName="layers"
          />
          <Card
            title="Tail Sampling & N+1"
            description="Automatically retains 100% of errors and slow requests while sampling healthy traffic to conserve disk space."
            href="/docs/performance/sql-fingerprint"
            iconName="database"
          />
        </Cards>

        <h2 id="comparison" className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 pt-4">
          SpurTrace vs Traditional APM
        </h2>
        <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900/50 text-zinc-900 dark:text-zinc-200">
              <tr>
                <th className="p-3 font-bold">Feature</th>
                <th className="p-3 font-bold text-emerald-600 dark:text-emerald-400">SpurTrace</th>
                <th className="p-3 font-bold">Datadog / New Relic</th>
                <th className="p-3 font-bold">Self-Hosted Jaeger</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300">
              <tr>
                <td className="p-3 font-semibold text-zinc-900 dark:text-zinc-100">Setup Complexity</td>
                <td className="p-3 text-emerald-600 dark:text-emerald-400 font-semibold">1 line of middleware</td>
                <td className="p-3">Host daemon + API keys</td>
                <td className="p-3">Elasticsearch + Collector + UI</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold text-zinc-900 dark:text-zinc-100">Data Exfiltration</td>
                <td className="p-3 text-emerald-600 dark:text-emerald-400 font-semibold">Zero (Local-First)</td>
                <td className="p-3">Yes (Third-party cloud)</td>
                <td className="p-3">No (Self-hosted)</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold text-zinc-900 dark:text-zinc-100">Memory Footprint</td>
                <td className="p-3 text-emerald-600 dark:text-emerald-400 font-semibold">&lt; 15 MB</td>
                <td className="p-3">&gt; 150 MB (Daemon)</td>
                <td className="p-3">&gt; 2 GB (Cluster)</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold text-zinc-900 dark:text-zinc-100">SQL N+1 Detection</td>
                <td className="p-3 text-emerald-600 dark:text-emerald-400 font-semibold">Built-in automatic</td>
                <td className="p-3">Paid Add-on</td>
                <td className="p-3">Manual span creation</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h2 id="next-steps" className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 pt-4">
          Next Steps
        </h2>
        <p className="text-sm text-zinc-700 dark:text-zinc-300">
          Ready to get started? Check out our 2-minute quickstart guide to see live requests in your application.
        </p>
      </div>
    ),
  },

  // 2. Quickstart
  "getting-started/quickstart": {
    title: "Quickstart Guide",
    description: "Install SpurTrace and inspect live telemetry in under 2 minutes.",
    group: "Getting Started",
    lastUpdated: "November 2026",
    badge: "2 min",
    toc: [
      { id: "step-1-install", title: "1. Install the SDK", level: 2 },
      { id: "step-2-initialize", title: "2. Initialize SpurTrace", level: 2 },
      { id: "step-3-inspect", title: "3. Open the Dashboard", level: 2 },
    ],
    content: (
      <div className="space-y-6">
        <p className="text-sm text-zinc-700 dark:text-zinc-300">
          Choose your package manager or framework below to integrate SpurTrace into your service:
        </p>

        <Steps>
          <Step number={1} title="Install SpurTrace SDK">
            <p className="mb-2 text-zinc-700 dark:text-zinc-300">Install the package from npm or NuGet depending on your backend runtime:</p>
            <Tabs
              items={[
                {
                  id: "pnpm",
                  label: "pnpm",
                  content: <CodeBlock code="pnpm add spurtrace" language="bash" />,
                },
                {
                  id: "npm",
                  label: "npm",
                  content: <CodeBlock code="npm install spurtrace" language="bash" />,
                },
                {
                  id: "yarn",
                  label: "yarn",
                  content: <CodeBlock code="yarn add spurtrace" language="bash" />,
                },
                {
                  id: "bun",
                  label: "bun",
                  content: <CodeBlock code="bun add spurtrace" language="bash" />,
                },
                {
                  id: "dotnet",
                  label: ".NET CLI (6+)",
                  content: <CodeBlock code="dotnet add package SpurTrace.AspNetCore" language="bash" />,
                },
              ]}
            />
          </Step>

          <Step number={2} title="Initialize in your application">
            <p className="mb-2 text-zinc-700 dark:text-zinc-300">
              Select your framework below to view the exact setup code:
            </p>
            <Tabs
              items={[
                {
                  id: "express",
                  label: "Express.js",
                  content: (
                    <CodeBlock
                      filename="server.ts"
                      code={`import express from "express"
import { createSpurTrace, SqliteStorageAdapter } from "spurtrace"

const app = express()

// 1. Initialize SpurTrace with SQLite storage
const trace = createSpurTrace({
  appName: "OrderService",
  storage: new SqliteStorageAdapter({ path: "./spurtrace.sqlite" }),
})

// 2. Mount HTTP middleware at the top of your pipeline
app.use(trace.httpMiddleware())

// 3. Serve embedded Next.js dashboard UI
app.use("/_telemetry", trace.dashboardMiddleware())

// 4. Sample route with automatic timing
app.get("/api/orders", async (req, res) => {
  res.json({ message: "Hello SpurTrace" })
})

app.listen(3000, () => console.log("Running on http://localhost:3000"))`}
                    />
                  ),
                },
                {
                  id: "dotnet",
                  label: ".NET 6+ (C#)",
                  content: (
                    <CodeBlock
                      filename="Program.cs"
                      code={`using SpurTrace.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

// 1. Add SpurTrace services via Dependency Injection (.NET 6+)
builder.Services.AddSpurTrace(options =>
{
    options.AppName = "MESProductionAPI";
    options.StoragePath = "./spurtrace.sqlite";
    options.SampleRateSuccess = 0.2; // 20% sample on healthy 200 OKs
    options.SlowRequestThresholdMs = 500;
});

var app = builder.Build();

// 2. SpurTrace HTTP Middleware (Place before controllers)
app.UseSpurTrace();

// 3. Mount Embedded Dashboard UI at /_telemetry
app.UseSpurTraceDashboard("/_telemetry");

app.MapGet("/api/orders", () => Results.Ok(new { message = "Hello from .NET 8 / 9" }));

app.Run();`}
                    />
                  ),
                },
                {
                  id: "nestjs",
                  label: "NestJS",
                  content: (
                    <CodeBlock
                      filename="app.module.ts"
                      code={`import { Module, NestModule, MiddlewareConsumer } from "@nestjs/common"
import { SpurTraceModule, SpurTraceMiddleware } from "spurtrace/nestjs"

@Module({
  imports: [
    SpurTraceModule.forRoot({
      appName: "Nest-Inventory-Service",
      storagePath: "./spurtrace.sqlite",
    }),
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(SpurTraceMiddleware).forRoutes("*")
  }
}`}
                    />
                  ),
                },
                {
                  id: "nextjs",
                  label: "Next.js",
                  content: (
                    <CodeBlock
                      filename="instrumentation.ts"
                      code={`export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { initSpurTrace } = await import("spurtrace/next")
    initSpurTrace({
      appName: "Next-Web-App",
      storagePath: "./spurtrace.sqlite",
    })
  }
}`}
                    />
                  ),
                },
              ]}
            />
          </Step>

          <Step number={3} title="Open the Live Dashboard">
            <p className="mb-2 text-zinc-700 dark:text-zinc-300">
              Visit <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-zinc-900 dark:text-zinc-100 font-semibold">http://localhost:3000/_telemetry/</code> (or port 5000 in .NET) in your browser. You will see live requests, response times, and waterfall breakdowns immediately.
            </p>
            <Callout type="note" title="Storage Connected">
              SpurTrace automatically creates the <code className="font-mono">spurtrace.sqlite</code> file in your working directory and applies WAL mode for concurrent, lock-free operations.
            </Callout>
          </Step>
        </Steps>
      </div>
    ),
  },

  // 3. Architecture
  "getting-started/architecture": {
    title: "Architecture Overview",
    description: "Deep dive into SpurTrace's internal worker threads, batch writers, and storage engine.",
    group: "Getting Started",
    lastUpdated: "November 2026",
    toc: [
      { id: "execution-flow", title: "Execution Flow", level: 2 },
      { id: "async-context", title: "Context Propagation", level: 2 },
      { id: "batch-writer", title: "Non-Blocking Batch Writer", level: 2 },
    ],
    content: (
      <div className="space-y-6">
        <h2 id="execution-flow" className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          Execution Flow
        </h2>
        <p className="text-sm text-zinc-700 dark:text-zinc-300">
          The diagram below illustrates how a single HTTP request travels through your application and how SpurTrace captures telemetry without introducing latency:
        </p>

        <ArchitectureDiagram />

        <h2 id="async-context" className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 pt-4">
          Context Propagation
        </h2>
        <p className="text-sm text-zinc-700 dark:text-zinc-300">
          In Node.js, SpurTrace uses Node&apos;s native <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded text-zinc-900 dark:text-zinc-100">AsyncLocalStorage</code> API. In .NET, it utilizes <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded text-zinc-900 dark:text-zinc-100">AsyncLocal&lt;TraceContext&gt;</code>. This allows nested database queries, service calls, and helper functions to automatically inherit the current request&apos;s trace ID and execution waterfall without passing a trace context parameter through every function.
        </p>

        <h2 id="batch-writer" className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 pt-4">
          Non-Blocking Batch Writer
        </h2>
        <p className="text-sm text-zinc-700 dark:text-zinc-300">
          Writing to disk on every request would degrade throughput under load. SpurTrace uses an in-memory ring buffer with a worker thread that flushes every 1,500ms or when 500 records accumulate. If the storage adapter experiences transient delays, backpressure safeguards prevent memory exhaustion.
        </p>
      </div>
    ),
  },

  // 4. Express.js
  "backend/express": {
    title: "Express.js Integration",
    description: "Complete guide to integrating SpurTrace in Express.js applications with SQL tracking.",
    group: "Backend SDKs",
    lastUpdated: "November 2026",
    badge: "Node.js",
    toc: [
      { id: "installation", title: "Installation", level: 2 },
      { id: "middleware-setup", title: "Middleware Setup", level: 2 },
      { id: "database-instrumentation", title: "Database Instrumentation", level: 2 },
    ],
    content: (
      <div className="space-y-6">
        <h2 id="installation" className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          Installation
        </h2>
        <Tabs
          items={[
            {
              id: "pnpm",
              label: "pnpm",
              content: <CodeBlock code="pnpm add spurtrace" language="bash" />,
            },
            {
              id: "npm",
              label: "npm",
              content: <CodeBlock code="npm install spurtrace" language="bash" />,
            },
            {
              id: "yarn",
              label: "yarn",
              content: <CodeBlock code="yarn add spurtrace" language="bash" />,
            },
            {
              id: "bun",
              label: "bun",
              content: <CodeBlock code="bun add spurtrace" language="bash" />,
            },
          ]}
        />

        <h2 id="middleware-setup" className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 pt-4">
          Middleware Setup
        </h2>
        <CodeBlock
          filename="app.ts"
          code={`import express from "express"
import { createSpurTrace, SqliteStorageAdapter } from "spurtrace"

const app = express()

const trace = createSpurTrace({
  appName: "MES-Production-API",
  storage: new SqliteStorageAdapter({ path: "./spurtrace.sqlite" }),
  sampleRateSuccess: 0.2, // Tail sampling: 20% healthy requests
  slowRequestThresholdMs: 500, // Flag requests > 500ms
  slowQueryThresholdMs: 200,   // Flag SQL queries > 200ms
  auth: {
    enabled: true,
    users: [{ username: "admin", password: process.env.SPURTRACE_PASSWORD || "admin123" }]
  }
})

// 1. MUST be the first middleware
app.use(trace.httpMiddleware())

// 2. Application routes
app.get("/api/orders/:id", async (req, res, next) => {
  try {
    const id = req.params.id
    const order = await trace.runSql(
      "SELECT * FROM orders WHERE id = ?",
      async () => db.query("SELECT * FROM orders WHERE id = ?", [id]),
      (rows) => rows.length
    )
    res.json(order)
  } catch (err) {
    next(err)
  }
})

// 3. Mount dashboard UI at /_telemetry
app.use("/_telemetry", trace.dashboardMiddleware())

// 4. Error capture middleware
app.use(trace.errorMiddleware())

// 5. Final express error handler
app.use((err, req, res, next) => {
  res.status(500).json({ error: err.message })
})`}
        />

        <h2 id="database-instrumentation" className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 pt-4">
          Database Instrumentation
        </h2>
        <p className="text-sm text-zinc-700 dark:text-zinc-300">
          Wrap your database queries with <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded text-zinc-900 dark:text-zinc-100">trace.runSql()</code> to automatically measure query duration, sanitize parameters, and detect N+1 loops:
        </p>
        <CodeBlock
          code={`const users = await trace.runSql(
  "SELECT id, name FROM users WHERE active = 1",
  async () => await prisma.user.findMany({ where: { active: true } }),
  (result) => result.length // Row counter callback
)`}
        />
      </div>
    ),
  },

  // 5. NestJS
  "backend/nestjs": {
    title: "NestJS Integration",
    description: "Idiomatic NestJS module, interceptor, and span decorators.",
    group: "Backend SDKs",
    lastUpdated: "November 2026",
    badge: "NestJS",
    toc: [
      { id: "installation", title: "Installation", level: 2 },
      { id: "module-registration", title: "1. Module Registration", level: 2 },
      { id: "global-interceptor", title: "2. Global Interceptor", level: 2 },
      { id: "custom-decorators", title: "3. Decorators for Spans", level: 2 },
    ],
    content: (
      <div className="space-y-6">
        <h2 id="installation" className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          Installation
        </h2>
        <Tabs
          items={[
            {
              id: "pnpm",
              label: "pnpm",
              content: <CodeBlock code="pnpm add spurtrace @nestjs/common" language="bash" />,
            },
            {
              id: "npm",
              label: "npm",
              content: <CodeBlock code="npm install spurtrace @nestjs/common" language="bash" />,
            },
            {
              id: "yarn",
              label: "yarn",
              content: <CodeBlock code="yarn add spurtrace @nestjs/common" language="bash" />,
            },
            {
              id: "bun",
              label: "bun",
              content: <CodeBlock code="bun add spurtrace @nestjs/common" language="bash" />,
            },
          ]}
        />

        <h2 id="module-registration" className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 pt-4">
          1. Module Registration
        </h2>
        <CodeBlock
          filename="app.module.ts"
          code={`import { Module, NestModule, MiddlewareConsumer } from "@nestjs/common"
import { SpurTraceModule, SpurTraceMiddleware } from "spurtrace/nestjs"

@Module({
  imports: [
    SpurTraceModule.forRoot({
      appName: "Nest-Inventory-Service",
      storagePath: "./spurtrace.sqlite",
      slowRequestThresholdMs: 400,
      slowQueryThresholdMs: 250,
    }),
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(SpurTraceMiddleware).forRoutes("*")
  }
}`}
        />

        <h2 id="global-interceptor" className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 pt-4">
          2. Global Interceptor
        </h2>
        <CodeBlock
          filename="main.ts"
          code={`import { NestFactory } from "@nestjs/core"
import { AppModule } from "./app.module"
import { SpurTraceInterceptor } from "spurtrace/nestjs"

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  app.useGlobalInterceptors(new SpurTraceInterceptor())
  await app.listen(3000)
}
bootstrap()`}
        />

        <h2 id="custom-decorators" className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 pt-4">
          3. Custom Span Decorator
        </h2>
        <CodeBlock
          filename="order.service.ts"
          code={`import { Injectable } from "@nestjs/common"
import { TraceSpan } from "spurtrace/nestjs"

@Injectable()
export class OrderService {
  @TraceSpan("process-payment")
  async processPayment(orderId: string) {
    await this.paymentGateway.charge(orderId)
  }
}`}
        />
      </div>
    ),
  },

  // 6. Next.js Server
  "backend/nextjs": {
    title: "Next.js Server Integration",
    description: "Instrument Next.js App Router, Route Handlers, and Server Actions using instrumentation.ts.",
    group: "Backend SDKs",
    lastUpdated: "November 2026",
    badge: "Next.js",
    toc: [
      { id: "installation", title: "Installation", level: 2 },
      { id: "instrumentation-hook", title: "1. Next.js instrumentation.ts", level: 2 },
      { id: "route-handler-wrapper", title: "2. Route Handler Wrapper", level: 2 },
    ],
    content: (
      <div className="space-y-6">
        <h2 id="installation" className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          Installation
        </h2>
        <Tabs
          items={[
            {
              id: "pnpm",
              label: "pnpm",
              content: <CodeBlock code="pnpm add spurtrace" language="bash" />,
            },
            {
              id: "npm",
              label: "npm",
              content: <CodeBlock code="npm install spurtrace" language="bash" />,
            },
            {
              id: "yarn",
              label: "yarn",
              content: <CodeBlock code="yarn add spurtrace" language="bash" />,
            },
            {
              id: "bun",
              label: "bun",
              content: <CodeBlock code="bun add spurtrace" language="bash" />,
            },
          ]}
        />

        <h2 id="instrumentation-hook" className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 pt-4">
          1. Next.js instrumentation.ts
        </h2>
        <p className="text-sm text-zinc-700 dark:text-zinc-300">
          Next.js 14, 15, and 16 provide a native <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded text-zinc-900 dark:text-zinc-100">instrumentation.ts</code> hook that executes once when the server boots:
        </p>
        <CodeBlock
          filename="instrumentation.ts"
          code={`export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { initSpurTrace } = await import("spurtrace/next")
    initSpurTrace({
      appName: "Next-Web-App",
      storagePath: "./spurtrace.sqlite",
    })
  }
}`}
        />

        <h2 id="route-handler-wrapper" className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 pt-4">
          2. Route Handler Wrapper
        </h2>
        <CodeBlock
          filename="app/api/users/route.ts"
          code={`import { withSpurTrace } from "spurtrace/next"
import { NextResponse } from "next/server"

export const GET = withSpurTrace(async (request) => {
  const users = await db.user.findMany()
  return NextResponse.json(users)
})`}
        />
      </div>
    ),
  },

  // 7. .NET 6+
  "backend/dotnet-core": {
    title: ".NET 6 / 7 / 8 / 9 Integration",
    description: "Modern C# middleware for ASP.NET Core Web APIs, Minimal APIs, and Dapper/EF Core.",
    group: "Backend SDKs",
    lastUpdated: "November 2026",
    badge: ".NET 6+",
    toc: [
      { id: "supported-versions", title: "Supported .NET Versions", level: 2 },
      { id: "nuget-package", title: "1. Install NuGet Package", level: 2 },
      { id: "program-cs", title: "2. Web API & Auto DB Migration", level: 2 },
      { id: "dotnet-mvc", title: "3. .NET MVC & Embedded Dashboard", level: 2 },
      { id: "dapper-efcore", title: "4. Dapper & EF Core Tracking", level: 2 },
      { id: "multi-framework", title: "5. Multi-Framework Fleet (Next.js & NestJS)", level: 2 },
    ],
    content: (
      <div className="space-y-6">
        <h2 id="supported-versions" className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          Supported .NET Versions
        </h2>
        <Callout type="tip" title="Modern .NET First (from .NET 6 onwards)">
          SpurTrace for .NET targets modern unified .NET versions: <strong>.NET 6 (LTS), .NET 7, .NET 8 (LTS), and .NET 9</strong>. It supports both <strong>ASP.NET Core Web APIs</strong> and <strong>ASP.NET Core MVC</strong>, leveraging <code className="font-mono">AsyncLocal&lt;T&gt;</code>, EF Core interceptors, and non-blocking in-memory batch writers.
        </Callout>

        <h2 id="nuget-package" className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 pt-4">
          1. Install NuGet Package
        </h2>
        <Tabs
          items={[
            {
              id: "cli",
              label: ".NET CLI",
              content: <CodeBlock code="dotnet add package SpurTrace.AspNetCore" language="bash" />,
            },
            {
              id: "pm",
              label: "Package Manager",
              content: <CodeBlock code="Install-Package SpurTrace.AspNetCore" language="powershell" />,
            },
            {
              id: "xml",
              label: "PackageReference",
              content: (
                <CodeBlock
                  language="xml"
                  code={`<PackageReference Include="SpurTrace.AspNetCore" Version="1.0.0" />`}
                />
              ),
            },
          ]}
        />

        <h2 id="program-cs" className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 pt-4">
          2. Web API &amp; Auto Database Migration
        </h2>
        <p className="text-sm text-zinc-700 dark:text-zinc-300">
          When your .NET application boots, SpurTrace automatically verifies and creates the universal <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded text-zinc-900 dark:text-zinc-100">sys_traces</code> table if it does not already exist. Configure in <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded text-zinc-900 dark:text-zinc-100">Program.cs</code>:
        </p>
        <CodeBlock
          filename="Program.cs"
          code={`using SpurTrace.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

// 1. Add SpurTrace Services & Auto-Create Table in SQL Server or SQLite
builder.Services.AddSpurTrace(options =>
{
    options.AppName = "MES-Production-API";
    options.StorageType = SpurTraceStorageType.SqlServer;
    options.ConnectionString = builder.Configuration.GetConnectionString("DefaultConnection")!;
    options.AutoCreateTables = true; // Auto-creates dbo.sys_traces if not exists
    options.SampleRateSuccess = 0.2; // 20% healthy requests, 100% errors/slow
    options.SlowRequestThresholdMs = 500;
    options.SlowQueryThresholdMs = 250;
});

var app = builder.Build();

// 2. SpurTrace HTTP Middleware (non-blocking request & error tracking)
app.UseSpurTrace();

// 3. Expose Telemetry API for external React Frontend or monitoring agents
app.MapSpurTraceEndpoints();

app.MapControllers();
app.Run();`}
        />

        <h2 id="dotnet-mvc" className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 pt-4">
          3. .NET MVC &amp; Embedded Dashboard UI
        </h2>
        <p className="text-sm text-zinc-700 dark:text-zinc-300">
          In a <strong>.NET MVC project</strong>, you can serve the complete React Dashboard directly from your MVC application (similar to Swagger UI or Hangfire Dashboard) without installing Node.js on production servers:
        </p>
        <CodeBlock
          filename="Program.cs (.NET MVC)"
          code={`var app = builder.Build();

app.UseSpurTrace();
app.UseStaticFiles(); // Serves dashboard bundle from wwwroot/telemetry

// Map dashboard UI to https://your-domain/telemetry
app.MapFallbackToFile("/telemetry/{*path}", "/telemetry/index.html");
app.MapSpurTraceEndpoints(); // Exposes /api/traces

app.MapDefaultControllerRoute();
app.Run();`}
        />

        <h2 id="dapper-efcore" className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 pt-4">
          4. Dapper &amp; EF Core Tracking
        </h2>
        <p className="text-sm text-zinc-700 dark:text-zinc-300">
          Attach the zero-code <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded">SpurTraceDbInterceptor</code> to your EF Core DbContext to automatically track query latency, sanitize literal bindings, and detect duplicate N+1 patterns:
        </p>
        <CodeBlock
          filename="Program.cs (EF Core)"
          code={`builder.Services.AddDbContext<AppDbContext>((sp, options) =>
{
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection"))
           .AddInterceptors(new SpurTraceDbInterceptor(slowQueryThresholdMs: 250));
});`}
        />

        <h2 id="multi-framework" className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 pt-4">
          5. Multi-Framework Fleet (Next.js &amp; NestJS)
        </h2>
        <p className="text-sm text-zinc-700 dark:text-zinc-300">
          Because SpurTrace uses a single universal contract (<code className="font-mono text-xs bg-muted px-1 py-0.5 rounded">sys_traces</code>), your <strong>Next.js</strong> frontends, <strong>NestJS</strong> microservices, and <strong>.NET</strong> backends can all report to the same database. The unified SpurTrace Dashboard automatically aggregates all services into a live dependency topology map.
        </p>
      </div>
    ),
  },

  // 8. Frontend Overview
  "frontend/overview": {
    title: "Frontend Integration Overview",
    description: "Detailed architecture patterns for connecting frontend apps (React, Vite, Vue, Next.js) to SpurTrace UI.",
    group: "Frontend Integration",
    lastUpdated: "November 2026",
    badge: "Guide",
    toc: [
      { id: "native-vs-iframe", title: "Native Component vs Iframe", level: 2 },
      { id: "integration-options", title: "The 3 Frontend Integration Patterns", level: 2 },
      { id: "react-and-nextjs", title: "Pattern 1: React & Next.js Component Package", level: 2 },
      { id: "vanilla-js", title: "Pattern 2: Vanilla JS / TypeScript Mount", level: 2 },
      { id: "direct-link", title: "Pattern 3: Direct Link in Navigation Bar", level: 2 },
    ],
    content: (
      <div className="space-y-6">
        <h2 id="native-vs-iframe" className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          Native Component vs Iframe
        </h2>
        <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
          Nhiều bạn hỏi: <em>&ldquo;Tại sao ở Frontend lại dùng iframe? Nếu dùng React hoặc Next.js thì phải là component chứ, còn với JavaScript / TypeScript thuần thì thế nào?&rdquo;</em>
        </p>
        <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
          Hoàn toàn chính xác! Trong kiến trúc hiện đại, <strong>iframe chỉ là phương án dự phòng</strong>. SpurTrace cung cấp <strong>Native Component Packages</strong> và <strong>Vanilla Mount API</strong> để bạn nhúng trực tiếp như một UI component bình thường, tận dụng chung React context, TanStack Query, và theme của ứng dụng!
        </p>

        <h2 id="integration-options" className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 pt-4">
          The 3 Frontend Integration Patterns
        </h2>
        <Cards cols={3}>
          <Card
            title="React / Next.js Component"
            description="Import <SpurTraceDashboard /> trực tiếp vào React/Vite/Next.js. Không dùng iframe."
            href="/docs/frontend/react-component"
            iconName="laptop"
            badge="Khuyên Dùng"
          />
          <Card
            title="Vanilla JS / TS Mount"
            description="Dùng hàm mountSpurTrace('#container') cho JavaScript thuần, TypeScript, Vue hoặc HTML thông thường."
            href="/docs/frontend/vanilla-js"
            iconName="code"
            badge="Universal"
          />
          <Card
            title="Direct Link in Menu"
            description="Đặt nút liên kết 'SpurTrace APM' trong navbar (như đã cắm vào MESProductionReport) mở tab riêng."
            href="/docs/frontend/overview#direct-link"
            iconName="globe"
            badge="Siêu Nhẹ"
          />
        </Cards>

        <h2 id="react-and-nextjs" className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 pt-4">
          Pattern 1: React & Next.js Component Package
        </h2>
        <p className="text-sm text-zinc-700 dark:text-zinc-300">
          Cài đặt package <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded text-zinc-900 dark:text-zinc-100">@spurtrace/react</code> trong dự án React hoặc Next.js của bạn:
        </p>
        <CodeBlock code="pnpm add @spurtrace/react" language="bash" />
        <CodeBlock
          filename="MyTelemetryPage.tsx"
          code={`import { SpurTraceDashboard } from "@spurtrace/react"
import "@spurtrace/react/styles.css"

export function SystemApmPage() {
  return (
    <div className="w-full h-screen p-6 bg-background">
      <SpurTraceDashboard
        endpoint="http://localhost:5119/_telemetry/api"
        theme="dark"
        pollIntervalMs={3000}
      />
    </div>
  )
}`}
        />

        <h2 id="vanilla-js" className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 pt-4">
          Pattern 2: Vanilla JS / TypeScript Mount
        </h2>
        <p className="text-sm text-zinc-700 dark:text-zinc-300">
          Với các trang web dùng HTML/JS thuần, jQuery, Vue hoặc bất kỳ framework nào khác:
        </p>
        <CodeBlock
          filename="app.ts"
          code={`import { mountSpurTrace } from "@spurtrace/vanilla"

mountSpurTrace(document.getElementById("telemetry-container"), {
  endpoint: "http://localhost:5119/_telemetry/api",
  theme: "auto",
})`}
        />

        <h2 id="direct-link" className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 pt-4">
          Pattern 3: Direct Link in Navigation Bar (Thực tế tại MESProductionReport)
        </h2>
        <p className="text-sm text-zinc-700 dark:text-zinc-300">
          Đây là phương án tối giản nhất đã được gắn trực tiếp vào <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded text-zinc-900 dark:text-zinc-100">MESProductionReport</code> tại <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded text-zinc-900 dark:text-zinc-100">sidebarData.js</code> và <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded text-zinc-900 dark:text-zinc-100">TraceFilterToolbar.jsx</code>. Người dùng click mở tab mới hiển thị toàn màn hình, không làm nặng dung lượng bundle của trang MES Report.
        </p>
      </div>
    ),
  },

  // 9. React Component Package
  "frontend/react-component": {
    title: "React & Next.js Component Package",
    description: "Embed SpurTrace as a first-class React component with props, theme synchronization, and sub-components.",
    group: "Frontend Integration",
    lastUpdated: "November 2026",
    badge: "React",
    toc: [
      { id: "installation", title: "Installation", level: 2 },
      { id: "full-dashboard", title: "Full Dashboard Component", level: 2 },
      { id: "standalone-waterfall", title: "Single Trace Waterfall Component", level: 2 },
      { id: "props-reference", title: "Props Reference", level: 2 },
    ],
    content: (
      <div className="space-y-6">
        <h2 id="installation" className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          Installation
        </h2>
        <Tabs
          items={[
            {
              id: "pnpm",
              label: "pnpm",
              content: <CodeBlock code="pnpm add @spurtrace/react" language="bash" />,
            },
            {
              id: "npm",
              label: "npm",
              content: <CodeBlock code="npm install @spurtrace/react" language="bash" />,
            },
            {
              id: "yarn",
              label: "yarn",
              content: <CodeBlock code="yarn add @spurtrace/react" language="bash" />,
            },
            {
              id: "bun",
              label: "bun",
              content: <CodeBlock code="bun add @spurtrace/react" language="bash" />,
            },
          ]}
        />

        <h2 id="full-dashboard" className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 pt-4">
          Full Dashboard Component
        </h2>
        <p className="text-sm text-zinc-700 dark:text-zinc-300">
          Nhúng toàn bộ giao diện dashboard quản lý traces, slow SQL, và error inspection vào trang quản trị (hỗ trợ cả JSX và TSX):
        </p>

        <Tabs
          items={[
            {
              id: "jsx",
              label: "JSX (JavaScript)",
              content: (
                <CodeBlock
                  filename="src/features/system-logs/SpurTraceView.jsx"
                  code={`import React from "react"
import { SpurTraceDashboard } from "@spurtrace/react"
import "@spurtrace/react/styles.css"
import { useTheme } from "@/hooks/useTheme"

export function SpurTraceView() {
  const { resolvedTheme } = useTheme()

  return (
    <div className="w-full h-full min-h-[700px] rounded-2xl overflow-hidden border border-border">
      <SpurTraceDashboard
        endpoint={import.meta.env.VITE_API_BASE_URL + "/_telemetry/api"}
        theme={resolvedTheme} // "dark" | "light"
        features={{
          sqlStudio: true,
          errorTracking: true,
          liveStream: true,
        }}
      />
    </div>
  )
}`}
                />
              ),
            },
            {
              id: "tsx",
              label: "TSX (TypeScript)",
              content: (
                <CodeBlock
                  filename="src/features/system-logs/SpurTraceView.tsx"
                  code={`import * as React from "react"
import { SpurTraceDashboard, type SpurTraceDashboardProps } from "@spurtrace/react"
import "@spurtrace/react/styles.css"
import { useTheme } from "@/hooks/useTheme"

export function SpurTraceView(): React.JSX.Element {
  const { resolvedTheme } = useTheme()

  return (
    <div className="w-full h-full min-h-[700px] rounded-2xl overflow-hidden border border-border">
      <SpurTraceDashboard
        endpoint={process.env.NEXT_PUBLIC_API_URL ? \`\${process.env.NEXT_PUBLIC_API_URL}/_telemetry/api\` : "/_telemetry/api"}
        theme={(resolvedTheme as SpurTraceDashboardProps["theme"]) || "dark"}
        features={{
          sqlStudio: true,
          errorTracking: true,
          liveStream: true,
        }}
      />
    </div>
  )
}`}
                />
              ),
            },
          ]}
        />

        <h2 id="standalone-waterfall" className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 pt-4">
          Single Trace Waterfall Component
        </h2>
        <p className="text-sm text-zinc-700 dark:text-zinc-300">
          Nếu bạn muốn chỉ hiển thị biểu đồ waterfall của một request cụ thể (ví dụ khi user bấm vào 1 dòng error log trong bảng):
        </p>

        <Tabs
          items={[
            {
              id: "jsx-waterfall",
              label: "JSX (JavaScript)",
              content: (
                <CodeBlock
                  filename="OrderDetailTraceModal.jsx"
                  code={`import React from "react"
import { TraceWaterfall } from "@spurtrace/react"

export function OrderDetailTraceModal({ traceId }) {
  return (
    <TraceWaterfall
      traceId={traceId}
      endpoint="/_telemetry/api"
      showBreadcrumbs={true}
      showSqlBreakdown={true}
    />
  )
}`}
                />
              ),
            },
            {
              id: "tsx-waterfall",
              label: "TSX (TypeScript)",
              content: (
                <CodeBlock
                  filename="OrderDetailTraceModal.tsx"
                  code={`import * as React from "react"
import { TraceWaterfall } from "@spurtrace/react"

interface OrderDetailTraceModalProps {
  traceId: string;
}

export function OrderDetailTraceModal({ traceId }: OrderDetailTraceModalProps): React.JSX.Element {
  return (
    <TraceWaterfall
      traceId={traceId}
      endpoint="/_telemetry/api"
      showBreadcrumbs={true}
      showSqlBreakdown={true}
    />
  )
}`}
                />
              ),
            },
          ]}
        />

        <h2 id="props-reference" className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 pt-4">
          Props Reference
        </h2>
        <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
          <table className="w-full text-left text-xs font-mono">
            <thead className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900/50 text-zinc-900 dark:text-zinc-200">
              <tr>
                <th className="p-3">Prop</th>
                <th className="p-3">Type</th>
                <th className="p-3">Default</th>
                <th className="p-3 font-sans">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300">
              <tr>
                <td className="p-3 font-bold text-zinc-900 dark:text-zinc-100">endpoint</td>
                <td className="p-3 text-cyan-600 dark:text-cyan-400">string</td>
                <td className="p-3 italic">required</td>
                <td className="p-3 font-sans">URL trỏ tới API của backend SpurTrace.</td>
              </tr>
              <tr>
                <td className="p-3 font-bold text-zinc-900 dark:text-zinc-100">theme</td>
                <td className="p-3 text-cyan-600 dark:text-cyan-400">&quot;dark&quot; | &quot;light&quot; | &quot;system&quot;</td>
                <td className="p-3">&quot;system&quot;</td>
                <td className="p-3 font-sans">Đồng bộ chế độ giao diện sáng/tối.</td>
              </tr>
              <tr>
                <td className="p-3 font-bold text-zinc-900 dark:text-zinc-100">pollIntervalMs</td>
                <td className="p-3 text-cyan-600 dark:text-cyan-400">number</td>
                <td className="p-3">3000</td>
                <td className="p-3 font-sans">Tần suất làm mới dữ liệu tự động (ms).</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    ),
  },

  // 10. Vanilla JS
  "frontend/vanilla-js": {
    title: "Vanilla JS / TypeScript Integration",
    description: "Mount SpurTrace into any standard DOM node without React or bundlers.",
    group: "Frontend Integration",
    lastUpdated: "November 2026",
    badge: "Vanilla",
    toc: [
      { id: "es-modules", title: "ES Modules / TypeScript", level: 2 },
      { id: "script-tag", title: "HTML Script Tag / CDN", level: 2 },
    ],
    content: (
      <div className="space-y-6">
        <h2 id="es-modules" className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          ES Modules / TypeScript
        </h2>
        <p className="text-sm text-zinc-700 dark:text-zinc-300">
          Trong các ứng dụng không dùng React (Vue 3, Svelte, Angular, hoặc TypeScript thuần):
        </p>
        <CodeBlock
          filename="main.ts"
          code={`import { mountSpurTrace } from "@spurtrace/vanilla"
import "@spurtrace/vanilla/styles.css"

const container = document.getElementById("apm-mount-point")

const instance = mountSpurTrace(container, {
  endpoint: "http://localhost:5119/_telemetry/api",
  theme: "dark",
})

// Khi cần unmount
// instance.destroy()`}
        />

        <h2 id="script-tag" className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 pt-4">
          HTML Script Tag / CDN
        </h2>
        <p className="text-sm text-zinc-700 dark:text-zinc-300">
          Với các trang web server-rendered truyền thống (Razor Views, PHP, Django, Express EJS):
        </p>
        <CodeBlock
          filename="index.html"
          code={`<!DOCTYPE html>
<html>
<head>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@spurtrace/vanilla/dist/style.css" />
</head>
<body>
  <div id="spurtrace-root" style="height: 100vh;"></div>

  <script src="https://cdn.jsdelivr.net/npm/@spurtrace/vanilla/dist/index.umd.js"></script>
  <script>
    SpurTrace.mount(document.getElementById('spurtrace-root'), {
      endpoint: '/_telemetry/api'
    });
  </script>
</body>
</html>`}
        />
      </div>
    ),
  },

  // 10. Database Architecture & Schemas
  "storage/database-setup": {
    title: "Database Architecture & sys_traces Schema",
    description: "Single-table APM architecture vs Laravel Telescope comparison, unified DDL schemas, and zero-setup auto-migration.",
    group: "Storage Adapters",
    lastUpdated: "November 2026",
    badge: "Architecture",
    toc: [
      { id: "engine-overview", title: "Supported Database Engines", level: 2 },
      { id: "telescope-comparison", title: "Why 1 Table? vs Laravel Telescope (3 Tables)", level: 2 },
      { id: "unified-schema", title: "Unified sys_traces Schema & Design", level: 2 },
      { id: "sqlite-ddl", title: "1. SQLite WAL DDL (Zero Setup)", level: 2 },
      { id: "postgres-ddl", title: "2. PostgreSQL Range-Partitioned DDL", level: 2 },
      { id: "mssql-ddl", title: "3. Microsoft SQL Server Partitioned DDL", level: 2 },
      { id: "multi-framework-fleet", title: "Multi-Framework Fleet Integration", level: 2 },
      { id: "retention-maintenance", title: "Automated Retention & Partition Dropping", level: 2 },
    ],
    content: (
      <div className="space-y-6">
        <h2 id="engine-overview" className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          Supported Database Engines
        </h2>
        <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
          SpurTrace provides first-class support for three production database backends. All backends adhere to the <strong>exact same single-table contract (<code className="font-mono text-xs bg-muted px-1 py-0.5 rounded">sys_traces</code>)</strong>, enabling any frontend or backend service (.NET, NestJS, Next.js, Express) to write to and read from the exact same telemetry store:
        </p>

        <Cards cols={3}>
          <Card
            title="SQLite WAL"
            description="Zero-maintenance, self-contained single-file storage. Powered by a dedicated worker thread with WAL mode. Ideal for standalone and microservice nodes."
            href="/docs/storage/sqlite"
            iconName="database"
            badge="Default (Zero-Config)"
          />
          <Card
            title="PostgreSQL"
            description="Enterprise relational storage with JSONB columns and daily range partitioning. Detach and drop old daily partitions instantly without table locks."
            href="/docs/storage/postgres-mssql"
            iconName="server"
            badge="Enterprise Cluster"
          />
          <Card
            title="Microsoft SQL Server"
            description="First-class adapter for Windows Server and enterprise MES / ERP relational clusters (.NET 6+). Partition schemes and native ISJSON check constraints."
            href="/docs/storage/postgres-mssql"
            iconName="cpu"
            badge="Enterprise .NET"
          />
        </Cards>

        <h2 id="telescope-comparison" className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 pt-4">
          Why 1 Table? vs Laravel Telescope (3 Tables)
        </h2>
        <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
          Many developers ask: <em>&ldquo;In Laravel Telescope, there are 3 tables (telescope_entries, telescope_entries_tags, telescope_monitoring). Why does SpurTrace use only 1 table (sys_traces)? Does 1 table satisfy all APM monitoring requirements, and is it truly optimal?&rdquo;</em>
        </p>

        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-zinc-200 dark:divide-zinc-800">
            <div className="p-4 bg-amber-500/5 space-y-2">
              <span className="font-bold text-amber-600 dark:text-amber-400 text-sm block">Laravel Telescope (3 Tables)</span>
              <p className="text-zinc-600 dark:text-zinc-400">
                Designed for <strong>local/staging developer debugging</strong>. Each SQL query, log, dump, request, and cache hit is inserted as a separate row in <code className="font-mono">telescope_entries</code> plus multiple rows in <code className="font-mono">telescope_entries_tags</code>.
              </p>
              <ul className="list-disc pl-4 space-y-1 text-zinc-600 dark:text-zinc-400">
                <li><strong>Heavy Write Amplification:</strong> 1 HTTP request executing 30 SQL queries and 5 logs produces <strong>36+ database inserts</strong>.</li>
                <li><strong>Catastrophic Analytics:</strong> Calculating P95/P99 latency, error rate %, or DB time % requires scanning and deserializing millions of rows of JSON <code className="font-mono">content</code> fields.</li>
                <li><strong>High Table Lock Risk:</strong> Foreign key cascades and tag lookups create lock contention under concurrent load.</li>
              </ul>
            </div>
            <div className="p-4 bg-emerald-500/5 space-y-2">
              <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm block">SpurTrace APM (Unified sys_traces)</span>
              <p className="text-zinc-600 dark:text-zinc-400">
                Engineered for <strong>high-throughput production APM</strong> (the same architectural pattern used by Sentry, Datadog, and OpenTelemetry collectors).
              </p>
              <ul className="list-disc pl-4 space-y-1 text-zinc-600 dark:text-zinc-400">
                <li><strong>Zero Write Amplification (1 Write/Request):</strong> All execution spans, queries, breadcrumbs, and exceptions are flushed in <strong>a single batch write</strong> at request completion.</li>
                <li><strong>Sub-Millisecond Percentile Scans:</strong> Metrics (<code className="font-mono">duration_ms</code>, <code className="font-mono">status_code</code>, <code className="font-mono">created_at</code>, <code className="font-mono">app_name</code>) are top-level B-Tree indexed. P50/P95/P99 latency computes in &lt;1 ms without touching JSON payloads.</li>
                <li><strong>Zero Foreign Key Deadlocks:</strong> 1 table means no cascaded deletes, no orphaned children, and instant daily partition drops.</li>
              </ul>
            </div>
          </div>
        </div>

        <Callout type="tip" title="Best of Both Worlds: Fast Aggregates + Deep Waterfalls">
          Top-level indexed columns drive all dashboard graphs, throughput timelines, error rates, and percentile calculations at lightning speed. The rich execution details (<code className="font-mono">spans_json</code>, <code className="font-mono">sql_calls_json</code>, <code className="font-mono">breadcrumbs_json</code>) are stored as compressed JSON and only fetched on demand when clicking into a specific trace waterfall.
        </Callout>

        <h2 id="unified-schema" className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 pt-4">
          Unified sys_traces Schema &amp; Data Types
        </h2>
        <p className="text-sm text-zinc-700 dark:text-zinc-300">
          The table structure is normalized across SQLite, PostgreSQL, and SQL Server:
        </p>

        <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-zinc-100 dark:bg-zinc-800/60 font-semibold text-zinc-900 dark:text-zinc-100">
              <tr>
                <th className="p-2.5 border-b border-zinc-200 dark:border-zinc-700">Column Name</th>
                <th className="p-2.5 border-b border-zinc-200 dark:border-zinc-700">PostgreSQL</th>
                <th className="p-2.5 border-b border-zinc-200 dark:border-zinc-700">SQL Server (MSSQL)</th>
                <th className="p-2.5 border-b border-zinc-200 dark:border-zinc-700">SQLite</th>
                <th className="p-2.5 border-b border-zinc-200 dark:border-zinc-700">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 text-zinc-700 dark:text-zinc-300">
              <tr>
                <td className="p-2.5 font-mono font-semibold text-emerald-600 dark:text-emerald-400">trace_id</td>
                <td className="p-2.5 font-mono">VARCHAR(64)</td>
                <td className="p-2.5 font-mono">NVARCHAR(64)</td>
                <td className="p-2.5 font-mono">TEXT</td>
                <td className="p-2.5">Universal trace ID (UUIDv4, W3C traceparent, or custom string)</td>
              </tr>
              <tr>
                <td className="p-2.5 font-mono font-semibold text-emerald-600 dark:text-emerald-400">app_name</td>
                <td className="p-2.5 font-mono">TEXT</td>
                <td className="p-2.5 font-mono">NVARCHAR(160)</td>
                <td className="p-2.5 font-mono">TEXT</td>
                <td className="p-2.5">Service name (e.g. &apos;MES-Production&apos;, &apos;Storefront-NextJS&apos;, &apos;Order-NestJS&apos;)</td>
              </tr>
              <tr>
                <td className="p-2.5 font-mono font-semibold text-emerald-600 dark:text-emerald-400">method</td>
                <td className="p-2.5 font-mono">VARCHAR(12)</td>
                <td className="p-2.5 font-mono">VARCHAR(12)</td>
                <td className="p-2.5 font-mono">TEXT</td>
                <td className="p-2.5">HTTP method: GET, POST, PUT, DELETE, PATCH, etc.</td>
              </tr>
              <tr>
                <td className="p-2.5 font-mono font-semibold text-emerald-600 dark:text-emerald-400">route</td>
                <td className="p-2.5 font-mono">TEXT</td>
                <td className="p-2.5 font-mono">NVARCHAR(1024)</td>
                <td className="p-2.5 font-mono">TEXT</td>
                <td className="p-2.5">Normalized HTTP route pattern (e.g. &apos;/api/orders/[id]&apos;)</td>
              </tr>
              <tr>
                <td className="p-2.5 font-mono font-semibold text-emerald-600 dark:text-emerald-400">status_code</td>
                <td className="p-2.5 font-mono">SMALLINT</td>
                <td className="p-2.5 font-mono">SMALLINT</td>
                <td className="p-2.5 font-mono">INTEGER</td>
                <td className="p-2.5">HTTP status code (200, 404, 500, etc.)</td>
              </tr>
              <tr>
                <td className="p-2.5 font-mono font-semibold text-emerald-600 dark:text-emerald-400">duration_ms</td>
                <td className="p-2.5 font-mono">DOUBLE PRECISION</td>
                <td className="p-2.5 font-mono">FLOAT</td>
                <td className="p-2.5 font-mono">REAL</td>
                <td className="p-2.5">Total execution latency in milliseconds</td>
              </tr>
              <tr>
                <td className="p-2.5 font-mono font-semibold text-emerald-600 dark:text-emerald-400">created_at</td>
                <td className="p-2.5 font-mono">TIMESTAMPTZ</td>
                <td className="p-2.5 font-mono">DATETIME2(3)</td>
                <td className="p-2.5 font-mono">TEXT (ISO8601)</td>
                <td className="p-2.5">Creation timestamp; acts as partition key</td>
              </tr>
              <tr>
                <td className="p-2.5 font-mono font-semibold text-emerald-600 dark:text-emerald-400">sample_reason</td>
                <td className="p-2.5 font-mono">VARCHAR(12)</td>
                <td className="p-2.5 font-mono">VARCHAR(12)</td>
                <td className="p-2.5 font-mono">TEXT</td>
                <td className="p-2.5">&apos;error&apos;, &apos;slow&apos;, &apos;random&apos;, &apos;forced&apos; (adaptive tail sampling)</td>
              </tr>
              <tr>
                <td className="p-2.5 font-mono font-semibold text-emerald-600 dark:text-emerald-400">exception_json</td>
                <td className="p-2.5 font-mono">JSONB NULL</td>
                <td className="p-2.5 font-mono">NVARCHAR(MAX) NULL</td>
                <td className="p-2.5 font-mono">TEXT NULL</td>
                <td className="p-2.5">Serialized error stack, exception type, and inner exceptions</td>
              </tr>
              <tr>
                <td className="p-2.5 font-mono font-semibold text-emerald-600 dark:text-emerald-400">spans_json</td>
                <td className="p-2.5 font-mono">JSONB NOT NULL</td>
                <td className="p-2.5 font-mono">NVARCHAR(MAX) NOT NULL</td>
                <td className="p-2.5 font-mono">TEXT NOT NULL</td>
                <td className="p-2.5">Array of execution spans: middleware, app logic, external HTTP</td>
              </tr>
              <tr>
                <td className="p-2.5 font-mono font-semibold text-emerald-600 dark:text-emerald-400">sql_calls_json</td>
                <td className="p-2.5 font-mono">JSONB NOT NULL</td>
                <td className="p-2.5 font-mono">NVARCHAR(MAX) NOT NULL</td>
                <td className="p-2.5 font-mono">TEXT NOT NULL</td>
                <td className="p-2.5">Array of SQL executions: query, fingerprint, duration, rows affected</td>
              </tr>
              <tr>
                <td className="p-2.5 font-mono font-semibold text-emerald-600 dark:text-emerald-400">breadcrumbs_json</td>
                <td className="p-2.5 font-mono">JSONB NOT NULL</td>
                <td className="p-2.5 font-mono">NVARCHAR(MAX) NOT NULL</td>
                <td className="p-2.5 font-mono">TEXT NOT NULL</td>
                <td className="p-2.5">Correlated logging events and checkpoints occurring during the trace</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h2 id="sqlite-ddl" className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 pt-4">
          1. SQLite WAL DDL (Zero Setup)
        </h2>
        <p className="text-sm text-zinc-700 dark:text-zinc-300">
          Created automatically by SpurTrace on startup. Zero configuration required:
        </p>
        <CodeBlock
          language="sql"
          filename="sqlite_schema.sql"
          code={`PRAGMA journal_mode = WAL;
PRAGMA synchronous = NORMAL;
PRAGMA busy_timeout = 5000;

CREATE TABLE IF NOT EXISTS sys_traces (
  trace_id TEXT NOT NULL,
  app_name TEXT NOT NULL,
  method TEXT NOT NULL,
  route TEXT NOT NULL,
  status_code INTEGER NOT NULL,
  duration_ms REAL NOT NULL,
  created_at TEXT NOT NULL,
  sample_reason TEXT NOT NULL,
  exception_json TEXT,
  spans_json TEXT NOT NULL DEFAULT '[]',
  sql_calls_json TEXT NOT NULL DEFAULT '[]',
  breadcrumbs_json TEXT NOT NULL DEFAULT '[]',
  PRIMARY KEY (trace_id, created_at)
);

CREATE INDEX IF NOT EXISTS idx_sys_traces_app_created ON sys_traces (app_name, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sys_traces_status_created ON sys_traces (status_code, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sys_traces_duration ON sys_traces (duration_ms DESC);`}
        />

        <h2 id="postgres-ddl" className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 pt-4">
          2. PostgreSQL Range-Partitioned DDL
        </h2>
        <p className="text-sm text-zinc-700 dark:text-zinc-300">
          Partitioned by day on <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded">created_at</code>. Daily child partitions automatically inherit all indexes:
        </p>
        <CodeBlock
          language="sql"
          filename="spurtrace/schema/postgres.sql"
          code={`CREATE TABLE IF NOT EXISTS sys_traces (
  trace_id VARCHAR(64) NOT NULL,
  app_name TEXT NOT NULL,
  method VARCHAR(12) NOT NULL,
  route TEXT NOT NULL,
  status_code SMALLINT NOT NULL,
  duration_ms DOUBLE PRECISION NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  sample_reason VARCHAR(12) NOT NULL,
  exception_json JSONB,
  spans_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  sql_calls_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  breadcrumbs_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  PRIMARY KEY (trace_id, created_at)
) PARTITION BY RANGE (created_at);

CREATE INDEX IF NOT EXISTS idx_sys_traces_app_created ON sys_traces (app_name, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sys_traces_status_created ON sys_traces (status_code, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sys_traces_duration ON sys_traces (duration_ms DESC);`}
        />

        <h2 id="mssql-ddl" className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 pt-4">
          3. Microsoft SQL Server Partitioned DDL
        </h2>
        <p className="text-sm text-zinc-700 dark:text-zinc-300">
          Uses partition functions and partition schemes for Windows Server / Azure SQL:
        </p>
        <CodeBlock
          language="sql"
          filename="spurtrace/schema/sqlserver.sql"
          code={`IF OBJECT_ID(N'dbo.sys_traces', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.sys_traces (
    created_at datetime2(3) NOT NULL,
    trace_id nvarchar(64) NOT NULL,
    app_name nvarchar(160) NOT NULL,
    method varchar(12) NOT NULL,
    route nvarchar(1024) NOT NULL,
    status_code smallint NOT NULL,
    duration_ms float NOT NULL,
    sample_reason varchar(12) NOT NULL,
    exception_json nvarchar(max) NULL,
    spans_json nvarchar(max) NOT NULL CONSTRAINT df_sys_traces_spans DEFAULT N'[]',
    sql_calls_json nvarchar(max) NOT NULL CONSTRAINT df_sys_traces_sql DEFAULT N'[]',
    breadcrumbs_json nvarchar(max) NOT NULL CONSTRAINT df_sys_traces_breadcrumbs DEFAULT N'[]',
    CONSTRAINT pk_sys_traces PRIMARY KEY CLUSTERED (created_at, trace_id),
    CONSTRAINT ck_sys_traces_spans_json CHECK (ISJSON(spans_json) = 1),
    CONSTRAINT ck_sys_traces_sql_json CHECK (ISJSON(sql_calls_json) = 1),
    CONSTRAINT ck_sys_traces_breadcrumbs_json CHECK (ISJSON(breadcrumbs_json) = 1)
  );

  CREATE INDEX idx_sys_traces_app_created ON dbo.sys_traces (app_name, created_at DESC);
  CREATE INDEX idx_sys_traces_status_created ON dbo.sys_traces (status_code, created_at DESC);
  CREATE INDEX idx_sys_traces_duration ON dbo.sys_traces (duration_ms DESC, created_at);
END;`}
        />

        <h2 id="multi-framework-fleet" className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 pt-4">
          Multi-Framework Fleet Integration
        </h2>
        <p className="text-sm text-zinc-700 dark:text-zinc-300">
          Because every SDK writes to this single table schema, your entire polyglot fleet lives in harmony in one dashboard:
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-3 bg-zinc-50 dark:bg-zinc-900/40">
            <span className="font-semibold text-xs text-zinc-900 dark:text-zinc-100 block mb-1">.NET 6 / 7 / 8 / 9 (.NET MVC &amp; Web API)</span>
            <p className="text-[11px] text-zinc-600 dark:text-zinc-400">
              Uses <code className="font-mono">SpurTraceDbInitializer</code> on application boot to automatically verify or create <code className="font-mono">sys_traces</code>. Writes non-blocking records via <code className="font-mono">System.Threading.Channels</code>.
            </p>
          </div>
          <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-3 bg-zinc-50 dark:bg-zinc-900/40">
            <span className="font-semibold text-xs text-zinc-900 dark:text-zinc-100 block mb-1">Next.js &amp; React (App Router &amp; Actions)</span>
            <p className="text-[11px] text-zinc-600 dark:text-zinc-400">
              Instruments server-side route handlers and server actions via <code className="font-mono">withSpurTrace()</code> or <code className="font-mono">instrumentation.ts</code>, writing directly to SQLite or posting to <code className="font-mono">POST /api/traces</code>.
            </p>
          </div>
          <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-3 bg-zinc-50 dark:bg-zinc-900/40">
            <span className="font-semibold text-xs text-zinc-900 dark:text-zinc-100 block mb-1">NestJS &amp; Express Microservices</span>
            <p className="text-[11px] text-zinc-600 dark:text-zinc-400">
              Emits traces tagged with their unique <code className="font-mono">app_name</code> (e.g. &apos;Order-Service&apos;, &apos;Payment-Gateway&apos;). The dashboard automatically maps services into a dependency topology.
            </p>
          </div>
          <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-3 bg-zinc-50 dark:bg-zinc-900/40">
            <span className="font-semibold text-xs text-zinc-900 dark:text-zinc-100 block mb-1">Direct Ingestion API</span>
            <p className="text-[11px] text-zinc-600 dark:text-zinc-400">
              Any legacy service or external worker can push traces via standard HTTP <code className="font-mono">POST /api/traces</code> with a JSON payload matching the <code className="font-mono">TraceRecord</code> interface.
            </p>
          </div>
        </div>

        <h2 id="retention-maintenance" className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 pt-4">
          Automated Retention &amp; Partition Dropping
        </h2>
        <Callout type="tip" title="Zero Table-Lock Partition Detach">
          For PostgreSQL and SQL Server, do not run heavy <code className="font-mono">DELETE FROM sys_traces WHERE created_at &lt; ...</code> statements, which cause high transaction log bloat and row locks. Instead, run daily maintenance to detach and drop expired daily partitions instantly.
        </Callout>
      </div>
    ),
  },

  // 11. SQLite WAL
  "storage/sqlite": {
    title: "SQLite WAL Storage Adapter",
    description: "High-performance, zero-maintenance local storage with Write-Ahead Logging and dedicated worker thread.",
    group: "Storage Adapters",
    lastUpdated: "November 2026",
    badge: "Default",
    toc: [
      { id: "why-sqlite", title: "Why SQLite WAL for APM?", level: 2 },
      { id: "worker-architecture", title: "Dedicated Worker Thread Architecture", level: 2 },
      { id: "configuration", title: "Configuration Options", level: 2 },
      { id: "auto-migration", title: "Zero-Setup Auto-Migration", level: 2 },
    ],
    content: (
      <div className="space-y-6">
        <h2 id="why-sqlite" className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          Why SQLite WAL for APM?
        </h2>
        <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
          SQLite in <strong>Write-Ahead Logging (WAL)</strong> mode is an exceptional storage engine for telemetry. Readers never block writers, and writers never block readers. Under batch transactions, SQLite achieves up to <strong>50,000 writes/second</strong> on modern NVMe drives with virtually zero CPU overhead.
        </p>

        <h2 id="worker-architecture" className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 pt-4">
          Dedicated Worker Thread Architecture
        </h2>
        <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
          In Node.js / Bun environments, SpurTrace offloads all SQLite file I/O to a dedicated background <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded">worker_thread</code> (<code className="font-mono">sqlite-worker.mjs</code>). The main event loop that processes your web traffic <strong>never touches the SQLite database file directly</strong>:
        </p>
        <ul className="list-disc pl-5 text-xs text-zinc-700 dark:text-zinc-300 space-y-1.5">
          <li><strong>0 ms Event Loop Lag:</strong> Trace records are buffered into an in-memory batch writer and transferred via structured cloning.</li>
          <li><strong>WAL Checkpoints:</strong> Passive checkpoints merge WAL pages back to the main database file without locking reads or writes.</li>
          <li><strong>Busy Timeout Protection:</strong> Configured with <code className="font-mono">busy_timeout = 5000</code> to eliminate any <code className="font-mono">SQLITE_BUSY</code> errors during peak traffic spikes.</li>
        </ul>

        <h2 id="configuration" className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 pt-4">
          Configuration Options
        </h2>
        <CodeBlock
          filename="server.ts"
          code={`import { createSpurTrace, SqliteStorageAdapter } from "spurtrace"

const trace = createSpurTrace({
  appName: "OrderService",
  storage: new SqliteStorageAdapter({
    path: "./spurtrace.sqlite", // Auto-creates file and sys_traces table
  }),
})`}
        />

        <h2 id="auto-migration" className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 pt-4">
          Zero-Setup Auto-Migration
        </h2>
        <p className="text-sm text-zinc-700 dark:text-zinc-300">
          On initialization, the adapter automatically executes <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded">CREATE TABLE IF NOT EXISTS sys_traces</code> and the required composite indexes. No manual migration scripts, CLI migrations, or database administrators are required.
        </p>
      </div>
    ),
  },

  // 12. Postgres / MSSQL
  "storage/postgres-mssql": {
    title: "PostgreSQL & SQL Server Enterprise Setup",
    description: "Production setup for shared enterprise databases, daily range partitioning, connection pooling, and multi-framework fleet ingestion.",
    group: "Storage Adapters",
    lastUpdated: "November 2026",
    badge: "Enterprise",
    toc: [
      { id: "enterprise-overview", title: "Enterprise Multi-Instance APM", level: 2 },
      { id: "postgres-setup", title: "1. PostgreSQL Production Guide", level: 2 },
      { id: "postgres-cron", title: "2. PostgreSQL Daily Partition Cron", level: 2 },
      { id: "mssql-setup", title: "3. Microsoft SQL Server Setup", level: 2 },
      { id: "mssql-retention", title: "4. SQL Server Partition Switching", level: 2 },
      { id: "polyglot-connection", title: "5. Connecting .NET, Next.js & NestJS", level: 2 },
    ],
    content: (
      <div className="space-y-6">
        <h2 id="enterprise-overview" className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          Enterprise Multi-Instance APM
        </h2>
        <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
          In distributed microservice clusters (Kubernetes pods, Docker Swarms, or multi-server IIS farms), container instances are ephemeral. SpurTrace supports centralizing all telemetry into a shared PostgreSQL or Microsoft SQL Server cluster while keeping application overhead below 1 millisecond.
        </p>

        <h2 id="postgres-setup" className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 pt-4">
          1. PostgreSQL Production Guide
        </h2>
        <p className="text-sm text-zinc-700 dark:text-zinc-300">
          Execute the unified partitioned schema in your PostgreSQL database:
        </p>
        <CodeBlock
          language="sql"
          filename="spurtrace/schema/postgres.sql"
          code={`CREATE TABLE IF NOT EXISTS sys_traces (
  trace_id VARCHAR(64) NOT NULL,
  app_name TEXT NOT NULL,
  method VARCHAR(12) NOT NULL,
  route TEXT NOT NULL,
  status_code SMALLINT NOT NULL,
  duration_ms DOUBLE PRECISION NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  sample_reason VARCHAR(12) NOT NULL,
  exception_json JSONB,
  spans_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  sql_calls_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  breadcrumbs_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  PRIMARY KEY (trace_id, created_at)
) PARTITION BY RANGE (created_at);

CREATE INDEX IF NOT EXISTS idx_sys_traces_app_created ON sys_traces (app_name, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sys_traces_status_created ON sys_traces (status_code, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sys_traces_duration ON sys_traces (duration_ms DESC);`}
        />

        <h2 id="postgres-cron" className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 pt-4">
          2. PostgreSQL Daily Partition Maintenance
        </h2>
        <p className="text-sm text-zinc-700 dark:text-zinc-300">
          Pre-create the next 14 daily partitions using a scheduled maintenance job (or <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded">pg_cron</code>):
        </p>
        <CodeBlock
          language="sql"
          code={`DO \$\$
DECLARE
  day_offset INTEGER;
  partition_start TIMESTAMPTZ;
  partition_end TIMESTAMPTZ;
  partition_name TEXT;
BEGIN
  FOR day_offset IN 0..13 LOOP
    partition_start := date_trunc('day', now()) + day_offset * INTERVAL '1 day';
    partition_end := partition_start + INTERVAL '1 day';
    partition_name := 'sys_traces_' || to_char(partition_start, 'YYYYMMDD');
    EXECUTE format(
      'CREATE TABLE IF NOT EXISTS %I PARTITION OF sys_traces FOR VALUES FROM (%L) TO (%L)',
      partition_name, partition_start, partition_end
    );
  END LOOP;
END \$\$;`}
        />

        <h2 id="mssql-setup" className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 pt-4">
          3. Microsoft SQL Server Setup
        </h2>
        <p className="text-sm text-zinc-700 dark:text-zinc-300">
          For enterprise Windows Server, Azure SQL, and MES factory clusters:
        </p>
        <CodeBlock
          language="sql"
          filename="spurtrace/schema/sqlserver.sql"
          code={`IF OBJECT_ID(N'dbo.sys_traces', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.sys_traces (
    created_at datetime2(3) NOT NULL,
    trace_id nvarchar(64) NOT NULL,
    app_name nvarchar(160) NOT NULL,
    method varchar(12) NOT NULL,
    route nvarchar(1024) NOT NULL,
    status_code smallint NOT NULL,
    duration_ms float NOT NULL,
    sample_reason varchar(12) NOT NULL,
    exception_json nvarchar(max) NULL,
    spans_json nvarchar(max) NOT NULL CONSTRAINT df_sys_traces_spans DEFAULT N'[]',
    sql_calls_json nvarchar(max) NOT NULL CONSTRAINT df_sys_traces_sql DEFAULT N'[]',
    breadcrumbs_json nvarchar(max) NOT NULL CONSTRAINT df_sys_traces_breadcrumbs DEFAULT N'[]',
    CONSTRAINT pk_sys_traces PRIMARY KEY CLUSTERED (created_at, trace_id),
    CONSTRAINT ck_sys_traces_spans_json CHECK (ISJSON(spans_json) = 1),
    CONSTRAINT ck_sys_traces_sql_json CHECK (ISJSON(sql_calls_json) = 1),
    CONSTRAINT ck_sys_traces_breadcrumbs_json CHECK (ISJSON(breadcrumbs_json) = 1)
  );

  CREATE INDEX idx_sys_traces_app_created ON dbo.sys_traces (app_name, created_at DESC);
  CREATE INDEX idx_sys_traces_status_created ON dbo.sys_traces (status_code, created_at DESC);
  CREATE INDEX idx_sys_traces_duration ON dbo.sys_traces (duration_ms DESC, created_at);
END;`}
        />

        <h2 id="mssql-retention" className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 pt-4">
          4. SQL Server Partition Switching &amp; Retention
        </h2>
        <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
          To purge traces older than your retention window (e.g. 14 days) in high-throughput SQL Server environments without causing table lock escalation:
        </p>
        <ul className="list-disc pl-5 text-xs text-zinc-700 dark:text-zinc-300 space-y-1">
          <li>Switch the expired partition into an empty staging table (<code className="font-mono">ALTER TABLE dbo.sys_traces SWITCH PARTITION 1 TO dbo.sys_traces_staging;</code>).</li>
          <li>Truncate the staging table (<code className="font-mono">TRUNCATE TABLE dbo.sys_traces_staging;</code>). This takes 0 milliseconds.</li>
          <li>Merge the old partition boundary using <code className="font-mono">ALTER PARTITION FUNCTION</code>.</li>
        </ul>

        <h2 id="polyglot-connection" className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 pt-4">
          5. Connecting .NET, Next.js &amp; NestJS to Central DB
        </h2>
        <p className="text-sm text-zinc-700 dark:text-zinc-300">
          Point all your applications to the shared database:
        </p>
        <Tabs
          items={[
            {
              id: "dotnet",
              label: ".NET 6+ (Program.cs)",
              content: (
                <CodeBlock
                  filename="Program.cs"
                  code={`builder.Services.AddSpurTrace(options =>
{
    options.AppName = "MES-Production-API";
    options.StorageType = SpurTraceStorageType.SqlServer;
    options.ConnectionString = builder.Configuration.GetConnectionString("DefaultConnection")!;
    options.AutoCreateTables = true; // Auto-creates sys_traces on first run
});`}
                />
              ),
            },
            {
              id: "nestjs",
              label: "NestJS (app.module.ts)",
              content: (
                <CodeBlock
                  filename="app.module.ts"
                  code={`SpurTraceModule.forRoot({
  appName: "Order-NestJS",
  storage: new PostgresStorageAdapter({
    connectionString: process.env.DATABASE_URL!,
  }),
})`}
                />
              ),
            },
            {
              id: "nextjs",
              label: "Next.js (instrumentation.ts)",
              content: (
                <CodeBlock
                  filename="instrumentation.ts"
                  code={`export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { initSpurTrace } = await import("@spurtrace/next");
    initSpurTrace({
      appName: "Storefront-NextJS",
      connectionString: process.env.DATABASE_URL,
    });
  }
}`}
                />
              ),
            },
          ]}
        />
      </div>
    ),
  },

  // 13. SQL Fingerprinting & N+1
  "performance/sql-fingerprint": {
    title: "SQL Fingerprinting & N+1 Detection",
    description: "How SpurTrace abstracts queries, protects sensitive parameters, and detects N+1 loops.",
    group: "APM & Diagnostics",
    lastUpdated: "November 2026",
    badge: "APM",
    toc: [
      { id: "fingerprinting", title: "Query Fingerprinting", level: 2 },
      { id: "n-plus-one", title: "Automatic N+1 Detection", level: 2 },
    ],
    content: (
      <div className="space-y-6">
        <h2 id="fingerprinting" className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          Query Fingerprinting
        </h2>
        <p className="text-sm text-zinc-700 dark:text-zinc-300">
          SpurTrace automatically normalizes queries by masking literal strings, numbers, and UUIDs with <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded text-zinc-900 dark:text-zinc-100">?</code> so that query patterns can be aggregated:
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4">
            <span className="text-xs font-bold text-red-600 dark:text-red-400 block mb-1">Raw Query (Sensitive)</span>
            <code className="text-xs font-mono text-zinc-800 dark:text-zinc-300 block whitespace-pre-wrap">
              SELECT * FROM users WHERE email = &apos;user@example.com&apos; AND role = 1
            </code>
          </div>
          <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4">
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 block mb-1">Normalized Fingerprint</span>
            <code className="text-xs font-mono text-zinc-800 dark:text-zinc-300 block whitespace-pre-wrap">
              select * from users where email = ? and role = ?
            </code>
          </div>
        </div>

        <h2 id="n-plus-one" className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 pt-4">
          Automatic N+1 Detection
        </h2>
        <p className="text-sm text-zinc-700 dark:text-zinc-300">
          When an HTTP request triggers the same fingerprint 3 or more times (such as querying items inside a loop), SpurTrace tags the trace with a prominent red <strong>N+1 Alert</strong> badge and displays the exact execution count in the waterfall view.
        </p>
      </div>
    ),
  },

  // 14. Latency Waterfall
  "performance/waterfall": {
    title: "Latency Waterfalls",
    description: "Break down request execution across middleware, database, and application logic.",
    group: "APM & Diagnostics",
    lastUpdated: "November 2026",
    toc: [
      { id: "waterfall-spans", title: "Span Categories", level: 2 },
    ],
    content: (
      <div className="space-y-6">
        <h2 id="waterfall-spans" className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          Span Categories
        </h2>
        <p className="text-sm text-zinc-700 dark:text-zinc-300">
          Every trace in SpurTrace is decomposed into visual timeline spans:
        </p>
        <ul className="list-disc pl-5 text-xs text-zinc-700 dark:text-zinc-300 space-y-1">
          <li><strong>Middleware</strong>: Network parsing, authorization, and route dispatching.</li>
          <li><strong>Database (SQL)</strong>: Exact start offset and execution duration for every query.</li>
          <li><strong>Application Logic</strong>: CPU time spent executing business rules and serializing responses.</li>
        </ul>
      </div>
    ),
  },

  // 15. REST Endpoints
  "api-reference/endpoints": {
    title: "REST Endpoints",
    description: "API reference for the telemetry endpoints exposed by SpurTrace dashboard middleware.",
    group: "API Reference",
    lastUpdated: "November 2026",
    toc: [
      { id: "get-traces", title: "GET /api/traces", level: 2 },
    ],
    content: (
      <div className="space-y-6">
        <h2 id="get-traces" className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          GET /_telemetry/api/traces
        </h2>
        <p className="text-sm text-zinc-700 dark:text-zinc-300">
          Returns the most recent captured traces with sampling metadata:
        </p>
        <CodeBlock
          language="json"
          code={`{
  "sampleRateSuccess": 0.1,
  "traces": [
    {
      "traceId": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
      "appName": "MESProductionDashboardAPI",
      "method": "GET",
      "route": "/api/orders/:id",
      "statusCode": 200,
      "durationMs": 14.2,
      "createdAt": "2026-11-22T10:45:00.000Z",
      "sampleReason": "sampled"
    }
  ]
}`}
        />
      </div>
    ),
  },

  // 16. Configuration
  "api-reference/configuration": {
    title: "Configuration Options",
    description: "Comprehensive options reference for createSpurTrace().",
    group: "API Reference",
    lastUpdated: "November 2026",
    toc: [
      { id: "options-table", title: "SpurTraceOptions", level: 2 },
    ],
    content: (
      <div className="space-y-6">
        <h2 id="options-table" className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          SpurTraceOptions Reference
        </h2>
        <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900/50 text-zinc-900 dark:text-zinc-200">
              <tr>
                <th className="p-3 font-bold">Option</th>
                <th className="p-3 font-bold">Type</th>
                <th className="p-3 font-bold">Default</th>
                <th className="p-3 font-bold">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 font-mono">
              <tr>
                <td className="p-3 font-bold text-zinc-900 dark:text-zinc-100">appName</td>
                <td className="p-3 text-cyan-600 dark:text-cyan-400">string</td>
                <td className="p-3 italic">required</td>
                <td className="p-3 font-sans">Identifier for the monitored service.</td>
              </tr>
              <tr>
                <td className="p-3 font-bold text-zinc-900 dark:text-zinc-100">sampleRateSuccess</td>
                <td className="p-3 text-cyan-600 dark:text-cyan-400">number</td>
                <td className="p-3">0.1</td>
                <td className="p-3 font-sans">Percentage of 2xx requests to store (0.0 to 1.0). Errors are always 100%.</td>
              </tr>
              <tr>
                <td className="p-3 font-bold text-zinc-900 dark:text-zinc-100">slowRequestThresholdMs</td>
                <td className="p-3 text-cyan-600 dark:text-cyan-400">number</td>
                <td className="p-3">500</td>
                <td className="p-3 font-sans">Requests exceeding this duration are flagged as slow and 100% retained.</td>
              </tr>
              <tr>
                <td className="p-3 font-bold text-zinc-900 dark:text-zinc-100">slowQueryThresholdMs</td>
                <td className="p-3 text-cyan-600 dark:text-cyan-400">number</td>
                <td className="p-3">300</td>
                <td className="p-3 font-sans">SQL queries exceeding this duration trigger a warning breadcrumb.</td>
              </tr>
              <tr>
                <td className="p-3 font-bold text-zinc-900 dark:text-zinc-100">retentionDays</td>
                <td className="p-3 text-cyan-600 dark:text-cyan-400">number</td>
                <td className="p-3">7</td>
                <td className="p-3 font-sans">Number of days to keep traces before automated rolling cleanup.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    ),
  },

  // 17. Docker
  "deployment/docker": {
    title: "Docker & Containerization",
    description: "Run SpurTrace in containers with persistent storage volumes, Docker Compose, and healthchecks.",
    group: "Deployment & Ops",
    lastUpdated: "November 2026",
    badge: "Guide",
    toc: [
      { id: "docker-compose", title: "1. Docker Compose (Recommended)", level: 2 },
      { id: "nodejs-dockerfile", title: "2. Node.js (Express / NestJS) Dockerfile", level: 2 },
      { id: "dotnet-dockerfile", title: "3. .NET 8 / 9 ASP.NET Core Dockerfile", level: 2 },
      { id: "volume-persistence", title: "4. SQLite Volume Persistence & WAL Locks", level: 2 },
      { id: "env-vars", title: "5. Production Environment Variables", level: 2 },
    ],
    content: (
      <div className="space-y-6">
        <h2 id="docker-compose" className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          1. Docker Compose (Recommended)
        </h2>
        <p className="text-sm text-zinc-700 dark:text-zinc-300">
          The cleanest way to run your service with persistent SpurTrace telemetry is mounting a host directory for the SQLite WAL file:
        </p>
        <CodeBlock
          filename="docker-compose.yml"
          language="yaml"
          code={`version: "3.8"

services:
  api-service:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - SPURTRACE_APP_NAME=MES-Production-API
      - SPURTRACE_STORAGE_PATH=/data/spurtrace.sqlite
      - SPURTRACE_AUTH_ENABLED=true
      - SPURTRACE_AUTH_PASSWORD=YourStrongSecretKey123!
    volumes:
      # CRITICAL: Mount host directory so SQLite WAL traces survive container restarts
      - spurtrace_data:/data
    restart: unless-stopped

volumes:
  spurtrace_data:
    driver: local`}
        />

        <h2 id="nodejs-dockerfile" className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 pt-4">
          2. Node.js (Express / NestJS) Dockerfile
        </h2>
        <p className="text-sm text-zinc-700 dark:text-zinc-300">
          Production multi-stage build ensuring minimal image size and non-root execution:
        </p>
        <CodeBlock
          filename="Dockerfile"
          code={`# Build stage
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json pnpm-lock.yaml* ./
RUN corepack enable && pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

# Production Runner stage
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Create volume mount directory with write permissions
RUN mkdir -p /data && chown -R node:node /data

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

USER node
EXPOSE 3000

ENV SPURTRACE_STORAGE_PATH=/data/spurtrace.sqlite
CMD ["node", "dist/server.js"]`}
        />

        <h2 id="dotnet-dockerfile" className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 pt-4">
          3. .NET 8 / 9 ASP.NET Core Dockerfile
        </h2>
        <p className="text-sm text-zinc-700 dark:text-zinc-300">
          Multi-stage build compiling your modern C# ASP.NET Core Web API with SpurTrace:
        </p>
        <CodeBlock
          filename="Dockerfile"
          code={`# Build & Publish
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["MESProductionAPI.csproj", "./"]
RUN dotnet restore "MESProductionAPI.csproj"
COPY . .
RUN dotnet publish "MESProductionAPI.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Runtime Image
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
EXPOSE 5000
ENV ASPNETCORE_URLS=http://+:5000

# Create folder for SQLite database with write permissions
RUN mkdir -p /app/data && chmod 777 /app/data

COPY --from=build /app/publish .
ENV SpurTrace__StoragePath=/app/data/spurtrace.sqlite

ENTRYPOINT ["dotnet", "MESProductionAPI.dll"]`}
        />

        <h2 id="volume-persistence" className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 pt-4">
          4. SQLite Volume Persistence &amp; WAL Locks
        </h2>
        <Callout type="warning" title="Always Mount a Dedicated Volume">
          SQLite WAL creates auxiliary files <code className="font-mono">spurtrace.sqlite-wal</code> and <code className="font-mono">spurtrace.sqlite-shm</code>. Always mount a dedicated directory (such as <code className="font-mono">/data</code> or <code className="font-mono">/app/data</code>) rather than mounting only the single file path.
        </Callout>

        <h2 id="env-vars" className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 pt-4">
          5. Production Environment Variables
        </h2>
        <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
          <table className="w-full text-left text-xs font-mono">
            <thead className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900/50 text-zinc-900 dark:text-zinc-200">
              <tr>
                <th className="p-3">Environment Variable</th>
                <th className="p-3">Default</th>
                <th className="p-3 font-sans">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-zinc-700 dark:text-zinc-300">
              <tr>
                <td className="p-3 font-bold text-zinc-900 dark:text-zinc-100">SPURTRACE_APP_NAME</td>
                <td className="p-3">&quot;App&quot;</td>
                <td className="p-3 font-sans">Tên định danh dịch vụ trong dashboard.</td>
              </tr>
              <tr>
                <td className="p-3 font-bold text-zinc-900 dark:text-zinc-100">SPURTRACE_STORAGE_PATH</td>
                <td className="p-3">&quot;./spurtrace.sqlite&quot;</td>
                <td className="p-3 font-sans">Đường dẫn tệp cơ sở dữ liệu SQLite trong container.</td>
              </tr>
              <tr>
                <td className="p-3 font-bold text-zinc-900 dark:text-zinc-100">SPURTRACE_SAMPLE_RATE</td>
                <td className="p-3">0.2</td>
                <td className="p-3 font-sans">Tỷ lệ lấy mẫu request thành công (20%).</td>
              </tr>
              <tr>
                <td className="p-3 font-bold text-zinc-900 dark:text-zinc-100">SPURTRACE_AUTH_PASSWORD</td>
                <td className="p-3">undefined</td>
                <td className="p-3 font-sans">Mật khẩu bảo vệ trang /_telemetry dashboard.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    ),
  },

  // 18. IIS (.NET 6+)
  "deployment/iis": {
    title: "IIS & Windows Server Deployment",
    description: "Configuring SpurTrace for .NET 6+ applications on Windows Server IIS.",
    group: "Deployment & Ops",
    lastUpdated: "November 2026",
    toc: [
      { id: "iis-dotnet6", title: "In-Process Hosting with ASP.NET Core Module", level: 2 },
    ],
    content: (
      <div className="space-y-6">
        <h2 id="iis-dotnet6" className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          In-Process Hosting with ASP.NET Core Module
        </h2>
        <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
          For .NET 6+ projects hosted on IIS with the ASP.NET Core Hosting Bundle (In-Process mode), ensure the application pool identity has write permissions to the SQLite data folder.
        </p>
      </div>
    ),
  },
};
