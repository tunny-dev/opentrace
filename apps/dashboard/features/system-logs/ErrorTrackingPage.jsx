"use client";

import { useState, useEffect } from 'react';
import { useNavigate } from '@/features/system-logs/compat-router';
import { systemLogsService } from '@/services/system-logs.service';
import { useSystemLogDates, useSystemLogTraces } from '@/hooks/useSystemLogs';
import { CimdevAuthModal } from '@/features/system-logs/components/CimdevAuthModal';
import { TraceFilterToolbar } from '@/features/system-logs/components/TraceFilterToolbar';
import { ErrorTrackingTab } from '@/features/system-logs/components/ErrorTrackingTab';
import { TraceDetailSheet } from '@/features/system-logs/components/TraceDetailSheet';
import { FilesModal } from '@/features/system-logs/components/FilesModal';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useTheme } from '@/hooks/useTheme';

export function ErrorTrackingPage() {
  const navigate = useNavigate();
  const { resolvedTheme, toggleTheme } = useTheme();

  useEffect(() => {
    const prevTitle = document.title;
    document.title = 'Error Tracking & Exception Triage | MES APM';
    return () => {
      document.title = prevTitle;
    };
  }, []);

  const [mounted, setMounted] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    setMounted(true);
    const authed = systemLogsService.isAuthenticated();
    setIsAuthenticated(authed);
    setShowAuthModal(!authed);
  }, []);
  const [isFilesModalOpen, setIsFilesModalOpen] = useState(false);
  const [inspectTrace, setInspectTrace] = useState(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

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
    search,
    onlyErrors: true,
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
    setIsAuthenticated(false);
    setShowAuthModal(true);
  };

  const traces = tracesData?.traces || [];

  if (!mounted) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#111217] text-sm text-slate-400">
        Loading Error Tracking...
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={150}>
      <div className="min-h-screen bg-slate-50 dark:bg-[#111217] text-slate-900 dark:text-[#c7d0d9] font-sans antialiased transition-colors">
        <CimdevAuthModal
          isOpen={showAuthModal}
          onSuccess={handleAuthSuccess}
          onCancel={() => {
            if (!isAuthenticated) {
              window.location.href = '/';
            } else {
              setShowAuthModal(false);
            }
          }}
        />

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
          <ErrorTrackingTab
            traces={traces}
            onInspectTrace={(tr) => {
              setInspectTrace(tr);
              setIsSheetOpen(true);
            }}
            onFilterErrorInTraces={(errType) => {
              navigate(`/system-logs?search=${encodeURIComponent(errType)}`);
            }}
          />
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

export default ErrorTrackingPage;
