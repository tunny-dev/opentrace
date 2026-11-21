import assert from "node:assert/strict"
import { mkdtemp, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { BatchWriter, fingerprintSql, SqliteStorageAdapter } from "opentrace"
import type { StorageAdapter, TraceRecord } from "opentrace"

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

  const directory = await mkdtemp(join(tmpdir(), "opentrace-smoke-"))
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

  console.log("OpenTrace smoke tests passed: SQL fingerprints, priority backpressure, SQLite batch insert, read, and retention.")
}

void main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
