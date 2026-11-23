import { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  ArrowUpDown,
  Search,
  Eye,
  SlidersHorizontal,
  Table as TableIcon,
  Terminal,
  Copy,
  Check,
  WrapText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';

export function LogStreamView({ events = [], onInspect }) {
  // Display Mode: 'logs' | 'table'
  const [displayMode, setDisplayMode] = useState('logs');

  // Logs Mode Wrap State: 'nowrap' | 'wrap' | 'pretty'
  const [logViewMode, setLogViewMode] = useState('wrap');

  // Table Mode Wrap State: ONLY 'nowrap' (disabled) or 'wrap' (enabled)
  const [tableWrap, setTableWrap] = useState(false); // false = disabled (nowrap), true = enabled (wrap)

  // Sort Order: 'desc' (Newest first) | 'asc' (Oldest first)
  const [sortOrder, setSortOrder] = useState('desc');

  // Local search inside console
  const [consoleSearch, setConsoleSearch] = useState('');
  const [copiedIdx, setCopiedIdx] = useState(null);

  const handleCopy = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 1800);
  };

  // Format time to YYYY-MM-DD HH:mm:ss.SSS like Grafana Loki
  const formatTime = (iso) => {
    if (!iso) return '';
    try {
      const d = new Date(iso);
      if (isNaN(d.getTime())) return iso;
      const pad = (n, len = 2) => String(n).padStart(len, '0');
      const datePart = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
      const timePart = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${pad(d.getMilliseconds(), 3)}`;
      return `${datePart} ${timePart}`;
    } catch {
      return iso;
    }
  };

  const getLevelBadge = (level = 'info') => {
    const l = String(level).toUpperCase();
    if (l.includes('ERR') || l.includes('FATAL')) {
      return (
        <span className="rounded px-1.5 py-0.5 text-[10px] font-bold font-sans bg-[#f2495c]/20 text-[#f2495c] border border-[#f2495c]/40 uppercase shrink-0">
          ERROR
        </span>
      );
    }
    if (l.includes('WARN')) {
      return (
        <span className="rounded px-1.5 py-0.5 text-[10px] font-bold font-sans bg-[#faad14]/20 text-[#faad14] border border-[#faad14]/40 uppercase shrink-0">
          WARN
        </span>
      );
    }
    return (
      <span className="rounded px-1.5 py-0.5 text-[10px] font-bold font-sans bg-[#5794f2]/20 text-[#5794f2] border border-[#5794f2]/40 uppercase shrink-0">
        INFO
      </span>
    );
  };

  const formatPrettyJson = (raw) => {
    if (!raw) return '';
    try {
      const obj = typeof raw === 'string' ? JSON.parse(raw) : raw;
      return JSON.stringify(obj, null, 2);
    } catch {
      return raw;
    }
  };

  // Sort and filter events
  const processedEvents = useMemo(() => {
    let list = [...events];

    // Filter by console search
    if (consoleSearch.trim()) {
      const q = consoleSearch.trim().toLowerCase();
      list = list.filter((e) => {
        const inMsg = (e.message || '').toLowerCase().includes(q);
        const inRaw = (e.rawJson || '').toLowerCase().includes(q);
        const inTrace = (e.parentTrace?.traceId || '').toLowerCase().includes(q);
        return inMsg || inRaw || inTrace;
      });
    }

    // Sort: Newest logs first vs Oldest logs first
    list.sort((a, b) => {
      const tA = new Date(a.time || 0).getTime();
      const tB = new Date(b.time || 0).getTime();
      return sortOrder === 'desc' ? tB - tA : tA - tB;
    });

    return list;
  }, [events, consoleSearch, sortOrder]);

  return (
    <TooltipProvider delayDuration={150}>
      <div className="space-y-2 rounded border dark:border-[#22252b] border-slate-200 dark:bg-[#181b1f] bg-white p-3 shadow-xs transition-colors">
        <div className="flex flex-wrap items-center justify-between gap-2.5 pb-2 border-b dark:border-[#22252b] border-slate-200">
          <div className="flex items-center gap-2">
            <div className="flex items-center rounded border dark:border-[#2c323f] border-slate-300 dark:bg-[#111217] bg-slate-100 p-0.5">
              <button
                type="button"
                onClick={() => setDisplayMode('logs')}
                className={`flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium transition cursor-pointer ${
                  displayMode === 'logs'
                    ? 'dark:bg-[#22252b] bg-white text-[#3274d9] dark:text-[#5794f2] shadow-xs font-semibold'
                    : 'text-slate-500 hover:text-slate-900 dark:text-[#8e94a0] dark:hover:text-slate-200'
                }`}
              >
                <Terminal className="h-3 w-3" />
                Logs
              </button>
              <button
                type="button"
                onClick={() => setDisplayMode('table')}
                className={`flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium transition cursor-pointer ${
                  displayMode === 'table'
                    ? 'dark:bg-[#22252b] bg-white text-[#3274d9] dark:text-[#5794f2] shadow-xs font-semibold'
                    : 'text-slate-500 hover:text-slate-900 dark:text-[#8e94a0] dark:hover:text-slate-200'
                }`}
              >
                <TableIcon className="h-3 w-3" />
                Table
              </button>
            </div>

            <span className="text-xs text-slate-500 dark:text-[#8e94a0] font-sans">
              {processedEvents.length} lines displayed
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="absolute left-2.5 top-2 h-3 w-3 text-slate-400" />
              <Input
                type="text"
                value={consoleSearch}
                onChange={(e) => setConsoleSearch(e.target.value)}
                placeholder="Search in log lines..."
                className="pl-7 h-7 w-44 sm:w-56 text-[11px] dark:bg-[#111217] bg-slate-50 dark:border-[#2c323f] border-slate-300 dark:text-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:border-[#3274d9]"
              />
            </div>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
                  className="h-7 text-xs dark:border-[#2c323f] border-slate-300 dark:bg-[#111217] bg-slate-50 dark:text-[#c7d0d9] text-slate-700 hover:text-slate-900 dark:hover:text-white"
                >
                  <ArrowUpDown className="h-3 w-3 mr-1 text-[#3274d9] dark:text-[#5794f2]" />
                  {sortOrder === 'desc' ? 'Newest logs first' : 'Oldest logs first'}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {sortOrder === 'desc'
                  ? 'Currently sorted: Newest logs first'
                  : 'Currently sorted: Oldest logs first'}
              </TooltipContent>
            </Tooltip>

            {displayMode === 'table' ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setTableWrap(!tableWrap)}
                    className={`h-7 text-xs border transition ${
                      tableWrap
                        ? 'dark:border-amber-500/50 border-amber-400 dark:bg-amber-500/10 bg-amber-50 text-amber-600 dark:text-amber-400 font-medium'
                        : 'dark:border-[#2c323f] border-slate-300 dark:bg-[#111217] bg-slate-50 dark:text-[#c7d0d9] text-slate-700'
                    }`}
                  >
                    <WrapText className="h-3 w-3 mr-1 text-[#3274d9] dark:text-[#5794f2]" />
                    <span>{tableWrap ? 'Wrapping enabled' : 'Wrapping disabled'}</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {tableWrap
                    ? 'Click to disable line wrapping (single line)'
                    : 'Click to enable line wrapping (multi-line)'}
                </TooltipContent>
              </Tooltip>
            ) : (
              <DropdownMenu>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DropdownMenuTrigger
                      render={
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs dark:border-[#2c323f] border-slate-300 dark:bg-[#111217] bg-slate-50 dark:text-[#c7d0d9] text-slate-700 hover:text-slate-900 dark:hover:text-white"
                        >
                          <SlidersHorizontal className="h-3 w-3 mr-1 text-[#3274d9] dark:text-[#5794f2]" />
                          <span>
                            {logViewMode === 'nowrap'
                              ? 'Wrap disabled'
                              : logViewMode === 'wrap'
                                ? 'Wrap lines'
                                : 'Prettify JSON'}
                          </span>
                        </Button>
                      }
                    />
                  </TooltipTrigger>
                  <TooltipContent>Configure log stream formatting</TooltipContent>
                </Tooltip>

                <DropdownMenuContent
                  align="end"
                  className="w-72 dark:bg-[#181b1f] bg-white dark:border-[#2c323f] border-slate-200 p-1.5 shadow-2xl dark:text-slate-300 text-slate-700"
                >
                  <div className="space-y-1">
                    <DropdownMenuItem
                      onClick={() => setLogViewMode('nowrap')}
                      className={`flex items-center text-xs py-2 px-3 rounded cursor-pointer transition select-none relative ${
                        logViewMode === 'nowrap'
                          ? 'dark:bg-slate-800/70 bg-slate-100 dark:text-white text-slate-900 font-medium'
                          : 'hover:dark:bg-slate-800/40 hover:bg-slate-50 dark:text-slate-300 text-slate-600'
                      }`}
                    >
                      {logViewMode === 'nowrap' && (
                        <span className="absolute left-1.5 top-2 bottom-2 w-1 rounded-full bg-amber-500" />
                      )}
                      <span className="pl-2">Disable line wrapping</span>
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      onClick={() => setLogViewMode('wrap')}
                      className={`flex items-center text-xs py-2 px-3 rounded cursor-pointer transition select-none relative ${
                        logViewMode === 'wrap'
                          ? 'dark:bg-slate-800/70 bg-slate-100 dark:text-white text-slate-900 font-medium'
                          : 'hover:dark:bg-slate-800/40 hover:bg-slate-50 dark:text-slate-300 text-slate-600'
                      }`}
                    >
                      {logViewMode === 'wrap' && (
                        <span className="absolute left-1.5 top-2 bottom-2 w-1 rounded-full bg-amber-500" />
                      )}
                      <span className="pl-2">Enable line wrapping</span>
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      onClick={() => setLogViewMode('pretty')}
                      className={`flex items-center text-xs py-2 px-3 rounded cursor-pointer transition select-none relative ${
                        logViewMode === 'pretty'
                          ? 'dark:bg-slate-800/70 bg-slate-100 dark:text-white text-slate-900 font-medium'
                          : 'hover:dark:bg-slate-800/40 hover:bg-slate-50 dark:text-slate-300 text-slate-600'
                      }`}
                    >
                      {logViewMode === 'pretty' && (
                        <span className="absolute left-1.5 top-2 bottom-2 w-1 rounded-full bg-amber-500" />
                      )}
                      <span className="pl-2">Enable line wrapping and prettify JSON</span>
                    </DropdownMenuItem>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        <ScrollArea className="h-[calc(100vh-320px)] w-full">
          {processedEvents.length === 0 ? (
            <div className="py-16 text-center text-slate-500 text-xs">
              No matching log records found.
            </div>
          ) : displayMode === 'table' ? (
            <div className="w-full overflow-x-auto">
              <table className="w-full text-left font-sans text-xs border-collapse">
                <thead>
                  <tr className="border-b dark:border-slate-800 border-slate-200 dark:text-slate-400 text-slate-600 dark:bg-slate-900/60 bg-slate-100 text-[11px]">
                    <th className="py-2 px-3 w-10 text-center">#</th>
                    <th className="py-2 px-3 w-48 whitespace-nowrap">
                      <button
                        onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
                        className="flex items-center gap-1 dark:hover:text-white hover:text-slate-900 transition cursor-pointer"
                      >
                        <span>Time</span>
                        <ArrowUpDown className="h-3 w-3 text-cyan-500 dark:text-cyan-400" />
                      </button>
                    </th>
                    <th className="py-2 px-3 w-28 whitespace-nowrap">detected_level</th>
                    <th className="py-2 px-3 text-left">Line</th>
                    <th className="py-2 px-3 w-64 min-w-[240px] text-left whitespace-nowrap">
                      Trace ID
                    </th>
                    <th className="py-2 px-3 w-16 text-center whitespace-nowrap">Inspect</th>
                  </tr>
                </thead>
                <tbody className="divide-y dark:divide-slate-800/60 divide-slate-200">
                  {processedEvents.map((evt, idx) => (
                    <tr
                      key={idx}
                      className="hover:dark:bg-slate-800/40 hover:bg-slate-100/70 transition group cursor-pointer"
                      onClick={() => evt.parentTrace && onInspect && onInspect(evt.parentTrace)}
                    >
                      <td className="py-2 px-3 text-center dark:text-slate-600 text-slate-400 text-[11px]">
                        {idx + 1}
                      </td>
                      <td className="py-2 px-3 dark:text-slate-400 text-slate-600 text-[11px] whitespace-nowrap">
                        {formatTime(evt.time)}
                      </td>
                      <td className="py-2 px-3 whitespace-nowrap">{getLevelBadge(evt.level)}</td>
                      <td className="py-2 px-3 dark:text-slate-300 text-slate-800 w-full max-w-0">
                        <div
                          className={
                            tableWrap
                              ? 'whitespace-pre-wrap break-all leading-relaxed text-[11px]'
                              : 'truncate w-full font-sans text-[11px] leading-relaxed'
                          }
                        >
                          {evt.rawJson || evt.message}
                        </div>
                      </td>
                      <td className="py-2 px-3 text-cyan-600 dark:text-cyan-400 text-[11px] select-all whitespace-nowrap font-sans w-64 min-w-[240px]">
                        {evt.parentTrace?.traceId ? (
                          <span className="font-sans tracking-tight font-medium select-all">
                            {evt.parentTrace.traceId}
                          </span>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-600">-</span>
                        )}
                      </td>
                      <td className="py-2 px-3 text-center">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (evt.parentTrace && onInspect) onInspect(evt.parentTrace);
                              }}
                              className="h-6 w-6 p-0 text-slate-400 hover:text-cyan-500"
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Inspect Trace</TooltipContent>
                        </Tooltip>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="space-y-1 p-1">
              {processedEvents.map((evt, idx) => {
                const lineContent = evt.rawJson || evt.message;

                if (logViewMode === 'pretty') {
                  return (
                    <div
                      key={idx}
                      className="font-sans text-xs dark:text-slate-300 text-slate-800 py-2.5 px-3 rounded hover:dark:bg-slate-800/30 hover:bg-slate-100/60 transition border-b dark:border-slate-800/70 border-slate-200"
                    >
                      <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400 select-none">|</span>
                          <span className="dark:text-slate-400 text-slate-600 font-sans text-[11px]">
                            {formatTime(evt.time)}
                          </span>
                          {getLevelBadge(evt.level)}
                          {evt.parentTrace?.traceId && (
                            <span className="text-cyan-600 dark:text-cyan-400 font-sans text-[11px] select-all font-medium">
                              [{evt.parentTrace.traceId}]
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleCopy(formatPrettyJson(lineContent), idx)}
                                className="h-6 px-1.5 text-[10px] text-slate-400 hover:text-slate-900 dark:hover:text-white"
                              >
                                {copiedIdx === idx ? (
                                  <Check className="h-3 w-3 text-emerald-500" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              {copiedIdx === idx ? 'Copied to clipboard' : 'Copy formatted JSON'}
                            </TooltipContent>
                          </Tooltip>

                          {evt.parentTrace && onInspect && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => onInspect(evt.parentTrace)}
                                  className="h-6 px-1.5 text-[10px] text-cyan-600 dark:text-cyan-400"
                                >
                                  <Eye className="h-3 w-3 mr-1" /> Inspect
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Open Inspector Drawer</TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                      </div>
                      <pre className="dark:text-slate-200 text-slate-800 whitespace-pre-wrap break-all dark:bg-black/50 bg-slate-100 p-3 rounded-lg border dark:border-slate-800/80 border-slate-200 text-[11px] leading-relaxed select-text font-sans">
                        {formatPrettyJson(lineContent)}
                      </pre>
                    </div>
                  );
                }

                return (
                  <div
                    key={idx}
                    onClick={() => evt.parentTrace && onInspect && onInspect(evt.parentTrace)}
                    className={`group font-sans text-xs dark:text-slate-300 text-slate-800 py-1.5 px-2.5 rounded hover:dark:bg-slate-800/50 hover:bg-slate-100 cursor-pointer transition flex items-start gap-2 border-b dark:border-slate-900/50 border-slate-200/60 ${
                      logViewMode === 'nowrap'
                        ? 'whitespace-pre overflow-x-auto'
                        : 'whitespace-pre-wrap break-all'
                    }`}
                  >
                    <span className="text-slate-400 select-none shrink-0">|</span>
                    <span className="dark:text-slate-400 text-slate-600 text-[11px] shrink-0 font-sans">
                      {formatTime(evt.time)}
                    </span>
                    {getLevelBadge(evt.level)}
                    {evt.parentTrace?.traceId && (
                      <span className="text-cyan-600 dark:text-cyan-400 text-[11px] shrink-0 font-sans font-medium">
                        [{evt.parentTrace.traceId.slice(0, 8)}...]
                      </span>
                    )}
                    <span className="flex-1 dark:text-slate-200 text-slate-800 group-hover:dark:text-white group-hover:text-black leading-relaxed">
                      {lineContent}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </div>
    </TooltipProvider>
  );
}

LogStreamView.propTypes = {
  events: PropTypes.array,
  onInspect: PropTypes.func,
};
