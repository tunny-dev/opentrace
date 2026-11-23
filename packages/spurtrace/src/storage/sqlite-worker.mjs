import { DatabaseSync } from "node:sqlite"
import { parentPort, workerData } from "node:worker_threads"

const database = new DatabaseSync(workerData.filename)
database.exec("PRAGMA journal_mode = WAL; PRAGMA synchronous = NORMAL; PRAGMA busy_timeout = 5000;")
database.exec(`
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
`)

const insert = database.prepare(`
  INSERT OR REPLACE INTO sys_traces (
    trace_id, app_name, method, route, status_code, duration_ms, created_at,
    sample_reason, exception_json, spans_json, sql_calls_json, breadcrumbs_json
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`)

parentPort.postMessage({ id: 0, ok: true })

parentPort.on("message", ({ id, type, payload }) => {
  try {
    let value
    if (type === "insert") {
      database.exec("BEGIN IMMEDIATE")
      try {
        for (const trace of payload) {
          insert.run(
            trace.traceId,
            trace.appName,
            trace.method,
            trace.route,
            trace.statusCode,
            trace.durationMs,
            trace.createdAt,
            trace.sampleReason,
            trace.exception ? JSON.stringify(trace.exception) : null,
            JSON.stringify(trace.spans),
            JSON.stringify(trace.sqlCalls),
            JSON.stringify(trace.breadcrumbs),
          )
        }
        database.exec("COMMIT")
      } catch (error) {
        database.exec("ROLLBACK")
        throw error
      }
    } else if (type === "prune") {
      value = Number(database.prepare("DELETE FROM sys_traces WHERE created_at < ?").run(payload).changes)
    } else if (type === "list") {
      value = database.prepare(`
        SELECT trace_id, app_name, method, route, status_code, duration_ms, created_at,
          sample_reason, exception_json, spans_json, sql_calls_json, breadcrumbs_json
        FROM sys_traces ORDER BY created_at DESC LIMIT ?
      `).all(payload).map((row) => ({
        traceId: row.trace_id,
        appName: row.app_name,
        method: row.method,
        route: row.route,
        statusCode: row.status_code,
        durationMs: row.duration_ms,
        createdAt: row.created_at,
        sampleReason: row.sample_reason,
        priority: row.sample_reason === "sampled" ? "normal" : "critical",
        exception: row.exception_json ? JSON.parse(row.exception_json) : undefined,
        spans: JSON.parse(row.spans_json),
        sqlCalls: JSON.parse(row.sql_calls_json),
        breadcrumbs: JSON.parse(row.breadcrumbs_json),
      }))
    } else if (type === "close") {
      database.close()
    } else {
      throw new Error(`Unknown SQLite worker message: ${type}`)
    }
    parentPort.postMessage({ id, ok: true, value })
  } catch (error) {
    parentPort.postMessage({ id, ok: false, error: error instanceof Error ? error.message : String(error) })
  }
})
