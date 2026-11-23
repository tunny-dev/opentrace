import { useState, useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import PropTypes from 'prop-types';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Search,
  RefreshCw,
  FolderOpen,
  Activity,
  Sun,
  Moon,
  Layers,
  Database,
  AlertCircle,
  ExternalLink,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { TimeRangePicker } from '@/features/system-logs/components/TimeRangePicker';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import { cn } from '@/core/utils/utils';
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';

export function TraceFilterToolbar({
  dates = [],
  timeRange,
  onChangeTimeRange,
  search = '',
  onSearchChange,
  traceIdFilter = '',
  onTraceIdFilterChange,
  onlyErrors = false,
  onOnlyErrorsChange,
  onlySlow = false,
  onOnlySlowChange,
  onlySql = false,
  onOnlySqlChange,
  onlyInfo = false,
  onOnlyInfoChange,
  onlyWarn = false,
  onOnlyWarnChange,
  pageSize = 20,
  onPageSizeChange,
  onRefresh,
  loading = false,
  onOpenFiles,
  onLogout,
  autoRefreshInterval = 0,
  onAutoRefreshChange,
  resolvedTheme = 'dark',
  toggleTheme,
  isSubPage = false,
}) {
  const location = useLocation();
  const isSystemLogsActive =
    location.pathname === '/system-logs' ||
    location.pathname === '/system/logs' ||
    /^\/system(-logs)?\/(traces|routes|stream|raw|client)/.test(location.pathname);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const queryForm = useForm({
    resolver: zodResolver(z.object({ query: z.string().trim() })),
    defaultValues: { query: search || traceIdFilter || '' },
  });
  const queryDraft = useWatch({ control: queryForm.control, name: 'query' });
  const resetQuery = queryForm.reset;

  useEffect(() => {
    resetQuery({ query: search || traceIdFilter || '' });
  }, [resetQuery, search, traceIdFilter]);

  const executeQuery = ({ query }) => {
    if (typeof onSearchChange === 'function') {
      onSearchChange(query);
    }
    if (/^[a-fA-F0-9]{32}$/.test(query)) {
      if (typeof onTraceIdFilterChange === 'function') onTraceIdFilterChange(query);
    } else if (typeof onTraceIdFilterChange === 'function') {
      onTraceIdFilterChange('');
    }
    if (typeof onRefresh === 'function') onRefresh();
  };
  const handleExecuteQuery = queryForm.handleSubmit(executeQuery);

  const handleClearQuery = () => {
    queryForm.reset({ query: '' });
    if (typeof onSearchChange === 'function') {
      onSearchChange('');
    }
    if (typeof onTraceIdFilterChange === 'function') onTraceIdFilterChange('');
    if (typeof onRefresh === 'function') onRefresh();
  };

  const quickFilters = [
    {
      id: 'all',
      label: 'All Logs',
      query: '{layer="all"}',
      active: !onlyErrors && !onlySlow && !onlySql && !onlyInfo && !onlyWarn,
      onClick: () => {
        onOnlyErrorsChange(false);
        onOnlySlowChange(false);
        if (onOnlySqlChange) onOnlySqlChange(false);
        if (onOnlyInfoChange) onOnlyInfoChange(false);
        if (onOnlyWarnChange) onOnlyWarnChange(false);
      },
    },
    {
      id: 'sql',
      label: '{layer="SQL"}',
      query: '{layer="database_sql"}',
      active: !!onlySql,
      color: 'text-[#73bf69] border-[#73bf69]/40 bg-[#73bf69]/10 hover:bg-[#73bf69]/20',
      onClick: () => {
        if (onOnlySqlChange) onOnlySqlChange(!onlySql);
      },
    },
    {
      id: 'slow',
      label: '{duration ≥ 1s}',
      query: '{latency>=1000ms}',
      active: onlySlow,
      color: 'text-[#faad14] border-[#faad14]/40 bg-[#faad14]/10 hover:bg-[#faad14]/20',
      onClick: () => onOnlySlowChange(!onlySlow),
    },
    {
      id: 'error',
      label: '{level="error"}',
      query: '{status>=400 | has_error}',
      active: onlyErrors,
      color: 'text-[#f2495c] border-[#f2495c]/40 bg-[#f2495c]/10 hover:bg-[#f2495c]/20',
      onClick: () => onOnlyErrorsChange(!onlyErrors),
    },
    {
      id: 'warn',
      label: '{level="warn"}',
      query: '{level="warning"}',
      active: !!onlyWarn,
      color: 'text-[#f2994a] border-[#f2994a]/40 bg-[#f2994a]/10 hover:bg-[#f2994a]/20',
      onClick: () => {
        if (onOnlyWarnChange) onOnlyWarnChange(!onlyWarn);
      },
    },
    {
      id: 'info',
      label: '{level="info"}',
      query: '{level="information"}',
      active: !!onlyInfo,
      color: 'text-[#5794f2] border-[#5794f2]/40 bg-[#5794f2]/10 hover:bg-[#5794f2]/20',
      onClick: () => {
        if (onOnlyInfoChange) onOnlyInfoChange(!onlyInfo);
      },
    },
  ];

  return (
    <TooltipProvider delayDuration={150}>
      <div className="sticky top-0 z-30 w-full rounded-none border-b dark:border-[#22252b] border-slate-200 dark:bg-[#181b1f]/98 bg-white/98 backdrop-blur-md px-4 py-2.5 sm:px-6 shadow-sm transition-colors space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b dark:border-[#22252b] border-slate-200 pb-2.5">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-[#f4f5f7]">
              <div className="flex h-7 w-7 items-center justify-center rounded bg-[#3274d9] text-white shadow-sm">
                <Activity className="h-4 w-4" />
              </div>
              <span className="tracking-tight hidden sm:inline">MES APM</span>
            </div>

            <nav className="flex items-center gap-1 bg-slate-100 dark:bg-[#111217] p-0.5 rounded-lg border border-slate-200 dark:border-[#2c323f]">
              <NavLink
                to="/system-logs"
                className={cn(
                  'px-2.5 py-1 text-xs font-medium rounded transition flex items-center gap-1.5',
                  isSystemLogsActive
                    ? 'bg-white dark:bg-[#22252b] text-[#3274d9] dark:text-[#5794f2] shadow-xs font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                )}
              >
                <Layers className="h-3.5 w-3.5" />
                <span>System Logs</span>
              </NavLink>
              <NavLink
                to="/system-logs/sql"
                className={({ isActive }) =>
                  cn(
                    'px-2.5 py-1 text-xs font-medium rounded transition flex items-center gap-1.5',
                    isActive
                      ? 'bg-white dark:bg-[#22252b] text-[#3274d9] dark:text-[#5794f2] shadow-xs font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  )
                }
              >
                <Database className="h-3.5 w-3.5" />
                <span>SQL Analytics</span>
              </NavLink>
              <NavLink
                to="/system-logs/errors"
                className={({ isActive }) =>
                  cn(
                    'px-2.5 py-1 text-xs font-medium rounded transition flex items-center gap-1.5',
                    isActive
                      ? 'bg-white dark:bg-[#22252b] text-[#3274d9] dark:text-[#5794f2] shadow-xs font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  )
                }
              >
                <AlertCircle className="h-3.5 w-3.5" />
                <span>Error Tracking</span>
              </NavLink>
              <NavLink
                to="/system-logs/health"
                className={({ isActive }) =>
                  cn(
                    'px-2.5 py-1 text-xs font-medium rounded transition flex items-center gap-1.5',
                    isActive
                      ? 'bg-white dark:bg-[#22252b] text-[#3274d9] dark:text-[#5794f2] shadow-xs font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  )
                }
              >
                <Activity className="h-3.5 w-3.5" />
                <span>System Health</span>
              </NavLink>
            </nav>
            <a
              href={import.meta.env.VITE_OPENTRACE_URL || 'http://localhost:4175/_telemetry'}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 py-1 text-xs font-semibold rounded transition flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30"
              title="Mở bảng điều khiển OpenTrace APM trực tiếp"
            >
              <Zap className="h-3.5 w-3.5 text-emerald-500 fill-emerald-500/30" />
              <span>OpenTrace APM</span>
              <ExternalLink className="h-3 w-3 opacity-70" />
            </a>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {!isSubPage && onPageSizeChange && (
              <div className="flex items-center gap-1.5 rounded border dark:border-[#2c323f] border-slate-300 dark:bg-[#111217] bg-slate-50 px-2 py-0.5 text-xs">
                <span className="text-[11px] dark:text-[#8e94a0] text-slate-500">Rows/page:</span>
                <Select
                  value={String(pageSize)}
                  onValueChange={(val) => onPageSizeChange(Number(val))}
                >
                  <SelectTrigger className="h-6 border-0 bg-transparent px-1 py-0 text-[11px] font-sans text-cyan-600 dark:text-[#5794f2] focus-visible:ring-0">
                    <SelectValue placeholder="20" />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-[#181b1f] bg-white dark:border-[#2c323f] border-slate-200 dark:text-slate-200 text-slate-800">
                    <SelectItem value="20" className="text-xs">
                      20
                    </SelectItem>
                    <SelectItem value="50" className="text-xs">
                      50
                    </SelectItem>
                    <SelectItem value="100" className="text-xs">
                      100
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <TimeRangePicker
              timeRange={timeRange}
              onChangeTimeRange={onChangeTimeRange}
              availableDates={dates}
            />

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  onClick={handleExecuteQuery}
                  disabled={loading}
                  className="h-8 px-3.5 bg-[#3274d9] hover:bg-[#2463eb] text-white font-medium text-xs rounded shadow-sm flex items-center gap-1.5 shrink-0 cursor-pointer transition active:scale-95 disabled:opacity-60"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
                  <span>Run query</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Execute search query (Shortcut: Enter)</TooltipContent>
            </Tooltip>

            {!isSubPage && onAutoRefreshChange && (
              <div className="flex items-center gap-1.5 rounded border dark:border-[#2c323f] border-slate-300 dark:bg-[#111217] bg-slate-50 px-2 py-0.5 text-xs">
                <span
                  className={`h-2 w-2 rounded-full ${
                    autoRefreshInterval > 0 ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
                  }`}
                />
                <span className="text-[11px] dark:text-[#8e94a0] text-slate-500">Live:</span>
                <Select
                  value={String(autoRefreshInterval)}
                  onValueChange={(val) => onAutoRefreshChange(Number(val))}
                >
                  <SelectTrigger className="h-6 border-0 bg-transparent px-1 py-0 text-[11px] font-sans text-emerald-500 dark:text-emerald-400 font-medium focus-visible:ring-0">
                    <SelectValue placeholder="Off" />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-[#181b1f] bg-white dark:border-[#2c323f] border-slate-200 dark:text-slate-200 text-slate-800">
                    <SelectItem value="0" className="text-xs">
                      Off
                    </SelectItem>
                    <SelectItem value="5" className="text-xs">
                      5s
                    </SelectItem>
                    <SelectItem value="10" className="text-xs">
                      10s
                    </SelectItem>
                    <SelectItem value="30" className="text-xs">
                      30s
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onOpenFiles}
                  className="h-8 text-xs dark:border-[#2c323f] border-slate-300 dark:bg-[#111217] bg-slate-50 dark:text-[#c7d0d9] text-slate-700 hover:text-slate-900 dark:hover:text-white"
                >
                  <FolderOpen className="h-3.5 w-3.5 mr-1 text-[#5794f2]" />
                  Log Files
                </Button>
              </TooltipTrigger>
              <TooltipContent>Browse raw server log files on disk</TooltipContent>
            </Tooltip>

            {toggleTheme && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={toggleTheme}
                    className="h-8 w-8 p-0 rounded dark:border-[#2c323f] border-slate-300 dark:bg-[#111217] bg-slate-50 dark:text-[#8e94a0] text-slate-700 hover:text-slate-900 dark:hover:text-white"
                  >
                    {resolvedTheme === 'dark' ? (
                      <Sun className="h-3.5 w-3.5 text-amber-400" />
                    ) : (
                      <Moon className="h-3.5 w-3.5 text-blue-600" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {resolvedTheme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                </TooltipContent>
              </Tooltip>
            )}

            <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <AlertDialogTrigger
                    render={
                      <button
                        type="button"
                        className="relative flex items-center gap-1.5 rounded-full ring-1 dark:ring-[#2c323f] ring-slate-300 hover:ring-[#3274d9] transition cursor-pointer p-0.5 ml-1"
                      >
                        <Avatar className="h-7 w-7 border dark:border-[#2c323f] border-slate-300">
                          <AvatarFallback className="bg-gradient-to-tr from-[#3274d9] to-blue-700 text-white font-bold text-[11px]">
                            AD
                          </AvatarFallback>
                        </Avatar>
                        <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-emerald-500 ring-2 dark:ring-[#181b1f] ring-white" />
                      </button>
                    }
                  />
                </TooltipTrigger>
                <TooltipContent>Administrator profile (Click to sign out)</TooltipContent>
              </Tooltip>

              <AlertDialogContent className="dark:bg-[#181b1f] bg-white dark:border-[#2c323f] border-slate-200 dark:text-slate-200 text-slate-800">
                <AlertDialogHeader>
                  <AlertDialogTitle className="dark:text-white text-slate-900 text-base">
                    Confirm Sign Out
                  </AlertDialogTitle>
                  <AlertDialogDescription className="dark:text-slate-400 text-slate-600 text-sm">
                    Are you sure you want to sign out of the administrator session? You will need to
                    enter administrator credentials again to access system logs.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="mt-4 flex gap-2 justify-end">
                  <AlertDialogCancel className="dark:border-[#2c323f] border-slate-300 dark:bg-[#111217] bg-slate-100 dark:text-slate-300 text-slate-700">
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={onLogout}
                    className="bg-rose-600 hover:bg-rose-500 text-white font-medium"
                  >
                    Sign Out
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {!isSubPage && (
          <div className="rounded border dark:border-[#22252b] border-slate-200 dark:bg-[#181b1f] bg-white p-3 space-y-2.5 shadow-sm">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] dark:text-[#8e94a0] text-slate-500 mr-1 select-none font-medium">
                Label filters:
              </span>
              {quickFilters.map((p) => (
                <button
                  key={p.id}
                  onClick={p.onClick}
                  type="button"
                  className={`rounded px-2.5 py-0.5 text-xs font-sans transition border cursor-pointer ${
                    p.active
                      ? p.color || 'bg-[#3274d9]/20 text-[#5794f2] border-[#3274d9] font-medium'
                      : 'dark:bg-[#111217] bg-slate-50 dark:text-[#8e94a0] text-slate-600 dark:border-[#2c323f] border-slate-300 hover:dark:text-white hover:dark:bg-[#22252b]'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            <form
              onSubmit={handleExecuteQuery}
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2"
            >
              <label
                htmlFor="trace-query-filter"
                className="flex items-center gap-1 text-[11px] dark:text-[#8e94a0] text-slate-500 shrink-0 font-medium"
              >
                <span>Line contains</span>
                <span className="text-slate-500">:</span>
              </label>
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-[#8e94a0] pointer-events-none" />
                <Input
                  id="trace-query-filter"
                  type="text"
                  aria-invalid={Boolean(queryForm.formState.errors.query)}
                  {...queryForm.register('query')}
                  placeholder="Text to find (SQL query, parameters, URL path, WO, Model, Exception, or Trace ID)..."
                  className="pl-8 pr-20 h-7 text-xs font-sans dark:bg-[#111217] bg-slate-50 dark:border-[#2c323f] border-slate-300 dark:text-white text-slate-900 placeholder:text-slate-500 focus-visible:border-[#3274d9] rounded"
                />
                <div className="absolute right-2 top-1.5 flex items-center gap-1.5">
                  {queryDraft && (
                    <button
                      onClick={handleClearQuery}
                      type="button"
                      className="h-4 w-4 rounded-full flex items-center justify-center text-[10px] text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
                      title="Clear input"
                    >
                      ✕
                    </button>
                  )}
                  <kbd className="hidden sm:inline-block px-1.5 py-0.2 text-[9px] font-sans text-slate-400 border border-slate-300 dark:border-slate-700 rounded bg-slate-100 dark:bg-slate-800 select-none">
                    ↵ Enter
                  </kbd>
                </div>
              </div>
            </form>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}

TraceFilterToolbar.propTypes = {
  dates: PropTypes.array,
  timeRange: PropTypes.object,
  onChangeTimeRange: PropTypes.func,
  search: PropTypes.string,
  onSearchChange: PropTypes.func,
  traceIdFilter: PropTypes.string,
  onTraceIdFilterChange: PropTypes.func,
  onlyErrors: PropTypes.bool,
  onOnlyErrorsChange: PropTypes.func,
  onlySlow: PropTypes.bool,
  onOnlySlowChange: PropTypes.func,
  onlySql: PropTypes.bool,
  onOnlySqlChange: PropTypes.func,
  onlyInfo: PropTypes.bool,
  onOnlyInfoChange: PropTypes.func,
  onlyWarn: PropTypes.bool,
  onOnlyWarnChange: PropTypes.func,
  pageSize: PropTypes.number,
  onPageSizeChange: PropTypes.func,
  onRefresh: PropTypes.func.isRequired,
  loading: PropTypes.bool,
  onOpenFiles: PropTypes.func.isRequired,
  onLogout: PropTypes.func.isRequired,
  autoRefreshInterval: PropTypes.number,
  onAutoRefreshChange: PropTypes.func,
  resolvedTheme: PropTypes.string,
  toggleTheme: PropTypes.func,
  isSubPage: PropTypes.bool,
};
