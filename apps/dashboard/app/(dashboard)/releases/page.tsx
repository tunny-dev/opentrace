"use client";

import { ReleasesPage } from "@/components/opentrace/releases-page";
import { useI18n } from "@/lib/i18n/i18n-context";

export default function ReleasesRoute() {
  const { dict } = useI18n();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-(--ot-text)">{dict.common.releases}</h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/25">
              {dict.releases.badge}
            </span>
          </div>
          <p className="text-xs text-(--ot-muted) mt-0.5">{dict.releases.subtitle}</p>
        </div>

        {/* Symmetrical Breadcrumb on the right */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-(--ot-panel-raised) border border-(--ot-border) text-[11px] text-(--ot-muted) font-sans">
            <span>MES-Production</span>
            <span className="text-(--ot-dim)">/</span>
            <span className="text-(--ot-text) font-semibold">{dict.common.releases}</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-[11px] font-medium">
            <span>{dict.releases.stableVersion}</span>
          </div>
        </div>
      </div>

      <ReleasesPage />
    </div>
  );
}
