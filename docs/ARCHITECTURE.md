# SpurTrace Enterprise Architecture Specification

SpurTrace is an enterprise-grade in-app Application Performance Monitoring (APM) and Live Observability suite supporting both **.NET 8 (ASP.NET Core MVC & Web API)** and **Node.js / TypeScript (Express, Fastify, NestJS)** with an embedded **Next.js 16 App Router SPA Dashboard**.

---

## 1. High-Level Architecture & Data Flow

```text
Incoming HTTP Request
  │
  ├── 1. HTTP Middleware (SpurTraceMiddleware / httpMiddleware)
  │      ├─ Initializes AsyncLocal / AsyncLocalStorage trace context
  │      ├─ Records HTTP Method, Path, Status Code, Route, User-Agent
  │      └─ Starts high-resolution stopwatch
  │
  ├── 2. Database Execution (EF Core Interceptor / ADO.NET / Dapper / Node Driver)
  │      ├─ Intercepts SQL Command & extracts Parameter mapping
  │      ├─ Measures query execution time (Math.Round(ms, 2))
  │      ├─ Generates query fingerprint & detects N+1 duplicates
  │      └─ Attaches Span & Breadcrumb to active Trace Context
  │
  ├── 3. Tail Sampling & Evaluation
  │      ├─ Automatically captures all 5xx Errors, unhandled exceptions, and Slow Queries
  │      └─ Samples normal fast 200 OK traffic according to `SampleRateSuccess`
  │
  ├── 4. Zero-Wait Ingestion Pipeline (< 0.1ms)
  │      ├─ .NET: Bounded System.Threading.Channels.Channel<TraceRecord>
  │      ├─ Node.js: Bounded in-memory Ring Buffer
  │      └─ Request thread returns to caller immediately (ZERO I/O WAIT)
  │
  └── 5. Background Batch Persistence Worker
         ├─ Triggers on batch size threshold (50) or flush interval (1500ms)
         ├─ Writes to dedicated `spurtrace` schema (SQL Server) or SQLite
         ├─ Evaluates dynamic alert rules (P95 latency, error rate, slow SQL)
         └─ Dispatches automated SMTP alert emails when thresholds are breached
```

---

## 2. Platform Engines

### 2.1 .NET 8 Enterprise Engine (`SpurTraceExtensions.cs`)
Designed for high-throughput ASP.NET Core MVC and Web API architectures:
- **AsyncLocal Trace Context**: `SpurTraceContext` maintains the trace execution scope across asynchronous task continuations without thread-affinity bottlenecks.
- **EF Core Database Interceptor**: `SpurTraceDbInterceptor` inherits from `DbCommandInterceptor`, non-invasively instrumenting `ReaderExecuting`, `ReaderExecuted`, `ScalarExecuted`, and `NonQueryExecuted`.
- **Dedicated Schema Injection**: Isolates telemetry into `spurtrace` schema (`spurtrace.traces`, `spurtrace.users`, `spurtrace.settings`, `spurtrace.alert_rules`, `spurtrace.alert_history`).
- **Channel-based Background Worker**: `SpurTraceBatchBackgroundService` continuously drains the thread-safe `Channel<TraceRecord>` and executes batch parameterized inserts.
- **Dynamic Configuration & Backups**: Dynamic runtime threshold adjustments (`app_name`, `slow_query_threshold_ms`, `sample_rate`) and 1-Click Database Backups / SQLite VACUUM.

### 2.2 Node.js Core Engine (`packages/spurtrace`)
Designed for Node.js 22+ (using built-in `node:sqlite`) and standard Node runtimes:
- **AsyncLocalStorage Context**: Preserves execution context across promise chains and callbacks.
- **Worker Thread Writer**: Dedicated `worker_threads` isolate SQLite write transactions and synchronous disk I/O from the main event loop.
- **Memory Bound Enqueue**: Fixed 10,000-trace ring buffer protects the host process from memory saturation during downstream database outages.

---

## 3. Embedded Next.js 16 SPA Dashboard Architecture

The dashboard is built as an offline, zero-dependency Next.js 16 Single Page Application (`apps/dashboard`):

### 3.1 Static SPA Packaging (`scripts/build-dashboard-bundle.mjs`)
1. Stashes server-only API routes.
2. Executes `next build` with `output: 'export'` and `basePath: '/telemetry'`.
3. Compiles static HTML files (`index.html`, `traces.html`, `sql.html`, etc.) and corresponding Next.js RSC Flight payload files (`index.txt`, `traces.txt`, `sql.txt`, etc.).
4. Copies the output directly into the host application's static web root (`wwwroot/telemetry`).

### 3.2 0-Reload SPA Navigation Handling
To achieve instantaneous client-side page transitions in embedded environments without full browser reloads:
- When Next.js executes client navigation, it sends requests with `RSC: 1` header or `?_rsc=...` query.
- The host telemetry route handler inspects this header and serves the corresponding `.txt` flight payload file with `Content-Type: text/x-component; charset=utf-8`.
- If an end-user directly navigates or refreshes a URL, the host serves the corresponding `.html` document.
- `window.history.state` is preserved during table query-string synchronization to maintain Next.js's internal router state tree.

---

## 4. Storage Schemas

### 4.1 SQL Server (Dedicated Schema: `spurtrace`)
```sql
CREATE SCHEMA spurtrace;

-- Traces
CREATE TABLE spurtrace.traces (
    id NVARCHAR(64) PRIMARY KEY,
    trace_id NVARCHAR(64) NOT NULL,
    route NVARCHAR(256) NOT NULL,
    method NVARCHAR(16) NOT NULL,
    status_code INT NOT NULL,
    duration_ms FLOAT NOT NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    payload NVARCHAR(MAX) NULL
);

-- Users (RBAC)
CREATE TABLE spurtrace.users (
    id NVARCHAR(64) PRIMARY KEY,
    username NVARCHAR(64) NOT NULL UNIQUE,
    password_hash NVARCHAR(256) NOT NULL,
    password_salt NVARCHAR(128) NOT NULL,
    display_name NVARCHAR(128) NOT NULL,
    email NVARCHAR(128) NOT NULL,
    role NVARCHAR(32) NOT NULL DEFAULT 'Viewer',
    is_active BIT NOT NULL DEFAULT 1,
    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);

-- Settings
CREATE TABLE spurtrace.settings (
    [key] NVARCHAR(64) PRIMARY KEY,
    [value] NVARCHAR(MAX) NULL,
    category NVARCHAR(32) NOT NULL DEFAULT 'telemetry',
    description NVARCHAR(256) NULL,
    updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);

-- Alert Rules & Incident History
CREATE TABLE spurtrace.alert_rules (
    id NVARCHAR(64) PRIMARY KEY,
    name NVARCHAR(128) NOT NULL,
    metric NVARCHAR(64) NOT NULL,
    condition NVARCHAR(16) NOT NULL,
    threshold FLOAT NOT NULL,
    unit NVARCHAR(16) NOT NULL DEFAULT 'ms',
    channel NVARCHAR(32) NOT NULL DEFAULT 'email',
    severity NVARCHAR(16) NOT NULL DEFAULT 'warning',
    enabled BIT NOT NULL DEFAULT 1,
    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);

CREATE TABLE spurtrace.alert_history (
    id NVARCHAR(64) PRIMARY KEY,
    rule_id NVARCHAR(64) NOT NULL,
    rule_name NVARCHAR(128) NOT NULL,
    severity NVARCHAR(16) NOT NULL,
    message NVARCHAR(MAX) NOT NULL,
    triggered_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);
```

### 4.2 SQLite (Isolated Storage)
Uses identical column structures with SQLite affinity types (`INTEGER`, `REAL`, `TEXT`) and `journal_mode=WAL` for concurrent non-blocking reads and batch inserts.
