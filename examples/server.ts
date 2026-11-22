import express from "express"
import { createOpenTrace, SqliteStorageAdapter } from "opentrace"

const app = express()
const port = Number(process.env.OPENTRACE_DEMO_PORT ?? 4175)
const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const trace = createOpenTrace({
  appName: "MES-Production",
  storage: new SqliteStorageAdapter({ path: "./opentrace.sqlite" }),
  batchSize: 200,
  flushIntervalMs: 2000,
  maxBufferSize: 10_000,
  sampleRateSuccess: 0.1,
  retentionDays: 7,
  slowQueryThresholdMs: 300,
  slowRequestThresholdMs: 500,
  auth: {
    enabled: process.env.OPENTRACE_USER !== undefined,
    users: process.env.OPENTRACE_USER && process.env.OPENTRACE_PASSWORD
      ? [{ username: process.env.OPENTRACE_USER, password: process.env.OPENTRACE_PASSWORD }]
      : undefined,
  },
})

app.use(trace.httpMiddleware())
app.get("/api/orders/:id", async (request, response, next) => {
  try {
    const id = Number(request.params.id)
    await trace.runSql(
      "SELECT * FROM orders WHERE customer_id = 42 AND state = 'ready'",
      async () => {
        await pause(id % 5 === 0 ? 18 : 5)
        return []
      },
      (rows) => rows.length,
    )
    if (id === 99) await pause(550)
    if (id > 0 && id % 11 === 0) throw new Error(`Demo order ${id} failed validation`)
    response.json({ id, status: "ready" })
  } catch (error) {
    next(error)
  }
})
app.use("/_telemetry", trace.dashboardMiddleware())
app.use("/_next", trace.dashboardMiddleware())
app.use(trace.errorMiddleware())
app.use((error: unknown, _request: express.Request, response: express.Response, _next: express.NextFunction) => {
  response.status(500).json({ error: error instanceof Error ? error.message : "Request failed" })
})

const server = app.listen(port, async () => {
  console.log(`SpurTrace demo listening on http://localhost:${port}`)
  console.log(`Embedded dashboard: http://localhost:${port}/_telemetry/`)
  const startedAt = performance.now()
  const results = await Promise.allSettled(
    Array.from({ length: 100 }, (_, index) => fetch(`http://localhost:${port}/api/orders/${index + 1}`)),
  )
  await trace.flush()
  const elapsedMs = performance.now() - startedAt
  console.log(`Generated ${results.length} requests in ${elapsedMs.toFixed(1)} ms`)
  console.log("Batch writer:", trace.getStats())
  console.log("Open the dashboard to inspect sampled, slow, and failed requests.")
})

async function shutdown() {
  server.close()
  await trace.close()
  process.exit(0)
}

process.once("SIGINT", () => void shutdown())
process.once("SIGTERM", () => void shutdown())
