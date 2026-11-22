"use client";

import { SettingsPage } from "@/components/opentrace/settings-page";
import { useTelemetry } from "@/lib/opentrace/telemetry-context";
import { useI18n } from "@/lib/i18n/i18n-context";

export default function SettingsRoute() {
  const { userRole } = useTelemetry();
  const { dict } = useI18n();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-(--ot-text)">{dict.common.settings}</h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/25">
              {dict.settings.badge}
            </span>
          </div>
          <p className="text-xs text-(--ot-muted) mt-0.5">{dict.settings.subtitle}</p>
        </div>

        {/* Symmetrical Breadcrumb on the right */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-(--ot-panel-raised) border border-(--ot-border) text-[11px] text-(--ot-muted) font-sans">
            <span>MES-Production</span>
            <span className="text-(--ot-dim)">/</span>
            <span className="text-(--ot-text) font-semibold">{dict.common.settings}</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 text-[11px] font-medium">
            <span>{dict.common.activeAdmin}</span>
          </div>
        </div>
      </div>

      <SettingsPage role={userRole} />
    </div>
  );
}
