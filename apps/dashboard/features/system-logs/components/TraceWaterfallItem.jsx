"use client";

import { useState } from 'react';
import PropTypes from 'prop-types';
import {
  ChevronDown,
  ChevronRight,
  Database,
  AlertTriangle,
  AlertCircle,
  Copy,
  Check,
  Clock,
  Eye,
  Filter,
  Flame,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import { analyzeTrace } from '@/features/system-logs/utils/traceAnalytics';

export function TraceWaterfallItem({ trace, onInspect, onFilterTraceId }) {
  const [expanded, setExpanded] = useState(false);
  const [copiedSql, setCopiedSql] = useState(null);
  const [copiedTrace, setCopiedTrace] = useState(false);

  const {
    traceId,
    method = 'GET',
    path = 'Unknown',
    statusCode = 200,
    totalDurationMs = 0,
    timestamp = '',
    clientIp = '',
    queryCount = 0,
    slowQueryCount = 0,
    hasError = false,
    events = [],
  } = trace;

  const {
    totalSqlMs,
    appMs,
    dbPercent,
    appPercent,
    hasDuplicates,
    isNPlusOne,
    totalDuplicateQueries,
    maxDuplicateCount,
  } = analyzeTrace(trace);

  const handleCopySql = (sql, id, e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(sql);
    setCopiedSql(id);
    setTimeout(() => setCopiedSql(null), 1800);
  };

  const handleCopyTrace = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(traceId);
    setCopiedTrace(true);
    setTimeout(() => setCopiedTrace(false), 1800);
  };

  const methodColors = {
    GET: 'bg-[#5794f2]/15 text-[#5794f2] border-[#5794f2]/30',
    POST: 'bg-[#73bf69]/15 text-[#73bf69] border-[#73bf69]/30',
    PUT: 'bg-[#faad14]/15 text-[#faad14] border-[#faad14]/30',
    DELETE: 'bg-[#f2495c]/15 text-[#f2495c] border-[#f2495c]/30',
    SYS: 'bg-[#b877d9]/15 text-[#b877d9] border-[#b877d9]/30',
  };

  const isErr = statusCode >= 400 || hasError;
  const isSlow = totalDurationMs >= 1000 || slowQueryCount > 0;

  const formatTime = (iso) => {
    if (!iso) return '';
    try {
      const d = new Date(iso);
      if (isNaN(d.getTime())) return iso.split('T')[1]?.split('+')[0] || iso;
      return d.toTimeString().split(' ')[0] + '.' + String(d.getMilliseconds()).padStart(3, '0');
    } catch {
      return iso;
    }
  };

  const maxWaterfallDuration = Math.max(totalDurationMs, 1);

  return (
    <TooltipProvider delayDuration={150}>
      <div
        className={`rounded border transition-all ${
          isErr
            ? 'border-[#f2495c]/40 dark:bg-[#181b1f] bg-rose-50/70'
            : isSlow
              ? 'border-[#faad14]/40 dark:bg-[#181b1f] bg-amber-50/70'
              : 'dark:border-[#22252b] border-slate-200 dark:bg-[#181b1f] bg-white hover:dark:border-[#2c323f] hover:border-slate-300 shadow-xs'
        }`}
      >
        <div
          onClick={() => setExpanded(!expanded)}
          className="flex cursor-pointer flex-wrap items-center justify-between gap-3 p-3 transition hover:dark:bg-[#1e2229] hover:bg-slate-50"
        >
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <Button
              variant="ghost"
              size="icon-xs"
              className="h-6 w-6 p-0 dark:text-[#8e94a0] text-slate-500 transition hover:dark:text-white hover:text-slate-900 cursor-pointer"
              type="button"
            >
              {expanded ? (
                <ChevronDown className="h-4 w-4 text-[#5794f2]" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>

            <span
              className={`rounded px-2 py-0.5 text-xs font-bold font-sans border ${
                methodColors[method] || methodColors.GET
              }`}
            >
              {method}
            </span>

            <Badge variant={isErr ? 'destructive' : 'secondary'} className="font-sans text-xs">
              {statusCode}
            </Badge>

            <span className="font-semibold dark:text-[#f4f5f7] text-slate-900 font-sans text-xs sm:text-sm truncate max-w-[280px] sm:max-w-md md:max-w-xl">
              {path}
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {queryCount > 0 && (
              <Badge
                variant="outline"
                className="border-[#73bf69]/40 text-[#73bf69] bg-[#73bf69]/10 font-sans text-xs rounded"
              >
                <Database className="h-3 w-3 mr-1" />
                {queryCount} SQL
              </Badge>
            )}

            {slowQueryCount > 0 && (
              <Badge
                variant="outline"
                className="border-[#faad14]/40 text-[#faad14] bg-[#faad14]/10 font-sans text-xs font-bold rounded"
              >
                <AlertTriangle className="h-3 w-3 mr-1" />
                {slowQueryCount} slow
              </Badge>
            )}

            {hasDuplicates && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge
                    variant="outline"
                    className="border-amber-500/40 text-amber-500 bg-amber-500/10 font-sans text-xs font-semibold rounded cursor-pointer"
                  >
                    <Flame className="h-3 w-3 mr-1 text-amber-500" />
                    {isNPlusOne
                      ? `N+1 (${maxDuplicateCount}x)`
                      : `${totalDuplicateQueries} dup SQL`}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  {isNPlusOne
                    ? `Possible N+1 Query detected! ${maxDuplicateCount} repeated queries with identical pattern.`
                    : `${totalDuplicateQueries} duplicate queries detected.`}
                </TooltipContent>
              </Tooltip>
            )}

            <div
              className={`flex items-center gap-1.5 rounded border px-2.5 py-1 text-xs font-sans ${
                isSlow
                  ? 'border-[#faad14]/40 bg-[#faad14]/10 text-[#faad14] font-bold'
                  : 'dark:border-[#2c323f] border-slate-200 dark:bg-[#111217] bg-slate-100 dark:text-[#c7d0d9] text-slate-700'
              }`}
            >
              <Clock className="h-3 w-3 text-[#8e94a0]" />
              <span>{totalDurationMs} ms</span>
            </div>

            {totalDurationMs > 0 && queryCount > 0 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded border dark:border-[#2c323f] border-slate-200 dark:bg-[#111217] bg-slate-100 text-[11px] cursor-help">
                    <div className="w-14 h-2 rounded-full overflow-hidden flex bg-slate-200 dark:bg-slate-800">
                      <div
                        className="h-full bg-indigo-500 dark:bg-indigo-600 transition-all"
                        style={{ width: `${dbPercent}%` }}
                      />
                      <div
                        className="h-full bg-sky-500 dark:bg-sky-600 transition-all"
                        style={{ width: `${appPercent}%` }}
                      />
                    </div>
                    <span className="font-mono text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold">
                      {dbPercent}% DB
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent className="flex flex-col items-stretch gap-2 p-3 min-w-[240px] text-xs bg-slate-900 text-slate-100 border border-slate-700 shadow-xl rounded-lg">
                  <div className="font-bold border-b border-slate-700/80 pb-1.5 text-slate-200">
                    Latency Distribution
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-indigo-400 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" /> Database:
                    </span>
                    <span className="font-mono font-semibold text-slate-100">
                      {totalSqlMs} ms ({dbPercent}%)
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sky-400 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-sky-500 shrink-0" /> Server Logic:
                    </span>
                    <span className="font-mono font-semibold text-slate-100">
                      {appMs} ms ({appPercent}%)
                    </span>
                  </div>
                </TooltipContent>
              </Tooltip>
            )}

            <div className="flex items-center rounded border dark:border-[#2c323f] border-slate-200 dark:bg-[#111217] bg-slate-100 px-2 py-1 text-xs">
              <span className="font-sans text-[11px] text-[#3274d9] dark:text-[#5794f2] select-all tracking-tight mr-1.5 font-medium">
                {traceId}
              </span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={handleCopyTrace}
                    type="button"
                    className="h-5 w-5 dark:text-[#8e94a0] text-slate-500 hover:dark:text-white hover:text-slate-900 p-0.5 cursor-pointer"
                  >
                    {copiedTrace ? (
                      <Check className="h-3 w-3 text-[#73bf69]" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{copiedTrace ? 'Copied Trace ID' : 'Copy Trace ID'}</TooltipContent>
              </Tooltip>

              {onFilterTraceId && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        onFilterTraceId(traceId);
                      }}
                      type="button"
                      className="h-5 w-5 dark:text-[#8e94a0] text-slate-500 hover:text-[#5794f2] p-0.5 ml-1 cursor-pointer"
                    >
                      <Filter className="h-3 w-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Filter by this Trace ID</TooltipContent>
                </Tooltip>
              )}
            </div>

            {onInspect && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      onInspect(trace);
                    }}
                    className="h-7 text-xs dark:border-[#2c323f] border-slate-300 dark:bg-[#111217] bg-slate-50 text-[#3274d9] dark:text-[#5794f2] hover:bg-[#3274d9] hover:text-white dark:hover:bg-[#3274d9] dark:hover:text-white px-2.5 rounded"
                  >
                    <Eye className="h-3.5 w-3.5 mr-1" />
                    Inspect
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Open Trace Inspector Drawer</TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>

        {expanded && (
          <div className="border-t dark:border-[#22252b] border-slate-200 dark:bg-[#14161a] bg-slate-50/70 p-4 space-y-3">
            <div className="flex items-center justify-between text-xs dark:text-slate-400 text-slate-500 pb-2 border-b dark:border-[#22252b] border-slate-200">
              <span className="font-medium">Waterfall Progress ({events.length} events):</span>
              <span className="font-sans text-[11px] dark:text-slate-400 text-slate-500">
                IP: {clientIp || '127.0.0.1'} &bull; {timestamp}
              </span>
            </div>

            <div className="space-y-2">
              {events.map((evt, idx) => {
                const offset = evt.relativeOffsetMs || 0;
                const dur = evt.durationMs || 10;
                const leftPercent = Math.min((offset / maxWaterfallDuration) * 85, 80);
                const widthPercent = Math.max(
                  Math.min((dur / maxWaterfallDuration) * 85, 85 - leftPercent),
                  4
                );

                const isSql = evt.eventType === 'sql' || evt.eventType === 'slow_sql';
                const isSlowSql = evt.eventType === 'slow_sql';
                const isEventError = evt.eventType === 'error';
                const isHttpEnd = evt.eventType === 'http_end';

                return (
                  <div
                    key={idx}
                    className="rounded-lg border dark:border-[#22252b] border-slate-200 dark:bg-[#181b1f] bg-white p-3 text-xs transition hover:dark:border-[#2c323f] hover:border-slate-300 shadow-xs"
                  >
                    <div className="flex items-center justify-between gap-3 text-slate-400 mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-sans text-[11px] text-slate-500">
                          {formatTime(evt.time)}
                        </span>
                        <span className="font-sans text-[11px] text-[#3274d9] dark:text-[#5794f2] font-semibold">
                          +{offset}ms
                        </span>
                        <span
                          className={`rounded px-1.5 py-0.5 text-[10px] font-bold font-sans ${
                            isSlowSql
                              ? 'bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/40'
                              : isSql
                                ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30'
                                : isEventError
                                  ? 'bg-rose-500/20 text-rose-600 dark:text-rose-300 border border-rose-500/40'
                                  : isHttpEnd
                                    ? 'bg-[#3274d9]/20 text-[#5794f2] border border-[#3274d9]/30'
                                    : 'dark:bg-slate-800 bg-slate-100 text-slate-500'
                          }`}
                        >
                          {evt.eventType.toUpperCase()}
                        </span>
                      </div>

                      {dur && (
                        <span className="font-sans text-[11px] font-bold dark:text-slate-300 text-slate-700">
                          {dur} ms
                        </span>
                      )}
                    </div>

                    <div className="relative h-1.5 w-full rounded-full dark:bg-[#111217] bg-slate-200 overflow-hidden mb-2">
                      <div
                        className={`absolute h-full rounded-full ${
                          isSlowSql
                            ? 'bg-amber-400'
                            : isEventError
                              ? 'bg-rose-500'
                              : isSql
                                ? 'bg-emerald-400'
                                : 'bg-[#5794f2]'
                        }`}
                        style={{
                          left: `${leftPercent}%`,
                          width: `${widthPercent}%`,
                        }}
                      />
                    </div>

                    <div className="dark:text-slate-300 text-slate-800 font-sans leading-relaxed">
                      {evt.message?.includes('| SQL:')
                        ? evt.message.split('| SQL:')[0].trim()
                        : evt.message}
                    </div>

                    {isSql && evt.sql && (
                      <div className="mt-2.5 space-y-2">
                        <div className="relative rounded border dark:border-[#2c323f] border-slate-700 dark:bg-[#111217] bg-slate-900 p-3 font-sans text-[11px] text-[#5794f2] dark:text-cyan-300 overflow-x-auto whitespace-pre-wrap">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="xs"
                                onClick={(e) => handleCopySql(evt.sql, `sql-${idx}`, e)}
                                type="button"
                                className="h-6 absolute right-2 top-2 rounded bg-slate-800/90 px-2 py-1 text-[10px] text-slate-300 hover:text-white flex items-center gap-1 border border-slate-700 cursor-pointer"
                              >
                                {copiedSql === `sql-${idx}` ? (
                                  <>
                                    <Check className="h-3 w-3 text-emerald-400" /> Copied
                                  </>
                                ) : (
                                  <>
                                    <Copy className="h-3 w-3" /> Copy SQL
                                  </>
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Copy SQL statement</TooltipContent>
                          </Tooltip>
                          {evt.sql}
                        </div>

                        {evt.paramsJson && (
                          <div className="rounded border dark:border-[#22252b] border-slate-200 dark:bg-[#111217] bg-slate-100 p-2.5">
                            <span className="text-[10px] font-bold uppercase text-slate-500 mr-2">
                              Parameters:
                            </span>
                            <code className="font-sans text-xs dark:text-amber-300 text-amber-700 break-all">
                              {evt.paramsJson}
                            </code>
                          </div>
                        )}
                      </div>
                    )}

                    {evt.exception && (
                      <div className="mt-2.5 rounded border border-[#f2495c]/30 dark:bg-[#f2495c]/10 bg-rose-50/80 p-3 font-sans text-xs text-[#f2495c] whitespace-pre-wrap">
                        <div className="font-bold text-[#f2495c] mb-1 flex items-center gap-1.5">
                          <AlertCircle className="h-3.5 w-3.5" />
                          Exception Details:
                        </div>
                        {evt.exception}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}

TraceWaterfallItem.propTypes = {
  trace: PropTypes.object.isRequired,
  onInspect: PropTypes.func,
  onFilterTraceId: PropTypes.func,
};
