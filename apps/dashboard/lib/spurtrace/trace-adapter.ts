import type { DemoTrace, DemoQuery, DemoSpan } from "./demo-data";
import { getSqlFingerprint } from "@/features/system-logs/utils/traceAnalytics";

function formatRelativeTime(dateString: string): string {
  try {
    const diff = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
    if (diff < 5) return "just now";
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  } catch {
    return "";
  }
}

export function toDemoTrace(raw: any): DemoTrace {
  if (!raw) {
    return {
      id: "unknown",
      method: "GET",
      route: "/",
      status: 200,
      duration: 0,
      createdAt: new Date().toISOString(),
      ageLabel: "just now",
      environment: "production",
      service: "SpurTrace",
      sqlCount: 0,
      state: "success",
      spans: [],
      queries: [],
    };
  }

  const id = String(raw.id || raw.traceId || raw.TraceId || "unknown");
  const method = String(raw.method || raw.Method || "GET").toUpperCase();
  const route = String(raw.route || raw.path || raw.Path || raw.endpoint || raw.Endpoint || "/");
  const status = Number(raw.status || raw.statusCode || raw.StatusCode || 200);
  const duration = Number(
    raw.duration ??
    raw.durationMs ??
    raw.totalDurationMs ??
    raw.DurationMs ??
    raw.TotalDurationMs ??
    0
  );
  const createdAt = String(
    raw.createdAt || raw.timestamp || raw.Timestamp || new Date().toISOString()
  );
  const ageLabel = raw.ageLabel || formatRelativeTime(createdAt);
  const environment = raw.environment || "production";
  const service = raw.service || "SpurTrace";
  const clientIp = raw.clientIp || raw.ClientIp || raw.ip || "";

  // Extract raw SQL events or queries
  let rawQueries: any[] = [];
  if (Array.isArray(raw.queries) && raw.queries.length > 0) {
    rawQueries = raw.queries;
  } else if (Array.isArray(raw.sqlCalls) && raw.sqlCalls.length > 0) {
    rawQueries = raw.sqlCalls;
  } else if (Array.isArray(raw.events)) {
    rawQueries = raw.events
      .filter((e: any) => e && (e.eventType === "sql" || e.eventType === "slow_sql" || Boolean(e.sql)))
      .map((e: any) => ({
        query: e.sql || e.query || e.message || "",
        duration: Number(e.durationMs ?? e.duration ?? 0),
        rows: Number(e.rowCount ?? e.rows ?? 0),
        parameters: e.parameters,
        timestamp: e.timestamp,
        offsetMs: e.offsetMs,
        callSite: e.callSite || e.source,
      }));
  }

  // Count fingerprints for duplicate / N+1 detection
  const fpCounts = new Map<string, number>();
  rawQueries.forEach((q) => {
    const text = q.query || q.sql || "";
    const fp = getSqlFingerprint(text);
    fpCounts.set(fp, (fpCounts.get(fp) || 0) + 1);
  });

  const queries: DemoQuery[] = rawQueries.map((q, idx) => {
    const rawSql = q.query || q.sql || "";
    const fp = q.fingerprint || getSqlFingerprint(rawSql) || `SQL_${idx + 1}`;
    const dupCount = fpCounts.get(fp) || 1;
    const qDuration = Number(q.duration ?? q.durationMs ?? 0);
    const isSlow = Boolean(q.slow || qDuration >= 1000);

    let params: Record<string, any> = {};
    if (q.parameters && typeof q.parameters === "object") {
      params = { ...q.parameters };
    } else if (typeof q.parameters === "string" && q.parameters.trim()) {
      try {
        const parsed = JSON.parse(q.parameters);
        if (parsed && typeof parsed === "object") params = parsed;
      } catch {
        // ignore
      }
    }

    if ("raw" in params && (params.raw === "" || params.raw == null)) {
      delete params.raw;
    }

    const matches = rawSql.match(/@([a-zA-Z0-9_]+)/g);
    if (matches) {
      matches.forEach((m: string) => {
        const pName = m.substring(1);
        if (!(pName in params) && !(`@${pName}` in params)) {
          params[pName] = pName.toLowerCase().includes("lang") ? "zh-TW" : "";
        }
      });
    }

    return {
      query: rawSql,
      fingerprint: fp,
      duration: qDuration,
      rows: Number(q.rows ?? q.rowCount ?? 0),
      duplicateCount: dupCount,
      slow: isSlow,
      slowCount: isSlow ? 1 : 0,
      callSite: q.callSite,
      sampleBindValues: Object.keys(params).length > 0 ? Object.values(params).map(String) : undefined,
      parameters: params,
      sampleQuery: rawSql,
    } as DemoQuery;
  });

  // Build spans
  let spans: DemoSpan[] = [];
  if (Array.isArray(raw.spans) && raw.spans.length > 0) {
    spans = raw.spans;
  } else {
    // Construct waterfall spans
    let currentOffset = 0;
    const interval = queries.length > 0 ? Math.max(1, duration / (queries.length + 2)) : duration;

    queries.forEach((q, idx) => {
      const qDuration = Math.max(1, q.duration);
      const spanStart = (q as any).offsetMs != null
        ? Number((q as any).offsetMs)
        : Math.min(duration, (idx + 1) * interval);

      spans.push({
        name: q.fingerprint && q.fingerprint.length > 40
          ? `${q.fingerprint.slice(0, 40)}...`
          : (q.fingerprint || `SQL Query #${idx + 1}`),
        kind: "db",
        start: spanStart,
        duration: qDuration,
      });
      currentOffset = Math.max(currentOffset, spanStart + qDuration);
    });

    // Main middleware / handler span
    spans.unshift({
      name: `${method} ${route}`,
      kind: "middleware",
      start: 0,
      duration: Math.max(1, duration),
    });
  }

  // Extract exception if any
  let exception = raw.exception;
  if (!exception && Array.isArray(raw.events)) {
    const errEvent = raw.events.find(
      (e: any) => e && (e.eventType === "exception" || e.eventType === "error")
    );
    if (errEvent) {
      exception = {
        name: errEvent.type || errEvent.name || "Exception",
        message: errEvent.message || errEvent.exception || "Unhandled Exception",
        signature: errEvent.stack || errEvent.signature || "",
      };
    }
  }

  let state: "success" | "error" | "slow" = "success";
  if (raw.state) {
    state = raw.state;
  } else if (status >= 500 || raw.hasError || exception) {
    state = "error";
  } else if (duration >= 1000) {
    state = "slow";
  }

  return {
    id,
    method,
    route,
    status,
    duration,
    createdAt,
    ageLabel,
    environment,
    service,
    isLive: Boolean(raw.isLive),
    sqlCount: queries.length,
    state,
    spans,
    queries,
    exception,
    rawEvents: Array.isArray(raw.events) ? raw.events : undefined,
    clientIp,
  } as DemoTrace;
}
