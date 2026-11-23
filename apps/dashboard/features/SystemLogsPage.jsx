import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useParams, useNavigate } from 'react-router-dom';
import {
  Layers,
  Terminal,
  ChevronLeft,
  ChevronRight,
  Activity,
  Laptop,
  Network,
} from 'lucide-react';

const TAB_SLUG_MAP = {
  waterfall: 'traces',
  traces: 'traces',
  routes: 'routes',
  raw: 'stream',
  stream: 'stream',
  client: 'client',
};

const SLUG_TAB_MAP = {
  traces: 'waterfall',
  routes: 'routes',
  stream: 'raw',
  raw: 'raw',
  client: 'client',
};
import { systemLogsService } from '@/services/system-logs.service';
import { useSystemLogDates, useSystemLogTraces } from '@/hooks/useSystemLogs';
import { CimdevAuthModal } from '@/features/system-logs/components/CimdevAuthModal';
import { TraceFilterToolbar } from '@/features/system-logs/components/TraceFilterToolbar';
import { TraceSummaryCards } from '@/features/system-logs/components/TraceSummaryCards';
import { TraceTimelineChart } from '@/features/system-logs/components/TraceTimelineChart';
import { TraceWaterfallItem } from '@/features/system-logs/components/TraceWaterfallItem';
import { TraceDetailSheet } from '@/features/system-logs/components/TraceDetailSheet';
import { LogStreamView } from '@/features/system-logs/components/LogStreamView';
import { FilesModal } from '@/features/system-logs/components/FilesModal';
import { ClientLogsTab } from '@/features/system-logs/components/ClientLogsTab';
import { RouteAnalyticsTab } from '@/features/system-logs/components/RouteAnalyticsTab';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import { useTheme } from '@/hooks/useTheme';

export function SystemLogsPage() {
  const [searchParams] = useSearchParams();
  const { tab } = useParams();
  const navigate = useNavigate();
  const { resolvedTheme, toggleTheme } = useTheme();

  // URL-driven active tab synchronization
  const activeTab = useMemo(() => {
    if (tab && SLUG_TAB_MAP[tab]) {
      return SLUG_TAB_MAP[tab];
    }
    if (searchParams.get('tab') === 'client') return 'client';
    return 'waterfall';
  }, [tab, searchParams]);

  const handleTabChange = (newTab) => {
    const slug = TAB_SLUG_MAP[newTab] || 'traces';
    const targetPath = slug === 'traces' ? '/system-logs' : `/system-logs/${slug}`;
    navigate(targetPath);
  };

  const [isAuthenticated, setIsAuthenticated] = useState(() => !!systemLogsService.getStoredAuth());
  const [showAuthModal, setShowAuthModal] = useState(!isAuthenticated);

  const [selectedDate, setSelectedDate] = useState('');
  const [timeRange, setTimeRange] = useState({
    from: 'now-1h',
    to: 'now',
    label: 'Last 1 hour',
    spanMs: 3600 * 1000,
    date: '',
  });
  const [search, setSearch] = useState('');
  const [traceIdFilter, setTraceIdFilter] = useState('');

  const [onlyErrors, setOnlyErrors] = useState(false);
  const [onlySlow, setOnlySlow] = useState(false);
  const [onlySql, setOnlySql] = useState(false);
  const [onlyInfo, setOnlyInfo] = useState(false);
  const [onlyWarn, setOnlyWarn] = useState(false);

  // Pagination states
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Auto-refresh interval (0 = off, 5, 10, 30s)
  const [autoRefreshInterval, setAutoRefreshInterval] = useState(0);

  // Modal & Inspector Sheet State
  const [isFilesModalOpen, setIsFilesModalOpen] = useState(false);
  const [inspectTrace, setInspectTrace] = useState(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  // Set browser tab title
  useEffect(() => {
    const prevTitle = document.title;
    document.title = 'MES APM & System Trace Explorer | CIMDEV';
    return () => {
      document.title = prevTitle;
    };
  }, []);

  // React Query: Dates
  const {
    data: dates = [],
    refetch: refetchDates,
    error: datesError,
  } = useSystemLogDates({
    enabled: isAuthenticated,
  });

  // Set initial selected date once dates are loaded
  useEffect(() => {
    if (dates && dates.length > 0 && !selectedDate) {
      setSelectedDate(dates[0]);
    }
  }, [dates, selectedDate]);

  // React Query: Traces with timeRange, filters, pagination, polling
  const {
    data: tracesData,
    isLoading,
    isFetching,
    error: tracesError,
    refetch: refetchTraces,
  } = useSystemLogTraces({
    date: timeRange.date || selectedDate,
    from: timeRange.from,
    to: timeRange.to,
    search,
    traceId: traceIdFilter,
    onlyErrors,
    onlySlow,
    onlySql,
    onlyInfo,
    onlyWarn,
    page,
    pageSize,
    autoRefreshInterval,
    enabled: isAuthenticated,
  });

  // Handle 401 unauthorized
  useEffect(() => {
    if (datesError?.message === 'UNAUTHORIZED' || tracesError?.message === 'UNAUTHORIZED') {
      systemLogsService.clearAuth();
      setIsAuthenticated(false);
      setShowAuthModal(true);
    }
  }, [datesError, tracesError]);

  const traces = tracesData?.traces || [];
  const timeline = tracesData?.timeline || [];
  const totalTracesCount = tracesData?.total || 0;
  const totalPages = tracesData?.totalPages || 1;
  const summary = tracesData?.summary || {
    totalTraces: 0,
    totalQueries: 0,
    slowQueries: 0,
    totalErrors: 0,
    avgDurationMs: 0,
  };
  const loading = isLoading || isFetching;
  const error = tracesError?.message || '';
  const displayedTraces = traces;

  const handleTimeRangeChange = (newRange) => {
    setTimeRange(newRange);
    if (newRange.date) {
      setSelectedDate(newRange.date);
    }
    setPage(1);
  };

  const handleSearchChange = (s) => {
    setSearch(s);
    setPage(1);
  };

  const handleTraceIdChange = (tid) => {
    setTraceIdFilter(tid);
    setPage(1);
  };

  const handlePageSizeChange = (ps) => {
    setPageSize(ps);
    setPage(1);
  };

  // Auth Handlers
  const handleAuthSuccess = async (u, p) => {
    systemLogsService.setStoredAuth(u, p);
    setIsAuthenticated(true);
    setShowAuthModal(false);
    await refetchDates();
    refetchTraces();
  };

  const handleLogout = () => {
    systemLogsService.clearAuth();
    setIsAuthenticated(false);
    setShowAuthModal(true);
  };

  const handleOpenInspect = (trace) => {
    setInspectTrace(trace);
    setIsSheetOpen(true);
  };

  const allEvents = displayedTraces.flatMap((t) =>
    (t.events || []).map((e) => ({ ...e, parentTrace: t }))
  );

  return (
    <TooltipProvider delayDuration={150}>
      <div className="min-h-screen w-full dark:bg-[#111217] bg-[#f4f5f7] dark:text-[#f4f5f7] text-slate-800 transition-colors">
        <CimdevAuthModal isOpen={showAuthModal} onSuccess={handleAuthSuccess} />

        <TraceFilterToolbar
          dates={dates}
          timeRange={timeRange}
          onChangeTimeRange={handleTimeRangeChange}
          search={search}
          onSearchChange={handleSearchChange}
          traceIdFilter={traceIdFilter}
          onTraceIdFilterChange={handleTraceIdChange}
          onlyErrors={onlyErrors}
          onOnlyErrorsChange={(val) => {
            setOnlyErrors(val);
            setPage(1);
          }}
          onlySlow={onlySlow}
          onOnlySlowChange={(val) => {
            setOnlySlow(val);
            setPage(1);
          }}
          onlySql={onlySql}
          onOnlySqlChange={(val) => {
            setOnlySql(val);
            setPage(1);
          }}
          onlyInfo={onlyInfo}
          onOnlyInfoChange={(val) => {
            setOnlyInfo(val);
            setPage(1);
          }}
          onlyWarn={onlyWarn}
          onOnlyWarnChange={(val) => {
            setOnlyWarn(val);
            setPage(1);
          }}
          pageSize={pageSize}
          onPageSizeChange={handlePageSizeChange}
          onRefresh={refetchTraces}
          loading={loading}
          onOpenFiles={() => setIsFilesModalOpen(true)}
          onLogout={handleLogout}
          autoRefreshInterval={autoRefreshInterval}
          onAutoRefreshChange={setAutoRefreshInterval}
          resolvedTheme={resolvedTheme}
          toggleTheme={toggleTheme}
        />

        <div className="w-full px-4 py-4 sm:px-6 space-y-3.5">
          <TraceSummaryCards summary={summary} />

          <TraceTimelineChart
            traces={traces}
            timeline={timeline}
            onSelectBucket={(bucket) => {
              if (bucket?.time) {
                setSearch(bucket.time);
                setPage(1);
              }
            }}
          />

          {(search ||
            traceIdFilter ||
            onlyErrors ||
            onlySlow ||
            onlyWarn ||
            onlySql ||
            onlyInfo) && (
            <div className="flex items-center flex-wrap gap-2 text-xs py-2 px-3 rounded border dark:border-[#22252b] border-slate-200 dark:bg-[#181b1f] bg-white shadow-xs">
              <span className="text-[11px] font-semibold uppercase tracking-wider dark:text-[#8e94a0] text-slate-500">
                Active filters:
              </span>
              {search && (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-[#3274d9]/10 text-[#3274d9] dark:text-[#5794f2] border border-[#3274d9]/30">
                  <span>
                    Contains: <strong className="font-semibold">{search}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setSearch('');
                      setPage(1);
                    }}
                    className="hover:opacity-75 cursor-pointer text-xs"
                    title="Remove filter"
                  >
                    ✕
                  </button>
                </span>
              )}
              {traceIdFilter && (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30">
                  <span>
                    Trace: <strong className="font-mono">{traceIdFilter.slice(0, 10)}...</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setTraceIdFilter('');
                      setPage(1);
                    }}
                    className="hover:opacity-75 cursor-pointer text-xs"
                    title="Remove filter"
                  >
                    ✕
                  </button>
                </span>
              )}
              {onlyErrors && (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-[#f2495c]/10 text-[#f2495c] border border-[#f2495c]/30">
                  <span>Errors only</span>
                  <button
                    type="button"
                    onClick={() => {
                      setOnlyErrors(false);
                      setPage(1);
                    }}
                    className="hover:opacity-75 cursor-pointer text-xs"
                    title="Remove filter"
                  >
                    ✕
                  </button>
                </span>
              )}
              {onlySlow && (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-[#faad14]/10 text-[#faad14] border border-[#faad14]/30">
                  <span>Slow (≥1s) only</span>
                  <button
                    type="button"
                    onClick={() => {
                      setOnlySlow(false);
                      setPage(1);
                    }}
                    className="hover:opacity-75 cursor-pointer text-xs"
                    title="Remove filter"
                  >
                    ✕
                  </button>
                </span>
              )}
              {onlyWarn && (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-[#f2994a]/10 text-[#f2994a] border border-[#f2994a]/30">
                  <span>Warning only</span>
                  <button
                    type="button"
                    onClick={() => {
                      setOnlyWarn(false);
                      setPage(1);
                    }}
                    className="hover:opacity-75 cursor-pointer text-xs"
                    title="Remove filter"
                  >
                    ✕
                  </button>
                </span>
              )}
              {onlySql && (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-[#73bf69]/10 text-[#73bf69] border border-[#73bf69]/30">
                  <span>SQL queries only</span>
                  <button
                    type="button"
                    onClick={() => {
                      setOnlySql(false);
                      setPage(1);
                    }}
                    className="hover:opacity-75 cursor-pointer text-xs"
                    title="Remove filter"
                  >
                    ✕
                  </button>
                </span>
              )}
              {onlyInfo && (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-[#5794f2]/10 text-[#5794f2] border border-[#5794f2]/30">
                  <span>Info level only</span>
                  <button
                    type="button"
                    onClick={() => {
                      setOnlyInfo(false);
                      setPage(1);
                    }}
                    className="hover:opacity-75 cursor-pointer text-xs"
                    title="Remove filter"
                  >
                    ✕
                  </button>
                </span>
              )}
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setTraceIdFilter('');
                  setOnlyErrors(false);
                  setOnlySlow(false);
                  setOnlyWarn(false);
                  setOnlySql(false);
                  setOnlyInfo(false);
                  setPage(1);
                }}
                className="text-[11px] text-slate-400 hover:text-rose-500 hover:underline transition ml-auto cursor-pointer"
              >
                Clear all filters
              </button>
            </div>
          )}

          {error && (
            <div className="rounded border border-[#f2495c]/40 bg-[#f2495c]/10 p-3 text-xs text-[#f2495c] flex items-center justify-between">
              <span>{error}</span>
              <Button
                size="sm"
                variant="outline"
                onClick={refetchTraces}
                className="h-7 text-xs border-[#f2495c]/40 text-[#f2495c] hover:bg-[#f2495c]/20"
              >
                Retry
              </Button>
            </div>
          )}

          <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-2.5">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <TabsList className="dark:bg-[#181b1f] bg-white border dark:border-[#22252b] border-slate-200 h-8 p-0.5 rounded shadow-sm">
                <TabsTrigger
                  value="waterfall"
                  className="text-xs h-7 rounded data-[state=active]:bg-[#3274d9] data-[state=active]:text-white dark:data-[state=active]:bg-[#22252b] dark:data-[state=active]:text-[#5794f2] dark:data-[state=active]:border dark:data-[state=active]:border-[#3274d9] font-medium"
                >
                  <Layers className="h-3.5 w-3.5 mr-1.5" />
                  APM Traces ({displayedTraces.length})
                </TabsTrigger>
                <TabsTrigger
                  value="raw"
                  className="text-xs h-7 rounded data-[state=active]:bg-[#3274d9] data-[state=active]:text-white dark:data-[state=active]:bg-[#22252b] dark:data-[state=active]:text-[#5794f2] dark:data-[state=active]:border dark:data-[state=active]:border-[#3274d9] font-medium"
                >
                  <Terminal className="h-3.5 w-3.5 mr-1.5" />
                  Logs &amp; Table ({allEvents.length})
                </TabsTrigger>
                <TabsTrigger
                  value="client"
                  className="text-xs h-7 rounded data-[state=active]:bg-[#3274d9] data-[state=active]:text-white dark:data-[state=active]:bg-[#22252b] dark:data-[state=active]:text-[#5794f2] dark:data-[state=active]:border dark:data-[state=active]:border-[#3274d9] font-medium"
                >
                  <Laptop className="h-3.5 w-3.5 mr-1.5" />
                  Client FE Logs
                </TabsTrigger>
                <TabsTrigger
                  value="routes"
                  className="text-xs h-7 rounded data-[state=active]:bg-[#3274d9] data-[state=active]:text-white dark:data-[state=active]:bg-[#22252b] dark:data-[state=active]:text-[#5794f2] dark:data-[state=active]:border dark:data-[state=active]:border-[#3274d9] font-medium"
                >
                  <Network className="h-3.5 w-3.5 mr-1.5" />
                  Route Analytics
                </TabsTrigger>
              </TabsList>

              <div className="flex items-center gap-2 text-xs">
                <span className="dark:text-[#8e94a0] text-slate-500 font-sans">
                  Total:{' '}
                  <strong className="dark:text-white text-slate-900">{totalTracesCount}</strong>{' '}
                  traces (Page{' '}
                  <strong className="text-[#3274d9] dark:text-[#5794f2]">{page}</strong>/
                  {totalPages})
                </span>
                <div className="flex items-center gap-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={page <= 1 || loading}
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        className="h-7 px-2 dark:border-[#2c323f] border-slate-300 dark:bg-[#181b1f] bg-white dark:text-[#c7d0d9] text-slate-700 hover:dark:bg-[#22252b] hover:bg-slate-50 disabled:opacity-40 rounded"
                      >
                        <ChevronLeft className="h-3.5 w-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Previous page</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={page >= totalPages || loading}
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        className="h-7 px-2 dark:border-[#2c323f] border-slate-300 dark:bg-[#181b1f] bg-white dark:text-[#c7d0d9] text-slate-700 hover:dark:bg-[#22252b] hover:bg-slate-50 disabled:opacity-40 rounded"
                      >
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Next page</TooltipContent>
                  </Tooltip>
                </div>
              </div>
            </div>

            <TabsContent value="waterfall" className="m-0 space-y-2">
              {loading && displayedTraces.length === 0 ? (
                <div className="rounded-xl border dark:border-[#22252b] border-slate-200 dark:bg-[#181b1f] bg-white p-12 text-center dark:text-slate-400 text-slate-500 text-xs shadow-sm">
                  <Activity className="h-6 w-6 animate-spin text-[#3274d9] dark:text-[#5794f2] mx-auto mb-2" />
                  Scanning and grouping APM Traces from structured log files...
                </div>
              ) : displayedTraces.length === 0 ? (
                <div className="rounded-xl border dark:border-[#22252b] border-slate-200 dark:bg-[#181b1f] bg-white p-12 text-center text-slate-500 text-xs space-y-2 shadow-sm">
                  <div className="dark:text-slate-300 text-slate-700 font-medium">
                    No Trace records found.
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Try changing the date, selecting another API endpoint, clearing search filters,
                    or checking server log files.
                  </p>
                </div>
              ) : (
                <div
                  className={`space-y-2.5 transition-opacity duration-200 ${loading ? 'opacity-70' : 'opacity-100'}`}
                >
                  {displayedTraces.map((trace) => (
                    <TraceWaterfallItem
                      key={trace.traceId}
                      trace={trace}
                      onInspect={handleOpenInspect}
                      onFilterTraceId={handleTraceIdChange}
                    />
                  ))}
                </div>
              )}

              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t dark:border-[#22252b] border-slate-200 pt-3 text-xs dark:text-slate-400 text-slate-600">
                  <span>
                    Showing {(page - 1) * pageSize + 1} -{' '}
                    {Math.min(page * pageSize, totalTracesCount)} of {totalTracesCount} Traces
                  </span>
                  <div className="flex items-center gap-1.5">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={page <= 1 || loading}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className="h-7 text-xs dark:border-[#2c323f] border-slate-300 dark:bg-[#181b1f] bg-white dark:text-[#c7d0d9] text-slate-700 hover:dark:bg-[#22252b] hover:bg-slate-50 rounded"
                    >
                      <ChevronLeft className="h-3.5 w-3.5 mr-1" /> Previous
                    </Button>
                    <span className="px-2 font-sans font-medium text-[#3274d9] dark:text-[#5794f2]">
                      {page} / {totalPages}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={page >= totalPages || loading}
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      className="h-7 text-xs dark:border-[#2c323f] border-slate-300 dark:bg-[#181b1f] bg-white dark:text-[#c7d0d9] text-slate-700 hover:dark:bg-[#22252b] hover:bg-slate-50 rounded"
                    >
                      Next <ChevronRight className="h-3.5 w-3.5 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="raw" className="m-0">
              <LogStreamView events={allEvents} onInspect={handleOpenInspect} />
            </TabsContent>

            <TabsContent value="client" className="m-0">
              <ClientLogsTab />
            </TabsContent>

            <TabsContent value="routes" className="m-0">
              <RouteAnalyticsTab
                traces={traces}
                onFilterPath={(path) => {
                  setSearch(path);
                  handleTabChange('waterfall');
                  setPage(1);
                }}
                onInspectTrace={(tr) => {
                  setInspectTrace(tr);
                  setIsSheetOpen(true);
                }}
              />
            </TabsContent>
          </Tabs>
        </div>

        <TraceDetailSheet
          trace={inspectTrace}
          isOpen={isSheetOpen}
          onClose={() => setIsSheetOpen(false)}
        />

        <FilesModal
          isOpen={isFilesModalOpen}
          onClose={() => setIsFilesModalOpen(false)}
          selectedDate={selectedDate}
        />
      </div>
    </TooltipProvider>
  );
}
