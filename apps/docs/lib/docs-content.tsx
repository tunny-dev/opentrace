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
      { id: "program-cs", title: "2. Program.cs Configuration", level: 2 },
      { id: "dapper-efcore", title: "3. Dapper & EF Core Tracking", level: 2 },
      { id: "minimal-apis", title: "4. Minimal APIs Example", level: 2 },
    ],
    content: (
      <div className="space-y-6">
        <h2 id="supported-versions" className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          Supported .NET Versions
        </h2>
        <Callout type="tip" title="Modern .NET First (from .NET 6 onwards)">
          SpurTrace for .NET targets modern unified .NET versions: <strong>.NET 6 (LTS), .NET 7, .NET 8 (LTS), and .NET 9</strong>. It leverages modern C# 10/11/12 features, <code className="font-mono">AsyncLocal&lt;T&gt;</code>, and high-performance zero-allocation buffers.
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
          2. Program.cs Configuration
        </h2>
        <p className="text-sm text-zinc-700 dark:text-zinc-300">
          In your modern ASP.NET Core project (like <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded text-zinc-900 dark:text-zinc-100">MESProductionDashboardAPI</code>), configure SpurTrace in <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded text-zinc-900 dark:text-zinc-100">Program.cs</code>:
        </p>
        <CodeBlock
          filename="Program.cs"
          code={`using SpurTrace.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

// 1. Add SpurTrace Services & Configure Storage
builder.Services.AddSpurTrace(options =>
{
    options.AppName = "MESProductionDashboardAPI";
    options.StoragePath = "./spurtrace.sqlite";
    options.SampleRateSuccess = 0.2; // 20% healthy requests
    options.SlowRequestThresholdMs = 500;
    options.SlowQueryThresholdMs = 250;
    options.Auth.Enabled = true;
    options.Auth.Users.Add(new("CIMDEV", "cimdev"));
});

var app = builder.Build();

// 2. SpurTrace HTTP Middleware (Must be before routing/controllers)
app.UseSpurTrace();

// 3. Serve the Embedded Dashboard UI
app.UseSpurTraceDashboard("/_telemetry");

app.MapControllers();
app.Run();`}
        />

        <h2 id="dapper-efcore" className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 pt-4">
          3. Dapper & EF Core Tracking
        </h2>
        <CodeBlock
          filename="ProductionReportRepository.cs"
          code={`public async Task<IEnumerable<ReportDto>> GetDailyReportAsync(string lineId, DateTime date)
{
    const string sql = "SELECT * FROM MES_PRODUCTION_LOG WHERE LineId = @LineId AND WorkDate = @Date";

    // Automatically captures query execution time, sanitizes parameters, and detects N+1
    return await _trace.RunSqlAsync(sql, async () =>
    {
        using var connection = CreateConnection();
        return await connection.QueryAsync<ReportDto>(sql, new { LineId = lineId, Date = date });
    });
}`}
        />

        <h2 id="minimal-apis" className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 pt-4">
          4. Minimal APIs Example
        </h2>
        <CodeBlock
          filename="Program.cs"
          code={`app.MapGet("/api/status", () => Results.Ok(new { status = "operational" }))
   .WithSpurTrace("HealthCheck");`}
        />
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

  // Database Setup & Schemas
  "storage/database-setup": {
    title: "Database Setup & Schemas",
    description: "Connect SpurTrace to SQLite WAL, PostgreSQL, or Microsoft SQL Server with automated schema migrations.",
    group: "Storage Adapters",
    lastUpdated: "November 2026",
    badge: "Setup",
    toc: [
      { id: "engine-overview", title: "Supported Database Engines", level: 2 },
      { id: "sqlite-setup", title: "1. SQLite WAL (Zero Setup)", level: 2 },
      { id: "postgres-setup", title: "2. PostgreSQL Enterprise Setup", level: 2 },
      { id: "mssql-setup", title: "3. Microsoft SQL Server Setup", level: 2 },
      { id: "schema-ddl", title: "Database Schema & UUID Convention", level: 2 },
      { id: "retention-maintenance", title: "Automated Retention & Pruning", level: 2 },
    ],
    content: (
      <div className="space-y-6">
        <h2 id="engine-overview" className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          Supported Database Engines
        </h2>
        <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
          SpurTrace supports flexible storage backends depending on your deployment architecture. Every backend uses <strong>UUIDv4 primary keys</strong>, automated schema initialization on first boot, and non-blocking background workers:
        </p>

        <Cards cols={3}>
          <Card
            title="SQLite WAL"
            description="Zero maintenance, embedded single-file storage. Recommended for 95% of single-node deployments."
            href="/docs/storage/sqlite"
            iconName="database"
            badge="Default (Priority #4)"
          />
          <Card
            title="PostgreSQL"
            description="Enterprise relational storage with JSONB support, connection pooling, and multi-node cluster scaling."
            href="/docs/storage/postgres-mssql"
            iconName="server"
            badge="Priority #1"
          />
          <Card
            title="Microsoft SQL Server"
            description="First-class adapter for Windows Server and MES / ERP enterprise relational clusters (.NET 6+)."
            href="/docs/storage/postgres-mssql"
            iconName="cpu"
            badge="Priority #2"
          />
        </Cards>

        <h2 id="sqlite-setup" className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 pt-4">
          1. SQLite WAL (Zero Setup)
        </h2>
        <p className="text-sm text-zinc-700 dark:text-zinc-300">
          SQLite is enabled by default. You do not need to install or run any external database server:
        </p>
        <CodeBlock
          filename="server.ts (Node.js)"
          code={`import { createSpurTrace, SqliteStorageAdapter } from "spurtrace"

const trace = createSpurTrace({
  appName: "OrderService",
  storage: new SqliteStorageAdapter({
    path: "./spurtrace.sqlite", // Created automatically with WAL mode
    busyTimeoutMs: 5000,
  }),
})`}
        />
        <CodeBlock
          filename="Program.cs (.NET 6+)"
          code={`builder.Services.AddSpurTrace(options =>
{
    options.AppName = "MESProductionAPI";
    options.StoragePath = "./spurtrace.sqlite"; // Auto-configured SQLite WAL
});`}
        />

        <h2 id="postgres-setup" className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 pt-4">
          2. PostgreSQL Enterprise Setup
        </h2>
        <p className="text-sm text-zinc-700 dark:text-zinc-300">
          For multi-node services writing to a central PostgreSQL database:
        </p>
        <CodeBlock
          filename="server.ts"
          code={`import { createSpurTrace, PostgresStorageAdapter } from "spurtrace"

const trace = createSpurTrace({
  appName: "ProductionOrderService",
  storage: new PostgresStorageAdapter({
    connectionString: process.env.DATABASE_URL || "postgres://postgres:secret@db.internal:5432/opentrace_db",
    maxConnections: 10,
    schema: "public",
  }),
})`}
        />

        <h2 id="mssql-setup" className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 pt-4">
          3. Microsoft SQL Server Setup (MSSQL)
        </h2>
        <p className="text-sm text-zinc-700 dark:text-zinc-300">
          In .NET enterprise environments (such as factory MES Production systems), connect to Microsoft SQL Server:
        </p>
        <CodeBlock
          filename="Program.cs (.NET 8/9)"
          code={`builder.Services.AddSpurTrace(options =>
{
    options.AppName = "MESProductionAPI";
    options.UseSqlServer(builder.Configuration.GetConnectionString("SpurTraceMssql"));
    options.RetentionDays = 14;
});`}
        />

        <h2 id="schema-ddl" className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 pt-4">
          Database Schema &amp; UUID Convention
        </h2>
        <p className="text-sm text-zinc-700 dark:text-zinc-300">
          All records utilize <strong>RFC 4122 UUIDv4</strong> keys, avoiding auto-increment lock contention across distributed workers:
        </p>
        <CodeBlock
          language="sql"
          filename="schema.sql"
          code={`-- PostgreSQL / SQLite / MSSQL Telemetry Table Schema
CREATE TABLE IF NOT EXISTS opentrace_spans (
    id VARCHAR(36) PRIMARY KEY, -- UUIDv4
    trace_id VARCHAR(36) NOT NULL,
    parent_span_id VARCHAR(36),
    service_name VARCHAR(120) NOT NULL,
    name VARCHAR(255) NOT NULL,
    kind VARCHAR(30) NOT NULL,
    status_code INT NOT NULL,
    duration_ms FLOAT NOT NULL,
    start_time TIMESTAMP NOT NULL,
    metadata JSON,
    error_message TEXT
);

CREATE INDEX IF NOT EXISTS idx_opentrace_trace ON opentrace_spans(trace_id);
CREATE INDEX IF NOT EXISTS idx_opentrace_start_time ON opentrace_spans(start_time);
CREATE INDEX IF NOT EXISTS idx_opentrace_duration ON opentrace_spans(duration_ms DESC);`}
        />

        <h2 id="retention-maintenance" className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 pt-4">
          Automated Retention &amp; Pruning
        </h2>
        <Callout type="tip" title="Automatic 7-Day Rolling Retention">
          The background worker automatically runs a lightweight pruning transaction once every 24 hours to delete spans older than <code className="font-mono">retentionDays</code> (default 7 days). For SQLite, WAL checkpoints ensure file size is maintained without vacuum locks.
        </Callout>
      </div>
    ),
  },

  // 11. SQLite WAL
  "storage/sqlite": {
    title: "SQLite WAL Storage Adapter",
    description: "High-performance, zero-maintenance local storage with Write-Ahead Logging.",
    group: "Storage Adapters",
    lastUpdated: "November 2026",
    badge: "Default",
    toc: [
      { id: "why-sqlite", title: "Why SQLite WAL for APM?", level: 2 },
      { id: "configuration", title: "Adapter Configuration", level: 2 },
    ],
    content: (
      <div className="space-y-6">
        <h2 id="why-sqlite" className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          Why SQLite WAL for APM?
        </h2>
        <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
          SQLite with <strong>Write-Ahead Logging (WAL)</strong> mode provides incredible write throughput (up to 50,000 writes/sec in batch transactions) while allowing concurrent reads without locking.
        </p>
        <CodeBlock
          code={`import { SqliteStorageAdapter } from "spurtrace"

const storage = new SqliteStorageAdapter({
  path: "./spurtrace.sqlite",
  wal: true,               // Enables WAL mode
  busyTimeoutMs: 5000,     // Prevents SQLITE_BUSY under heavy concurrency
})`}
        />
      </div>
    ),
  },

  // 12. Postgres / MSSQL
  "storage/postgres-mssql": {
    title: "PostgreSQL & MSSQL Adapters",
    description: "Enterprise storage adapters for multi-instance clusters and shared databases.",
    group: "Storage Adapters",
    lastUpdated: "November 2026",
    toc: [
      { id: "enterprise-setup", title: "Enterprise Database Setup", level: 2 },
    ],
    content: (
      <div className="space-y-6">
        <h2 id="enterprise-setup" className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          Enterprise Database Setup
        </h2>
        <p className="text-sm text-zinc-700 dark:text-zinc-300">
          For distributed container environments (Kubernetes, AWS ECS) where pods are ephemeral, SpurTrace supports storing traces in centralized PostgreSQL or Microsoft SQL Server instances.
        </p>
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
