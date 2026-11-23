"use client";

import { useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Clock,
  GitCommit,
  GitPullRequest,
  Globe,
  Rocket,
  ShieldCheck,
  Tag,
  UserRound,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ReleaseItem {
  version: string;
  commitHash: string;
  commitMessage: string;
  author: string;
  deployTime: string;
  environment: string;
  status: "active" | "superseded" | "rolled_back";
  newErrorsCount: number;
  regressionsCount: number;
  p95Change: string;
  p95Improved: boolean;
  adoptionPct: number;
}

const demoReleases: ReleaseItem[] = [
  {
    version: "v2.4.1",
    commitHash: "f8c321a",
    commitMessage: "perf(db): fix N+1 query on customer lookup and add eager loading",
    author: "Alex Kim",
    deployTime: "2 hours ago",
    environment: "Production · us-east-1",
    status: "active",
    newErrorsCount: 0,
    regressionsCount: 0,
    p95Change: "-18ms (-7.4%)",
    p95Improved: true,
    adoptionPct: 98.4,
  },
  {
    version: "v2.4.0",
    commitHash: "9b110de",
    commitMessage: "feat(inventory): batch reservation updates & optimistic lock retry",
    author: "DevOps Bot",
    deployTime: "1 day ago",
    environment: "Production · us-east-1",
    status: "superseded",
    newErrorsCount: 1,
    regressionsCount: 1,
    p95Change: "+32ms (+14%)",
    p95Improved: false,
    adoptionPct: 1.6,
  },
  {
    version: "v2.3.9",
    commitHash: "3a8f902",
    commitMessage: "chore(telemetry): introduce in-memory ring buffer & batch writer",
    author: "Alex Kim",
    deployTime: "3 days ago",
    environment: "Production · us-east-1",
    status: "superseded",
    newErrorsCount: 0,
    regressionsCount: 0,
    p95Change: "-45ms (-16.2%)",
    p95Improved: true,
    adoptionPct: 0,
  },
  {
    version: "v2.3.8",
    commitHash: "6c41b89",
    commitMessage: "security(masking): sanitize sensitive parameters in query templates",
    author: "Security Team",
    deployTime: "6 days ago",
    environment: "Production · us-east-1",
    status: "superseded",
    newErrorsCount: 0,
    regressionsCount: 0,
    p95Change: "0ms",
    p95Improved: true,
    adoptionPct: 0,
  },
];

export function ReleasesPage() {
  const [selectedRelease, setSelectedRelease] = useState<ReleaseItem | null>(demoReleases[0]);

  return (
    <div className="releases-page">
      <div className="sql-workspace-context">
        <div className="section-kicker">
          PLATFORM / DEPLOYMENT TRACKER <span className="demo-label">GIT CI/CD</span>
        </div>
        <div className="sql-studio-context-meta">
          <div className="sql-studio-status">
            <span className="collector-dot" />
            Active build: v2.4.1 (f8c321a)
          </div>
        </div>
      </div>

      <section className="sql-metrics-grid" aria-label="Releases performance metrics">
        <article className="sql-metric-card">
          <div>
            <Rocket aria-hidden="true" />
            <span>CURRENT RELEASE</span>
          </div>
          <strong>v2.4.1</strong>
          <small>commit f8c321a</small>
        </article>
        <article className="sql-metric-card">
          <div>
            <Globe aria-hidden="true" />
            <span>FLEET ADOPTION</span>
          </div>
          <strong>98.4%</strong>
          <small>across 12 server instances</small>
        </article>
        <article className="sql-metric-card">
          <div>
            <CheckCircle2 aria-hidden="true" />
            <span>CRASH-FREE</span>
          </div>
          <strong>99.98%</strong>
          <small>last 24 hours</small>
        </article>
        <article className="sql-metric-card">
          <div>
            <GitPullRequest aria-hidden="true" />
            <span>DEPLOYMENTS</span>
          </div>
          <strong>8</strong>
          <small>completed this month</small>
        </article>
      </section>

      <section className="panel-card releases-table-panel">
        <header className="sql-analytics-header">
          <div>
            <div className="section-kicker">DEPLOYMENT HISTORY</div>
            <div className="table-title-row flex items-center gap-2">
              <h2>Release Registry</h2>
              <Badge
                variant="secondary"
                size="sm"
                className="font-semibold tabular-nums text-muted-foreground"
              >
                {demoReleases.length} tracked builds
              </Badge>
            </div>
          </div>
          <Badge
            variant="outline"
            size="sm"
            className="font-mono text-[10px] text-muted-foreground uppercase"
          >
            CORRELATED BUILDS
          </Badge>
        </header>

        <div className="releases-table-scroll border border-border rounded-lg overflow-hidden bg-card shadow-2xs">
          <table className="releases-table w-full border-collapse font-sans">
            <thead className="bg-muted/40 border-b border-border">
              <tr>
                <th
                  scope="col"
                  className="w-12 text-center text-[10px] uppercase font-semibold text-muted-foreground"
                >
                  STT
                </th>
                <th
                  scope="col"
                  className="text-[10px] uppercase font-semibold text-muted-foreground"
                >
                  RELEASE VERSION
                </th>
                <th
                  scope="col"
                  className="text-[10px] uppercase font-semibold text-muted-foreground"
                >
                  COMMIT & MESSAGE
                </th>
                <th
                  scope="col"
                  className="text-[10px] uppercase font-semibold text-muted-foreground"
                >
                  DEPLOYED BY
                </th>
                <th
                  scope="col"
                  className="text-[10px] uppercase font-semibold text-muted-foreground"
                >
                  NEW ISSUES
                </th>
                <th
                  scope="col"
                  className="text-[10px] uppercase font-semibold text-muted-foreground"
                >
                  P95 LATENCY IMPACT
                </th>
                <th
                  scope="col"
                  className="text-[10px] uppercase font-semibold text-muted-foreground"
                >
                  STATUS
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {demoReleases.map((release, idx) => (
                <tr
                  key={release.version}
                  className={cn(
                    "group transition-colors hover:bg-muted/40 cursor-pointer border-b border-border/60",
                    selectedRelease?.version === release.version
                      ? "is-selected-row bg-emerald-500/10 dark:bg-emerald-950/20"
                      : ""
                  )}
                  onClick={() => setSelectedRelease(release)}
                >
                  <td className="text-[11px] tabular-nums text-muted-foreground text-center font-mono">
                    {idx + 1}
                  </td>
                  <td>
                    <div className="release-version-cell">
                      <Tag className="release-tag-icon size-3.5 text-emerald-500" />
                      <strong className="text-xs font-semibold text-foreground font-mono">
                        {release.version}
                      </strong>
                    </div>
                  </td>
                  <td>
                    <div className="release-commit-cell">
                      <div className="commit-meta-line flex items-center gap-1.5 text-xs">
                        <GitCommit className="commit-icon size-3 text-muted-foreground" />
                        <code className="font-mono text-[11px]">{release.commitHash}</code>
                        <span className="commit-time text-muted-foreground text-[11px]">
                          · {release.deployTime}
                        </span>
                      </div>
                      <span className="commit-msg text-xs text-foreground/90">
                        {release.commitMessage}
                      </span>
                    </div>
                  </td>
                  <td>
                    <div className="release-author-cell">
                      <div className="author-avatar">{release.author[0]}</div>
                      <span className="text-xs font-medium text-foreground">{release.author}</span>
                    </div>
                  </td>
                  <td>
                    {release.newErrorsCount === 0 ? (
                      <Badge variant="success" size="sm" className="gap-1 font-medium">
                        <CheckCircle2 className="size-3" />0 new issues
                      </Badge>
                    ) : (
                      <Badge variant="destructive" size="sm" className="gap-1 font-medium">
                        <AlertTriangle className="size-3" />
                        {release.newErrorsCount} new regression
                      </Badge>
                    )}
                  </td>
                  <td>
                    <Badge
                      variant="outline"
                      size="sm"
                      className={cn(
                        "font-mono font-semibold text-[11px]",
                        release.p95Improved
                          ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          : "border-amber-500/25 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                      )}
                    >
                      {release.p95Change}
                    </Badge>
                  </td>
                  <td>
                    {release.status === "active" ? (
                      <Badge variant="success" size="sm" className="font-bold tracking-wider">
                        ACTIVE PRODUCTION
                      </Badge>
                    ) : (
                      <Badge
                        variant="secondary"
                        size="sm"
                        className="font-medium text-muted-foreground"
                      >
                        SUPERSEDED
                      </Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Release Spotlight Box */}
      {selectedRelease && (
        <section className="panel-card release-spotlight-card">
          <div className="spotlight-header">
            <div className="spotlight-title-group">
              <span className="section-kicker">RELEASE DEEP DIVE</span>
              <h3>
                Build {selectedRelease.version} ({selectedRelease.commitHash})
              </h3>
            </div>
            <span className="spotlight-env">{selectedRelease.environment}</span>
          </div>
          <div className="spotlight-grid">
            <div className="spotlight-stat">
              <span>Commit Author</span>
              <strong>{selectedRelease.author}</strong>
            </div>
            <div className="spotlight-stat">
              <span>Deployed At</span>
              <strong>{selectedRelease.deployTime}</strong>
            </div>
            <div className="spotlight-stat">
              <span>Traffic Share</span>
              <strong>{selectedRelease.adoptionPct}%</strong>
            </div>
            <div className="spotlight-stat">
              <span>Regression Status</span>
              <strong
                className={selectedRelease.newErrorsCount > 0 ? "text-amber" : "text-emerald"}
              >
                {selectedRelease.newErrorsCount > 0
                  ? "1 Regression (ConflictError)"
                  : "Clean Build · 0 Regressions"}
              </strong>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
