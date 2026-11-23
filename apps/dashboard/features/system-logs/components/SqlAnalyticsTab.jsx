"use client";

import { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  Database,
  Clock,
  AlertTriangle,
  Flame,
  Search,
  Sparkles,
  Copy,
  Check,
  Table as TableIcon,
  Code2,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TooltipProvider } from '@/components/ui/tooltip';
import { aggregateSqlQueries } from '@/features/system-logs/utils/sqlAnalytics';

export function SqlAnalyticsTab({ traces = [], onOpenStudioWithQuery }) {
  const [subView, setSubView] = useState('queries'); // 'queries' | 'tables'
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all' | 'slow' | 'nplusone'
  const [sortBy, setSortBy] = useState('totalTime'); // 'totalTime' | 'calls' | 'avgDuration' | 'p95' | 'maxDuration'
  const [sortOrder, setSortOrder] = useState('desc');
  const [copiedFingerprint, setCopiedFingerprint] = useState(null);

  const handleCopySql = (sql, fp, e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(sql);
    setCopiedFingerprint(fp);
    setTimeout(() => setCopiedFingerprint(null), 1800);
  };

  // Aggregate queries and tables
  const { queries, tables, metrics } = useMemo(() => {
    return aggregateSqlQueries(traces);
  }, [traces]);

  // Filter & Sort queries
  const filteredQueries = useMemo(() => {
    let result = [...queries];

    // Filter by type
    if (filterType === 'slow') {
      result = result.filter((q) => q.isSlow);
    } else if (filterType === 'nplusone') {
      result = result.filter((q) => q.isNPlusOne);
    }

    // Search query text or table
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (item) =>
          item.sampleSql.toLowerCase().includes(q) ||
          item.tables.some((t) => t.toLowerCase().includes(q))
      );
    }

    // Sort
    result.sort((a, b) => {
      let valA = a.totalDurationMs;
      let valB = b.totalDurationMs;

      if (sortBy === 'calls') {
        valA = a.calls;
        valB = b.calls;
      } else if (sortBy === 'avgDuration') {
        valA = a.avgDurationMs;
        valB = b.avgDurationMs;
      } else if (sortBy === 'p95') {
        valA = a.p95DurationMs;
        valB = b.p95DurationMs;
      } else if (sortBy === 'maxDuration') {
        valA = a.maxDurationMs;
        valB = b.maxDurationMs;
      }

      if (valA !== valB) {
        return sortOrder === 'asc' ? valA - valB : valB - valA;
      }
      return b.calls - a.calls;
    });

    return result;
  }, [queries, filterType, search, sortBy, sortOrder]);

  // Filtered tables
  const filteredTables = useMemo(() => {
    if (!search.trim()) return tables;
    const q = search.toLowerCase();
    return tables.filter((t) => t.tableName.toLowerCase().includes(q));
  }, [tables, search]);

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
              <span>Total SQL Executions</span>
              <Database className="h-4 w-4 text-indigo-500" />
            </div>
            <div className="text-2xl font-bold font-mono dark:text-white text-slate-900 mt-1">
              {metrics.totalQueriesCount}
            </div>
            <div className="text-[11px] text-[#8e94a0] mt-0.5 truncate">
              Total DB time:{' '}
              <strong className="text-indigo-600 dark:text-indigo-400">
                {metrics.totalSqlDurationMs.toLocaleString()} ms
              </strong>{' '}
              ({metrics.distinctPatternsCount} patterns)
            </div>
          </div>

          <div className="rounded border dark:border-[#22252b] border-slate-200 dark:bg-[#181b1f] bg-white p-3.5 shadow-xs">
            <div className="flex items-center justify-between text-xs dark:text-[#8e94a0] text-slate-500 font-medium">
              <span>P95 SQL Latency</span>
              <Clock className="h-4 w-4 text-sky-500" />
            </div>
            <div className="text-2xl font-bold font-mono text-sky-500 mt-1">
              {metrics.p95SqlDurationMs} ms
            </div>
            <div className="text-[11px] text-[#8e94a0] mt-0.5 truncate">
              Average query time:{' '}
              <strong className="dark:text-slate-300 text-slate-700">
                {metrics.avgSqlDurationMs} ms
              </strong>
            </div>
          </div>

          <div className="rounded border dark:border-[#22252b] border-slate-200 dark:bg-[#181b1f] bg-white p-3.5 shadow-xs">
            <div className="flex items-center justify-between text-xs dark:text-[#8e94a0] text-slate-500 font-medium">
              <span>Slow Queries (≥ 1s)</span>
              <AlertTriangle className="h-4 w-4 text-[#faad14]" />
            </div>
            <div
              className={`text-2xl font-bold font-mono mt-1 ${metrics.slowQueriesCount > 0 ? 'text-[#faad14]' : 'text-[#73bf69]'}`}
            >
              {metrics.slowQueriesCount}
            </div>
            <div className="text-[11px] text-[#8e94a0] mt-0.5 truncate">
              {metrics.slowQueriesCount > 0 ? (
                <>Attention needed for {metrics.slowQueriesCount} slow statement(s)</>
              ) : (
                'All queries running under 1s'
              )}
            </div>
          </div>

          <div className="rounded border dark:border-[#22252b] border-slate-200 dark:bg-[#181b1f] bg-white p-3.5 shadow-xs">
            <div className="flex items-center justify-between text-xs dark:text-[#8e94a0] text-slate-500 font-medium">
              <span>N+1 Repeated Patterns</span>
              <Flame className="h-4 w-4 text-amber-500" />
            </div>
            <div
              className={`text-2xl font-bold font-mono mt-1 ${metrics.nPlusOnePatternsCount > 0 ? 'text-amber-500' : 'text-[#73bf69]'}`}
            >
              {metrics.nPlusOnePatternsCount}
            </div>
            <div className="text-[11px] text-[#8e94a0] mt-0.5 truncate">
              {metrics.nPlusOnePatternsCount > 0 ? (
                <>{metrics.nPlusOnePatternsCount} query pattern(s) repeated in single request</>
              ) : (
                'No repeated query loops detected'
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded border dark:border-[#22252b] border-slate-200 dark:bg-[#181b1f] bg-white">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center border dark:border-[#2c323f] border-slate-200 rounded p-0.5 dark:bg-[#111217] bg-slate-100">
              <Button
                variant={subView === 'queries' ? 'default' : 'ghost'}
                size="xs"
                type="button"
                onClick={() => setSubView('queries')}
                className={`h-7 px-3 py-1 text-xs font-semibold rounded transition cursor-pointer flex items-center gap-1.5 ${
                  subView === 'queries'
                    ? 'bg-[#3274d9] text-white shadow-xs'
                    : 'dark:text-[#8e94a0] text-slate-600 hover:dark:text-white'
                }`}
              >
                <Code2 className="h-3.5 w-3.5" />
                Query Leaderboard ({queries.length})
              </Button>
              <Button
                variant={subView === 'tables' ? 'default' : 'ghost'}
                size="xs"
                type="button"
                onClick={() => setSubView('tables')}
                className={`h-7 px-3 py-1 text-xs font-semibold rounded transition cursor-pointer flex items-center gap-1.5 ${
                  subView === 'tables'
                    ? 'bg-[#3274d9] text-white shadow-xs'
                    : 'dark:text-[#8e94a0] text-slate-600 hover:dark:text-white'
                }`}
              >
                <TableIcon className="h-3.5 w-3.5" />
                Table Heatmap ({tables.length})
              </Button>
            </div>

            {subView === 'queries' && (
              <div className="flex items-center gap-1.5 ml-2">
                <Button
                  variant={filterType === 'all' ? 'secondary' : 'ghost'}
                  size="xs"
                  type="button"
                  onClick={() => setFilterType('all')}
                  className={`h-7 px-2.5 py-1 text-xs font-medium rounded transition cursor-pointer ${
                    filterType === 'all'
                      ? 'bg-slate-800 text-white dark:bg-slate-700'
                      : 'text-[#8e94a0] hover:dark:text-white'
                  }`}
                >
                  All ({queries.length})
                </Button>
                {metrics.slowQueriesCount > 0 && (
                  <Button
                    variant={filterType === 'slow' ? 'default' : 'ghost'}
                    size="xs"
                    type="button"
                    onClick={() => setFilterType('slow')}
                    className={`h-7 px-2.5 py-1 text-xs font-medium rounded transition cursor-pointer flex items-center gap-1 ${
                      filterType === 'slow'
                        ? 'bg-[#faad14] text-slate-950 font-bold'
                        : 'text-[#faad14] hover:bg-[#faad14]/10'
                    }`}
                  >
                    <AlertTriangle className="h-3 w-3" />
                    Slow (≥1s)
                  </Button>
                )}
                {metrics.nPlusOnePatternsCount > 0 && (
                  <Button
                    variant={filterType === 'nplusone' ? 'default' : 'ghost'}
                    size="xs"
                    type="button"
                    onClick={() => setFilterType('nplusone')}
                    className={`h-7 px-2.5 py-1 text-xs font-medium rounded transition cursor-pointer flex items-center gap-1 ${
                      filterType === 'nplusone'
                        ? 'bg-amber-500 text-slate-950 font-bold'
                        : 'text-amber-500 hover:bg-amber-500/10'
                    }`}
                  >
                    <Flame className="h-3 w-3" />
                    N+1 Culprits ({metrics.nPlusOnePatternsCount})
                  </Button>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative min-w-50 max-w-xs">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[#8e94a0]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={
                  subView === 'queries' ? 'Search SQL or table...' : 'Search table name...'
                }
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded border dark:border-[#22252b] border-slate-300 dark:bg-[#111217] bg-white dark:text-slate-100 text-slate-900 placeholder-[#8e94a0] focus:outline-none focus:border-[#3274d9]"
              />
            </div>

            {subView === 'queries' && (
              <div className="flex items-center gap-1 text-xs">
                <span className="text-[#8e94a0] font-sans mr-1">Sort:</span>
                {[
                  { id: 'totalTime', label: 'Total Time' },
                  { id: 'calls', label: 'Calls' },
                  { id: 'avgDuration', label: 'Avg' },
                  { id: 'p95', label: 'P95' },
                  { id: 'maxDuration', label: 'Max' },
                ].map((s) => (
                  <Button
                    key={s.id}
                    size="sm"
                    variant={sortBy === s.id ? 'default' : 'outline'}
                    onClick={() => toggleSort(s.id)}
                    className={`h-7 px-2 text-xs rounded transition-colors ${
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
            )}
          </div>
        </div>

        {/* Sub-view 1: Query Leaderboard */}
        {subView === 'queries' && (
          <div className="space-y-3">
            {filteredQueries.length === 0 ? (
              <div className="rounded border dark:border-[#22252b] border-slate-200 dark:bg-[#181b1f] bg-white p-12 text-center text-xs text-[#8e94a0] space-y-1.5">
                <Database className="h-8 w-8 mx-auto text-slate-400 opacity-60 mb-2" />
                <div className="font-semibold text-slate-700 dark:text-slate-300">
                  {search
                    ? 'No SQL queries match your search filter.'
                    : 'No SQL queries detected in current traces.'}
                </div>
                <p className="text-[11px] text-slate-500 max-w-md mx-auto">
                  {traces.length > 0
                    ? `Loaded ${traces.length} traces, but none contained SQL execution logs. Try selecting a broader time window or another date.`
                    : 'Try changing the time window (e.g., Last 24 hours, Last 7 days) or selecting a date from the log files calendar.'}
                </p>
              </div>
            ) : (
              filteredQueries.map((query, qIdx) => {
                return (
                  <div
                    key={query.fingerprint || qIdx}
                    className={`rounded border p-4 transition shadow-xs ${
                      query.isSlow
                        ? 'border-[#faad14]/30 dark:bg-[#181b1f] bg-amber-50/30'
                        : query.isNPlusOne
                          ? 'border-amber-500/30 dark:bg-[#181b1f] bg-amber-50/20'
                          : 'dark:border-[#22252b] border-slate-200 dark:bg-[#181b1f] bg-white hover:dark:border-[#2c323f] hover:border-slate-300'
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-3">
                      {/* Left: Code snippet & tags */}
                      <div className="space-y-2 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="flex h-5 w-5 items-center justify-center rounded bg-indigo-500/20 text-[11px] font-bold text-indigo-400 font-mono">
                            #{qIdx + 1}
                          </span>

                          {query.isNPlusOne && (
                            <Badge
                              variant="outline"
                              className="border-amber-500/40 text-amber-500 bg-amber-500/10 text-[10px] font-semibold rounded"
                            >
                              <Flame className="h-3 w-3 mr-1" />
                              N+1 Loop ({query.nPlusOneTracesCount} traces)
                            </Badge>
                          )}

                          {query.isSlow && (
                            <Badge
                              variant="outline"
                              className="border-[#faad14]/40 text-[#faad14] bg-[#faad14]/10 text-[10px] font-semibold rounded"
                            >
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Slow Query ({query.slowCallsCount}x ≥ 1s)
                            </Badge>
                          )}

                          {query.tables.map((tbl) => (
                            <span
                              key={tbl}
                              className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium dark:bg-[#111217] bg-slate-100 text-indigo-600 dark:text-indigo-400 border dark:border-[#22252b] border-slate-200"
                            >
                              {tbl}
                            </span>
                          ))}
                        </div>

                        {/* SQL Code Block */}
                        <div className="rounded-md border dark:border-[#22252b] border-slate-700/80 bg-[#0c1017] p-3 font-mono text-xs text-slate-200 leading-relaxed overflow-x-auto select-text max-h-35">
                          {query.sampleSql}
                        </div>
                      </div>

                      {/* Right: Metrics & Actions */}
                      <div className="flex lg:flex-col items-end justify-between gap-3 shrink-0 lg:w-48 text-right">
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs w-full">
                          <div className="text-right">
                            <span className="text-[10px] uppercase text-[#8e94a0]">Calls:</span>
                            <div className="font-mono font-bold dark:text-white text-slate-900">
                              {query.calls}
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] uppercase text-[#8e94a0]">Avg / P95:</span>
                            <div className="font-mono font-bold dark:text-white text-slate-900">
                              {query.avgDurationMs}ms{' '}
                              <span className="text-[10px] text-[#8e94a0] font-normal">
                                ({query.p95DurationMs}ms)
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] uppercase text-[#8e94a0]">
                              Total Time:
                            </span>
                            <div className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                              {query.totalDurationMs.toLocaleString()}ms
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] uppercase text-[#8e94a0]">Traces:</span>
                            <div className="font-mono font-bold dark:text-slate-300 text-slate-700">
                              {query.tracesCount}
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => handleCopySql(query.sampleSql, query.fingerprint, e)}
                            className="h-7 px-2 text-xs dark:border-[#2c323f] border-slate-300 dark:bg-[#111217] bg-white text-[#8e94a0] hover:dark:text-white"
                          >
                            {copiedFingerprint === query.fingerprint ? (
                              <>
                                <Check className="h-3 w-3 mr-1 text-[#73bf69]" /> Copied
                              </>
                            ) : (
                              <>
                                <Copy className="h-3 w-3 mr-1" /> Copy
                              </>
                            )}
                          </Button>

                          {onOpenStudioWithQuery && (
                            <Button
                              size="sm"
                              onClick={() =>
                                onOpenStudioWithQuery({
                                  sql: query.sampleSql,
                                  paramsJson: query.paramsJson,
                                  durationMs: query.avgDurationMs,
                                  eventType: 'sql',
                                })
                              }
                              className="h-7 px-2.5 text-xs bg-[#3274d9] hover:bg-[#2461c2] text-white font-semibold transition-colors flex items-center gap-1 shadow-xs"
                            >
                              <Sparkles className="h-3 w-3" />
                              Studio
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Sub-view 2: Table Heatmap */}
        {subView === 'tables' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredTables.length === 0 ? (
              <div className="col-span-full rounded border dark:border-[#22252b] border-slate-200 dark:bg-[#181b1f] bg-white p-12 text-center text-xs text-[#8e94a0]">
                No database tables match the criteria.
              </div>
            ) : (
              filteredTables.map((tbl) => {
                const maxHits = tables[0]?.totalHits || 1;
                const hitPercent = Math.min(100, Math.round((tbl.totalHits / maxHits) * 100));

                return (
                  <div
                    key={tbl.tableName}
                    className="rounded border dark:border-[#22252b] border-slate-200 dark:bg-[#181b1f] bg-white p-4 space-y-3 shadow-xs hover:dark:border-[#2c323f] hover:border-slate-300 transition"
                  >
                    <div className="flex items-center justify-between gap-2 border-b dark:border-[#22252b] border-slate-200 pb-2.5">
                      <div className="flex items-center gap-2">
                        <TableIcon className="h-4 w-4 text-indigo-500" />
                        <span className="font-mono font-bold dark:text-white text-slate-900 text-sm">
                          {tbl.tableName}
                        </span>
                      </div>
                      <Badge variant="outline" className="text-[10px] font-mono">
                        {tbl.queriesCount} queries
                      </Badge>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[#8e94a0]">Relative Table Load:</span>
                        <span className="font-mono font-semibold dark:text-slate-200 text-slate-800">
                          {tbl.totalHits.toLocaleString()} hits ({hitPercent}%)
                        </span>
                      </div>
                      <div className="w-full h-1.5 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                        <div
                          className="h-full bg-indigo-500 rounded-full transition-all"
                          style={{ width: `${hitPercent}%` }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                      <div className="p-2 rounded dark:bg-[#111217] bg-slate-50 border dark:border-[#22252b] border-slate-200">
                        <span className="text-[10px] uppercase text-[#8e94a0] block">
                          Total DB Time
                        </span>
                        <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                          {tbl.totalDurationMs.toLocaleString()} ms
                        </span>
                      </div>
                      <div className="p-2 rounded dark:bg-[#111217] bg-slate-50 border dark:border-[#22252b] border-slate-200">
                        <span className="text-[10px] uppercase text-[#8e94a0] block">
                          Avg Query Time
                        </span>
                        <span className="font-mono font-bold dark:text-slate-200 text-slate-800">
                          {tbl.avgDurationMs} ms
                        </span>
                      </div>
                    </div>

                    {tbl.slowQueriesCount > 0 && (
                      <div className="flex items-center gap-1.5 text-xs text-[#faad14] bg-[#faad14]/10 p-2 rounded border border-[#faad14]/30">
                        <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                        <span>{tbl.slowQueriesCount} query execution(s) took ≥ 1,000ms</span>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}

SqlAnalyticsTab.propTypes = {
  traces: PropTypes.arrayOf(PropTypes.object),
  onOpenStudioWithQuery: PropTypes.func,
};
