import type {
  BatchWriterOptions,
  BatchWriterStats,
  StorageAdapter,
  TracePriority,
  TraceRecord,
} from "./types.ts"

type Log = (message: string, error?: unknown) => void

class RingQueue<T> {
  private readonly slots: Array<T | undefined>
  readonly capacity: number
  private readonly getPriority: (item: T) => TracePriority
  private head = 0
  private size = 0

  constructor(capacity: number, getPriority: (item: T) => TracePriority) {
    this.capacity = capacity
    this.getPriority = getPriority
    this.slots = new Array<T | undefined>(capacity)
  }

  get length() {
    return this.size
  }

  push(item: T) {
    this.slots[(this.head + this.size) % this.capacity] = item
    this.size += 1
  }

  shift() {
    if (this.size === 0) return undefined
    const item = this.slots[this.head]
    this.slots[this.head] = undefined
    this.head = (this.head + 1) % this.capacity
    this.size -= 1
    return item
  }

  removeOldestNormal() {
    let offset = 0
    while (offset < this.size) {
      const index = (this.head + offset) % this.capacity
      const item = this.slots[index]
      if (item && this.getPriority(item) === "normal") {
        for (let cursor = offset; cursor < this.size - 1; cursor += 1) {
          const from = (this.head + cursor + 1) % this.capacity
          const to = (this.head + cursor) % this.capacity
          this.slots[to] = this.slots[from]
        }
        const tail = (this.head + this.size - 1) % this.capacity
        this.slots[tail] = undefined
        this.size -= 1
        return true
      }
      offset += 1
    }
    return false
  }

  take(count: number) {
    const batch: T[] = []
    while (batch.length < count && this.size > 0) {
      const item = this.shift()
      if (item !== undefined) batch.push(item)
    }
    return batch
  }
}

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

export class BatchWriter {
  private readonly queue: RingQueue<TraceRecord>
  private readonly storage: StorageAdapter
  private readonly options: BatchWriterOptions
  private readonly log: Log
  private interval: ReturnType<typeof setInterval> | undefined
  private scheduledFlush: ReturnType<typeof setTimeout> | undefined
  private inFlight: Promise<void> | undefined
  private closing = false
  private closed = false
  private readonly stats: BatchWriterStats = {
    buffered: 0,
    written: 0,
    dropped: 0,
    writeFailures: 0,
    flushes: 0,
  }

  constructor(
    storage: StorageAdapter,
    options: BatchWriterOptions,
    log: Log = (message, error) => console.warn(message, error),
  ) {
    if (!Number.isInteger(options.batchSize) || options.batchSize < 1) throw new RangeError("batchSize must be a positive integer")
    if (!Number.isInteger(options.maxBufferSize) || options.maxBufferSize < 1) throw new RangeError("maxBufferSize must be a positive integer")
    if (!Number.isFinite(options.flushIntervalMs) || options.flushIntervalMs < 1) throw new RangeError("flushIntervalMs must be positive")
    if (!Number.isInteger(options.maxRetries) || options.maxRetries < 0) throw new RangeError("maxRetries must be a non-negative integer")
    this.storage = storage
    this.options = options
    this.log = log
    this.queue = new RingQueue(options.maxBufferSize, (record) => record.priority)
    this.interval = setInterval(() => void this.flush(true), options.flushIntervalMs)
    this.interval.unref?.()
  }

  enqueue(record: TraceRecord) {
    if (this.closing || this.closed) {
      this.stats.dropped += 1
      return false
    }

    if (this.queue.length === this.options.maxBufferSize) {
      if (record.priority !== "critical" || !this.queue.removeOldestNormal()) {
        this.stats.dropped += 1
        this.stats.buffered = this.queue.length
        return false
      }
      this.stats.dropped += 1
    }

    this.queue.push(record)
    this.stats.buffered = this.queue.length

    if (this.queue.length >= this.options.batchSize && !this.scheduledFlush) {
      this.scheduledFlush = setTimeout(() => {
        this.scheduledFlush = undefined
        void this.flush(true)
      }, 0)
      this.scheduledFlush.unref?.()
    }
    return true
  }

  getStats(): BatchWriterStats {
    return { ...this.stats, buffered: this.queue.length }
  }

  async flush(force = false) {
    if (this.inFlight) {
      await this.inFlight
      if (force && this.queue.length > 0) await this.flush(true)
      return
    }

    const run = this.writeAvailable(force)
    this.inFlight = run
    try {
      await run
    } finally {
      this.inFlight = undefined
    }
    if (force && this.queue.length > 0) await this.flush(true)
  }

  async close() {
    if (this.closed) return
    this.closing = true
    if (this.interval) clearInterval(this.interval)
    if (this.scheduledFlush) clearTimeout(this.scheduledFlush)
    this.interval = undefined
    this.scheduledFlush = undefined
    await this.flush(true)
    this.closed = true
  }

  private async writeAvailable(force: boolean) {
    while (this.queue.length >= this.options.batchSize || (force && this.queue.length > 0)) {
      const records = this.queue.take(this.options.batchSize)
      this.stats.buffered = this.queue.length
      if (records.length === 0) break

      let succeeded = false
      for (let attempt = 0; attempt <= this.options.maxRetries; attempt += 1) {
        try {
          await this.storage.insertBatch(records)
          this.stats.written += records.length
          this.stats.flushes += 1
          succeeded = true
          break
        } catch (error) {
          this.stats.writeFailures += 1
          if (attempt < this.options.maxRetries) {
            await sleep(Math.min(100 * 2 ** attempt, 1000))
          } else {
            this.stats.dropped += records.length
            this.log(`OpenTrace dropped ${records.length} records after ${attempt + 1} failed batch writes.`, error)
          }
        }
      }

      if (!succeeded) continue
    }
  }
}
