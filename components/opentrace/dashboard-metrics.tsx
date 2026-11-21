import { Activity, ArrowDownRight, ArrowUpRight, Clock3, Database, Gauge, TriangleAlert } from "lucide-react"

const metrics = [
  { label: "REQUESTS", value: "12.8k", change: "+12.4%", direction: "up", icon: Gauge, description: "vs. previous hour", good: false },
  { label: "ERROR RATE", value: "0.08%", change: "−0.12%", direction: "down", icon: TriangleAlert, description: "vs. previous hour", good: true },
  { label: "P95 LATENCY", value: "226 ms", change: "+2.1%", direction: "up", icon: Clock3, description: "vs. previous hour", good: false },
  { label: "P99 LATENCY", value: "408 ms", change: "+1.6%", direction: "up", icon: Activity, description: "vs. previous hour", good: false },
  { label: "DB TIME", value: "68.4%", change: "−4.8%", direction: "down", icon: Database, description: "of total request time", good: true },
] as const

export function DashboardMetrics() {
  return (
    <section className="metrics-grid" aria-label="Service performance summary">
      {metrics.map(({ label, value, change, direction, icon: Icon, description, good }) => {
        const positive = direction === "down" && good
        return (
          <article className="metric-card" key={label}>
            <div className="metric-top"><span>{label}</span><Icon aria-hidden="true" /></div>
            <div className="metric-value">{value}</div>
            <div className="metric-bottom">
              <span className={`metric-change${positive ? " change-good" : ""}`}>
                {direction === "up" ? <ArrowUpRight aria-hidden="true" /> : <ArrowDownRight aria-hidden="true" />}{change}
              </span>
              <span className="metric-description">{description}</span>
            </div>
          </article>
        )
      })}
    </section>
  )
}
