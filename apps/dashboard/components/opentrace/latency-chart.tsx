import { ArrowUpRight, CircleHelp } from "lucide-react";
import { latencySeries } from "@/lib/opentrace/demo-data";

const width = 740;
const height = 190;
const plot = { left: 42, top: 14, right: 14, bottom: 30 };
const chartHeight = height - plot.top - plot.bottom;
const chartWidth = width - plot.left - plot.right;
const maxValue = 360;

function linePath(key: "p50" | "p95") {
  return latencySeries
    .map((point, index) => {
      const x = plot.left + (index / (latencySeries.length - 1)) * chartWidth;
      const y = plot.top + chartHeight - (point[key] / maxValue) * chartHeight;
      return `${index === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

function areaPath() {
  return `${linePath("p95")} L${plot.left + chartWidth},${plot.top + chartHeight} L${plot.left},${plot.top + chartHeight} Z`;
}

export function LatencyChart() {
  return (
    <section className="panel-card latency-panel" aria-labelledby="latency-title">
      <div className="panel-heading">
        <div>
          <div className="section-kicker">
            REQUEST PERFORMANCE <CircleHelp aria-label="Latency percentile chart" />
          </div>
          <div className="latency-title-row">
            <h2 id="latency-title">Latency over time</h2>
            <span className="panel-badge">LAST 60 MIN</span>
          </div>
        </div>
        <span className="select-button chart-selector">P50 / P95</span>
      </div>
      <div className="chart-summary">
        <div>
          <span className="summary-number">
            84<span>ms</span>
          </span>
          <span className="summary-caption">
            P50 <b>−8.4%</b>
          </span>
        </div>
        <div>
          <span className="summary-number">
            226<span>ms</span>
          </span>
          <span className="summary-caption">
            P95 <b>+2.1%</b>
          </span>
        </div>
        <div className="chart-legend">
          <span>
            <i className="legend-p50" />
            P50
          </span>
          <span>
            <i className="legend-p95" />
            P95
          </span>
        </div>
      </div>
      <div className="chart-wrap">
        <svg
          className="latency-chart"
          viewBox={`0 0 ${width} ${height}`}
          role="img"
          aria-label="P50 and P95 request latency trends over the last hour"
        >
          {[0, 100, 200, 300].map((value) => {
            const y = plot.top + chartHeight - (value / maxValue) * chartHeight;
            return (
              <g key={value}>
                <line
                  x1={plot.left}
                  x2={plot.left + chartWidth}
                  y1={y}
                  y2={y}
                  className="chart-grid"
                />
                <text x={plot.left - 9} y={y + 3} className="axis-label" textAnchor="end">
                  {value}
                </text>
              </g>
            );
          })}
          <path d={areaPath()} className="chart-area" />
          <path d={linePath("p95")} className="chart-line-p95" />
          <path d={linePath("p50")} className="chart-line-p50" />
          {latencySeries.map((point, index) => {
            if (index % 3 !== 0) return null;
            const x = plot.left + (index / (latencySeries.length - 1)) * chartWidth;
            return (
              <text
                key={point.label}
                x={x}
                y={height - 8}
                className="axis-label"
                textAnchor="middle"
              >
                {point.label}
              </text>
            );
          })}
        </svg>
      </div>
      <div className="chart-footer">
        <span>Compared to previous hour</span>
        <span className="chart-link">
          View performance <ArrowUpRight aria-hidden="true" />
        </span>
      </div>
    </section>
  );
}
