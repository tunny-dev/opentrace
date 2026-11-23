import assert from "node:assert/strict"
import { mkdtemp, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { BatchWriter, fingerprintSql, SqliteStorageAdapter } from "spurtrace"
import type { StorageAdapter, TraceRecord } from "spurtrace"
import { aggregateQueries, expandTraceQueries, formatSql, getStatementType } from "../apps/dashboard/lib/spurtrace/sql-analytics.ts"
import { demoTraces } from "../apps/dashboard/lib/spurtrace/demo-data.ts"

function traceRecord(traceId: string, priority: TraceRecord["priority"] = "normal"): TraceRecord {
  return {
    traceId,
    appName: "smoke-test",
    method: "GET",
    route: "/test",
    statusCode: priority === "critical" ? 500 : 200,
    durationMs: 12,
    createdAt: new Date().toISOString(),
    priority,
    sampleReason: priority === "critical" ? "error" : "sampled",
    spans: [],
    sqlCalls: [],
    breadcrumbs: [],
  }
}

async function main() {
  assert.equal(
    fingerprintSql("SELECT * FROM orders WHERE id = 42 AND state = 'ready'"),
    fingerprintSql("select * from orders where id = 8 and state = 'closed'"),
    "literal values should not change a SQL fingerprint",
  )
  assert.equal(
    fingerprintSql("SELECT * FROM orders WHERE id IN (1, 2, 3)"),
    fingerprintSql("SELECT * FROM orders WHERE id IN (4, 5)"),
    "IN-list values should normalize to a stable fingerprint",
  )

  assert.equal(getStatementType("UPDATE inventory SET quantity = ?"), "UPDATE")
  assert.equal(getStatementType("INSERT INTO orders (id) VALUES (?)"), "INSERT")
  assert.equal(getStatementType("DELETE FROM sessions WHERE id = ?"), "DELETE")
  assert.ok(formatSql("SELECT id FROM orders WHERE state = ? AND total > ?").includes("\nFROM"))
  assert.ok(formatSql("SELECT 'FROM, AND' AS label FROM orders WHERE id = ?").includes("'FROM, AND'"))

  const nPlusOneTrace = demoTraces.find((trace) => trace.id === "tr_0de773b5a1")
  assert.ok(nPlusOneTrace)
  const expandedStatements = expandTraceQueries(nPlusOneTrace)
  assert.equal(expandedStatements.length, 24)
  assert.equal(expandedStatements.filter((statement) => statement.isSlow).length, 3)
  assert.equal(expandedStatements.filter((statement) => statement.isDuplicate).length, 22)
  const customerQuery = aggregateQueries(demoTraces).find((query) => query.fingerprint === "select * from customers where id = ?")
  assert.ok(customerQuery)
  assert.equal(customerQuery.nPlusOneRoutes.includes("/api/v1/orders"), true)
  assert.equal(customerQuery.maxDuplicateCount, 22)

  const written: TraceRecord[] = []
  const fakeStorage: StorageAdapter = {
    async insertBatch(records) { written.push(...records) },
    async pruneBefore() { return 0 },
  }
  const writer = new BatchWriter(fakeStorage, {
    batchSize: 2,
    flushIntervalMs: 60_000,
    maxBufferSize: 2,
    maxRetries: 0,
  })
  assert.equal(writer.enqueue(traceRecord("normal-1")), true)
  assert.equal(writer.enqueue(traceRecord("normal-2")), true)
  assert.equal(writer.enqueue(traceRecord("critical-1", "critical")), true)
  await writer.flush(true)
  assert.deepEqual(written.map((record) => record.traceId), ["normal-2", "critical-1"])
  assert.equal(writer.getStats().dropped, 1, "critical ingress should evict one normal trace")
  await writer.close()

  const directory = await mkdtemp(join(tmpdir(), "spurtrace-smoke-"))
  const sqlite = new SqliteStorageAdapter({ path: join(directory, "traces.sqlite") })
  try {
    await sqlite.insertBatch([traceRecord("sqlite-1", "critical")])
    const recent = await sqlite.listRecent(10)
    assert.equal(recent.length, 1)
    assert.equal(recent[0].traceId, "sqlite-1")
    assert.equal(await sqlite.pruneBefore(new Date(Date.now() + 1000).toISOString()), 1)
    assert.equal((await sqlite.listRecent(10)).length, 0)
  } finally {
    await sqlite.close()
    await rm(directory, { recursive: true, force: true })
  }

  console.log("SpurTrace smoke tests passed: SQL fingerprints, priority backpressure, SQLite batch insert, read, and retention.")
}

void main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
