import type { DemoQuery, DemoTrace } from "./demo-data";

export type StatementType = "SELECT" | "INSERT" | "UPDATE" | "DELETE" | "OTHER";

export interface ExpandedSqlStatement extends DemoQuery {
  id: string;
  occurrence: number;
  isSlow: boolean;
  isDuplicate: boolean;
}

export interface AggregatedQuery {
  fingerprint: string;
  template: string;
  statementType: StatementType;
  totalCalls: number;
  totalDurationMs: number;
  avgLatencyMs: number;
  p95LatencyMs: number;
  impactPct: number;
  routes: string[];
  nPlusOneRoutes: string[];
  maxDuplicateCount: number;
  callSite: string;
  sampleQuery: string;
  sampleBindValues?: string[];
  slowCalls: number;
}

export interface ExplainPlanNode {
  label: string;
  detail: string;
  level: number;
  severity?: "warning";
}

const percentile = (values: number[], percentileValue: number) => {
  if (values.length === 0) return 0;
  const ordered = [...values].sort((left, right) => left - right);
  const index = Math.max(0, Math.ceil(percentileValue * ordered.length) - 1);
  return ordered[index];
};

export function getStatementType(sql: string): StatementType {
  const withoutComments = sql.replace(/^\s*(?:--[^\n]*\n\s*|\/\*[\s\S]*?\*\/\s*)+/g, "").trim();
  const firstKeyword = withoutComments.match(/^[a-z]+/i)?.[0]?.toUpperCase();
  if (firstKeyword === "WITH") {
    const mainCommand = withoutComments
      .match(/\b(SELECT|INSERT|UPDATE|DELETE)\b/gi)
      ?.at(-1)
      ?.toUpperCase();
    return mainCommand === "SELECT" ||
      mainCommand === "INSERT" ||
      mainCommand === "UPDATE" ||
      mainCommand === "DELETE"
      ? mainCommand
      : "OTHER";
  }
  return firstKeyword === "SELECT" ||
    firstKeyword === "INSERT" ||
    firstKeyword === "UPDATE" ||
    firstKeyword === "DELETE"
    ? firstKeyword
    : "OTHER";
}

export function getCallSite(trace: DemoTrace, query: DemoQuery) {
  if (query.callSite) return query.callSite;
  if (trace.service === "Inventory-Worker") return "src/repositories/inventory.repository.ts:88";
  if (trace.service === "Order-Service")
    return query.fingerprint.includes("customers")
      ? "src/repositories/customer.repository.ts:51"
      : "src/services/order.service.ts:142";
  if (trace.route.includes("reports")) return "src/services/report.service.ts:103";
  if (trace.route.includes("payment")) return "src/services/payment.service.ts:43";
  return "src/controllers/api.controller.ts:64";
}

export function expandTraceQueries(trace: DemoTrace): ExpandedSqlStatement[] {
  const statements: ExpandedSqlStatement[] = [];

  for (const query of trace.queries) {
    const occurrences = Math.max(1, Math.floor(query.duplicateCount || 1));
    for (let occurrence = 0; occurrence < occurrences; occurrence += 1) {
      statements.push({
        ...query,
        id: `${trace.id}:${query.fingerprint}:${occurrence}`,
        query: query.fingerprint || query.query,
        occurrence: occurrence + 1,
        isSlow: query.slowCount === undefined ? Boolean(query.slow) : occurrence < query.slowCount,
        isDuplicate: occurrences > 2,
      });
    }
  }

  return trace.sqlCount > 0 ? statements.slice(0, trace.sqlCount) : statements;
}

export function aggregateQueries(traces: DemoTrace[]): AggregatedQuery[] {
  const groups = new Map<
    string,
    {
      fingerprint: string;
      sampleQuery: string;
      sampleBindValues?: string[];
      statementType: StatementType;
      callSite: string;
      totalCalls: number;
      totalDurationMs: number;
      latencies: number[];
      routes: Set<string>;
      nPlusOneRoutes: Set<string>;
      maxDuplicateCount: number;
      slowCalls: number;
    }
  >();

  for (const trace of traces) {
    for (const query of trace.queries) {
      const fingerprint = query.fingerprint || query.query;
      const calls = Math.max(1, Math.floor(query.duplicateCount || 1));
      const group = groups.get(fingerprint) ?? {
        fingerprint,
        sampleQuery: query.query,
        sampleBindValues: query.sampleBindValues,
        statementType: getStatementType(fingerprint),
        callSite: getCallSite(trace, query),
        totalCalls: 0,
        totalDurationMs: 0,
        latencies: [],
        routes: new Set<string>(),
        nPlusOneRoutes: new Set<string>(),
        maxDuplicateCount: 0,
        slowCalls: 0,
      };
      if (!group.sampleBindValues && query.sampleBindValues)
        group.sampleBindValues = query.sampleBindValues;
      group.totalCalls += calls;
      group.totalDurationMs += query.duration * calls;
      group.routes.add(trace.route);
      group.maxDuplicateCount = Math.max(group.maxDuplicateCount, calls);
      if (calls > 2) group.nPlusOneRoutes.add(trace.route);
      group.slowCalls += query.slowCount ?? (query.slow ? calls : 0);
      for (let index = 0; index < calls; index += 1) group.latencies.push(query.duration);
      groups.set(fingerprint, group);
    }
  }

  const totalDatabaseTime = [...groups.values()].reduce(
    (total, group) => total + group.totalDurationMs,
    0
  );
  return [...groups.values()]
    .map((group) => ({
      fingerprint: group.fingerprint,
      template: group.fingerprint,
      statementType: group.statementType,
      totalCalls: group.totalCalls,
      totalDurationMs: group.totalDurationMs,
      avgLatencyMs: group.totalCalls > 0 ? group.totalDurationMs / group.totalCalls : 0,
      p95LatencyMs: percentile(group.latencies, 0.95),
      impactPct: totalDatabaseTime > 0 ? (group.totalDurationMs / totalDatabaseTime) * 100 : 0,
      routes: [...group.routes].sort(),
      nPlusOneRoutes: [...group.nPlusOneRoutes].sort(),
      maxDuplicateCount: group.maxDuplicateCount,
      callSite: group.callSite,
      sampleQuery: group.sampleQuery,
      sampleBindValues: group.sampleBindValues,
      slowCalls: group.slowCalls,
    }))
    .sort((left, right) => right.totalDurationMs - left.totalDurationMs);
}

export function formatSql(sql: string) {
  const protectedTokens: string[] = [];
  const protectedSql = sql.replace(
    /--[^\n]*(?:\n|$)|\/\*[\s\S]*?\*\/|'(?:''|\\.|[^'\\])*'|"(?:""|\\.|[^"\\])*"/g,
    (token) => `\u0000${protectedTokens.push(token) - 1}\u0000`
  );
  const formatted = protectedSql
    .replace(/\s+/g, " ")
    .trim()
    .replace(
      /\s+(FROM|WHERE|GROUP BY|HAVING|ORDER BY|LIMIT|RETURNING|VALUES|SET|LEFT JOIN|RIGHT JOIN|INNER JOIN|JOIN)\b/gi,
      "\n$1"
    )
    .replace(/\s+(AND|OR)\s+/gi, "\n  $1 ")
    .replace(/,\s*/g, ",\n  ");

  return formatted.replace(
    /\u0000(\d+)\u0000/g,
    (_match, index: string) => protectedTokens[Number(index)]
  );
}

export function buildExplainPlan(sql: string): ExplainPlanNode[] {
  const statementType = getStatementType(sql);
  const table =
    sql.match(/\b(?:from|update|into|join|delete\s+from)\s+([a-z_][a-z\d_]*)/i)?.[1] ?? "table";
  const hasJoin = /\bjoin\b/i.test(sql);
  const hasIndexPredicate =
    /\bwhere\b[\s\S]*\b(?:id|sku|trace_id|order_id|customer_id)\s*=\s*\?/i.test(sql);
  const needsFullScan = !hasIndexPredicate || /\bgroup by\b/i.test(sql);

  const plan: ExplainPlanNode[] = [
    { label: statementType, detail: "Estimated cost 0.00..120.00 · simulated planner", level: 0 },
  ];
  if (hasJoin) plan.push({ label: "Nested Loop", detail: "Estimated cost 3.20..64.80", level: 1 });
  plan.push(
    needsFullScan
      ? {
          label: `Seq Scan on ${table}`,
          detail: "Full table scan · candidate index missing",
          level: hasJoin ? 2 : 1,
          severity: "warning",
        }
      : {
          label: `Index Scan using idx_${table}_lookup`,
          detail: "Estimated cost 0.15..12.40",
          level: hasJoin ? 2 : 1,
        }
  );
  if (/\bgroup by\b/i.test(sql))
    plan.push({ label: "HashAggregate", detail: "Estimated cost 121.00..128.00", level: 1 });
  return plan;
}
