import { getSqlFingerprint } from './traceAnalytics';

/**
 * Extracts table names from a T-SQL query string.
 * Supports standard table names, schema-prefixed tables (dbo.Table), bracketed names ([Table]),
 * and queries with table hints like WITH (NOLOCK).
 */
export function extractSqlTables(sql) {
  if (!sql || typeof sql !== 'string') return [];
  const regex =
    /\b(?:FROM|JOIN|UPDATE|INTO)\s+(?:\[?dbo\]?\.)?\[?([a-zA-Z0-9_#]+)\]?(?:\s+(?:AS\s+)?([a-zA-Z0-9_]+))?(?:\s+WITH\s*\([^)]*\))?/gi;
  const tables = new Set();
  const IGNORE_WORDS = new Set([
    'SELECT',
    'WHERE',
    'SET',
    'VALUES',
    'GROUP',
    'ORDER',
    'HAVING',
    'ON',
    'AS',
    'AND',
    'OR',
    'OPENJSON',
    'STRING_SPLIT',
    'INSERT',
    'DELETE',
    'INNER',
    'LEFT',
    'RIGHT',
    'FULL',
    'CROSS',
    'OUTER',
  ]);

  let match;
  while ((match = regex.exec(sql)) !== null) {
    const table = match[1];
    if (table && !IGNORE_WORDS.has(table.toUpperCase()) && !table.startsWith('@') && isNaN(table)) {
      tables.add(table);
    }
  }
  return Array.from(tables);
}

/**
 * Aggregates all SQL queries across loaded traces into:
 * 1. Query Leaderboard (slowest, most frequent, N+1 patterns)
 * 2. Table Heatmap (most accessed database tables)
 * 3. Overall SQL performance metrics
 */
export function aggregateSqlQueries(traces) {
  if (!Array.isArray(traces) || traces.length === 0) {
    return {
      queries: [],
      tables: [],
      metrics: {
        totalQueriesCount: 0,
        totalSqlDurationMs: 0,
        slowQueriesCount: 0,
        avgSqlDurationMs: 0,
        p95SqlDurationMs: 0,
        distinctPatternsCount: 0,
        nPlusOnePatternsCount: 0,
      },
    };
  }

  const queryMap = new Map();
  let totalQueriesCount = 0;
  let totalSqlDurationMs = 0;
  let slowQueriesCount = 0;
  const allDurations = [];

  traces.forEach((trace) => {
    const events = Array.isArray(trace.events) ? trace.events : [];
    const sqlEvents = events.filter((e) => e.eventType === 'sql' || e.eventType === 'slow_sql');

    // Count occurrences within this trace to detect N+1
    const traceQueryCounts = new Map();
    sqlEvents.forEach((evt) => {
      const rawSql =
        evt.sql || (evt.message?.includes('| SQL:') ? evt.message.split('| SQL:')[1] : '');
      const fp = getSqlFingerprint(rawSql);
      if (!fp) return;
      traceQueryCounts.set(fp, (traceQueryCounts.get(fp) || 0) + 1);
    });

    sqlEvents.forEach((evt) => {
      const rawSql =
        evt.sql || (evt.message?.includes('| SQL:') ? evt.message.split('| SQL:')[1] : '');
      const fp = getSqlFingerprint(rawSql);
      if (!fp) return;

      const dur = Number(evt.durationMs) || 0;
      totalQueriesCount += 1;
      totalSqlDurationMs += dur;
      allDurations.push(dur);
      if (dur >= 1000 || evt.eventType === 'slow_sql') {
        slowQueriesCount += 1;
      }

      if (!queryMap.has(fp)) {
        const tables = extractSqlTables(rawSql);
        let initialParams = evt.paramsJson || evt.parameters || '';
        if (initialParams && typeof initialParams === 'object') {
          try {
            initialParams = JSON.stringify(initialParams, null, 2);
          } catch {
            initialParams = '';
          }
        }
        queryMap.set(fp, {
          fingerprint: fp,
          sampleSql: rawSql,
          paramsJson: initialParams,
          calls: 0,
          durations: [],
          totalDurationMs: 0,
          slowCallsCount: 0,
          traceIds: new Set(),
          nPlusOneTracesCount: 0,
          tables,
          sampleTrace: trace,
        });
      }

      const q = queryMap.get(fp);
      q.calls += 1;
      q.durations.push(dur);
      q.totalDurationMs += dur;
      if (dur >= 1000 || evt.eventType === 'slow_sql') {
        q.slowCallsCount += 1;
      }
      if (trace.traceId) {
        q.traceIds.add(trace.traceId);
      }
    });

    // Check if this trace had N+1 for any query
    for (const [fp, count] of traceQueryCounts.entries()) {
      if (count >= 3 && queryMap.has(fp)) {
        queryMap.get(fp).nPlusOneTracesCount += 1;
      }
    }
  });

  // Calculate detailed stats per query pattern
  const queries = Array.from(queryMap.values()).map((q) => {
    const sortedDurs = [...q.durations].sort((a, b) => a - b);
    const p95Idx = Math.min(Math.floor(sortedDurs.length * 0.95), sortedDurs.length - 1);
    const p95DurationMs = sortedDurs[p95Idx] || 0;
    const avgDurationMs = Number((q.totalDurationMs / q.calls).toFixed(1));
    const minDurationMs = sortedDurs[0] || 0;
    const maxDurationMs = sortedDurs[sortedDurs.length - 1] || 0;
    const tracesCount = q.traceIds.size;
    const isNPlusOne = q.nPlusOneTracesCount > 0;
    const isSlow = q.slowCallsCount > 0 || avgDurationMs >= 1000;

    return {
      fingerprint: q.fingerprint,
      sampleSql: q.sampleSql,
      paramsJson: q.paramsJson,
      calls: q.calls,
      totalDurationMs: Number(q.totalDurationMs.toFixed(1)),
      avgDurationMs,
      minDurationMs,
      maxDurationMs,
      p95DurationMs,
      slowCallsCount: q.slowCallsCount,
      tracesCount,
      nPlusOneTracesCount: q.nPlusOneTracesCount,
      isNPlusOne,
      isSlow,
      tables: q.tables,
      sampleTrace: q.sampleTrace,
    };
  });

  // Aggregate Table Impact Map
  const tableMap = new Map();
  queries.forEach((q) => {
    q.tables.forEach((tbl) => {
      if (!tableMap.has(tbl)) {
        tableMap.set(tbl, {
          tableName: tbl,
          totalHits: 0,
          totalDurationMs: 0,
          slowQueriesCount: 0,
          queriesCount: 0,
          queries: [],
        });
      }
      const t = tableMap.get(tbl);
      t.totalHits += q.calls;
      t.totalDurationMs += q.totalDurationMs;
      t.slowQueriesCount += q.slowCallsCount;
      t.queriesCount += 1;
      t.queries.push(q);
    });
  });

  const tables = Array.from(tableMap.values()).map((t) => ({
    ...t,
    totalDurationMs: Number(t.totalDurationMs.toFixed(1)),
    avgDurationMs: Number((t.totalDurationMs / Math.max(1, t.totalHits)).toFixed(1)),
  }));

  // Sort tables by totalHits desc
  tables.sort((a, b) => b.totalHits - a.totalHits);

  // Overall metrics
  allDurations.sort((a, b) => a - b);
  const p95Index = Math.min(Math.floor(allDurations.length * 0.95), allDurations.length - 1);
  const p95SqlDurationMs = allDurations[p95Index] || 0;
  const avgSqlDurationMs =
    totalQueriesCount > 0 ? Number((totalSqlDurationMs / totalQueriesCount).toFixed(1)) : 0;
  const nPlusOnePatternsCount = queries.filter((q) => q.isNPlusOne).length;

  return {
    queries,
    tables,
    metrics: {
      totalQueriesCount,
      totalSqlDurationMs: Number(totalSqlDurationMs.toFixed(1)),
      slowQueriesCount,
      avgSqlDurationMs,
      p95SqlDurationMs,
      distinctPatternsCount: queries.length,
      nPlusOnePatternsCount,
    },
  };
}
