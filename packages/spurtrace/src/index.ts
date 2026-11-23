import { AsyncLocalStorage } from "node:async_hooks"
import { createHash, randomUUID, timingSafeEqual } from "node:crypto"
import { existsSync, readFileSync, statSync } from "node:fs"
import { dirname, extname, join, resolve } from "node:path"
import { performance } from "node:perf_hooks"
import { fileURLToPath } from "node:url"
import { BatchWriter } from "./batch-writer.ts"
import { EMBEDDED_DASHBOARD_HTML } from "./dashboard/embedded-ui.ts"
import { fingerprintError, fingerprintSql } from "./sql-fingerprint.ts"
import type { Breadcrumb, SpanKind, StorageAdapter, TraceException, TraceRecord, TraceSpan } from "./types.ts"

const MIME_MAP: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".txt": "text/plain; charset=utf-8",
}

interface HttpRequest {
  method?: string
  path?: string
  url?: string
  baseUrl?: string
  route?: { path?: string | string[] }
  headers?: Record<string, string | string[] | undefined>
}

interface HttpResponse {
  statusCode: number
  once(event: "finish" | "close", listener: () => void): this
  setHeader(name: string, value: string): this
  end(body?: string | Uint8Array): this
}

type Next = (error?: unknown) => void
type HttpMiddleware = (request: HttpRequest, response: HttpResponse, next: Next) => void
type ErrorMiddleware = (error: unknown, request: HttpRequest, response: HttpResponse, next: Next) => void

export interface SpurTraceOptions {
  appName: string
  storage: StorageAdapter
  batchSize?: number
  flushIntervalMs?: number
  maxBufferSize?: number
  maxRetries?: number
  sampleRateSuccess?: number
  slowRequestThresholdMs?: number
  slowQueryThresholdMs?: number
  retentionDays?: number
  ignoreRoutes?: RegExp[]
  dashboardUiPath?: string
  auth?: { enabled?: boolean; users?: Array<{ username: string; password: string }> }
  logger?: (message: string, error?: unknown) => void
}

export type OpenTraceOptions = SpurTraceOptions

interface SqlContext {
  traceId: string
  startedAt: number
  spans: TraceSpan[]
  sqlCalls: TraceRecord["sqlCalls"]
  breadcrumbs: Breadcrumb[]
  exception?: TraceException
  hasSlowSql: boolean
}

const DEFAULT_IGNORED_ROUTES = [
  /^\/(?:ping|health|healthz|readyz)\/?$/i,
  /\.(?:ico|png|jpe?g|gif|svg|css|js|map|woff2?|ttf|webp|avif)$/i,
  /^\/(?:assets|_next|static)\//i,
]

function safeMessage(error: unknown) {
  if (error instanceof Error) return { name: error.name, message: error.message.slice(0, 300) }
  return { name: "Error", message: String(error).slice(0, 300) }
}

function matchesBasicAuth(request: HttpRequest, users: Array<{ username: string; password: string }>) {
  const header = request.headers?.authorization
  if (typeof header !== "string" || !header.startsWith("Basic ")) return false
  let credentials: string
  try {
    credentials = Buffer.from(header.slice(6), "base64").toString("utf8")
  } catch {
    return false
  }
  const separator = credentials.indexOf(":")
  if (separator < 0) return false
  const username = credentials.slice(0, separator)
  const password = credentials.slice(separator + 1)
  const digest = (value: string) => createHash("sha256").update(value).digest()
  const suppliedUser = digest(username)
  const suppliedPassword = digest(password)
  return users.some((user) =>
    timingSafeEqual(suppliedUser, digest(user.username)) &&
    timingSafeEqual(suppliedPassword, digest(user.password)),
  )
}

function requestPath(request: HttpRequest) {
  const path = request.path ?? request.url ?? "/"
  return path.split("?", 1)[0] || "/"
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character]!)
}

export class SpurTrace {
  private readonly context = new AsyncLocalStorage<SqlContext>()
  private readonly writer: BatchWriter
  private readonly options: Required<Pick<SpurTraceOptions,
    "sampleRateSuccess" | "slowRequestThresholdMs" | "slowQueryThresholdMs" | "retentionDays"
  >> & SpurTraceOptions
  private retentionTimer: ReturnType<typeof setTimeout> | undefined
  private closed = false

  constructor(options: SpurTraceOptions) {
    if (!options.appName.trim()) throw new Error("SpurTrace requires a non-empty appName")
    const sampleRate = options.sampleRateSuccess ?? 0.1
    if (!Number.isFinite(sampleRate) || sampleRate < 0 || sampleRate > 1) throw new RangeError("sampleRateSuccess must be between 0 and 1")
    if (options.auth?.enabled && !options.auth.users?.length) {
      throw new Error("At least one dashboard auth user is required when auth is enabled")
    }
    const slowRequestThresholdMs = options.slowRequestThresholdMs ?? 500
    const slowQueryThresholdMs = options.slowQueryThresholdMs ?? 300
    const retentionDays = options.retentionDays ?? 7
    if (!Number.isFinite(slowRequestThresholdMs) || slowRequestThresholdMs < 0) throw new RangeError("slowRequestThresholdMs must be non-negative")
    if (!Number.isFinite(slowQueryThresholdMs) || slowQueryThresholdMs < 0) throw new RangeError("slowQueryThresholdMs must be non-negative")
    if (!Number.isFinite(retentionDays) || retentionDays <= 0) throw new RangeError("retentionDays must be positive")
    this.options = {
      ...options,
      sampleRateSuccess: sampleRate,
      slowRequestThresholdMs,
      slowQueryThresholdMs,
      retentionDays,
    }
    this.writer = new BatchWriter(options.storage, {
      batchSize: options.batchSize ?? 500,
      flushIntervalMs: options.flushIntervalMs ?? 1500,
      maxBufferSize: options.maxBufferSize ?? 10_000,
      maxRetries: options.maxRetries ?? 2,
    }, options.logger)
    this.scheduleRetention()
  }

  httpMiddleware(): HttpMiddleware {
    return (request, response, next) => {
      const path = requestPath(request)
      const ignored = [...DEFAULT_IGNORED_ROUTES, ...(this.options.ignoreRoutes ?? [])]
        .some((pattern) => pattern.test(path))
      if (ignored || this.closed) {
        next()
        return
      }

      const startedAt = performance.now()
      const context: SqlContext = {
        traceId: randomUUID(),
        startedAt,
        spans: [],
        sqlCalls: [],
        breadcrumbs: [{ atMs: 0, category: "http", message: "Request started", level: "info" }],
        hasSlowSql: false,
      }
      let finalized = false
      const finalize = () => {
        if (finalized) return
        finalized = true
        const durationMs = Math.max(0, performance.now() - startedAt)
        const statusCode = response.statusCode || 200
        const failed = statusCode >= 500 || Boolean(context.exception)
        const slow = durationMs >= this.options.slowRequestThresholdMs || context.hasSlowSql
        if (!failed && !slow && Math.random() >= this.options.sampleRateSuccess) return

        const duplicateCounts = new Map<string, number>()
        for (const call of context.sqlCalls) {
          duplicateCounts.set(call.fingerprint, (duplicateCounts.get(call.fingerprint) ?? 0) + 1)
        }
        for (const call of context.sqlCalls) call.duplicateCount = duplicateCounts.get(call.fingerprint) ?? 1

        const route = typeof request.route?.path === "string"
          ? `${request.baseUrl ?? ""}${request.route.path}`
          : path
        context.spans.unshift({
          id: randomUUID(),
          name: `${request.method ?? "GET"} ${route}`,
          kind: "middleware",
          startOffsetMs: 0,
          durationMs,
          tags: { statusCode },
        })
        const externalAndDb = context.spans
          .filter((span) => span.kind === "db" || span.kind === "http")
          .reduce((total, span) => total + span.durationMs, 0)
        context.spans.push({
          id: randomUUID(),
          name: "Application logic",
          kind: "app",
          startOffsetMs: 0,
          durationMs: Math.max(0, durationMs - externalAndDb),
        })
        context.breadcrumbs.push({
          atMs: durationMs,
          category: "http",
          message: `Response finished with ${statusCode}`,
          level: failed ? "error" : slow ? "warning" : "info",
        })

        const record: TraceRecord = {
          traceId: context.traceId,
          appName: this.options.appName,
          method: request.method ?? "GET",
          route,
          statusCode,
          durationMs,
          createdAt: new Date().toISOString(),
          priority: failed || slow ? "critical" : "normal",
          sampleReason: failed ? "error" : slow ? "slow" : "sampled",
          spans: context.spans,
          sqlCalls: context.sqlCalls,
          breadcrumbs: context.breadcrumbs,
          exception: context.exception,
        }
        this.writer.enqueue(record)
      }

      response.once("finish", finalize)
      response.once("close", finalize)
      this.context.run(context, () => next())
    }
  }

  errorMiddleware(): ErrorMiddleware {
    return (error, _request, _response, next) => {
      this.captureException(error)
      next(error)
    }
  }

  dashboardMiddleware(): HttpMiddleware {
    return async (request, response, next) => {
      const users = this.options.auth?.users ?? []
      if (this.options.auth?.enabled && !matchesBasicAuth(request, users)) {
        response.statusCode = 401
        response.setHeader("WWW-Authenticate", 'Basic realm="SpurTrace", charset="UTF-8"')
        response.setHeader("Cache-Control", "no-store")
        response.end("Authentication required")
        return
      }

      const path = requestPath(request)
      if ((request.method ?? "GET").toUpperCase() === "GET" && path.replace(/\/$/, "") === "/api/traces") {
        try {
          const traces = await this.options.storage.listRecent?.(100) ?? []
          response.statusCode = 200
          response.setHeader("Content-Type", "application/json; charset=utf-8")
          response.setHeader("Cache-Control", "no-store")
          response.setHeader("X-Content-Type-Options", "nosniff")
          response.end(JSON.stringify({ traces, sampleRateSuccess: this.options.sampleRateSuccess }).replace(/</g, "\\u003c"))
        } catch (error) {
          this.options.logger?.("SpurTrace dashboard query failed.", error)
          response.statusCode = 503
          response.setHeader("Content-Type", "application/json; charset=utf-8")
          response.end(JSON.stringify({ error: "Trace storage is unavailable" }))
        }
        return
      }
      if ((request.method ?? "GET").toUpperCase() !== "GET") {
        next()
        return
      }

      // 1. Serve packaged Next.js static UI if present
      const candidates = [
        this.options.dashboardUiPath,
        resolve(dirname(fileURLToPath(import.meta.url)), "dashboard-ui"),
        resolve(dirname(fileURLToPath(import.meta.url)), "../dist/dashboard-ui"),
        resolve(process.cwd(), "packages/spurtrace/dist/dashboard-ui"),
        resolve(process.cwd(), "out"),
      ].filter((dir): dir is string => Boolean(dir && existsSync(dir)))

      const uiDir = candidates[0]
      if (uiDir) {
        let relative = path.replace(/^\/?(?:_telemetry\/?)?/, "").replace(/\/$/, "")
        if (!relative || relative === "index.html") relative = "index.html"

        const isRsc = request.headers?.["rsc"] === "1" || (request.url || "").includes("_rsc=")
        let filePath = join(uiDir, relative)
        if (isRsc && existsSync(filePath + ".txt")) {
          filePath = filePath + ".txt"
        } else if (existsSync(filePath + ".html")) {
          filePath = filePath + ".html"
        } else if (existsSync(join(filePath, "index.html"))) {
          filePath = join(filePath, "index.html")
        }

        if (existsSync(filePath) && statSync(filePath).isFile()) {
          const ext = extname(filePath).toLowerCase()
          let contentType = MIME_MAP[ext] ?? "application/octet-stream"
          if (ext === ".txt") {
            contentType = "text/x-component; charset=utf-8"
          }
          response.statusCode = 200
          response.setHeader("Content-Type", contentType)
          if (ext === ".html") {
            response.setHeader("Cache-Control", "no-cache")
          } else {
            response.setHeader("Cache-Control", "public, max-age=31536000, immutable")
          }
          response.end(readFileSync(filePath))
          return
        }

        // Fallback for SPA routing without extension
        if (!extname(path) && existsSync(join(uiDir, "index.html"))) {
          response.statusCode = 200
          response.setHeader("Content-Type", "text/html; charset=utf-8")
          response.setHeader("Cache-Control", "no-cache")
          response.end(readFileSync(join(uiDir, "index.html")))
          return
        }
      }

      // 2. Embedded mini UI fallback
      if (path !== "/" && path !== "/index.html") {
        next()
        return
      }
      response.statusCode = 200
      response.setHeader("Content-Type", "text/html; charset=utf-8")
      response.setHeader("Cache-Control", "no-store")
      response.setHeader("X-Content-Type-Options", "nosniff")
      response.setHeader("Referrer-Policy", "no-referrer")
      response.end(EMBEDDED_DASHBOARD_HTML)
    }
  }

  recordSpan(name: string, kind: SpanKind, durationMs: number, tags?: TraceSpan["tags"]) {
    const context = this.context.getStore()
    if (!context || context.spans.length >= 256) return
    const safeDuration = Math.max(0, durationMs)
    context.spans.push({
      id: randomUUID(), name, kind,
      startOffsetMs: Math.max(0, performance.now() - context.startedAt - safeDuration),
      durationMs: safeDuration,
      tags,
    })
  }

  recordSql(query: string, durationMs: number, rows?: number) {
    const context = this.context.getStore()
    if (!context) return
    const fingerprint = fingerprintSql(query)
    const isSlow = durationMs >= this.options.slowQueryThresholdMs
    if (isSlow) context.hasSlowSql = true
    if (context.sqlCalls.length < 200) {
      context.sqlCalls.push({ fingerprint, query: fingerprint.slice(0, 2000), durationMs: Math.max(0, durationMs), isSlow, duplicateCount: 1, rows })
    }
    this.recordSpan("SQL query", "db", durationMs, { fingerprint, slow: isSlow })
    if (context.breadcrumbs.length < 64) {
      context.breadcrumbs.push({
        atMs: Math.max(0, performance.now() - context.startedAt),
        category: "db",
        message: isSlow ? `Slow SQL · ${fingerprint}` : `SQL · ${fingerprint}`,
        level: isSlow ? "warning" : "info",
      })
    }
  }

  async runSql<T>(query: string, operation: () => Promise<T>, rows?: (result: T) => number): Promise<T> {
    const startedAt = performance.now()
    try {
      const result = await operation()
      this.recordSql(query, performance.now() - startedAt, rows?.(result))
      return result
    } catch (error) {
      this.recordSql(query, performance.now() - startedAt)
      this.captureException(error)
      throw error
    }
  }

  captureException(error: unknown) {
    const context = this.context.getStore()
    if (!context) return
    const { name, message } = safeMessage(error)
    context.exception = { name, message, signature: fingerprintError(name, message) }
    if (context.breadcrumbs.length < 64) {
      context.breadcrumbs.push({
        atMs: Math.max(0, performance.now() - context.startedAt),
        category: "exception",
        message: `${name}: ${message}`,
        level: "error",
      })
    }
  }

  getStats() {
    return this.writer.getStats()
  }

  async flush() {
    await this.writer.flush(true)
  }

  async close() {
    if (this.closed) return
    this.closed = true
    if (this.retentionTimer) clearTimeout(this.retentionTimer)
    await this.writer.close()
    await this.options.storage.close?.()
  }

  private scheduleRetention() {
    const runAtMidnight = () => {
      const now = new Date()
      const tomorrow = new Date(now)
      tomorrow.setHours(24, 0, 0, 0)
      this.retentionTimer = setTimeout(async () => {
        try {
          const cutoff = new Date(Date.now() - this.options.retentionDays * 86_400_000).toISOString()
          await this.options.storage.pruneBefore(cutoff)
        } catch (error) {
          this.options.logger?.("SpurTrace retention cleanup failed.", error)
        } finally {
          if (!this.closed) runAtMidnight()
        }
      }, tomorrow.getTime() - now.getTime())
      this.retentionTimer.unref?.()
    }
    runAtMidnight()
  }
}

export function createSpurTrace(options: SpurTraceOptions) {
  return new SpurTrace(options)
}

export const createOpenTrace = createSpurTrace
export { SpurTrace as OpenTrace }

export { BatchWriter, fingerprintError, fingerprintSql }
export { SqliteStorageAdapter } from "./storage/sqlite-adapter.ts"
export type { StorageAdapter, TraceRecord, TraceSpan, SqlCall, Breadcrumb, SpanKind, BatchWriterStats } from "./types.ts"
