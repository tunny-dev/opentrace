"use client";

import { useState, useEffect } from 'react';
import { useNavigate } from '@/features/system-logs/compat-router';
import { systemLogsService } from '@/services/system-logs.service';
import { useSystemLogDates, useSystemLogTraces } from '@/hooks/useSystemLogs';
import { CimdevAuthModal } from '@/features/system-logs/components/CimdevAuthModal';
import { TraceFilterToolbar } from '@/features/system-logs/components/TraceFilterToolbar';
import { SqlAnalyticsTab } from '@/features/system-logs/components/SqlAnalyticsTab';
import { SqlStudioModal } from '@/features/system-logs/components/SqlStudioModal';
import { FilesModal } from '@/features/system-logs/components/FilesModal';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useTheme } from '@/hooks/useTheme';

export function SqlAnalyticsPage() {
  const navigate = useNavigate();
  const { resolvedTheme, toggleTheme } = useTheme();

  useEffect(() => {
    const prevTitle = document.title;
    document.title = 'SpurTrace | SQL Performance Hub';
    return () => {
      document.title = prevTitle;
    };
  }, []);

  const [mounted, setMounted] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isFilesModalOpen, setIsFilesModalOpen] = useState(false);
  const [studioQuery, setStudioQuery] = useState(null);

  const [selectedDate, setSelectedDate] = useState('');
  const [search, setSearch] = useState('');
  const [timeRange, setTimeRange] = useState({
    from: 'now-24h',
    to: 'now',
    label: 'Last 24 hours',
    spanMs: 24 * 3600 * 1000,
    date: '',
  });

  const {
    data: dates = [],
    refetch: refetchDates,
    error: datesError,
  } = useSystemLogDates({
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (dates && dates.length > 0 && !selectedDate) {
      setSelectedDate(dates[0]);
    }
  }, [dates, selectedDate]);

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
    search: search || undefined,
    onlySql: true,
    page: 1,
    pageSize: 500,
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (datesError?.message === 'UNAUTHORIZED' || tracesError?.message === 'UNAUTHORIZED') {
      systemLogsService.clearAuth();
      setIsAuthenticated(false);
      setShowAuthModal(true);
    }
  }, [datesError, tracesError]);

  const handleAuthSuccess = async (u, p) => {
    if (u && p) {
      systemLogsService.setStoredAuth(u, p);
    }
    setIsAuthenticated(true);
    setShowAuthModal(false);
    refetchDates();
    refetchTraces();
  };

  const handleLogout = () => {
    systemLogsService.clearAuth();
    if (typeof window !== 'undefined') {
      window.location.href = '/telemetry/login';
    }
  };

  const traces = tracesData?.traces || [];

  if (!mounted) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#111217] text-sm text-slate-400">
        Loading SQL Performance Hub...
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={150}>
      <div className="min-h-screen bg-slate-50 dark:bg-[#111217] text-slate-900 dark:text-[#c7d0d9] font-sans antialiased transition-colors">
        <TraceFilterToolbar
          isSubPage={true}
          dates={dates}
          timeRange={timeRange}
          onChangeTimeRange={(newRange) => {
            setTimeRange(newRange);
            if (newRange.date) setSelectedDate(newRange.date);
          }}
          search={search}
          onSearchChange={setSearch}
          onRefresh={refetchTraces}
          loading={isLoading || isFetching}
          onOpenFiles={() => setIsFilesModalOpen(true)}
          onLogout={handleLogout}
          resolvedTheme={resolvedTheme}
          toggleTheme={toggleTheme}
        />

        <div className="w-full px-4 py-4 sm:px-6">
          <SqlAnalyticsTab
            traces={traces}
            onOpenStudioWithQuery={(q) => setStudioQuery(q)}
            onFilterQueryInTraces={(qText) => {
              navigate(`/system-logs?search=${encodeURIComponent(qText)}`);
            }}
          />
        </div>

        {studioQuery && (
          <SqlStudioModal
            isOpen={!!studioQuery}
            onClose={() => setStudioQuery(null)}
            initialIndex={0}
            sqlEvents={[
              {
                sql:
                  studioQuery.sql ||
                  studioQuery.sampleSql ||
                  studioQuery.query ||
                  studioQuery.rawSql ||
                  '',
                paramsJson: (() => {
                  let p = studioQuery.paramsJson || studioQuery.parameters || {};
                  if (typeof p === 'string' && p.trim()) {
                    try { p = JSON.parse(p); } catch { p = {}; }
                  }
                  if (!p || typeof p !== 'object') p = {};
                  const sql = studioQuery.sql || studioQuery.sampleSql || studioQuery.query || studioQuery.rawSql || '';
                  const matches = sql.match(/@([a-zA-Z0-9_]+)/g);
                  if (matches) {
                    matches.forEach((m) => {
                      const pName = m.substring(1);
                      if (!(pName in p) && !(`@${pName}` in p)) {
                        p[pName] = pName.toLowerCase().includes('lang') ? 'zh-TW' : '';
                      }
                    });
                  }
                  return JSON.stringify(p, null, 2);
                })(),
                durationMs: Math.round(
                  Number(
                    studioQuery.durationMs ||
                      studioQuery.avgDurationMs ||
                      studioQuery.avgDuration ||
                      0
                  )
                ),
                eventType: 'sql',
              },
            ]}
            trace={{
              traceId:
                studioQuery.sampleTrace?.traceId ||
                studioQuery.fingerprint ||
                'SQL-ANALYTICS-STUDIO',
              path:
                studioQuery.sampleTrace?.path || studioQuery.sampleRoute || '/api/sql-analytics',
              method: studioQuery.sampleTrace?.method || 'GET',
            }}
          />
        )}

        <FilesModal
          isOpen={isFilesModalOpen}
          onClose={() => setIsFilesModalOpen(false)}
          selectedDate={selectedDate}
        />
      </div>
    </TooltipProvider>
  );
}

export default SqlAnalyticsPage;
