import { NextResponse } from "next/server";
import { DatabaseSync } from "node:sqlite";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function findDatabasePath(): string {
  if (process.env.SPURTRACE_SQLITE_PATH && existsSync(/*turbopackIgnore: true*/ process.env.SPURTRACE_SQLITE_PATH)) {
    return process.env.SPURTRACE_SQLITE_PATH;
  }
  const candidates = [
    resolve(process.cwd(), "opentrace.sqlite"),
    resolve(process.cwd(), "spurtrace.sqlite"),
    resolve(process.cwd(), "../../opentrace.sqlite"),
    resolve(process.cwd(), "../../spurtrace.sqlite"),
    resolve(process.cwd(), "../..", "opentrace.sqlite"),
    resolve(process.cwd(), "..", "opentrace.sqlite"),
  ];
  for (const candidate of candidates) {
    if (existsSync(/*turbopackIgnore: true*/ candidate)) {
      return candidate;
    }
  }
  return resolve(process.cwd(), "opentrace.sqlite");
}

let dbInstance: DatabaseSync | null = null;

function getDatabase(): DatabaseSync {
  if (!dbInstance) {
    const dbPath = findDatabasePath();
    dbInstance = new DatabaseSync(dbPath);
    dbInstance.exec("PRAGMA journal_mode = WAL; PRAGMA synchronous = NORMAL; PRAGMA busy_timeout = 5000;");
    dbInstance.exec(`
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
        spans_json TEXT NOT NULL,
        sql_calls_json TEXT NOT NULL,
        breadcrumbs_json TEXT NOT NULL,
        PRIMARY KEY (trace_id, created_at)
      );
      CREATE INDEX IF NOT EXISTS idx_sys_traces_app_created ON sys_traces (app_name, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_sys_traces_status_created ON sys_traces (status_code, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_sys_traces_duration ON sys_traces (duration_ms DESC);
    `);
  }
  return dbInstance;
}

function formatAge(date: Date): string {
  const seconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  if (seconds < 5) return "now";
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export async function GET(request: Request) {
  try {
    const db = getDatabase();
    const { searchParams } = new URL(request.url);
    const limit = Math.min(1000, Math.max(1, Number(searchParams.get("limit") || 200)));
    const service = searchParams.get("service");
    const search = searchParams.get("search")?.toLowerCase().trim();
    const onlyErrors = searchParams.get("onlyErrors") === "true";
    const onlySlow = searchParams.get("onlySlow") === "true";
    const onlySql = searchParams.get("onlySql") === "true";

    const conditions: string[] = [];
    const params: (string | number)[] = [];

    if (service && service !== "all") {
      conditions.push("app_name = ?");
      params.push(service);
    }
    if (onlyErrors) {
      conditions.push("(status_code >= 400 OR sample_reason = 'error' OR exception_json IS NOT NULL)");
    }
    if (onlySlow) {
      conditions.push("duration_ms >= 300");
    }
    if (onlySql) {
      conditions.push("sql_calls_json != '[]' AND sql_calls_json IS NOT NULL");
    }
    if (search) {
      conditions.push("(LOWER(route) LIKE ? OR LOWER(trace_id) LIKE ? OR LOWER(exception_json) LIKE ?)");
      const term = `%${search}%`;
      params.push(term, term, term);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    const sql = `
      SELECT trace_id, app_name, method, route, status_code, duration_ms, created_at,
             sample_reason, exception_json, spans_json, sql_calls_json, breadcrumbs_json
      FROM sys_traces
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ?
    `;
    params.push(limit);

    const rows = db.prepare(sql).all(...params) as Array<{
      trace_id: string;
      app_name: string;
      method: string;
      route: string;
      status_code: number;
      duration_ms: number;
      created_at: string;
      sample_reason: string;
      exception_json: string | null;
      spans_json: string;
      sql_calls_json: string;
      breadcrumbs_json: string;
    }>;

    const traces = rows.map((row) => {
      let spans: any[] = [];
      let sqlCalls: any[] = [];
      let breadcrumbs: any[] = [];
      let exception: any = null;

      try {
        spans = JSON.parse(row.spans_json || "[]");
      } catch {}
      try {
        sqlCalls = JSON.parse(row.sql_calls_json || "[]");
      } catch {}
      try {
        breadcrumbs = JSON.parse(row.breadcrumbs_json || "[]");
      } catch {}
      try {
        exception = row.exception_json ? JSON.parse(row.exception_json) : null;
      } catch {}

      const hasError = row.status_code >= 400 || !!exception || row.sample_reason === "error";
      const isSlow = row.duration_ms >= 300;
      const state = hasError ? "error" : isSlow ? "slow" : "success";

      const formattedSpans = spans.map((span) => ({
        name: span.name || "Operation",
        kind: span.kind || "app",
        start: Math.round(span.startOffsetMs ?? 0),
        duration: Math.round(span.durationMs ?? 0),
      }));

      const formattedQueries = sqlCalls.map((query) => ({
        query: query.query || query.fingerprint || "SELECT 1",
        fingerprint: query.fingerprint || query.query || "select 1",
        duration: Math.round(query.durationMs ?? 0),
        rows: query.rows ?? 0,
        duplicateCount: query.duplicateCount ?? 1,
        slow: query.isSlow ?? (query.durationMs >= 300),
      }));

      return {
        id: row.trace_id,
        method: row.method || "GET",
        route: row.route || "/",
        status: row.status_code,
        duration: Math.round(row.duration_ms),
        createdAt: row.created_at,
        ageLabel: formatAge(new Date(row.created_at)),
        environment: "production",
        service: row.app_name || "MES-Production",
        sqlCount: sqlCalls.length,
        state,
        spans: formattedSpans,
        queries: formattedQueries,
        exception: exception
          ? {
              name: exception.name || "Error",
              message: exception.message || "An exception occurred",
              signature: exception.signature || `${exception.name || "Error"}: ${exception.message || ""}`,
            }
          : undefined,
        breadcrumbs,
      };
    });

    // Extract real logs from breadcrumbs
    const logs: any[] = [];
    for (const trace of traces) {
      const traceDate = new Date(trace.createdAt).getTime();
      for (const [index, bc] of ((trace as any).breadcrumbs || []).entries()) {
        const atMs = Number(bc.atMs) || 0;
        const time = new Date(traceDate + atMs).toISOString();
        const level = bc.level || (bc.category === "exception" ? "error" : "info");
        logs.push({
          id: `log_${trace.id}_${index}`,
          traceId: trace.id,
          timestamp: time,
          level,
          category: bc.category || "http",
          service: trace.service,
          environment: trace.environment,
          message: bc.message || "Trace event",
          payload: {
            route: trace.route,
            statusCode: trace.status,
            durationMs: trace.duration,
          },
        });
      }
    }
    logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Discovered unique services
    const services = Array.from(new Set(traces.map((t) => t.service))).map((serviceName) => {
      const sTraces = traces.filter((t) => t.service === serviceName);
      const errors = sTraces.filter((t) => t.status >= 400 || t.state === "error").length;
      const sortedDurations = [...sTraces].map((t) => t.duration).sort((a, b) => a - b);
      const p95 = sortedDurations[Math.floor(sortedDurations.length * 0.95)] || 0;
      return {
        id: serviceName,
        name: serviceName,
        count: sTraces.length,
        errorRate: sTraces.length > 0 ? (errors / sTraces.length) * 100 : 0,
        p95Latency: p95,
      };
    });

    return NextResponse.json(
      {
        traces,
        logs: logs.slice(0, 300),
        services,
        total: traces.length,
        timestamp: new Date().toISOString(),
      },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        error: error.message || "Failed to query real traces from SQLite",
        traces: [],
        logs: [],
        services: [],
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const db = getDatabase();
    const body = await request.json();
    const records = Array.isArray(body) ? body : [body];

    const insert = db.prepare(`
      INSERT OR REPLACE INTO sys_traces (
        trace_id, app_name, method, route, status_code, duration_ms, created_at,
        sample_reason, exception_json, spans_json, sql_calls_json, breadcrumbs_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    db.exec("BEGIN IMMEDIATE");
    try {
      for (const trace of records) {
        insert.run(
          trace.traceId || trace.id,
          trace.appName || trace.service || "MES-Production",
          trace.method || "GET",
          trace.route || "/",
          trace.statusCode ?? trace.status ?? 200,
          trace.durationMs ?? trace.duration ?? 0,
          trace.createdAt || new Date().toISOString(),
          trace.sampleReason || (trace.status >= 400 ? "error" : "sampled"),
          trace.exception ? JSON.stringify(trace.exception) : null,
          JSON.stringify(trace.spans || []),
          JSON.stringify(trace.sqlCalls || trace.queries || []),
          JSON.stringify(trace.breadcrumbs || [])
        );
      }
      db.exec("COMMIT");
    } catch (err) {
      db.exec("ROLLBACK");
      throw err;
    }

    return NextResponse.json({ success: true, count: records.length });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to insert traces into SQLite" },
      { status: 500 }
    );
  }
}
