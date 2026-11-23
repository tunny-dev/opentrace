"use client";

import { ReleasesPage } from "@/components/spurtrace/releases-page";
import { useI18n } from "@/lib/i18n/i18n-context";

export default function ReleasesRoute() {
  const { dict } = useI18n();

  return (
    <div className="flex flex-col gap-4">
      <div className="pb-1">
        <div className="flex items-center gap-2.5">
          <h1 className="text-xl font-bold text-(--ot-text)">{dict.common.releases}</h1>
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/25">
            {dict.releases.badge}
          </span>
        </div>
        <p className="text-xs text-(--ot-muted) mt-0.5">{dict.releases.subtitle}</p>
      </div>

      <ReleasesPage />
    </div>
  );
}
