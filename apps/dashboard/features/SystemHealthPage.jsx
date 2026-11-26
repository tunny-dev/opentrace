import { useState, useEffect } from 'react';
import { systemLogsService } from '@/services/system-logs.service';
import { useSystemLogDates } from '@/hooks/useSystemLogs';
import { CimdevAuthModal } from '@/features/system-logs/components/CimdevAuthModal';
import { TraceFilterToolbar } from '@/features/system-logs/components/TraceFilterToolbar';
import { SystemHealthTab } from '@/features/system-logs/components/SystemHealthTab';
import { FilesModal } from '@/features/system-logs/components/FilesModal';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useTheme } from '@/hooks/useTheme';

export function SystemHealthPage() {
  const { resolvedTheme, toggleTheme } = useTheme();

  useEffect(() => {
    const prevTitle = document.title;
    document.title = 'SpurTrace | System Health & Probes';
    return () => {
      document.title = prevTitle;
    };
  }, []);

  const [isAuthenticated, setIsAuthenticated] = useState(() => systemLogsService.isAuthenticated());
  const [showAuthModal, setShowAuthModal] = useState(!isAuthenticated);
  const [isFilesModalOpen, setIsFilesModalOpen] = useState(false);

  const [selectedDate, setSelectedDate] = useState('');
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

  useEffect(() => {
    if (datesError?.message === 'UNAUTHORIZED') {
      systemLogsService.clearAuth();
      setIsAuthenticated(false);
      setShowAuthModal(true);
    }
  }, [datesError]);

  const handleAuthSuccess = async (u, p) => {
    if (u && p) {
      systemLogsService.setStoredAuth(u, p);
    }
    setIsAuthenticated(true);
    setShowAuthModal(false);
    refetchDates();
  };

  const handleLogout = () => {
    systemLogsService.clearAuth();
    setIsAuthenticated(false);
    setShowAuthModal(true);
  };

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
          onRefresh={refetchDates}
          loading={false}
          onOpenFiles={() => setIsFilesModalOpen(true)}
          onLogout={handleLogout}
          resolvedTheme={resolvedTheme}
          toggleTheme={toggleTheme}
        />

        <div className="w-full px-4 py-4 sm:px-6">
          <SystemHealthTab selectedDate={timeRange.date || selectedDate} dates={dates} />
        </div>

        <FilesModal
          isOpen={isFilesModalOpen}
          onClose={() => setIsFilesModalOpen(false)}
          selectedDate={selectedDate}
        />
      </div>
    </TooltipProvider>
  );
}

export default SystemHealthPage;
