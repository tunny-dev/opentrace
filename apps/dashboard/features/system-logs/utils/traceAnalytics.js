/**
 * Normalizes SQL query string to extract a structural query fingerprint.
 * Replaces literals and numbers with '?' and collapses whitespace.
 */
export function getSqlFingerprint(sql) {
  if (!sql || typeof sql !== 'string') return '';
  return sql
    .replace(/\/\*[\s\S]*?\*\/|--.*$/gm, '') // Remove comments
    .replace(/'(?:''|[^'])*'/g, '?') // Replace string literals with ?
    .replace(/\b\d+\b/g, '?') // Replace numeric literals with ?
    .replace(/@\w+/g, '?') // Replace @param names with ?
    .replace(/\s+/g, ' ') // Collapse whitespace
    .trim()
    .toLowerCase();
}

/**
 * Full analysis of a trace:
 * - Latency breakdown: DB time vs App logic time
 * - N+1 / Duplicate query detection
 */
export function analyzeTrace(trace) {
  if (!trace) {
    return {
      totalDurationMs: 0,
      totalSqlMs: 0,
      appMs: 0,
      dbPercent: 0,
      appPercent: 100,
      sqlEvents: [],
      duplicateGroups: [],
      hasDuplicates: false,
      isNPlusOne: false,
      totalDuplicateQueries: 0,
      maxDuplicateCount: 0,
    };
  }

  const totalDurationMs = Number(trace.totalDurationMs) || 0;
  const events = Array.isArray(trace.events) ? trace.events : [];
  const sqlEvents = events.filter((e) => e.eventType === 'sql' || e.eventType === 'slow_sql');

  // Calculate total DB time
  const calculatedSqlMs = sqlEvents.reduce((acc, e) => acc + (Number(e.durationMs) || 0), 0);
  const totalSqlMs = Number(
    Math.max(Number(trace.totalSqlDurationMs) || 0, calculatedSqlMs).toFixed(1)
  );
  const appMs = Number(Math.max(0, totalDurationMs - totalSqlMs).toFixed(1));

  let dbPercent = 0;
  let appPercent = 100;
  if (totalDurationMs > 0) {
    dbPercent = Math.min(100, Math.round((totalSqlMs / totalDurationMs) * 100));
    appPercent = Math.max(0, 100 - dbPercent);
  }

  // Detect duplicate queries
  const fingerprintMap = new Map();
  sqlEvents.forEach((evt, originalIndex) => {
    const rawSql =
      evt.sql || (evt.message?.includes('| SQL:') ? evt.message.split('| SQL:')[1] : '');
    const fp = getSqlFingerprint(rawSql);
    if (!fp) return;

    if (!fingerprintMap.has(fp)) {
      fingerprintMap.set(fp, []);
    }
    fingerprintMap.get(fp).push({
      ...evt,
      originalIndex,
      sql: rawSql,
    });
  });

  const duplicateGroups = [];
  let totalDuplicateQueries = 0;
  let maxDuplicateCount = 0;

  for (const [fingerprint, queries] of fingerprintMap.entries()) {
    if (queries.length >= 2) {
      const groupDuration = queries.reduce((sum, q) => sum + (Number(q.durationMs) || 0), 0);
      duplicateGroups.push({
        fingerprint,
        count: queries.length,
        totalDurationMs: groupDuration,
        sampleSql: queries[0].sql,
        queries,
      });
      totalDuplicateQueries += queries.length;
      if (queries.length > maxDuplicateCount) {
        maxDuplicateCount = queries.length;
      }
    }
  }

  // Sort duplicate groups by count descending
  duplicateGroups.sort((a, b) => b.count - a.count);

  const hasDuplicates = duplicateGroups.length > 0;
  const isNPlusOne = duplicateGroups.some((g) => g.count >= 3);

  return {
    totalDurationMs,
    totalSqlMs,
    appMs,
    dbPercent,
    appPercent,
    sqlEvents,
    duplicateGroups,
    hasDuplicates,
    isNPlusOne,
    totalDuplicateQueries,
    maxDuplicateCount,
  };
}
