import { resolve } from "node:path"
import { Worker } from "node:worker_threads"
import type { StorageAdapter, TraceRecord } from "../types.ts"

type WorkerResult = { id: number; ok: true; value?: unknown } | { id: number; ok: false; error: string }
type PendingRequest = { resolve: (value: unknown) => void; reject: (error: Error) => void }

export interface SqliteStorageAdapterOptions {
  path: string
}

export class SqliteStorageAdapter implements StorageAdapter {
  private readonly worker: Worker
  private readonly ready: Promise<void>
  private readonly pending = new Map<number, PendingRequest>()
  private nextId = 0
  private closed = false
  private readyResolve!: () => void
  private readyReject!: (error: Error) => void

  constructor(options: SqliteStorageAdapterOptions) {
    this.ready = new Promise<void>((resolveReady, rejectReady) => {
      this.readyResolve = resolveReady
      this.readyReject = rejectReady
    })
    this.worker = new Worker(new URL("./sqlite-worker.mjs", import.meta.url), {
      workerData: { filename: resolve(options.path) },
    })
    this.worker.on("message", (message: WorkerResult | { id: 0; ok: true }) => {
      if (message.id === 0 && message.ok) {
        this.readyResolve()
        return
      }
      const request = this.pending.get(message.id)
      if (!request) return
      this.pending.delete(message.id)
      if (message.ok) request.resolve("value" in message ? message.value : undefined)
      else request.reject(new Error(message.error))
    })
    this.worker.on("error", (error) => {
      this.readyReject(error)
      this.rejectPending(error)
    })
    this.worker.on("exit", (code) => {
      if (code !== 0) {
        const error = new Error(`OpenTrace SQLite worker exited with code ${code}`)
        this.readyReject(error)
        this.rejectPending(error)
      }
    })
  }

  async insertBatch(records: readonly TraceRecord[]) {
    if (records.length === 0) return
    await this.request("insert", records)
  }

  async pruneBefore(isoTimestamp: string) {
    return (await this.request("prune", isoTimestamp)) as number
  }

  async listRecent(limit = 100) {
    return (await this.request("list", Math.max(1, Math.min(500, Math.floor(limit))))) as TraceRecord[]
  }

  async close() {
    if (this.closed) return
    this.closed = true
    try {
      await this.request("close")
    } finally {
      await this.worker.terminate()
    }
  }

  private request(type: string, payload?: unknown): Promise<unknown> {
    if (this.closed && type !== "close") return Promise.reject(new Error("SQLite adapter is closed"))
    const id = ++this.nextId
    return new Promise((resolveRequest, rejectRequest) => {
      this.pending.set(id, { resolve: resolveRequest, reject: rejectRequest })
      this.ready
        .then(() => this.worker.postMessage({ id, type, payload }))
        .catch((error: unknown) => {
          this.pending.delete(id)
          rejectRequest(error instanceof Error ? error : new Error(String(error)))
        })
    })
  }

  private rejectPending(error: Error) {
    for (const request of this.pending.values()) request.reject(error)
    this.pending.clear()
  }
}
