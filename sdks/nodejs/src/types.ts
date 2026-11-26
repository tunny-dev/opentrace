export type TracePriority = "normal" | "critical"
export type SpanKind = "middleware" | "app" | "db" | "http" | "cache"

export interface TraceSpan {
  id: string
  name: string
  kind: SpanKind
  startOffsetMs: number
  durationMs: number
  tags?: Record<string, string | number | boolean>
}

export interface SqlCall {
  fingerprint: string
  query: string
  durationMs: number
  isSlow: boolean
  duplicateCount: number
  rows?: number
}

export interface TraceException {
  name: string
  message: string
  signature: string
}

export interface Breadcrumb {
  atMs: number
  category: string
  message: string
  level: "info" | "warning" | "error"
}

export interface TraceRecord {
  traceId: string
  appName: string
  method: string
  route: string
  statusCode: number
  durationMs: number
  createdAt: string
  priority: TracePriority
  sampleReason: "error" | "slow" | "sampled"
  spans: TraceSpan[]
  sqlCalls: SqlCall[]
  breadcrumbs: Breadcrumb[]
  exception?: TraceException
}

export interface StorageAdapter {
  insertBatch(records: readonly TraceRecord[]): Promise<void>
  pruneBefore(isoTimestamp: string): Promise<number>
  listRecent?(limit?: number): Promise<TraceRecord[]>
  close?(): Promise<void>
}

export interface BatchWriterOptions {
  batchSize: number
  flushIntervalMs: number
  maxBufferSize: number
  maxRetries: number
}

export interface BatchWriterStats {
  buffered: number
  written: number
  dropped: number
  writeFailures: number
  flushes: number
}
