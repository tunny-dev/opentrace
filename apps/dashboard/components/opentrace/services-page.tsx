"use client";

import { useState } from "react";
import {
  Activity,
  ArrowRight,
  Boxes,
  CheckCircle2,
  ChevronRight,
  Cpu,
  ExternalLink,
  Network,
  Search,
  Server,
  ShieldCheck,
  Zap,
} from "lucide-react";
import type { DemoService } from "@/lib/opentrace/demo-data";
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

const serviceCatalog: ServiceDetail[] = [
  {
    id: "MES-API",
    name: "MES-API",
    stack: "Node.js 22 / Express",
    version: "v2.4.1",
    status: "healthy",
    throughput: "1.8k req/m",
    p95Latency: "145 ms",
    errorRate: "0.02%",
    cpuUsage: "18.4%",
    memoryUsage: "240 MB",
    instances: 4,
    description:
      "Core manufacturing execution service handling work orders, routing, and machine metrics.",
    endpoints: ["GET /api/v1/orders", "GET /api/v1/customers", "POST /api/v1/inventory/reserve"],
    dependencies: ["PostgreSQL 16", "Redis 7.2", "Inventory-Worker"],
  },
  {
    id: "Order-Service",
    name: "Order-Service",
    stack: "Go 1.23 / Gin",
    version: "v1.12.0",
    status: "healthy",
    throughput: "940 req/m",
    p95Latency: "88 ms",
    errorRate: "0.00%",
    cpuUsage: "8.2%",
    memoryUsage: "84 MB",
    instances: 3,
    description:
      "High-throughput checkout pipeline, cart validation, and order lifecycle orchestration.",
    endpoints: ["POST /v1/checkout", "DELETE /v1/orders/:id", "GET /v1/orders/summary"],
    dependencies: ["PostgreSQL 16", "Kafka Broker"],
  },
  {
    id: "Inventory-Worker",
    name: "Inventory-Worker",
    stack: ".NET 8 / C#",
    version: "v3.0.4",
    status: "degraded",
    throughput: "320 req/m",
    p95Latency: "310 ms",
    errorRate: "1.40%",
    cpuUsage: "44.1%",
    memoryUsage: "380 MB",
    instances: 2,
    description:
      "Background worker synchronizing stock levels, warehouse reservations, and ERP reconciliation.",
    endpoints: ["PATCH /api/v1/orders/:id", "POST /sync/inventory", "GET /warehouse/health"],
    dependencies: ["SQL Server 2022", "RabbitMQ"],
  },
  {
    id: "Auth-Gateway",
    name: "Auth-Gateway",
    stack: "Python 3.12 / FastAPI",
    version: "v2.1.0",
    status: "healthy",
    throughput: "2.4k req/m",
    p95Latency: "42 ms",
    errorRate: "0.01%",
    cpuUsage: "12.0%",
    memoryUsage: "115 MB",
    instances: 4,
    description:
      "Edge security reverse proxy verifying JWT signatures, rate limiting, and permission scopes.",
    endpoints: ["POST /auth/jwt/verify", "POST /auth/token/refresh", "GET /auth/health"],
    dependencies: ["Redis Cluster 7"],
  },
];

export function ServicesPage({
  onSelectService,
}: {
  onSelectService: (service: DemoService) => void;
}) {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "healthy" | "degraded">("all");

  const filteredServices = serviceCatalog.filter((item) => {
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
          <strong>4</strong>
          <small>registered in fleet</small>
        </article>
        <article className="sql-metric-card">
          <div>
            <Activity aria-hidden="true" />
            <span>AGGREGATED LOAD</span>
          </div>
          <strong>5.46k</strong>
          <small>requests per minute</small>
        </article>
        <article className="sql-metric-card">
          <div>
            <CheckCircle2 aria-hidden="true" />
            <span>HEALTH SCORE</span>
          </div>
          <strong>99.98%</strong>
          <small>3 healthy · 1 degraded</small>
        </article>
        <article className="sql-metric-card">
          <div>
            <Zap aria-hidden="true" />
            <span>FASTEST P95</span>
          </div>
          <strong>42 ms</strong>
          <small>Auth-Gateway (FastAPI)</small>
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
            <strong>Auth-Gateway</strong>
            <small>42 ms · 2.4k req/m</small>
          </div>
          <div className="topology-arrow">
            <ArrowRight />
          </div>
          <div className="topology-group">
            <div className="topology-node api-node">
              <div className="node-icon">
                <Server />
              </div>
              <strong>MES-API</strong>
              <small>145 ms · 1.8k req/m</small>
            </div>
            <div className="topology-node api-node">
              <div className="node-icon">
                <Server />
              </div>
              <strong>Order-Service</strong>
              <small>88 ms · 940 req/m</small>
            </div>
          </div>
          <div className="topology-arrow">
            <ArrowRight />
          </div>
          <div className="topology-node worker-node degraded">
            <div className="node-icon">
              <Cpu />
            </div>
            <strong>Inventory-Worker</strong>
            <small>310 ms · 1.4% err</small>
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
                All (4)
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className={`filter-pill h-auto p-0${filterStatus === "healthy" ? " is-active" : ""}`}
                onClick={() => setFilterStatus("healthy")}
              >
                Healthy (3)
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className={`filter-pill h-auto p-0${filterStatus === "degraded" ? " is-active" : ""}`}
                onClick={() => setFilterStatus("degraded")}
              >
                Degraded (1)
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
                  <strong>{service.instances} pods</strong>
                </div>
              </div>

              <div className="service-endpoints-row">
                <span className="endpoints-label">Top endpoints:</span>
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
