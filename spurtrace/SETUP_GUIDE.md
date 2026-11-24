# SpurTrace APM - Complete Integration & Setup Guide

> **SpurTrace** is an enterprise-grade, in-app Application Performance Monitoring (APM) and Live Observability suite designed for **.NET 8 (ASP.NET Core MVC & Web API)** and **Node.js/TypeScript**. It provides zero-overhead request waterfall tracing, EF Core / Dapper SQL query profiling, automated N+1 detection, interactive SQL Studio, dynamic alerting with SMTP notifications, and an embedded Next.js 16 SPA dashboard.

---

## 📑 Table of Contents
1. [Core Features](#-core-features)
2. [Quickstart for .NET 8 (ASP.NET Core MVC & Web API)](#-quickstart-for-net-8)
   - [Step 1: Add SpurTraceExtensions.cs](#step-1-add-spurtraceextensionscs)
   - [Step 2: Database Setup (SQL Server / SQLite)](#step-2-database-setup)
   - [Step 3: Register in Program.cs](#step-3-register-in-programcs)
   - [Step 4: Hook into EF Core / Dapper](#step-4-hook-into-ef-core--dapper)
   - [Step 5: Bundle and Deploy the Dashboard UI](#step-5-bundle-and-deploy-the-dashboard-ui)
3. [Quickstart for Node.js / Express](#-quickstart-for-nodejs--express)
4. [Security, Authentication & RBAC](#-security-authentication--rbac)
5. [Operational Features & Usage](#-operational-features--usage)
   - [Live Request Traces & Waterfall](#live-request-traces--waterfall)
   - [Global SQL Studio & Sandbox Runner](#global-sql-studio--sandbox-runner)
   - [Automated Alerts & SMTP Notifications](#automated-alerts--smtp-notifications)
   - [Dynamic Settings & Database Backups](#dynamic-settings--database-backups)
   - [Log Stream & Loki-style Terminal](#log-stream--loki-style-terminal)
6. [Troubleshooting & FAQs](#-troubleshooting--faqs)

---

## 🚀 Core Features

- **Zero-Wait Ingestion Pipeline**: Telemetry data is pushed to a non-blocking in-memory `System.Threading.Channels.Channel<T>` (in .NET) or ring-buffer (in Node.js). HTTP request threads are released immediately in **< 0.1ms** without awaiting database I/O.
- **Dedicated Observability Schema (`spurtrace`)**: Isolates telemetry tables (`spurtrace.traces`, `spurtrace.users`, `spurtrace.settings`, `spurtrace.alert_rules`, `spurtrace.alert_history`) directly inside your existing SQL Server database or dedicated SQLite storage.
- **Automatic EF Core Profiling**: Captures SQL queries, execution durations, affected row counts, query parameters, duplicate queries (N+1 detector), and stack trace breadcrumbs.
- **Embedded Next.js 16 SPA Dashboard**: Built with Next.js 16 App Router, Turbopack, TanStack Table v8, and Shadcn UI. Runs completely offline as static assets hosted inside your app's `wwwroot/telemetry` with true client-side SPA routing (0-reload transitions).
- **Interactive SQL Studio Runner**: Test and analyze SELECT/WITH queries against live data in a read-only sandbox with execution timing and performance metrics.
- **Enterprise RBAC**: Built-in authentication with PBKDF2-SHA256 hashing and secure HTTP-only cookies (`Admin` and `Viewer` roles).
- **Incident Management & SMTP Gateway**: Automated threshold alerts (Slow SQL, Error Spikes, Latency Degradation) with automatic HTML email dispatch.

---

## 🛠 Quickstart for .NET 8

### Step 1: Add `SpurTraceExtensions.cs`
Copy `SpurTraceExtensions.cs` into your project under `Extensions/SpurTraceExtensions.cs`.

Ensure your `.csproj` includes the required packages:
```xml
<ItemGroup>
  <PackageReference Include="Microsoft.EntityFrameworkCore" Version="8.*" />
  <PackageReference Include="Microsoft.EntityFrameworkCore.SqlServer" Version="8.*" />
  <PackageReference Include="Microsoft.Data.SqlClient" Version="5.*" />
</ItemGroup>
```

---

### Step 2: Database Setup

SpurTrace supports both **SQL Server** and **SQLite**. By default, `AutoCreateTables = true` will automatically provision the schema and default admin user on application startup.

#### SQL Server DDL (Manual Provisioning Alternative)
If your DBA requires manual migration execution:
```sql
-- 1. Create Dedicated Schema
IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = 'spurtrace')
    EXEC('CREATE SCHEMA spurtrace');
GO

-- 2. Telemetry Traces Table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'spurtrace.traces') AND type in (N'U'))
BEGIN
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
    CREATE INDEX IX_spurtrace_traces_created ON spurtrace.traces (created_at DESC);
    CREATE INDEX IX_spurtrace_traces_trace_id ON spurtrace.traces (trace_id);
    CREATE INDEX IX_spurtrace_traces_route ON spurtrace.traces (route);
    CREATE INDEX IX_spurtrace_traces_status ON spurtrace.traces (status_code);
    CREATE INDEX IX_spurtrace_traces_duration ON spurtrace.traces (duration_ms DESC);
END
GO

-- 3. Users Table (RBAC)
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'spurtrace.users') AND type in (N'U'))
BEGIN
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
END
GO

-- 4. Dynamic Settings Table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'spurtrace.settings') AND type in (N'U'))
BEGIN
    CREATE TABLE spurtrace.settings (
        [key] NVARCHAR(64) PRIMARY KEY,
        [value] NVARCHAR(MAX) NULL,
        category NVARCHAR(32) NOT NULL DEFAULT 'telemetry',
        description NVARCHAR(256) NULL,
        updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
    );
END
GO

-- 5. Alert Rules & Incident History Tables
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'spurtrace.alert_rules') AND type in (N'U'))
BEGIN
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
END
GO

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'spurtrace.alert_history') AND type in (N'U'))
BEGIN
    CREATE TABLE spurtrace.alert_history (
        id NVARCHAR(64) PRIMARY KEY,
        rule_id NVARCHAR(64) NOT NULL,
        rule_name NVARCHAR(128) NOT NULL,
        severity NVARCHAR(16) NOT NULL,
        message NVARCHAR(MAX) NOT NULL,
        triggered_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
    );
    CREATE INDEX IX_spurtrace_alerts_triggered ON spurtrace.alert_history (triggered_at DESC);
END
GO
```

---

### Step 3: Register in `Program.cs`

Open `Program.cs` and add the following configuration:

```csharp
using EMS.Extensions; // Or your custom namespace

var builder = WebApplication.CreateBuilder(args);

// 1. Register SpurTrace Services
builder.Services.AddSpurTrace(options =>
{
    // Application display name (defaults to Entry Assembly name if omitted)
    options.AppName = "Senao EMS";
    
    // Thresholds
    options.SlowRequestThresholdMs = 500.0;  // Requests > 500ms tagged as SLOW
    options.SlowQueryThresholdMs = 250.0;    // SQL > 250ms tagged as SLOW
    options.SampleRateSuccess = 1.0;         // 100% ingestion (or e.g. 0.20 for 20% head-sampling)
    
    // Storage Engine (SqlServer or Sqlite)
    options.StorageType = SpurTraceStorageType.SqlServer;
    options.ConnectionString = builder.Configuration.GetConnectionString("DefaultConnection")!;
    
    // Auto-migrate schema on startup
    options.AutoCreateTables = true;
    options.RequireAuth = true;
});

// 2. Register EF Core Interceptor in DbContext
builder.Services.AddDbContext<ApplicationDbContext>((sp, db) =>
{
    db.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")!);
    
    // Attach SpurTrace Database Profiler
    db.AddInterceptors(sp.GetRequiredService<SpurTraceDbInterceptor>());
});

var app = builder.Build();

// 3. Register HTTP Tracing Middleware (Place BEFORE MVC/API routing)
app.UseSpurTrace();

app.UseRouting();
app.UseAuthentication();
app.UseAuthorization();

// 4. Map SpurTrace Embedded Dashboard & Telemetry APIs
// Dashboard available at: http://localhost:<port>/telemetry
app.MapSpurTraceEndpoints();

app.Run();
```

---

### Step 4: Hook into EF Core / Dapper

#### Entity Framework Core (Automatic)
When `db.AddInterceptors(sp.GetRequiredService<SpurTraceDbInterceptor>())` is registered in `AddDbContext`, EF Core queries are intercepted automatically:
- Command SQL & Parameter map
- Execution timing (`Math.Round(ms, 2)`)
- Affected row counts
- N+1 query detection

#### Dapper or Custom ADO.NET (Manual Recording)
If you execute raw queries via Dapper or ADO.NET, wrap your queries using `SpurTraceContext`:
```csharp
var stopwatch = Stopwatch.StartNew();
var users = await connection.QueryAsync<User>("SELECT * FROM Users WHERE IsActive = @active", new { active = true });
stopwatch.Stop();

SpurTraceContext.Current?.RecordSql(
    sql: "SELECT * FROM Users WHERE IsActive = @active",
    durationMs: stopwatch.Elapsed.TotalMilliseconds,
    parameters: new Dictionary<string, object?> { ["active"] = true }
);
```

---

### Step 5: Bundle and Deploy the Dashboard UI

The dashboard UI is built as a static Next.js Single-Page Application (SPA) located in `apps/dashboard`.

1. In the `opentrace` repository, build and bundle the dashboard:
   ```bash
   pnpm run bundle:ui
   ```
2. The script compiles the dashboard into static HTML/JS/CSS and copies it directly into your application's `wwwroot/telemetry`:
   ```text
   EMS/
   └── wwwroot/
       └── telemetry/
           ├── _next/
           ├── index.html
           ├── index.txt       <-- Next.js RSC Flight payload for SPA routing
           ├── traces.html
           ├── traces.txt
           ├── sql.html
           ├── sql.txt
           ├── logs.html
           ├── logs.txt
           ├── settings.html
           ├── settings.txt
           └── favicon.ico
   ```
3. Navigate to `http://localhost:<port>/telemetry` in your browser.

---

## 🟢 Quickstart for Node.js / Express

```typescript
import express from "express";
import { createSpurTrace, SqliteStorageAdapter } from "spurtrace";

const app = express();

const trace = createSpurTrace({
  appName: "Node-Backend",
  storage: new SqliteStorageAdapter({ path: "./spurtrace.sqlite" }),
  batchSize: 100,
  flushIntervalMs: 1500,
  slowRequestThresholdMs: 500,
  slowQueryThresholdMs: 250,
  sampleRateSuccess: 1.0,
  auth: {
    enabled: true,
    users: [{ username: "admin", password: process.env.SPURTRACE_PASSWORD || "admin@123" }]
  }
});

// Middleware
app.use(trace.httpMiddleware());

// Embedded Dashboard
app.use("/telemetry", trace.dashboardMiddleware());

// Profile SQL
app.get("/api/users", async (req, res) => {
  const users = await trace.runSql("SELECT * FROM Users", () => db.users.findMany());
  res.json(users);
});

// Error handling
app.use(trace.errorMiddleware());

app.listen(3000, () => console.log("Server running on http://localhost:3000/telemetry"));
```

---

## 🔐 Security, Authentication & RBAC

SpurTrace comes with built-in Role-Based Access Control (RBAC):

| Role | Privileges |
|---|---|
| **Admin** | Full access to Traces, SQL Studio Runner, Dynamic Settings, Alert Rules, User Management, DB Backups. |
| **Viewer** | Read-only access to Traces and Metrics. Sensitive runtime parameters are masked. |

### Default Credentials
- **Username**: `admin`
- **Password**: `admin@123`
*(Change the default password immediately via Settings -> User Management)*

### Security Architecture
- **PBKDF2-SHA256**: Passwords are salted with 16-byte cryptographic random salts and hashed with 100,000 iterations.
- **Session Tokens**: Crypographic HMAC tokens stored in `HttpOnly`, `SameSite=Lax` cookies (`spurtrace_session`).
- **Read-Only SQL Sandbox**: The SQL Studio execution endpoint strictly enforces read-only statements (`SELECT`, `WITH`, `EXPLAIN`). Destructive commands (`INSERT`, `UPDATE`, `DELETE`, `DROP`, `ALTER`, `TRUNCATE`, `EXEC`) are blocked with HTTP 403.

---

## 📊 Operational Features & Usage

### Live Request Traces & Waterfall
- **Waterfall Timeline**: Visually inspect the latency timeline breakdown across HTTP Middleware, Database Queries, and App Processing.
- **Percentiles**: Live calculation of P50, P95, and P99 latency percentiles.
- **Filters**: Instant client-side search, status filter (`2xx`, `4xx`, `5xx`), method filter (`GET`, `POST`), duration badges (`SLOW`, `FAST`, `N+1`).

### Global SQL Studio & Sandbox Runner
- **Global Query Aggregation**: Normalizes SQL queries into fingerprints, sorting by Total Impact (`impactPct`), Call Counts, and Average Latency.
- **Trace ID Linking**: Click any query's Trace ID badge to jump directly into the full request waterfall where the query was executed.
- **Interactive Runner**: Test parameterized SQL queries directly in the browser sandbox.

### Automated Alerts & SMTP Notifications
- **Metric Triggers**: Configure alerts for `p95_latency`, `error_rate`, `slow_sql_count`.
- **SMTP Gateway**: Configure host, port, username, password, SSL, and recipient list in **Settings -> Email Notifications**.
- **Incident History**: Logs all triggered alerts with severity (`Critical`, `Warning`, `Info`).

### Dynamic Settings & Database Backups
- Adjust thresholds (`Slow Query (ms)`, `Slow Request (ms)`, `Sample Rate`) at runtime without restarting your application.
- Trigger 1-Click Database Backups (`.sql` or SQLite `.db`) or vacuum storage on demand.

### Log Stream & Loki-style Terminal
- High-density terminal viewer for real-time application and SQL logs.
- Features: Line-wrapping toggles (`Wrap`, `No Wrap`, `Pretty`), search filter, log level badges (`INFO`, `WARN`, `ERROR`), and clickable Trace IDs.

---

## ❓ Troubleshooting & FAQs

### 1. Navigating between pages triggers a full page reload?
- **Cause**: Next.js App Router static export requires `.txt` files (RSC flight payloads, e.g. `traces.txt`) when client-side navigation (`RSC: 1` header or `?_rsc=...`) occurs.
- **Solution**: Ensure your host serves the `.txt` files with `Content-Type: text/x-component; charset=utf-8`. This is already handled out-of-the-box in `SpurTraceExtensions.cs`.

### 2. Can I use SpurTrace without modifying my application database?
- **Yes**. Set `options.StorageType = SpurTraceStorageType.Sqlite;` and specify `options.StoragePath = "spurtrace.sqlite";`. SpurTrace will run completely isolated inside a local SQLite file.

### 3. How to re-build the dashboard after editing UI components?
Run:
```bash
pnpm run bundle:ui
```
This automatically compiles the Next.js static bundle, cleans old chunks, and copies the distribution into `D:\Senao\EMS\EMS\wwwroot\telemetry`.
