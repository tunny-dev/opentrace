"use client";

import { RefreshCw } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { useTelemetry } from "@/lib/spurtrace/telemetry-context";
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
    <div
      className={`flex w-full min-w-0 flex-nowrap items-center gap-2 self-start sm:w-auto sm:self-auto ${className}`}
    >
      <div
        className="flex h-8 min-w-0 flex-1 items-center gap-1.5 rounded-md border border-(--ot-border) bg-(--ot-panel-raised) px-2 text-xs text-(--ot-text) sm:flex-none sm:gap-2 sm:px-2.5"
        title="MES-Production · Production"
      >
        <div className="flex min-w-0 flex-1 items-center gap-1.5 font-semibold sm:flex-none">
          <span className="size-2 shrink-0 rounded-full bg-emerald-500 animate-pulse" />
          <span className="truncate">MES-Production</span>
        </div>
        <span className="shrink-0 select-none text-(--ot-border)">|</span>
        <span className="shrink-0 text-[10px] font-medium text-emerald-600 dark:text-emerald-400 sm:text-[11px]">
          <span className="hidden min-[400px]:inline">Production</span>
          <span className="min-[400px]:hidden">Prod</span>
        </span>
      </div>

      {showLiveStream && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          aria-pressed={liveStream}
          className={`h-8 shrink-0 items-center gap-1.5 px-2 text-[11px] font-medium transition-all cursor-pointer sm:px-2.5 ${
            liveStream
              ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 font-semibold shadow-xs hover:bg-emerald-500/20"
              : "border-(--ot-border) bg-(--ot-panel-raised) text-(--ot-muted) hover:text-(--ot-text) hover:bg-(--ot-border-soft)"
          }`}
          onClick={toggleLiveStream}
          title={dict.common.liveStream}
        >
          <i
            aria-hidden="true"
            className={`h-2 w-2 rounded-full ${
              liveStream ? "bg-emerald-500 animate-ping" : "bg-neutral-400"
            }`}
          />
          <span>{dict.common.liveStream}</span>
          <small className="hidden text-[9px] opacity-80 sm:inline">
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
