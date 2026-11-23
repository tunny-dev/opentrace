# SpurTrace PoC

SpurTrace is a framework-friendly Node.js/TypeScript instrumentation core with an Express adapter, a worker-thread SQLite writer, and a framework-free embedded dashboard. The interactive dashboard in the project preview is a UI prototype; `dashboardMiddleware()` is the dependency-free static UI served by the library.

## Architecture and data flow

```text
HTTP request
  ├─ middleware starts AsyncLocalStorage trace context
  ├─ application / DB adapter records spans, SQL fingerprints, breadcrumbs
  └─ response finish → tail sampling and trace finalization
       └─ synchronous bounded ring-buffer enqueue (no DB await)
            ├─ drop sampled/normal first when full; preserve error/slow traces
            └─ timer (1.5 s) or batch threshold (500 by default)
                 └─ BatchWriter → serialized worker-thread messages
                      └─ SQLite worker: transaction + multi-row prepared INSERT
                           └─ WAL database → dashboard read / nightly retention
```

The request path never awaits storage. `BatchWriter.enqueue()` only mutates a bounded in-memory ring queue and schedules a timer; disk I/O and synchronous `node:sqlite` calls happen on a dedicated worker thread. A single write is retried up to the configured limit, then counted as dropped. A hung adapter can leave one bounded in-flight batch, but cannot grow the queue without limit. The embedded dashboard estimates P50/P95/P99 and error rate with inverse-probability weights for sampled fast requests; values are estimates over the latest 100 traces, not a full-retention aggregate.

### Sampling and overload

- Captures all HTTP 5xx, captured exceptions, requests slower than `slowRequestThresholdMs`, and traces containing slow SQL.
- Samples the remaining requests using `sampleRateSuccess` (0.1 = 10%).
- Ignores common health checks, static asset extensions, and `/_next`/`/assets` by default. Add application-specific `ignoreRoutes` patterns as needed.
- The buffer defaults to 10,000. When saturated, a new normal trace is dropped; a critical trace evicts the oldest normal trace; if the queue contains only critical traces, the incoming trace is dropped. The drop counter is observable through `getStats()`.
- SQL statements are stored in normalized form: literal values become `?`, parameters are never collected, and route query strings are excluded. Applications should still avoid secrets in SQL comments or route path segments.

## Storage schema

`sys_traces` is a flat trace table with JSON event/span/SQL payloads, a trace identifier, status, duration, app name, and timestamp. Only dashboard filter indexes are included: `(app_name, created_at DESC)`, `(status_code, created_at DESC)`, and `(duration_ms DESC)`. PostgreSQL and SQL Server templates are in `schema/postgres.sql` and `schema/sqlserver.sql`.

Daily range partitions enable fast retention by detaching/dropping an expired child table instead of deleting millions of rows. Partition provisioning must run ahead of incoming traffic. The PostgreSQL template provisions today plus 13 days. In SQL Server the duration index also contains `created_at` to remain aligned with the partition scheme. SQLite uses `journal_mode=WAL`, `synchronous=NORMAL`, a worker thread, a transactional batch insert, and indexed lookup columns. Its retention adapter uses a bounded delete; SQLite does not provide PostgreSQL-style daily partition drops.

## Package layout and install

The distributable package lives in `packages/spurtrace`; its `exports` map targets compiled ESM and declaration files under `dist/`, and `prepack` builds them for publication. In a consumer project, install the published package with `pnpm add spurtrace`. In this workspace, `pnpm run build:spurtrace` builds the local workspace package. Root `dev` and `build` scripts compile this workspace package before starting Next.js or running its TypeScript checks, so clean Vercel builds do not depend on ignored `dist/` artifacts.

## Install and mount

```ts
import express from "express"
import { createSpurTrace, SqliteStorageAdapter } from "spurtrace"

const app = express()
const trace = createSpurTrace({
  appName: "MES-Production",
  storage: new SqliteStorageAdapter({ path: "./spurtrace.sqlite" }),
  batchSize: 200,
  flushIntervalMs: 2000,
  sampleRateSuccess: 0.1,
  retentionDays: 7,
  slowQueryThresholdMs: 300,
  auth: { enabled: true, users: [{ username: "admin", password: process.env.SPURTRACE_PASSWORD! }] },
})

app.use(trace.httpMiddleware())
app.get("/orders", async (_request, response) => {
  const rows = await trace.runSql("SELECT * FROM orders", () => db.orders.findMany())
  response.json(rows)
})
app.use("/_telemetry", trace.dashboardMiddleware())
app.use(trace.errorMiddleware())
```

For custom database clients, call `trace.runSql(sql, operation)` around the query or use `trace.recordSql(sql, durationMs)` in the driver's existing instrumentation hook. `runSql` records SQL without parameters and rethrows the original error. Mount the error middleware before the application's final error responder so it can group the exception and attach a breadcrumb.

Set dashboard credentials through a secret manager/environment, not source control. The sample uses HTTP Basic authentication, which must only be used behind HTTPS or on a trusted local development network. Keep the dashboard private in production; do not expose an observability endpoint publicly without authentication and network controls.

## Embedded UI distribution

`dashboardMiddleware()` serves a self-contained HTML/CSS/JS asset held in `lib/spurtrace/dashboard/embedded-ui.ts` and exposes `GET /api/traces` relative to the mount. It has no React runtime, external CDN, or build step. A published package can ship this string as a static asset or generate it from a minified dashboard bundle during release, then import the asset into the middleware. The application's normal React dashboard is separate and provides the richer trace-detail prototype.

## Demo load test

The complete Express example is `examples/server.ts`. With Node 22.13+ (the PoC uses the built-in `node:sqlite` module), start it with:

```sh
pnpm run demo
```

It sends 100 concurrent requests, including slow and failing examples, flushes the writer, and prints elapsed time and buffer/write/drop counters. Visit `http://localhost:4175/_telemetry/`. Set `SPURTRACE_USER` and `SPURTRACE_PASSWORD` to enable Basic Auth; when unset, the local demo dashboard is unauthenticated. Keep the demo bound to a trusted development environment.

## PoC boundaries

- The project UI preview uses representative fixture traces to make the interaction demonstrable without a running service.
- `SqliteStorageAdapter` is production-shaped but intentionally small; PostgreSQL and SQL Server DDL are supplied as schema starting points, not implemented adapters.
- Slow SQL always promotes a trace to the critical queue. Error grouping is represented by a normalized exception signature; aggregation across traces can be added to the dashboard query layer.
- Node's built-in SQLite is a Node 22+ API. For older Node versions, replace the worker implementation with an asynchronous SQLite driver while preserving the `StorageAdapter` contract.
