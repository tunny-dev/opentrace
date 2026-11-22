"use client";

import { RefreshCw } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { useTelemetry } from "@/lib/opentrace/telemetry-context";
import { useI18n } from "@/lib/i18n/i18n-context";

export function TelemetryToolbar({
  showLiveStream = true,
  className = "",
}: {
  showLiveStream?: boolean;
  className?: string;
}) {
  const { dict } = useI18n();
  const { liveStream, toggleLiveStream, refreshDashboard, refreshing } = useTelemetry();

  return (
    <div className={`flex flex-wrap items-center gap-2 self-start sm:self-auto ${className}`}>
      {/* Single Monitored App & Single Environment */}
      <div className="flex items-center gap-2 h-8 px-2.5 rounded-md bg-(--ot-panel-raised) border border-(--ot-border) text-xs text-(--ot-text)">
        <div className="flex items-center gap-1.5 font-semibold">
          <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>MES-Production</span>
        </div>
        <span className="text-(--ot-border) select-none">|</span>
        <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
          Production
        </span>
      </div>

      {showLiveStream && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={`h-8 shrink-0 items-center gap-1.5 px-2.5 text-[11px] font-medium transition-all cursor-pointer ${
            liveStream
              ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 font-semibold shadow-xs hover:bg-emerald-500/20"
              : "border-(--ot-border) bg-(--ot-panel-raised) text-(--ot-muted) hover:text-(--ot-text) hover:bg-(--ot-border-soft)"
          }`}
          onClick={toggleLiveStream}
          title={dict.common.liveStream}
        >
          <i
            className={`h-2 w-2 rounded-full ${
              liveStream ? "bg-emerald-500 animate-ping" : "bg-neutral-400"
            }`}
          />
          <span>{dict.common.liveStream}</span>
          <small className="text-[9px] opacity-80">
            {liveStream ? dict.common.liveStreamOn : "SSE"}
          </small>
        </Button>
      )}

      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              type="button"
              variant="outline"
              size="icon"
              disabled={refreshing}
              className="h-8 w-8 shrink-0 border-(--ot-border) bg-(--ot-panel-raised) text-(--ot-muted) transition-all hover:bg-(--ot-border-soft) hover:text-(--ot-text) cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed shadow-xs"
              onClick={refreshDashboard}
              aria-label={dict.common.refresh}
            >
              <RefreshCw
                className={`h-3.5 w-3.5 transition-transform ${
                  refreshing ? "animate-spin text-emerald-500" : ""
                }`}
              />
            </Button>
          }
        />
        <TooltipContent side="bottom" align="end">
          {refreshing ? dict.common.refreshing : dict.common.refresh}
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
