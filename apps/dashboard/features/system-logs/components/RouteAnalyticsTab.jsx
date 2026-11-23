"use client";

import { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import { Search, Filter, Clock, Database, AlertTriangle, Check, Copy, Layers } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import { analyzeTrace } from '@/features/system-logs/utils/traceAnalytics';

const METHOD_COLORS = {
  GET: 'bg-[#5794f2]/15 text-[#5794f2] border-[#5794f2]/30',
  POST: 'bg-[#73bf69]/15 text-[#73bf69] border-[#73bf69]/30',
  PUT: 'bg-[#faad14]/15 text-[#faad14] border-[#faad14]/30',
  DELETE: 'bg-[#f2495c]/15 text-[#f2495c] border-[#f2495c]/30',
  SYS: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
};

export function RouteAnalyticsTab({ traces = [], onFilterPath }) {
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('calls'); // 'calls', 'avgDuration', 'p95', 'errorRate', 'sqlTime', 'sqlCount'
  const [sortOrder, setSortOrder] = useState('desc');
  const [copiedPath, setCopiedPath] = useState(null);

  const handleCopyPath = (path, e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(path);
    setCopiedPath(path);
    setTimeout(() => setCopiedPath(null), 1800);
  };

  // Group traces by method + path
  const routeStats = useMemo(() => {
    if (!Array.isArray(traces) || traces.length === 0) return [];

    const groupMap = new Map();

    traces.forEach((trace) => {
      const method = (trace.method || 'GET').toUpperCase();
      const path = trace.path || 'Unknown';
      const key = `${method} ${path}`;

      const { totalSqlMs, hasDuplicates, totalDuplicateQueries } = analyzeTrace(trace);
      const isErr = trace.statusCode >= 400 || trace.hasError;
      const duration = Number(trace.totalDurationMs) || 0;
      const queryCount = Number(trace.queryCount) || 0;

      if (!groupMap.has(key)) {
        groupMap.set(key, {
          key,
          method,
          path,
          calls: 0,
          errorCalls: 0,
          durations: [],
          totalDuration: 0,
          totalSqlMs: 0,
          totalQueries: 0,
          traces: [],
          duplicateQueryTracesCount: 0,
          totalDuplicateQueries: 0,
        });
      }

      const g = groupMap.get(key);
      g.calls += 1;
      if (isErr) g.errorCalls += 1;
      g.durations.push(duration);
      g.totalDuration += duration;
      g.totalSqlMs += totalSqlMs;
      g.totalQueries += queryCount;
      if (hasDuplicates) {
        g.duplicateQueryTracesCount += 1;
        g.totalDuplicateQueries += totalDuplicateQueries;
      }
      g.traces.push(trace);
    });

    const totalAllCalls = traces.length || 1;

    // Compute aggregated metrics
    const list = Array.from(groupMap.values()).map((g) => {
      const sortedDurations = [...g.durations].sort((a, b) => a - b);
      const p95Index = Math.min(
        Math.floor(sortedDurations.length * 0.95),
        sortedDurations.length - 1
      );
      const p95 = sortedDurations[p95Index] || 0;
      const avgDuration = Math.round(g.totalDuration / g.calls);
      const avgSqlTime = Math.round(g.totalSqlMs / g.calls);
      const avgQueries = Number((g.totalQueries / g.calls).toFixed(1));
      const errorRate = Number(((g.errorCalls / g.calls) * 100).toFixed(1));
      const trafficShare = Number(((g.calls / totalAllCalls) * 100).toFixed(1));

      const dbRatio =
        avgDuration > 0 ? Math.min(100, Math.round((avgSqlTime / avgDuration) * 100)) : 0;
      const appRatio = Math.max(0, 100 - dbRatio);

      return {
        ...g,
        avgDuration,
        p95,
        avgSqlTime,
        avgQueries,
        errorRate,
        trafficShare,
        dbRatio,
        appRatio,
      };
    });

    return list;
  }, [traces]);

  // Filter & sort
  const filteredRoutes = useMemo(() => {
    let result = [...routeStats];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (r) => r.path.toLowerCase().includes(q) || r.method.toLowerCase().includes(q)
      );
    }

    result.sort((a, b) => {
      let valA = a.calls;
      let valB = b.calls;

      if (sortBy === 'avgDuration') {
        valA = a.avgDuration;
        valB = b.avgDuration;
      } else if (sortBy === 'p95') {
        valA = a.p95;
        valB = b.p95;
      } else if (sortBy === 'errorRate') {
        valA = a.errorRate;
        valB = b.errorRate;
      } else if (sortBy === 'sqlTime') {
        valA = a.avgSqlTime;
        valB = b.avgSqlTime;
      } else if (sortBy === 'sqlCount') {
        valA = a.avgQueries;
        valB = b.avgQueries;
      }

      // Primary sort by selected metric
      if (valA !== valB) {
        return sortOrder === 'asc' ? valA - valB : valB - valA;
      }

      // Secondary tie-breaker: sort by avgDuration desc, then calls desc
      if (a.avgDuration !== b.avgDuration) {
        return b.avgDuration - a.avgDuration;
      }
      return b.calls - a.calls;
    });

    return result;
  }, [routeStats, search, sortBy, sortOrder]);

  // Highlights
  const slowestRoute = useMemo(() => {
    if (routeStats.length === 0) return null;
    return [...routeStats].sort((a, b) => b.p95 - a.p95)[0];
  }, [routeStats]);

  const highestErrorRoute = useMemo(() => {
    const errRoutes = routeStats.filter((r) => r.errorRate > 0);
    if (errRoutes.length === 0) return null;
    return [...errRoutes].sort((a, b) => b.errorRate - a.errorRate)[0];
  }, [routeStats]);

  const heaviestSqlRoute = useMemo(() => {
    if (routeStats.length === 0) return null;
    return [...routeStats].sort((a, b) => b.avgSqlTime - a.avgSqlTime)[0];
  }, [routeStats]);

  const mostActiveRoute = useMemo(() => {
    if (routeStats.length === 0) return null;
    return [...routeStats].sort((a, b) => b.calls - a.calls)[0];
  }, [routeStats]);

  const toggleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  return (
    <TooltipProvider delayDuration={150}>
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="rounded border dark:border-[#22252b] border-slate-200 dark:bg-[#181b1f] bg-white p-3.5 shadow-xs">
            <div className="flex items-center justify-between text-xs dark:text-[#8e94a0] text-slate-500 font-medium">
              <span>Active Endpoints</span>
              <Layers className="h-4 w-4 text-[#3274d9]" />
            </div>
            <div className="text-2xl font-bold font-mono dark:text-white text-slate-900 mt-1">
              {routeStats.length}
            </div>
            <div className="text-[11px] text-[#8e94a0] mt-0.5 truncate">
              {mostActiveRoute ? (
                <>
                  Top traffic: <strong className="text-slate-300">{mostActiveRoute.path}</strong> (
                  {mostActiveRoute.trafficShare}%)
                </>
              ) : (
                'No route activity'
              )}
            </div>
          </div>

          <div className="rounded border dark:border-[#22252b] border-slate-200 dark:bg-[#181b1f] bg-white p-3.5 shadow-xs">
            <div className="flex items-center justify-between text-xs dark:text-[#8e94a0] text-slate-500 font-medium">
              <span>P95 Bottleneck Route</span>
              <Clock className="h-4 w-4 text-[#faad14]" />
            </div>
            <div className="text-2xl font-bold font-mono text-[#faad14] mt-1">
              {slowestRoute ? `${slowestRoute.p95} ms` : '0 ms'}
            </div>
            <div className="text-[11px] text-[#8e94a0] mt-0.5 truncate" title={slowestRoute?.path}>
              {slowestRoute ? slowestRoute.path : 'All fast'}
            </div>
          </div>

          <div className="rounded border dark:border-[#22252b] border-slate-200 dark:bg-[#181b1f] bg-white p-3.5 shadow-xs">
            <div className="flex items-center justify-between text-xs dark:text-[#8e94a0] text-slate-500 font-medium">
              <span>Highest Error Route</span>
              <AlertTriangle className="h-4 w-4 text-[#f2495c]" />
            </div>
            <div
              className={`text-2xl font-bold font-mono mt-1 ${highestErrorRoute ? 'text-[#f2495c]' : 'text-[#73bf69]'}`}
            >
              {highestErrorRoute ? `${highestErrorRoute.errorRate}%` : '0%'}
            </div>
            <div
              className="text-[11px] text-[#8e94a0] mt-0.5 truncate"
              title={highestErrorRoute?.path}
            >
              {highestErrorRoute ? highestErrorRoute.path : '100% Healthy'}
            </div>
          </div>

          <div className="rounded border dark:border-[#22252b] border-slate-200 dark:bg-[#181b1f] bg-white p-3.5 shadow-xs">
            <div className="flex items-center justify-between text-xs dark:text-[#8e94a0] text-slate-500 font-medium">
              <span>Heaviest SQL Route</span>
              <Database className="h-4 w-4 text-purple-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-purple-400 mt-1">
              {heaviestSqlRoute ? `${heaviestSqlRoute.avgSqlTime} ms` : '0 ms'}
            </div>
            <div
              className="text-[11px] text-[#8e94a0] mt-0.5 truncate"
              title={heaviestSqlRoute?.path}
            >
              {heaviestSqlRoute ? `${heaviestSqlRoute.avgQueries} queries/req` : 'No DB overhead'}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded border dark:border-[#22252b] border-slate-200 dark:bg-[#181b1f] bg-white">
          <div className="relative flex-1 min-w-55 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[#8e94a0]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search route path or method..."
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded border dark:border-[#22252b] border-slate-300 dark:bg-[#111217] bg-white dark:text-slate-100 text-slate-900 placeholder-[#8e94a0] focus:outline-none focus:border-[#3274d9]"
            />
          </div>

          <div className="flex items-center gap-1.5 flex-wrap text-xs">
            <span className="text-[#8e94a0] font-sans mr-1">Sort by:</span>
            {[
              { id: 'calls', label: 'Calls' },
              { id: 'avgDuration', label: 'Avg Latency' },
              { id: 'p95', label: 'P95' },
              { id: 'errorRate', label: 'Error %' },
              { id: 'sqlTime', label: 'DB Time' },
              { id: 'sqlCount', label: 'Queries' },
            ].map((s) => (
              <Button
                key={s.id}
                size="sm"
                variant={sortBy === s.id ? 'default' : 'outline'}
                onClick={() => toggleSort(s.id)}
                className={`h-7 px-2.5 text-xs rounded transition-colors ${
                  sortBy === s.id
                    ? 'bg-[#3274d9] text-white hover:bg-[#2461c2]'
                    : 'dark:border-[#22252b] border-slate-300 dark:bg-[#111217] bg-white dark:text-[#c7d0d9] text-slate-700 hover:dark:bg-[#22252b]'
                }`}
              >
                {s.label}
                {sortBy === s.id && (
                  <span className="ml-1 text-[10px]">{sortOrder === 'desc' ? '↓' : '↑'}</span>
                )}
              </Button>
            ))}
          </div>
        </div>

        {filteredRoutes.length > 0 && (
          <div className="hidden lg:grid lg:grid-cols-[1fr_95px_160px_85px_130px_130px] items-center gap-4 px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-[#8e94a0] border-b dark:border-[#22252b] border-slate-200">
            <div>Endpoint Route</div>
            <div className="text-right">Calls (Share)</div>
            <div className="text-right">Avg (P95) Latency</div>
            <div className="text-right">Error Rate</div>
            <div className="text-right">Layer Ratio</div>
            <div className="text-right">Action</div>
          </div>
        )}

        {filteredRoutes.length === 0 ? (
          <div className="rounded border dark:border-[#22252b] border-slate-200 dark:bg-[#181b1f] bg-white p-12 text-center text-xs text-[#8e94a0]">
            No API routes match the criteria in the selected time range.
          </div>
        ) : (
          <div className="space-y-2">
            {filteredRoutes.map((route) => {
              const hasErrors = route.errorCalls > 0;
              const isSlowRoute = route.p95 >= 1000;
              const hasNPlusOne = route.duplicateQueryTracesCount > 0;

              return (
                <div
                  key={route.key}
                  className={`rounded border transition-all p-3.5 ${
                    hasErrors
                      ? 'border-[#f2495c]/30 dark:bg-[#181b1f] bg-rose-50/40'
                      : isSlowRoute
                        ? 'border-[#faad14]/30 dark:bg-[#181b1f] bg-amber-50/40'
                        : 'dark:border-[#22252b] border-slate-200 dark:bg-[#181b1f] bg-white hover:dark:border-[#2c323f] hover:border-slate-300 shadow-xs'
                  }`}
                >
                  <div className="grid grid-cols-1 lg:grid-cols-[1fr_95px_160px_85px_130px_130px] items-center gap-3.5">
                    {/* Route identification */}
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className={`rounded px-2 py-0.5 text-xs font-bold font-sans border shrink-0 ${
                          METHOD_COLORS[route.method] || METHOD_COLORS.GET
                        }`}
                      >
                        {route.method}
                      </span>
                      <span className="font-semibold dark:text-white text-slate-900 font-sans text-xs sm:text-sm truncate">
                        {route.path}
                      </span>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            type="button"
                            onClick={(e) => handleCopyPath(route.path, e)}
                            className="h-5 w-5 text-[#8e94a0] hover:dark:text-white hover:text-slate-900 cursor-pointer p-0.5 shrink-0"
                          >
                            {copiedPath === route.path ? (
                              <Check className="h-3 w-3 text-[#73bf69]" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Copy endpoint path</TooltipContent>
                      </Tooltip>

                      {hasNPlusOne && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Badge
                              variant="outline"
                              className="border-amber-500/40 text-amber-500 bg-amber-500/10 text-[10px] font-semibold rounded shrink-0"
                            >
                              N+1 ({route.duplicateQueryTracesCount})
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>
                            Repeated duplicate queries detected in {route.duplicateQueryTracesCount}{' '}
                            request(s) of this endpoint.
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>

                    {/* Calls & Traffic */}
                    <div className="text-right flex lg:block items-center justify-between">
                      <span className="lg:hidden text-[10px] uppercase text-[#8e94a0]">Calls:</span>
                      <div>
                        <div className="font-mono font-bold dark:text-white text-slate-900">
                          {route.calls}{' '}
                          <span className="text-[11px] font-normal text-[#8e94a0]">
                            ({route.trafficShare}%)
                          </span>
                        </div>
                        <div className="hidden lg:block text-[10px] text-[#8e94a0] uppercase">
                          Calls
                        </div>
                      </div>
                    </div>

                    {/* Avg & P95 Latency */}
                    <div className="text-right flex lg:block items-center justify-between">
                      <span className="lg:hidden text-[10px] uppercase text-[#8e94a0]">
                        Latency:
                      </span>
                      <div>
                        <div className="font-mono font-bold">
                          <span
                            className={
                              isSlowRoute ? 'text-[#faad14]' : 'dark:text-white text-slate-900'
                            }
                          >
                            {route.avgDuration}ms
                          </span>
                          <span className="text-[10px] text-[#8e94a0] font-normal ml-1">
                            (P95: {route.p95}ms)
                          </span>
                        </div>
                        <div className="hidden lg:block text-[10px] text-[#8e94a0] uppercase">
                          Avg (P95)
                        </div>
                      </div>
                    </div>

                    {/* Error Rate */}
                    <div className="text-right flex lg:block items-center justify-between">
                      <span className="lg:hidden text-[10px] uppercase text-[#8e94a0]">Error:</span>
                      <div>
                        <div
                          className={`font-mono font-bold ${
                            route.errorRate > 0 ? 'text-[#f2495c]' : 'text-[#73bf69]'
                          }`}
                        >
                          {route.errorRate}%
                        </div>
                        <div className="hidden lg:block text-[10px] text-[#8e94a0] uppercase">
                          Error Rate
                        </div>
                      </div>
                    </div>

                    {/* DB vs App Layer Breakdown */}
                    <div className="flex lg:justify-end justify-between items-center">
                      <span className="lg:hidden text-[10px] uppercase text-[#8e94a0]">
                        Layer Ratio:
                      </span>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex flex-col items-end gap-1 cursor-help">
                            <div className="w-24 h-2 rounded-full overflow-hidden flex bg-slate-200 dark:bg-slate-800">
                              <div
                                className="h-full bg-indigo-500 dark:bg-indigo-600 transition-all"
                                style={{ width: `${route.dbRatio}%` }}
                              />
                              <div
                                className="h-full bg-sky-500 dark:bg-sky-600 transition-all"
                                style={{ width: `${route.appRatio}%` }}
                              />
                            </div>
                            <span className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400 font-semibold">
                              {route.avgSqlTime}ms DB ({route.avgQueries} q)
                            </span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent className="flex flex-col items-stretch gap-2 p-3 min-w-65 text-xs bg-slate-900 text-slate-100 border border-slate-700 shadow-xl rounded-lg">
                          <div className="font-bold border-b border-slate-700/80 pb-1.5 text-slate-200">
                            Layer Latency Distribution
                          </div>
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-indigo-400 flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />{' '}
                              Database:
                            </span>
                            <span className="font-mono font-semibold text-slate-100">
                              {route.avgSqlTime} ms ({route.dbRatio}%)
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-sky-400 flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-sky-500 shrink-0" /> Server
                              Logic:
                            </span>
                            <span className="font-mono font-semibold text-slate-100">
                              {Math.max(0, route.avgDuration - route.avgSqlTime)} ms (
                              {route.appRatio}%)
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-4 text-[#8e94a0] pt-1.5 border-t border-slate-700/80 text-[11px]">
                            <span>Avg SQL Queries:</span>
                            <span className="font-mono font-medium text-slate-300">
                              {route.avgQueries} queries/req
                            </span>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </div>

                    {/* Action: Filter this route in Traces */}
                    <div className="text-right">
                      {onFilterPath && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onFilterPath(route.path)}
                          className="h-7 w-full lg:w-auto text-xs dark:border-[#2c323f] border-slate-300 dark:bg-[#111217] bg-white text-[#3274d9] dark:text-[#5794f2] hover:bg-[#3274d9] hover:text-white dark:hover:bg-[#3274d9] dark:hover:text-white px-2.5 rounded transition-colors"
                        >
                          <Filter className="h-3 w-3 mr-1" />
                          View Traces ({route.calls})
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}

RouteAnalyticsTab.propTypes = {
  traces: PropTypes.arrayOf(PropTypes.object),
  onFilterPath: PropTypes.func,
  onInspectTrace: PropTypes.func,
};
