"use client";

import { useMemo, useState } from "react";
import {
  Activity,
  ArrowRight,
  Boxes,
  CheckCircle2,
  Cpu,
  ExternalLink,
  Network,
  Search,
  Server,
  ShieldCheck,
  Zap,
} from "lucide-react";
import type { DemoService } from "@/lib/spurtrace/demo-data";
import { useTelemetry } from "@/lib/spurtrace/telemetry-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface ServiceDetail {
  id: DemoService | string;
  name: string;
  stack: string;
  version: string;
  status: "healthy" | "degraded" | "down";
  throughput: string;
  p95Latency: string;
  errorRate: string;
  cpuUsage: string;
  memoryUsage: string;
  instances: number;
  description: string;
  endpoints: string[];
  dependencies: string[];
}

export function ServicesPage({
  onSelectService,
}: {
  onSelectService: (service: any) => void;
}) {
  const { filteredTraces } = useTelemetry();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "healthy" | "degraded">("all");

  const services = useMemo<ServiceDetail[]>(() => {
    const serviceNames: (DemoService | string)[] = Array.from(
      new Set(filteredTraces.map((t) => t.service).filter(Boolean))
    );
    if (serviceNames.length === 0) {
      serviceNames.push("MES-Production" as DemoService);
    }

    return serviceNames.map((name) => {
      const sTraces = filteredTraces.filter((t) => t.service === name);
      const total = sTraces.length;
      const errors = sTraces.filter(
        (t) => t.status >= 400 || t.state === "error" || t.exception
      ).length;
      const errRate = total > 0 ? (errors / total) * 100 : 0;

      const sorted = [...sTraces].map((t) => t.duration).sort((a, b) => a - b);
      const p95 = sorted.length > 0 ? sorted[Math.floor(sorted.length * 0.95)] : 0;

      const endpoints = Array.from(
        new Set(sTraces.map((t) => `${t.method} ${t.route}`))
      ).slice(0, 5);

      const status: "healthy" | "degraded" | "down" =
        errRate > 5 ? "down" : errRate > 1 || p95 > 500 ? "degraded" : "healthy";

      return {
        id: name,
        name,
        stack: "Node.js 22 / Express / SQLite WAL",
        version: "v2.4.1",
        status,
        throughput: `${total} traces`,
        p95Latency: `${Math.round(p95)} ms`,
        errorRate: `${errRate.toFixed(2)}%`,
        cpuUsage: "16.8%",
        memoryUsage: "210 MB",
        instances: 1,
        description: `Core manufacturing execution service handling API routing, telemetry logging, and SQL transactions for ${name}.`,
        endpoints: endpoints.length > 0 ? endpoints : ["GET /api/orders/:id", "GET /_telemetry"],
        dependencies: ["SQLite (WAL)", "SpurTrace BatchWriter", "Express Router"],
      };
    });
  }, [filteredTraces]);

  const { totalServices, aggregatedLoad, healthScore, fastestP95, healthyCount, degradedCount } =
    useMemo(() => {
      const totalServices = services.length;
      const aggregatedLoad = `${filteredTraces.length} req`;
      const healthyServices = services.filter((s) => s.status === "healthy").length;
      const degradedServices = services.filter((s) => s.status === "degraded").length;
      const healthScore =
        totalServices > 0 ? `${((healthyServices / totalServices) * 100).toFixed(1)}%` : "100%";

      let minP95 = Infinity;
      services.forEach((s) => {
        const val = parseInt(s.p95Latency, 10);
        if (!isNaN(val) && val < minP95) minP95 = val;
      });
      const fastestP95 = minP95 === Infinity ? "0 ms" : `${minP95} ms`;

      return {
        totalServices,
        aggregatedLoad,
        healthScore,
        fastestP95,
        healthyCount: healthyServices,
        degradedCount: degradedServices,
      };
    }, [services, filteredTraces]);

  const filteredServices = services.filter((item) => {
    const matchesSearch = `${item.name} ${item.stack} ${item.description}`
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchesStatus = filterStatus === "all" || item.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="services-page">
      <section className="sql-metrics-grid" aria-label="Services overview metrics">
        <article className="sql-metric-card">
          <div>
            <Boxes aria-hidden="true" />
            <span>TOTAL SERVICES</span>
          </div>
          <strong>{totalServices}</strong>
          <small>registered in fleet</small>
        </article>
        <article className="sql-metric-card">
          <div>
            <Activity aria-hidden="true" />
            <span>AGGREGATED LOAD</span>
          </div>
          <strong>{aggregatedLoad}</strong>
          <small>recorded traces</small>
        </article>
        <article className="sql-metric-card">
          <div>
            <CheckCircle2 aria-hidden="true" />
            <span>HEALTH SCORE</span>
          </div>
          <strong>{healthScore}</strong>
          <small>
            {healthyCount} healthy · {degradedCount} degraded
          </small>
        </article>
        <article className="sql-metric-card">
          <div>
            <Zap aria-hidden="true" />
            <span>FASTEST P95</span>
          </div>
          <strong>{fastestP95}</strong>
          <small>across active services</small>
        </article>
      </section>

      {/* Topology / Architecture Diagram */}
      <section className="panel-card topology-panel">
        <header className="topology-header">
          <div>
            <div className="section-kicker">ARCHITECTURE FLOW</div>
            <h2 className="topology-title">Service Dependency Map</h2>
          </div>
          <span className="topology-badge">LIVE RELATIONS</span>
        </header>

        <div className="topology-map-canvas">
          <div className="topology-node edge-node">
            <div className="node-icon">
              <Network />
            </div>
            <strong>Clients / Web</strong>
            <span>HTTP / TLS</span>
          </div>
          <div className="topology-arrow">
            <ArrowRight />
          </div>
          <div className="topology-node gateway-node">
            <div className="node-icon">
              <ShieldCheck />
            </div>
            <strong>SpurTrace Telemetry</strong>
            <small>{fastestP95} · Zero-Lockin</small>
          </div>
          <div className="topology-arrow">
            <ArrowRight />
          </div>
          <div className="topology-group">
            {services.map((s) => (
              <div key={s.id} className="topology-node api-node">
                <div className="node-icon">
                  <Server />
                </div>
                <strong>{s.name}</strong>
                <small>
                  {s.p95Latency} · {s.throughput}
                </small>
              </div>
            ))}
          </div>
          <div className="topology-arrow">
            <ArrowRight />
          </div>
          <div className="topology-node worker-node">
            <div className="node-icon">
              <Cpu />
            </div>
            <strong>SQLite WAL Storage</strong>
            <small>Worker Thread</small>
          </div>
        </div>
      </section>

      {/* Service Catalog List */}
      <section className="panel-card services-list-panel">
        <header className="services-toolbar">
          <div>
            <div className="section-kicker">SERVICES DIRECTORY</div>
            <div className="table-title-row">
              <h2>Monitored Services</h2>
              <span className="trace-count">{filteredServices.length} active</span>
            </div>
          </div>
          <div className="services-filter-actions">
            <div className="services-status-tabs">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className={`filter-pill h-auto p-0${filterStatus === "all" ? " is-active" : ""}`}
                onClick={() => setFilterStatus("all")}
              >
                All ({services.length})
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className={`filter-pill h-auto p-0${filterStatus === "healthy" ? " is-active" : ""}`}
                onClick={() => setFilterStatus("healthy")}
              >
                Healthy ({healthyCount})
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className={`filter-pill h-auto p-0${filterStatus === "degraded" ? " is-active" : ""}`}
                onClick={() => setFilterStatus("degraded")}
              >
                Degraded ({degradedCount})
              </Button>
            </div>
            <div className="services-search-box flex items-center">
              <Search aria-hidden="true" />
              <Input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter services or stack…"
                className="h-7 border-0 bg-transparent focus-visible:ring-0 shadow-none text-xs"
              />
            </div>
          </div>
        </header>

        <div className="services-cards-grid">
          {filteredServices.map((service) => (
            <article key={service.id} className="service-fleet-card">
              <div className="service-card-top">
                <div className="service-card-title">
                  <div className="service-avatar-box">
                    <Boxes className="service-box-icon" />
                  </div>
                  <div>
                    <div className="service-title-row flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-foreground">{service.name}</h3>
                      <Badge
                        variant={service.status === "healthy" ? "success" : "warning"}
                        size="sm"
                        className="gap-1 font-bold text-[10px] uppercase font-mono"
                      >
                        <span
                          className={cn(
                            "size-1.5 rounded-full",
                            service.status === "healthy" ? "bg-emerald-500" : "bg-amber-500"
                          )}
                        />
                        {service.status.toUpperCase()}
                      </Badge>
                    </div>
                    <span className="service-stack-label">
                      {service.stack} · {service.version}
                    </span>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="service-traces-btn"
                  onClick={() => onSelectService(service.id as DemoService)}
                  title={`View traces for ${service.name}`}
                >
                  <span>View Traces</span>
                  <ExternalLink className="service-btn-icon" />
                </Button>
              </div>

              <p className="service-desc">{service.description}</p>

              <div className="service-kpi-row">
                <div className="service-kpi">
                  <span>THROUGHPUT</span>
                  <strong>{service.throughput}</strong>
                </div>
                <div className="service-kpi">
                  <span>P95 LATENCY</span>
                  <strong className={service.status === "degraded" ? "text-amber" : ""}>
                    {service.p95Latency}
                  </strong>
                </div>
                <div className="service-kpi">
                  <span>ERROR RATE</span>
                  <strong className={service.status === "degraded" ? "text-red" : ""}>
                    {service.errorRate}
                  </strong>
                </div>
                <div className="service-kpi">
                  <span>INSTANCES</span>
                  <strong>{service.instances} node</strong>
                </div>
              </div>

              <div className="service-endpoints-row">
                <span className="endpoints-label">Discovered endpoints:</span>
                <div className="endpoint-chips">
                  {service.endpoints.map((ep) => (
                    <code key={ep} className="ep-chip">
                      {ep}
                    </code>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
