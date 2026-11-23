"use client";

import PropTypes from 'prop-types';
import { Database, AlertTriangle, AlertCircle, Activity, Gauge } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';

export function TraceSummaryCards({ summary = {} }) {
  const {
    totalTraces = 0,
    totalQueries = 0,
    totalSlowQueries,
    slowQueries,
    totalErrors = 0,
    avgDurationMs = 0,
  } = summary;

  const effSlowQueries = totalSlowQueries ?? slowQueries ?? 0;

  // Calculate volume distribution percentage safely
  const totalWeight = Math.max(totalTraces, 1);
  const errCount = Math.min(totalErrors, totalTraces);
  const slowCount = Math.min(effSlowQueries, Math.max(0, totalTraces - errCount));
  const okCount = Math.max(totalTraces - errCount - slowCount, 0);
  const errorPercent = totalTraces > 0 ? (errCount / totalWeight) * 100 : 0;
  const slowPercent = totalTraces > 0 ? (slowCount / totalWeight) * 100 : 0;
  const normalPercent = totalTraces > 0 ? (okCount / totalWeight) * 100 : 100;

  return (
    <TooltipProvider delayDuration={150}>
      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          <Card className="dark:border-[#22252b] border-slate-200 dark:bg-[#181b1f] bg-white p-3 transition-all duration-200 hover:dark:border-[#2c323f] hover:border-slate-300 hover:shadow-sm shadow-xs rounded">
            <CardContent className="p-0 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider dark:text-[#8e94a0] text-slate-500">
                  Total Requests
                </p>
                <h3 className="mt-1 text-xl font-bold font-sans text-[#3274d9] dark:text-[#5794f2]">
                  {totalTraces.toLocaleString()}
                </h3>
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded bg-[#3274d9]/10 text-[#5794f2] border border-[#3274d9]/20">
                <Activity className="h-4 w-4" />
              </div>
            </CardContent>
          </Card>

          <Card className="dark:border-[#22252b] border-slate-200 dark:bg-[#181b1f] bg-white p-3 transition-all duration-200 hover:dark:border-[#2c323f] hover:border-slate-300 hover:shadow-sm shadow-xs rounded">
            <CardContent className="p-0 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider dark:text-[#8e94a0] text-slate-500">
                  SQL Queries
                </p>
                <h3 className="mt-1 text-xl font-bold font-sans text-[#73bf69]">
                  {totalQueries.toLocaleString()}
                </h3>
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded bg-[#73bf69]/10 text-[#73bf69] border border-[#73bf69]/20">
                <Database className="h-4 w-4" />
              </div>
            </CardContent>
          </Card>

          <Card className="dark:border-[#22252b] border-slate-200 dark:bg-[#181b1f] bg-white p-3 transition-all duration-200 hover:dark:border-[#2c323f] hover:border-slate-300 hover:shadow-sm shadow-xs rounded">
            <CardContent className="p-0 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider dark:text-[#8e94a0] text-slate-500">
                  Slow (= 1s)
                </p>
                <h3
                  className={`mt-1 text-xl font-bold font-sans ${
                    effSlowQueries > 0 ? 'text-[#faad14]' : 'dark:text-[#8e94a0] text-slate-400'
                  }`}
                >
                  {effSlowQueries.toLocaleString()}
                </h3>
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded bg-[#faad14]/10 text-[#faad14] border border-[#faad14]/20">
                <AlertTriangle className="h-4 w-4" />
              </div>
            </CardContent>
          </Card>

          <Card className="dark:border-[#22252b] border-slate-200 dark:bg-[#181b1f] bg-white p-3 transition-all duration-200 hover:dark:border-[#2c323f] hover:border-slate-300 hover:shadow-sm shadow-xs rounded">
            <CardContent className="p-0 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider dark:text-[#8e94a0] text-slate-500">
                  Errors &amp; Warnings
                </p>
                <h3
                  className={`mt-1 text-xl font-bold font-sans ${
                    totalErrors > 0 ? 'text-[#f2495c]' : 'dark:text-[#8e94a0] text-slate-400'
                  }`}
                >
                  {totalErrors.toLocaleString()}
                </h3>
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded bg-[#f2495c]/10 text-[#f2495c] border border-[#f2495c]/20">
                <AlertCircle className="h-4 w-4" />
              </div>
            </CardContent>
          </Card>

          <Card className="dark:border-[#22252b] border-slate-200 dark:bg-[#181b1f] bg-white p-3 transition-all duration-200 hover:dark:border-[#2c323f] hover:border-slate-300 hover:shadow-sm shadow-xs col-span-2 sm:col-span-1 rounded">
            <CardContent className="p-0 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider dark:text-[#8e94a0] text-slate-500">
                  Avg Latency
                </p>
                <h3 className="mt-1 text-xl font-bold font-sans text-[#5794f2]">
                  {avgDurationMs.toFixed(1)}{' '}
                  <span className="text-xs font-normal dark:text-[#8e94a0] text-slate-400">ms</span>
                </h3>
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded bg-[#5794f2]/10 text-[#5794f2] border border-[#5794f2]/20">
                <Gauge className="h-4 w-4" />
              </div>
            </CardContent>
          </Card>
        </div>

        {totalTraces > 0 && (
          <div className="rounded border dark:border-[#22252b] border-slate-200 dark:bg-[#181b1f] bg-white p-2.5 flex items-center gap-3 shadow-xs">
            <span className="text-[11px] dark:text-[#8e94a0] text-slate-500 font-sans shrink-0 uppercase font-medium">
              Distribution Ratio:
            </span>
            <div className="h-2 flex-1 flex rounded-full overflow-hidden dark:bg-[#111217] bg-slate-200">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    style={{ width: `${normalPercent}%` }}
                    className="bg-[#73bf69] transition-all cursor-help"
                  />
                </TooltipTrigger>
                <TooltipContent>Standard (200 OK): {normalPercent.toFixed(1)}%</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    style={{ width: `${slowPercent}%` }}
                    className="bg-[#faad14] transition-all cursor-help"
                  />
                </TooltipTrigger>
                <TooltipContent>Slow Queries (=1s): {slowPercent.toFixed(1)}%</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    style={{ width: `${errorPercent}%` }}
                    className="bg-[#f2495c] transition-all cursor-help"
                  />
                </TooltipTrigger>
                <TooltipContent>Errors &amp; Exceptions: {errorPercent.toFixed(1)}%</TooltipContent>
              </Tooltip>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-sans shrink-0">
              <span className="text-[#73bf69]">? 200 OK ({normalPercent.toFixed(0)}%)</span>
              <span className="text-[#faad14]">? Slow ({slowPercent.toFixed(0)}%)</span>
              <span className="text-[#f2495c]">? Error ({errorPercent.toFixed(0)}%)</span>
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}

TraceSummaryCards.propTypes = {
  summary: PropTypes.shape({
    totalTraces: PropTypes.number,
    totalQueries: PropTypes.number,
    slowQueries: PropTypes.number,
    totalErrors: PropTypes.number,
    avgDurationMs: PropTypes.number,
  }).isRequired,
};
