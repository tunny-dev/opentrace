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
  ];
  for (const candidate of candidates) {
    if (existsSync(/*turbopackIgnore: true*/ candidate)) return candidate;
  }
  return resolve(process.cwd(), "opentrace.sqlite");
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");
    const search = searchParams.get("search")?.toLowerCase().trim();
    const traceId = searchParams.get("traceId")?.trim();
    const onlyErrors = searchParams.get("onlyErrors") === "true";
    const onlySlow = searchParams.get("onlySlow") === "true";
    const onlySql = searchParams.get("onlySql") === "true";
    const page = Math.max(1, Number(searchParams.get("page") || 1));
    const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize") || 20)));

    const dbPath = findDatabasePath();
    if (!existsSync(/*turbopackIgnore: true*/ dbPath)) {
      return NextResponse.json({
        traces: [],
        total: 0,
        page,
        pageSize,
        totalPages: 1,
        summary: { totalTraces: 0, totalQueries: 0, slowQueries: 0, totalErrors: 0, avgDurationMs: 0 },
        timeline: [],
      });
    }

    const db = new DatabaseSync(dbPath);

    const conditions: string[] = [];
    const params: (string | number)[] = [];

    if (date) {
      conditions.push("substr(created_at, 1, 10) = ?");
      params.push(date);
    }
    if (traceId) {
      conditions.push("trace_id LIKE ?");
      params.push(`%${traceId}%`);
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
      conditions.push("(LOWER(route) LIKE ? OR LOWER(trace_id) LIKE ? OR LOWER(exception_json) LIKE ? OR LOWER(sql_calls_json) LIKE ?)");
      const term = `%${search}%`;
      params.push(term, term, term, term);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const countRow = db.prepare(`SELECT count(*) as total FROM sys_traces ${whereClause}`).get(...params) as { total: number };
    const total = Number(countRow?.total || 0);
    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    const offset = (page - 1) * pageSize;
    const querySql = `
      SELECT trace_id, app_name, method, route, status_code, duration_ms, created_at,
             sample_reason, exception_json, spans_json, sql_calls_json, breadcrumbs_json
      FROM sys_traces
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `;

    const rows = db.prepare(querySql).all(...params, pageSize, offset) as Array<{
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

    let totalQueriesCount = 0;
    let slowQueriesCount = 0;
    let totalErrorsCount = 0;
    let totalDurationSum = 0;

    const traces = rows.map((row) => {
      let spans: any[] = [];
      let sqlCalls: any[] = [];
      let breadcrumbs: any[] = [];
      let exception: any = null;

      try { spans = JSON.parse(row.spans_json || "[]"); } catch {}
      try { sqlCalls = JSON.parse(row.sql_calls_json || "[]"); } catch {}
      try { breadcrumbs = JSON.parse(row.breadcrumbs_json || "[]"); } catch {}
      try { exception = row.exception_json ? JSON.parse(row.exception_json) : null; } catch {}

      const hasError = row.status_code >= 400 || !!exception || row.sample_reason === "error";
      const slowCalls = sqlCalls.filter((q) => q.isSlow || q.durationMs >= 300).length;

      totalQueriesCount += sqlCalls.length;
      slowQueriesCount += slowCalls;
      if (hasError) totalErrorsCount += 1;
      totalDurationSum += row.duration_ms;

      // Construct events array expected by Waterfall view
      const events: any[] = [];
      const traceStart = new Date(row.created_at).getTime();

      // 1. Initial request start event
      events.push({
        id: `${row.trace_id}_start`,
        eventType: "request",
        time: row.created_at,
        durationMs: 0,
        message: `${row.method} ${row.route}`,
        level: "info",
      });

      // 2. SQL calls
      let offsetMs = 2;
      for (const [idx, q] of sqlCalls.entries()) {
        const dur = Number(q.durationMs) || 1;
        events.push({
          id: `${row.trace_id}_sql_${idx}`,
          eventType: dur >= 300 ? "slow_sql" : "sql",
          time: new Date(traceStart + offsetMs).toISOString(),
          durationMs: dur,
          sql: q.query || q.fingerprint,
          rawSql: q.query || q.fingerprint,
          fingerprint: q.fingerprint || q.query,
          rows: q.rows ?? 0,
          duplicateCount: q.duplicateCount ?? 1,
          level: dur >= 300 ? "warn" : "info",
          message: `SQL: ${q.fingerprint || q.query}`,
        });
        offsetMs += dur + 1;
      }

      // 3. Exception if any
      if (exception) {
        events.push({
          id: `${row.trace_id}_err`,
          eventType: "error",
          time: new Date(traceStart + offsetMs).toISOString(),
          durationMs: 0,
          level: "error",
          message: `${exception.name}: ${exception.message}`,
          errorName: exception.name,
          errorMessage: exception.message,
          stack: exception.signature,
        });
      }

      // 4. Breadcrumbs
      for (const [idx, bc] of breadcrumbs.entries()) {
        events.push({
          id: `${row.trace_id}_bc_${idx}`,
          eventType: bc.category || "breadcrumb",
          time: new Date(traceStart + (bc.atMs || 0)).toISOString(),
          durationMs: 0,
          level: bc.level || "info",
          message: bc.message,
        });
      }

      const totalSqlDurationMs = sqlCalls.reduce((sum, q) => sum + (Number(q.durationMs) || 0), 0);

      return {
        traceId: row.trace_id,
        method: row.method || "GET",
        path: row.route || "/",
        statusCode: row.status_code,
        totalDurationMs: Math.round(row.duration_ms * 10) / 10,
        totalSqlDurationMs: Math.round(totalSqlDurationMs * 10) / 10,
        timestamp: row.created_at,
        clientIp: "127.0.0.1",
        queryCount: sqlCalls.length,
        slowQueryCount: slowCalls,
        hasError,
        events,
        exception: exception
          ? {
              name: exception.name,
              message: exception.message,
              signature: exception.signature,
            }
          : undefined,
      };
    });

    // Build timeline buckets
    const timeline: any[] = [];
    if (traces.length > 0) {
      const times = traces.map((t) => new Date(t.timestamp).getTime()).filter(Number.isFinite);
      const minTime = Math.min(...times);
      const maxTime = Math.max(...times);
      const bucketCount = 12;
      const span = Math.max(1, maxTime - minTime);
      for (let i = 0; i < bucketCount; i++) {
        const bStart = minTime + (span * i) / bucketCount;
        const bEnd = minTime + (span * (i + 1)) / bucketCount;
        const bTraces = traces.filter((t) => {
          const tm = new Date(t.timestamp).getTime();
          return tm >= bStart && tm <= bEnd;
        });
        const errors = bTraces.filter((t) => t.hasError).length;
        const avg = bTraces.length > 0 ? bTraces.reduce((s, t) => s + t.totalDurationMs, 0) / bTraces.length : 0;
        timeline.push({
          time: new Date(bStart).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          count: bTraces.length,
          errors,
          avgDuration: Math.round(avg),
        });
      }
    }

    const summary = {
      totalTraces: total,
      totalQueries: totalQueriesCount,
      slowQueries: slowQueriesCount,
      totalErrors: totalErrorsCount,
      avgDurationMs: rows.length > 0 ? Math.round(totalDurationSum / rows.length) : 0,
    };

    return NextResponse.json({
      traces,
      total,
      page,
      pageSize,
      totalPages,
      summary,
      timeline,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: error.message || "Failed to query system traces",
        traces: [],
        total: 0,
        page: 1,
        pageSize: 20,
        totalPages: 1,
        summary: { totalTraces: 0, totalQueries: 0, slowQueries: 0, totalErrors: 0, avgDurationMs: 0 },
        timeline: [],
      },
      { status: 500 }
    );
  }
}
