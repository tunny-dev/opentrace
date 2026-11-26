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

### Step 1: Reference `SpurTrace.AspNetCore.dll` (or Project)

Thêm tham chiếu `SpurTrace.AspNetCore.dll` vào file `.csproj`:
```xml
<ItemGroup>
  <Reference Include="SpurTrace.AspNetCore">
    <HintPath>libs\SpurTrace.AspNetCore.dll</HintPath>
  </Reference>
</ItemGroup>
```

Hoặc nếu dùng Project Reference trong nội bộ:
```xml
<ItemGroup>
  <ProjectReference Include="..\packages\spurtrace-net\SpurTrace.AspNetCore.csproj" />
</ItemGroup>
```

---

### Step 2: Database Setup

SpurTrace hỗ trợ cấu hình cực kỳ linh hoạt về Database và Quản lý Retention Log:

1. **Tự động tạo bảng (`options.AutoCreateTables = true`)**:
   - Mặc định là `true`. Khi ứng dụng start, SpurTrace sẽ tự kiểm tra và khởi tạo schema `spurtrace`, các bảng (`traces`, `users`, `settings`, `alert_rules`, `alert_history`) và indexes nếu chưa tồn tại.
2. **Chạy script thủ công (`options.AutoCreateTables = false`)**:
   - Thích hợp cho môi trường Production của doanh nghiệp khi DBA không cấp quyền DDL cho app.
   - Chạy trực tiếp file script: [sdks/dotnet/schema/sqlserver.sql](file:///d:/TunnyProject/opentrace/sdks/dotnet/schema/sqlserver.sql)
3. **Cấu hình Xóa / Dọn dẹp Log (`AutoCleanLogs` & `RetentionDays`)**:
   - `AutoCleanLogs = true`: Tự động xóa trace cũ hơn số ngày quy định (mỗi 6 tiếng chạy 1 lần).
   - `AutoCleanLogs = false`: **TẮT HOÀN TOÀN** dọn dẹp, không bao giờ xóa bất kỳ bản ghi log nào. *(Lưu ý: `AutoCleanLogs` là công tắc chính. Nếu `AutoCleanLogs = false`, dù `RetentionDays` có đặt là 60 hay bất kỳ số nào thì hệ thống vẫn KHÔNG XÓA).*
   - `RetentionDays = 30`: Số ngày lưu log. Nếu cấu hình `<= 0` (hoặc `-1`), hệ thống sẽ giữ log vĩnh viễn.

---

### Step 3: Register in `Program.cs`

Mở file `Program.cs` và đăng ký:

```csharp
using SpurTrace.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

// 1. Đăng ký dịch vụ SpurTrace APM
builder.Services.AddSpurTrace(options =>
{
    options.AppName = "Senao EMS";
    options.StorageType = SpurTraceStorageType.SqlServer;
    options.ConnectionString = builder.Configuration.GetConnectionString("DefaultConnection")!;
    
    // Tùy biến tạo bảng
    options.AutoCreateTables = true; // Set false nếu DBA đã chạy script sqlserver.sql

    // Tùy biến xóa log
    options.AutoCleanLogs = true;    // Set false để lưu trữ vĩnh viễn, không bao giờ xóa
    options.RetentionDays = 30;      // Set <= 0 để tắt xóa log

    // Ngưỡng hiệu năng & lấy mẫu (Sampling & Thresholds)
    options.SlowRequestThresholdMs = 500.0;  // Ngưỡng request chậm (ms)
    options.SlowQueryThresholdMs = 250.0;    // Ngưỡng SQL query chậm (ms)
    options.SampleRateSuccess = 0.5;         // Lấy mẫu 50% request thành công (Lỗi & Chậm luôn lưu 100%)
});

// 2. Register EF Core Interceptor in DbContext
builder.Services.AddDbContextPool<ApplicationDbContext>(options =>
{
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")!);
    options.AddInterceptors(new SpurTraceDbInterceptor());
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

### Automated Alerts & Email Notifications (Port 25 vs 587, Outlook & Templates)
- **Email Gateway Architecture**:
  - **Port 587 (Office 365 / Outlook / Gmail)**: Uses secure `STARTTLS`. Requires sender email account and an *App Password* (Mật khẩu ứng dụng) if the company tenant enforces Multi-Factor Authentication (MFA).
  - **Port 25 (On-premise Internal Relay)**: Designed for factory/MES intranet networks with whitelisted server IPs. Does *not* require SSL or passwords.
- **Dynamic Email Templates**:
  - Pre-built templates stored in DB (`spurtrace.email_templates`):
    - `Alert_Critical`: Urgent red card for 5xx errors & Exception crashes with 1-click button to view the Trace Waterfall.
    - `Alert_SlowQuery`: Orange card for slow queries & N+1 loops with 1-click button to run in SQL Studio.
    - `Alert_Digest`: Periodic health & latency percentile summary.
  - Supported token placeholders: `{{AlertTitle}}`, `{{Severity}}`, `{{ServiceName}}`, `{{Endpoint}}`, `{{DurationMs}}`, `{{TraceId}}`, `{{Timestamp}}`, `{{ErrorMessage}}`, `{{SqlSnippet}}`, `{{TraceUrl}}`.
- **Incident History**: Logs all triggered alerts with severity (`Critical`, `Warning`, `Info`) and links back to the originating Trace ID.

### Database Schema, Audit Columns & TraceId Ordering
- **Trace ID Ordering**: In `spurtrace.traces`, `trace_id` is guaranteed to be the **very first column** in the table DDL and acts as the primary index.
- **Audit Columns**: All SpurTrace operational tables (`traces`, `users`, `settings`, `alert_rules`, `alert_history`, `email_templates`) include standardized audit metadata:
  - `created_at DATETIME2 NOT NULL DEFAULT GETUTCDATE()`
  - `updated_at DATETIME2 NULL`
  - `created_by NVARCHAR(100) NULL DEFAULT 'System'`
  - `updated_by NVARCHAR(100) NULL`

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
