# SpurTrace APM & Live Observability Suite

<p align="center">
  <strong>High-Precision In-App Application Performance Monitoring, SQL Profiling & Live Request Waterfall Tracing</strong><br>
  Built for <strong>.NET 8 (ASP.NET Core MVC & Web API)</strong> and <strong>Node.js / TypeScript</strong>.
</p>

---

## ⚡ Highlights

- **Zero-Wait Ingestion**: Non-blocking channel & ring-buffer architecture. Request threads complete in **< 0.1ms** without database write penalties.
- **Dedicated Observability Schema (`spurtrace`)**: Seamless schema injection into your existing SQL Server database, or isolated local SQLite storage.
- **Automatic EF Core Profiling**: Intercepts queries, execution times, parameters, row counts, and detects **N+1 query loops** automatically.
- **Embedded Next.js 16 SPA Dashboard**: Complete observability console running inside your app at `/telemetry` as self-contained static assets with 0-reload transitions.
- **Global SQL Studio & Sandbox**: Query fingerprint aggregation, impact ranking, and a read-only SQL execution sandbox.
- **Automated Incident Alerting**: Real-time evaluation of latency & error spikes with built-in SMTP email dispatch.
- **Enterprise RBAC**: Built-in authentication with PBKDF2-SHA256 password hashing and session management (`Admin` / `Viewer`).

---

## 📚 Documentation & Setup Guides

| Guide | Description |
|---|---|
| **[Setup & Integration Guide](file:///d:/TunnyProject/opentrace/docs/SETUP_GUIDE.md)** | Step-by-step instructions for integrating SpurTrace into .NET 8 and Node.js. |
| **[SpurTrace.AspNetCore (.NET 8 SDK)](file:///d:/TunnyProject/opentrace/sdks/dotnet/README.md)** | Deep dive into the .NET 8 library, Dapper queries, AutoCreateTables & AutoCleanLogs configuration. |
| **[Architecture & Design Specifications](file:///d:/TunnyProject/opentrace/docs/ARCHITECTURE.md)** | Detailed data flow, storage schema, tail sampling, and embedded SPA distribution blueprints. |
| **[SQL Server DDL Script](file:///d:/TunnyProject/opentrace/sdks/dotnet/schema/sqlserver.sql)** | Complete SQL Server DDL migration script for manual provisioning (`AutoCreateTables = false`). |

---

## 📂 Repository Structure

```
d:\TunnyProject\opentrace\
├── apps/                    # Toàn bộ ứng dụng giao diện & demo
│   ├── dashboard/           # Next.js 16 Web Dashboard UI (TanStack Table v8, Shadcn UI)
│   ├── docs/                # Next.js Documentation Site
│   └── demo/                # Server Express demo
├── sdks/                    # Toàn bộ SOURCE CODE thư viện lõi
│   ├── dotnet/              # .NET 8.0 ASP.NET Core Library (Dapper, EF Core Interceptors)
│   └── nodejs/              # Node.js / TypeScript SDK & middleware
├── docs/                    # Tài liệu kiến trúc & Setup guides
└── scripts/                 # Monorepo build scripts (dashboard bundler, icon generator)
```

---

## 🚀 Quick Setup in 3 Minutes (.NET 8)

### 1. Register Services in `Program.cs`
```csharp
using SpurTrace.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

// Register SpurTrace APM
builder.Services.AddSpurTrace(options =>
{
    options.AppName = "Senao-EMS";
    options.StorageType = SpurTraceStorageType.SqlServer;
    options.ConnectionString = builder.Configuration.GetConnectionString("DefaultConnection")!;
    
    // Tùy biến tạo bảng & dọn dẹp log linh hoạt
    options.AutoCreateTables = true; // true: tự tạo bảng; false: chạy script schema/sqlserver.sql
    options.AutoCleanLogs = true;    // true: tự động xóa log cũ; false: giữ log vĩnh viễn
    options.RetentionDays = 30;      // Số ngày lưu trữ (<= 0 để lưu vĩnh viễn)
});

// Hook EF Core Interceptor
builder.Services.AddDbContextPool<ApplicationDbContext>(options =>
{
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")!);
    options.AddInterceptors(new SpurTraceDbInterceptor());
});

var app = builder.Build();

// Enable Middleware & Endpoints
app.UseSpurTrace();
app.UseRouting();
app.MapSpurTraceEndpoints(); // Serves dashboard at /telemetry

app.Run();
```

### 2. Build Dashboard Assets
```bash
pnpm install
pnpm run bundle:ui
```
This compiles the Next.js static SPA dashboard and packages it into `wwwroot/telemetry`.

### 3. Access Dashboard
Navigate to `http://localhost:<port>/telemetry`.
- **Default Username**: `admin`
- **Default Password**: `admin@123`

---

## 🛠 Repository Monorepo Structure

```text
opentrace/
├── apps/
│   └── dashboard/              # Next.js 16 App Router Observability Dashboard
│       ├── app/                # Next.js pages & layout (Overview, Traces, SQL, Logs, Settings)
│       ├── components/         # Shadcn UI, TanStack Table v8, SpurTrace components
│       └── lib/                # Telemetry & Auth Context, i18n
├── packages/
│   ├── spurtrace/              # Core Node.js / TypeScript SDK
│   └── opentrace/              # OpenTrace alias package
├── scripts/
│   └── build-dashboard-bundle.mjs # Static export & wwwroot bundler
└── spurtrace/
    ├── ARCHITECTURE.md         # Full architecture specification
    └── SETUP_GUIDE.md          # Comprehensive integration manual
```

---

## 📜 License

Licensed under the MIT License.
