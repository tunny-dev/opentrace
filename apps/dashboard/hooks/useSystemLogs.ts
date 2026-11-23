import { useQuery } from '@tanstack/react-query';
import { systemLogsService } from '@/services/system-logs.service';

/**
 * Query Key Factory chuẩn hóa cho phân hệ System Logs.
 */
export const systemLogKeys = {
  all: ['system-logs'],
  dates: () => [...systemLogKeys.all, 'dates'],
  traces: (params: any) => [...systemLogKeys.all, 'traces', params],
  files: (date?: string) => [...systemLogKeys.all, 'files', date ?? ''],
};

export const SYSTEM_LOG_KEYS = systemLogKeys;

/**
 * React Query hook: Fetch available log dates from server
 */
export function useSystemLogDates(options: any = {}) {
  return useQuery({
    queryKey: systemLogKeys.dates(),
    queryFn: () => systemLogsService.getDates(),
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
    ...options,
  });
}

/**
 * React Query hook: Fetch traces with time range, pagination and filters.
 * Supports auto-refresh polling interval and placeholderData for smooth paging.
 */
export function useSystemLogTraces({
  date,
  from,
  to,
  search,
  traceId,
  onlyErrors,
  onlySlow,
  onlySql,
  onlyInfo,
  onlyWarn,
  page = 1,
  pageSize = 20,
  autoRefreshInterval = 0,
  enabled = true,
}: any) {
  const queryParams = {
    date,
    from,
    to,
    search: search || undefined,
    traceId,
    onlyErrors: Boolean(onlyErrors),
    onlySlow: Boolean(onlySlow),
    onlySql: Boolean(onlySql),
    onlyInfo: Boolean(onlyInfo),
    onlyWarn: Boolean(onlyWarn),
    page,
    pageSize,
  };

  return useQuery({
    queryKey: systemLogKeys.traces(queryParams),
    queryFn: async () => {
      return systemLogsService.getTraces(queryParams);
    },
    enabled: !!enabled,
    refetchInterval: autoRefreshInterval > 0 ? autoRefreshInterval * 1000 : false,
    refetchOnWindowFocus: false,
    placeholderData: (previousData) => previousData,
    staleTime: 5000,
    retry: 1,
  });
}

/**
 * React Query hook: Fetch files in a specific date folder
 */
export function useSystemLogFiles(date?: string, options: any = {}) {
  return useQuery({
    queryKey: systemLogKeys.files(date),
    queryFn: () => systemLogsService.getFiles(date),
    enabled: !!date,
    staleTime: 30 * 1000,
    ...options,
  });
}
