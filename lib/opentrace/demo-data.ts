export interface DemoSpan {
  name: string
  kind: "middleware" | "app" | "db" | "http"
  start: number
  duration: number
}

export interface DemoQuery {
  query: string
  fingerprint: string
  duration: number
  rows?: number
  duplicateCount: number
  slow?: boolean
}

export interface DemoTrace {
  id: string
  method: string
  route: string
  status: number
  duration: number
  createdAt: string
  ageLabel: string
  sqlCount: number
  state: "success" | "error" | "slow"
  spans: DemoSpan[]
  queries: DemoQuery[]
  exception?: { name: string; message: string; signature: string }
}

const timestamp = (secondsAgo: number) => new Date(Date.now() - secondsAgo * 1000).toISOString()

export const demoTraces: DemoTrace[] = [
  {
    id: "tr_8b72f0e1a9", method: "GET", route: "/api/v1/orders/842", status: 200, duration: 86, createdAt: timestamp(4), ageLabel: "4s ago", sqlCount: 4, state: "success",
    spans: [
      { name: "HTTP request", kind: "middleware", start: 0, duration: 86 },
      { name: "Load order + customer", kind: "db", start: 12, duration: 68 },
      { name: "Serialize response", kind: "app", start: 80, duration: 6 },
    ],
    queries: [
      { query: "SELECT * FROM orders WHERE id = 842", fingerprint: "select * from orders where id = ?", duration: 41, rows: 1, duplicateCount: 1 },
      { query: "SELECT * FROM order_items WHERE order_id = 842", fingerprint: "select * from order_items where order_id = ?", duration: 18, rows: 3, duplicateCount: 1 },
      { query: "SELECT * FROM customers WHERE id = 51", fingerprint: "select * from customers where id = ?", duration: 9, rows: 1, duplicateCount: 1 },
    ],
  },
  {
    id: "tr_9ac401f7d2", method: "PATCH", route: "/api/v1/orders/842", status: 500, duration: 422, createdAt: timestamp(18), ageLabel: "18s ago", sqlCount: 3, state: "error",
    spans: [
      { name: "HTTP request", kind: "middleware", start: 0, duration: 422 },
      { name: "Update inventory", kind: "db", start: 22, duration: 301 },
      { name: "Commit transaction", kind: "db", start: 341, duration: 63 },
    ],
    queries: [
      { query: "UPDATE inventory SET reserved = reserved + 1 WHERE sku = 'AX-92'", fingerprint: "update inventory set reserved = reserved + ? where sku = ?", duration: 301, rows: 0, duplicateCount: 1, slow: true },
      { query: "SELECT quantity FROM inventory WHERE sku = 'AX-92'", fingerprint: "select quantity from inventory where sku = ?", duration: 32, rows: 1, duplicateCount: 1 },
    ],
    exception: { name: "ConflictError", message: "Inventory reservation version changed during commit", signature: "conflicterror: inventory reservation version changed during commit" },
  },
  {
    id: "tr_4f1d36a8c0", method: "GET", route: "/api/v1/inventory/sku-992", status: 200, duration: 38, createdAt: timestamp(31), ageLabel: "31s ago", sqlCount: 1, state: "success",
    spans: [
      { name: "HTTP request", kind: "middleware", start: 0, duration: 38 },
      { name: "Fetch inventory item", kind: "db", start: 4, duration: 27 },
      { name: "Application logic", kind: "app", start: 31, duration: 7 },
    ],
    queries: [{ query: "SELECT sku, quantity, warehouse_id FROM inventory WHERE sku = 'sku-992'", fingerprint: "select sku, quantity, warehouse_id from inventory where sku = ?", duration: 27, rows: 1, duplicateCount: 1 }],
  },
  {
    id: "tr_0de773b5a1", method: "GET", route: "/api/v1/orders", status: 200, duration: 2410, createdAt: timestamp(53), ageLabel: "53s ago", sqlCount: 24, state: "slow",
    spans: [
      { name: "HTTP request", kind: "middleware", start: 0, duration: 2410 },
      { name: "Load order list", kind: "db", start: 14, duration: 1926 },
      { name: "Render response", kind: "app", start: 1940, duration: 470 },
    ],
    queries: [
      { query: "SELECT * FROM orders WHERE status = 'open'", fingerprint: "select * from orders where status = ?", duration: 246, rows: 24, duplicateCount: 1 },
      { query: "SELECT * FROM customers WHERE id = 51", fingerprint: "select * from customers where id = ?", duration: 82, rows: 1, duplicateCount: 24, slow: true },
      { query: "SELECT * FROM customers WHERE id = 52", fingerprint: "select * from customers where id = ?", duration: 79, rows: 1, duplicateCount: 24 },
    ],
  },
  {
    id: "tr_b932aac4e8", method: "POST", route: "/api/v1/payment/authorize", status: 201, duration: 184, createdAt: timestamp(85), ageLabel: "1m ago", sqlCount: 2, state: "success",
    spans: [
      { name: "HTTP request", kind: "middleware", start: 0, duration: 184 },
      { name: "Insert payment intent", kind: "db", start: 9, duration: 17 },
      { name: "Payment gateway", kind: "http", start: 29, duration: 142 },
    ],
    queries: [{ query: "INSERT INTO payment_intents (order_id, state) VALUES (842, 'pending')", fingerprint: "insert into payment_intents (order_id, state) values (?, ?)", duration: 17, rows: 1, duplicateCount: 1 }],
  },
  {
    id: "tr_609c8f332e", method: "GET", route: "/api/v1/reports/daily", status: 200, duration: 1180, createdAt: timestamp(141), ageLabel: "2m ago", sqlCount: 6, state: "slow",
    spans: [
      { name: "HTTP request", kind: "middleware", start: 0, duration: 1180 },
      { name: "Aggregate daily metrics", kind: "db", start: 7, duration: 940 },
      { name: "Build CSV payload", kind: "app", start: 951, duration: 220 },
    ],
    queries: [{ query: "SELECT date(created_at), count(*) FROM orders GROUP BY 1", fingerprint: "select date(created_at), count(*) from orders group by ?", duration: 940, rows: 31, duplicateCount: 1, slow: true }],
  },
  {
    id: "tr_2bc03a7d14", method: "DELETE", route: "/api/v1/sessions/expired", status: 204, duration: 64, createdAt: timestamp(188), ageLabel: "3m ago", sqlCount: 1, state: "success",
    spans: [
      { name: "HTTP request", kind: "middleware", start: 0, duration: 64 },
      { name: "Delete expired sessions", kind: "db", start: 5, duration: 42 },
      { name: "Application logic", kind: "app", start: 47, duration: 17 },
    ],
    queries: [{ query: "DELETE FROM sessions WHERE expires_at < CURRENT_TIMESTAMP", fingerprint: "delete from sessions where expires_at < current_timestamp", duration: 42, rows: 12, duplicateCount: 1 }],
  },
]

export const latencySeries = [
  { label: "09:00", p50: 74, p95: 191, requests: 35 }, { label: "09:05", p50: 82, p95: 225, requests: 42 },
  { label: "09:10", p50: 67, p95: 187, requests: 31 }, { label: "09:15", p50: 93, p95: 284, requests: 50 },
  { label: "09:20", p50: 76, p95: 203, requests: 39 }, { label: "09:25", p50: 88, p95: 236, requests: 47 },
  { label: "09:30", p50: 71, p95: 198, requests: 34 }, { label: "09:35", p50: 81, p95: 218, requests: 43 },
  { label: "09:40", p50: 97, p95: 302, requests: 52 }, { label: "09:45", p50: 78, p95: 209, requests: 40 },
  { label: "09:50", p50: 69, p95: 183, requests: 32 }, { label: "09:55", p50: 85, p95: 229, requests: 44 },
]
