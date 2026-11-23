import * as React from "react";
import {
  Rocket,
  Server,
  Layers,
  Database,
  Gauge,
  Code2,
  Cpu,
  BookOpen,
  ShieldCheck,
  FileCode2,
  Terminal,
  Laptop,
} from "lucide-react";

export interface DocPage {
  slug: string;
  title: string;
  description: string;
  group: string;
  lastUpdated?: string;
  badge?: string;
  keywords?: string[];
  toc: { id: string; title: string; level: number }[];
  content: string;
}

export interface NavGroup {
  title: string;
  icon?: React.ComponentType<{ className?: string }>;
  items: {
    title: string;
    href: string;
    description: string;
    badge?: string;
    keywords?: string[];
  }[];
}

export const docsNavItems: NavGroup[] = [
  {
    title: "Getting Started",
    icon: Rocket,
    items: [
      {
        title: "Introduction",
        href: "/docs/getting-started/introduction",
        description: "Overview, philosophy, and key advantages of SpurTrace.",
        badge: "Core",
        keywords: ["overview", "intro", "apm", "about"],
      },
      {
        title: "Quickstart Guide",
        href: "/docs/getting-started/quickstart",
        description: "Get SpurTrace up and running in your backend in 2 minutes.",
        badge: "2 min",
        keywords: ["install", "setup", "fast", "start"],
      },
      {
        title: "Architecture Overview",
        href: "/docs/getting-started/architecture",
        description: "How SpurTrace works internally: AsyncLocalStorage, Batch Writer, SQLite WAL.",
        keywords: ["architecture", "internals", "worker", "sqlite"],
      },
    ],
  },
  {
    title: "Backend SDKs",
    icon: Server,
    items: [
      {
        title: "Express.js",
        href: "/docs/backend/express",
        description: "Integrate SpurTrace middleware and SQL tracking in Express Node.js.",
        badge: "Node.js",
        keywords: ["express", "middleware", "javascript", "node"],
      },
      {
        title: "NestJS",
        href: "/docs/backend/nestjs",
        description: "Module, Interceptor, and Dependency Injection pattern for NestJS.",
        badge: "NestJS",
        keywords: ["nest", "interceptor", "module", "decorator"],
      },
      {
        title: "Next.js Server",
        href: "/docs/backend/nextjs",
        description: "Instrumentation hook for Next.js App Router, Route Handlers, and Server Actions.",
        badge: "Next.js",
        keywords: ["next", "instrumentation", "app router", "server"],
      },
      {
        title: ".NET 6 / 7 / 8 / 9",
        href: "/docs/backend/dotnet-core",
        description: "High-performance C# middleware for ASP.NET Core, Minimal APIs, and Dapper/EF Core.",
        badge: ".NET 6+",
        keywords: ["dotnet", "csharp", "aspnetcore", "dapper", "efcore"],
      },
    ],
  },
  {
    title: "Frontend Integration",
    icon: Laptop,
    items: [
      {
        title: "Overview & Architecture",
        href: "/docs/frontend/overview",
        description: "How frontend apps connect to SpurTrace: Component Packages vs Standalone.",
        badge: "Guide",
        keywords: ["frontend", "vite", "react", "ui", "connect", "component"],
      },
      {
        title: "React Component Package",
        href: "/docs/frontend/react-component",
        description: "Embed <SpurTraceDashboard /> directly in React, Vite, and Next.js applications.",
        badge: "React",
        keywords: ["react", "component", "vite", "nextjs", "embed"],
      },
      {
        title: "Vanilla JS / TypeScript",
        href: "/docs/frontend/vanilla-js",
        description: "Mount SpurTrace UI into any vanilla JS/TS, Vue, or legacy website with mountSpurTrace().",
        badge: "Vanilla",
        keywords: ["vanilla", "javascript", "cdn", "script"],
      },
    ],
  },
  {
    title: "Storage Adapters",
    icon: Database,
    items: [
      {
        title: "Database Setup & Schemas",
        href: "/docs/storage/database-setup",
        description: "Configure SQLite WAL, PostgreSQL, or MSSQL with automatic DDL migrations.",
        badge: "Setup",
        keywords: ["database", "setup", "ddl", "schema", "postgres", "mssql", "sqlite"],
      },
      {
        title: "SQLite WAL Adapter",
        href: "/docs/storage/sqlite",
        description: "High-throughput, zero-maintenance local storage with WAL mode and worker thread.",
        badge: "Default",
        keywords: ["sqlite", "wal", "worker", "retention"],
      },
      {
        title: "PostgreSQL & MSSQL",
        href: "/docs/storage/postgres-mssql",
        description: "Connecting SpurTrace to shared enterprise relational databases.",
        keywords: ["postgres", "mssql", "sql server", "database"],
      },
    ],
  },
  {
    title: "APM & Diagnostics",
    icon: Gauge,
    items: [
      {
        title: "SQL Fingerprinting & N+1",
        href: "/docs/performance/sql-fingerprint",
        description: "Parameter masking, query fingerprinting, and N+1 query detection.",
        keywords: ["sql", "fingerprint", "n+1", "masking"],
      },
      {
        title: "Latency Waterfalls",
        href: "/docs/performance/waterfall",
        description: "Deep dive into execution waterfalls: middleware vs DB vs app logic.",
        keywords: ["waterfall", "timeline", "spans", "latency"],
      },
    ],
  },
  {
    title: "API Reference",
    icon: Code2,
    items: [
      {
        title: "REST Endpoints",
        href: "/docs/api-reference/endpoints",
        description: "JSON endpoints served by dashboard middleware (/api/traces, /api/sql, /api/stats).",
        keywords: ["api", "rest", "endpoints", "json"],
      },
      {
        title: "Configuration Options",
        href: "/docs/api-reference/configuration",
        description: "Full configuration reference for SpurTraceOptions.",
        keywords: ["config", "options", "sampling", "retention"],
      },
    ],
  },
  {
    title: "Deployment & Ops",
    icon: ShieldCheck,
    items: [
      {
        title: "Docker & Self-Hosting",
        href: "/docs/deployment/docker",
        description: "Running SpurTrace in containers and production environments.",
        keywords: ["docker", "container", "compose", "deploy"],
      },
      {
        title: "IIS & Windows Server",
        href: "/docs/deployment/iis",
        description: "Configuring SpurTrace for .NET 6+ applications on Windows Server IIS.",
        keywords: ["iis", "windows", "server", "deploy"],
      },
    ],
  },
];
