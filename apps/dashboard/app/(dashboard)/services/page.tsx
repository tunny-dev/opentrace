"use client";

import { useRouter } from "next/navigation";
import { ServicesPage } from "@/components/opentrace/services-page";
import { TelemetryToolbar } from "@/components/opentrace/telemetry-toolbar";
import { useTelemetry } from "@/lib/opentrace/telemetry-context";
import { useI18n } from "@/lib/i18n/i18n-context";
import type { DemoService } from "@/lib/opentrace/demo-data";

export default function ServicesRoute() {
  const router = useRouter();
  const { setService } = useTelemetry();
  const { dict } = useI18n();

  function handleSelectService(srv: DemoService) {
    setService(srv);
    router.push("/traces");
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-(--ot-text)">{dict.common.services}</h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25">
              {dict.services.badge}
            </span>
          </div>
          <p className="text-xs text-(--ot-muted) mt-0.5">{dict.services.subtitle}</p>
        </div>

        {/* Telemetry Control Toolbar with Environment, Service, Live Stream & Refresh */}
        <TelemetryToolbar />
      </div>

      <ServicesPage onSelectService={handleSelectService} />
    </div>
  );
}
