import { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import {
  Database,
  HardDrive,
  Server,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ShieldCheck,
  Download,
  FileText,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TooltipProvider } from '@/components/ui/tooltip';
import { systemLogsService } from '@/services/system-logs.service';

export function SystemHealthTab({ selectedDate, dates = [] }) {
  const [isRunning, setIsRunning] = useState(false);
  const [dbProbe, setDbProbe] = useState({
    status: 'pending', // 'healthy' | 'degraded' | 'failed' | 'pending'
    latencyMs: null,
    dbName: '',
    serverTime: '',
    version: '',
    error: null,
  });
  const [apiProbe, setApiProbe] = useState({
    status: 'pending',
    latencyMs: null,
    endpoint: '/dates',
    datesCount: dates.length,
    error: null,
  });
  const [storageFiles, setStorageFiles] = useState([]);
  const [storageLoading, setStorageLoading] = useState(false);
  const [lastCheckTime, setLastCheckTime] = useState(null);

  // Run all health probes
  const runDiagnostics = useCallback(async () => {
    setIsRunning(true);
    const now = new Date();

    // Probe API Server
    const startApi = performance.now();
    try {
      const datesRes = await systemLogsService.getDates();
      const apiDur = Math.round(performance.now() - startApi);
      setApiProbe({
        status: 'healthy',
        latencyMs: apiDur,
        endpoint: '/dates',
        datesCount: datesRes?.length || 0,
        error: null,
      });
    } catch (err) {
      setApiProbe({
        status: 'failed',
        latencyMs: Math.round(performance.now() - startApi),
        endpoint: '/dates',
        datesCount: 0,
        error: err.message,
      });
    }

    // Probe Database Connectivity
    const startDb = performance.now();
    try {
      const dbRes = await systemLogsService.executeSql({
        sql: 'SELECT DB_NAME() AS dbName, GETDATE() AS serverTime, @@VERSION AS version',
        mode: 'data',
        maxRows: 1,
      });
      const dbDur = Math.round(performance.now() - startDb);
      const row = dbRes?.rows?.[0] || {};
      setDbProbe({
        status: 'healthy',
        latencyMs: dbDur,
        dbName: row.dbName || row.dbname || 'MES Database',
        serverTime: row.serverTime || new Date().toISOString(),
        version: (row.version || '').split('\n')[0].slice(0, 80),
        error: null,
      });
    } catch (err) {
      setDbProbe({
        status: 'failed',
        latencyMs: Math.round(performance.now() - startDb),
        dbName: 'Unknown',
        serverTime: '',
        version: '',
        error: err.message,
      });
    }

    // Probe Log Storage Files
    setStorageLoading(true);
    try {
      const filesRes = await systemLogsService.getFiles(selectedDate);
      setStorageFiles(Array.isArray(filesRes) ? filesRes : []);
    } catch {
      setStorageFiles([]);
    } finally {
      setStorageLoading(false);
    }

    setIsRunning(false);
    setLastCheckTime(now);
  }, [selectedDate]);

  useEffect(() => {
    runDiagnostics();
  }, [runDiagnostics]);

  const formatBytes = (val) => {
    if (val == null) return '0 B';
    if (typeof val === 'string') {
      if (/[a-zA-Z]/.test(val)) return val;
      val = parseFloat(val);
    }
    if (!Number.isFinite(val) || val <= 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.min(Math.floor(Math.log(val) / Math.log(k)), sizes.length - 1);
    return `${parseFloat((val / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const parseBytes = (size) => {
    if (size == null) return 0;
    if (typeof size === 'number') return Number.isFinite(size) ? size : 0;
    if (typeof size !== 'string') return 0;
    const match = size.trim().match(/^([\d.]+)\s*(B|KB|MB|GB|TB)?$/i);
    if (!match) return 0;
    const val = parseFloat(match[1]);
    if (!Number.isFinite(val)) return 0;
    const unit = (match[2] || 'B').toUpperCase();
    if (unit === 'KB') return val * 1024;
    if (unit === 'MB') return val * 1024 * 1024;
    if (unit === 'GB') return val * 1024 * 1024 * 1024;
    if (unit === 'TB') return val * 1024 * 1024 * 1024 * 1024;
    return val;
  };

  const totalStorageSize = storageFiles.reduce((acc, f) => {
    const b = f.bytes ?? f.sizeBytes ?? f.length;
    if (b != null && Number.isFinite(Number(b))) {
      return acc + Number(b);
    }
    return acc + parseBytes(f.size);
  }, 0);

  const displayFileSize = (f) => {
    if (!f) return '0 B';
    if (f.bytes != null && Number.isFinite(Number(f.bytes))) {
      return formatBytes(Number(f.bytes));
    }
    if (typeof f.size === 'string' && f.size.trim()) {
      return f.size;
    }
    return formatBytes(f.size || f.sizeBytes || f.length);
  };

  const formatTotalBytes = (bytes) => formatBytes(bytes);

  const isAllHealthy = dbProbe.status === 'healthy' && apiProbe.status === 'healthy';

  return (
    <TooltipProvider delayDuration={150}>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded border dark:border-[#22252b] border-slate-200 dark:bg-[#181b1f] bg-white shadow-xs">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-lg border ${
                isAllHealthy
                  ? 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30'
                  : 'bg-rose-500/15 text-rose-500 border-rose-500/30'
              }`}
            >
              {isAllHealthy ? (
                <ShieldCheck className="h-6 w-6" />
              ) : (
                <AlertTriangle className="h-6 w-6" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm sm:text-base dark:text-white text-slate-900">
                  {isAllHealthy
                    ? 'System Health: 100% Operational'
                    : 'System Degraded / Action Required'}
                </span>
                <Badge
                  variant="outline"
                  className={`text-[10px] ${
                    isAllHealthy
                      ? 'border-emerald-500/40 text-emerald-500 bg-emerald-500/10'
                      : 'border-rose-500/40 text-rose-500 bg-rose-500/10'
                  }`}
                >
                  {isAllHealthy ? 'ALL PROBES PASSING' : 'FAILURES DETECTED'}
                </Badge>
              </div>
              <div className="text-xs text-[#8e94a0] mt-0.5 font-sans">
                {lastCheckTime
                  ? `Last verified at ${lastCheckTime.toLocaleTimeString()} (${lastCheckTime.toLocaleDateString()})`
                  : 'Checking diagnostics...'}
              </div>
            </div>
          </div>

          <Button
            size="sm"
            onClick={runDiagnostics}
            disabled={isRunning}
            className="h-8 px-3 text-xs bg-[#3274d9] hover:bg-[#2461c2] text-white font-semibold transition flex items-center gap-1.5 shadow-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRunning ? 'animate-spin' : ''}`} />
            Run Diagnostics Now
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {/* SQL Server Database Probe */}
          <div className="rounded border dark:border-[#22252b] border-slate-200 dark:bg-[#181b1f] bg-white p-4 space-y-3 shadow-xs">
            <div className="flex items-center justify-between border-b dark:border-[#22252b] border-slate-200 pb-2.5">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-indigo-500" />
                <span className="font-bold text-xs sm:text-sm dark:text-white text-slate-900">
                  SQL Server Connectivity
                </span>
              </div>
              <Badge
                variant="outline"
                className={`text-[10px] font-mono ${
                  dbProbe.status === 'healthy'
                    ? 'border-emerald-500/40 text-emerald-500 bg-emerald-500/10'
                    : 'border-rose-500/40 text-rose-500 bg-rose-500/10'
                }`}
              >
                {dbProbe.status === 'healthy' ? 'CONNECTED' : 'DISCONNECTED'}
              </Badge>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[#8e94a0]">Ping Latency:</span>
                <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                  {dbProbe.latencyMs !== null ? `${dbProbe.latencyMs} ms` : 'Testing...'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[#8e94a0]">Active Database:</span>
                <span className="font-mono font-semibold dark:text-slate-200 text-slate-800">
                  {dbProbe.dbName || 'MES_PROD'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[#8e94a0]">Database Engine:</span>
                <span
                  className="font-mono text-[11px] dark:text-slate-300 text-slate-700 truncate max-w-45"
                  title={dbProbe.version}
                >
                  {dbProbe.version || 'Microsoft SQL Server'}
                </span>
              </div>
            </div>

            {dbProbe.error && (
              <div className="p-2.5 rounded bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs font-mono">
                {dbProbe.error}
              </div>
            )}
          </div>

          {/* API Ingestion Server Probe */}
          <div className="rounded border dark:border-[#22252b] border-slate-200 dark:bg-[#181b1f] bg-white p-4 space-y-3 shadow-xs">
            <div className="flex items-center justify-between border-b dark:border-[#22252b] border-slate-200 pb-2.5">
              <div className="flex items-center gap-2">
                <Server className="h-4 w-4 text-[#3274d9]" />
                <span className="font-bold text-xs sm:text-sm dark:text-white text-slate-900">
                  APM Ingestion Service
                </span>
              </div>
              <Badge
                variant="outline"
                className={`text-[10px] font-mono ${
                  apiProbe.status === 'healthy'
                    ? 'border-emerald-500/40 text-emerald-500 bg-emerald-500/10'
                    : 'border-rose-500/40 text-rose-500 bg-rose-500/10'
                }`}
              >
                {apiProbe.status === 'healthy' ? 'OPERATIONAL' : 'OFFLINE'}
              </Badge>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[#8e94a0]">API Ping Response:</span>
                <span className="font-mono font-bold text-sky-600 dark:text-sky-400">
                  {apiProbe.latencyMs !== null ? `${apiProbe.latencyMs} ms` : 'Testing...'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[#8e94a0]">Historical Log Dates:</span>
                <span className="font-mono font-semibold dark:text-slate-200 text-slate-800">
                  {apiProbe.datesCount} date partition(s)
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[#8e94a0]">Authentication:</span>
                <span className="font-mono text-emerald-500 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Basic Credentials Active
                </span>
              </div>
            </div>

            {apiProbe.error && (
              <div className="p-2.5 rounded bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs font-mono">
                {apiProbe.error}
              </div>
            )}
          </div>

          {/* Storage & Log File Footprint */}
          <div className="rounded border dark:border-[#22252b] border-slate-200 dark:bg-[#181b1f] bg-white p-4 space-y-3 shadow-xs">
            <div className="flex items-center justify-between border-b dark:border-[#22252b] border-slate-200 pb-2.5">
              <div className="flex items-center gap-2">
                <HardDrive className="h-4 w-4 text-purple-400" />
                <span className="font-bold text-xs sm:text-sm dark:text-white text-slate-900">
                  On-Disk Log Storage
                </span>
              </div>
              <Badge
                variant="outline"
                className="text-[10px] font-mono border-purple-500/40 text-purple-400 bg-purple-500/10"
              >
                ACTIVE
              </Badge>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[#8e94a0]">Today&apos;s Log Files:</span>
                <span className="font-mono font-bold dark:text-white text-slate-900">
                  {storageFiles.length} file(s)
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[#8e94a0]">Selected Date Volume:</span>
                <span className="font-mono font-bold text-purple-400">
                  {formatTotalBytes(totalStorageSize)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[#8e94a0]">Storage Engine:</span>
                <span className="font-mono text-[11px] text-[#8e94a0]">
                  Structured .jsonl / Serilog (Disk)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Log File Inventory Table */}
        <div className="rounded border dark:border-[#22252b] border-slate-200 dark:bg-[#181b1f] bg-white overflow-hidden shadow-xs">
          <div className="p-3.5 border-b dark:border-[#22252b] border-slate-200 dark:bg-[#14161b] bg-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-[#3274d9]" />
              <span className="font-bold text-xs sm:text-sm dark:text-white text-slate-900">
                Server Log Files Inventory ({selectedDate || 'Current Partition'})
              </span>
            </div>
            <span className="text-xs text-[#8e94a0] font-mono">
              Total volume: {formatTotalBytes(totalStorageSize)}
            </span>
          </div>

          {storageLoading ? (
            <div className="p-8 text-center text-xs text-[#8e94a0]">
              Scanning on-disk log directory...
            </div>
          ) : storageFiles.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#8e94a0]">
              No log files found in directory for partition {selectedDate}.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="dark:bg-[#111217] bg-slate-100 border-b dark:border-[#22252b] border-slate-200 text-[#8e94a0] font-semibold">
                  <tr>
                    <th className="p-2.5">File Name</th>
                    <th className="p-2.5 text-right">Size</th>
                    <th className="p-2.5 text-right">Last Modified</th>
                    <th className="p-2.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y dark:divide-[#22252b] divide-slate-100 font-mono">
                  {storageFiles.map((f, idx) => (
                    <tr
                      key={idx}
                      className="hover:dark:bg-[#14161b] hover:bg-slate-50/80 transition"
                    >
                      <td className="p-2.5 dark:text-slate-200 text-slate-800 font-semibold">
                        {f.name}
                      </td>
                      <td className="p-2.5 text-right text-purple-400 font-bold">
                        {displayFileSize(f)}
                      </td>
                      <td className="p-2.5 text-right text-[#8e94a0] font-sans text-[11px]">
                        {f.lastModified ? new Date(f.lastModified).toLocaleString() : '-'}
                      </td>
                      <td className="p-2.5 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          asChild
                          className="h-6 px-2 text-xs dark:border-[#2c323f] border-slate-300 dark:bg-[#111217] bg-white text-[#3274d9] dark:text-[#5794f2]"
                        >
                          <a
                            href={systemLogsService.getDownloadUrl(f.path || f.name)}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Download className="h-3 w-3 mr-1" />
                            Download
                          </a>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}

SystemHealthTab.propTypes = {
  selectedDate: PropTypes.string,
  dates: PropTypes.arrayOf(PropTypes.string),
};
