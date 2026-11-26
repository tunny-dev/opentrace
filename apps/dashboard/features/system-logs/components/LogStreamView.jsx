"use client";

import { useState, useMemo, useRef, useEffect } from 'react';
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
  X,
  Database,
  Radio,
  Clock,
  ExternalLink,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

const JSON_TOKENS =
  /"(?:\\.|[^"\\])*"(?=\s*:)|"(?:\\.|[^"\\])*"|\b(?:true|false|null)\b|-?\d+(?:\.\d+)?|[{}[\],:]/g;

function parseJsonSafe(val) {
  if (typeof val === 'object' && val !== null) return val;
  if (!val || typeof val !== 'string') return null;
  try {
    return JSON.parse(val);
  } catch {
    try {
      const fixed = val
        .replace(/\\r\\n/g, '\\n')
        .replace(/\r\n/g, '\\n')
        .replace(/\r/g, '\\n')
        .replace(/\n/g, '\\n')
        .replace(/\t/g, '\\t');
      return JSON.parse(fixed);
    } catch {
      return null;
    }
  }
}

function HighlightedJson({ value }) {
  let prettyJson = value;
  const parsed = parseJsonSafe(value);
  if (parsed !== null) {
    prettyJson = JSON.stringify(parsed, null, 2);
  } else {
    return <span className="font-mono text-[11px] whitespace-pre-wrap">{String(value)}</span>;
  }

  const fragments = [];
  let cursor = 0;
  for (const match of prettyJson.matchAll(JSON_TOKENS)) {
    const token = match[0];
    const index = match.index ?? cursor;
    if (index > cursor) fragments.push({ value: prettyJson.slice(cursor, index) });
    const isKey = token.startsWith('"') && /^\s*:/.test(prettyJson.slice(index + token.length));
    const className = isKey
      ? "text-sky-500 dark:text-sky-400 font-semibold"
      : token.startsWith('"')
        ? "text-emerald-600 dark:text-emerald-400"
        : /^-?\d/.test(token)
          ? "text-amber-600 dark:text-amber-400"
          : /^[{}[\],:]$/.test(token)
            ? "text-slate-400 dark:text-slate-500"
            : "text-purple-600 dark:text-purple-400";
    fragments.push({ value: token, className });
    cursor = index + token.length;
  }
  if (cursor < prettyJson.length) fragments.push({ value: prettyJson.slice(cursor) });

  return (
    <pre className="font-mono text-[11px] leading-relaxed whitespace-pre-wrap break-all select-text">
      {fragments.map((f, i) =>
        f.className ? (
          <span key={i} className={f.className}>
            {f.value}
          </span>
        ) : (
          f.value
        )
      )}
    </pre>
  );
}

export function LogStreamView({ events = [], onInspect }) {
  // Display Mode: 'table' (default, matching MESProductionDashboardClient) | 'logs'
  const [displayMode, setDisplayMode] = useState('table');

  // Logs Mode Wrap State: 'nowrap' | 'wrap' | 'pretty'
  const [logViewMode, setLogViewMode] = useState('wrap');

  // Table Mode Wrap State: default true (Wrapping enabled, matching MESProductionDashboardClient)
  const [tableWrap, setTableWrap] = useState(true);

  // Sort Order: 'desc' (Newest first) | 'asc' (Oldest first)
  const [sortOrder, setSortOrder] = useState('desc');

  // Local search inside console
  const [consoleSearch, setConsoleSearch] = useState('');
  const [quickLevel, setQuickLevel] = useState('all'); // 'all' | 'error' | 'warn' | 'sql' | 'slow' | 'info'
  const [copiedIdx, setCopiedIdx] = useState(null);
  const [expandedRowIdx, setExpandedRowIdx] = useState(null);

  const scrollRef = useRef(null);

  const handleCopy = (text, idx, label = 'nội dung log') => {
    if (!text) return;
    navigator.clipboard.writeText(typeof text === 'string' ? text : JSON.stringify(text, null, 2));
    setCopiedIdx(idx);
    toast.success(`Đã sao chép ${label} vào clipboard`);
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
    const obj = parseJsonSafe(raw);
    if (obj !== null) {
      return JSON.stringify(obj, null, 2);
    }
    return typeof raw === 'string' ? raw : JSON.stringify(raw, null, 2);
  };

  // Compute category counts for Quick Filter pills
  const stats = useMemo(() => {
    let errors = 0;
    let warnings = 0;
    let sqls = 0;
    let slows = 0;
    let infos = 0;

    events.forEach((evt) => {
      const l = String(evt.level || 'info').toLowerCase();
      const isSql = evt.eventType === 'sql' || evt.eventType === 'slow_sql' || !!evt.sql;
      const isSlow = evt.durationMs >= 1000 || evt.eventType === 'slow_sql';

      if (l.includes('err') || l.includes('fatal')) errors++;
      else if (l.includes('warn')) warnings++;
      else infos++;

      if (isSql) sqls++;
      if (isSlow) slows++;
    });

    return { total: events.length, errors, warnings, sqls, slows, infos };
  }, [events]);

  // Sort and filter events
  const processedEvents = useMemo(() => {
    let list = [...events];

    // Quick filter by level/type
    if (quickLevel !== 'all') {
      list = list.filter((evt) => {
        const l = String(evt.level || 'info').toLowerCase();
        const isSql = evt.eventType === 'sql' || evt.eventType === 'slow_sql' || !!evt.sql;
        const isSlow = evt.durationMs >= 1000 || evt.eventType === 'slow_sql';

        if (quickLevel === 'error') return l.includes('err') || l.includes('fatal');
        if (quickLevel === 'warn') return l.includes('warn');
        if (quickLevel === 'sql') return isSql;
        if (quickLevel === 'slow') return isSlow;
        if (quickLevel === 'info') return !l.includes('err') && !l.includes('warn');
        return true;
      });
    }

    // Filter by console search
    if (consoleSearch.trim()) {
      const q = consoleSearch.trim().toLowerCase();
      list = list.filter((e) => {
        const inMsg = (e.message || '').toLowerCase().includes(q);
        const inRaw = (e.rawJson || '').toLowerCase().includes(q);
        const inTrace = (e.parentTrace?.traceId || '').toLowerCase().includes(q);
        const inRoute = (e.parentTrace?.route || '').toLowerCase().includes(q);
        const inSql = (e.sql || '').toLowerCase().includes(q);
        return inMsg || inRaw || inTrace || inRoute || inSql;
      });
    }

    // Sort: Newest logs first vs Oldest logs first
    list.sort((a, b) => {
      const tA = new Date(a.time || 0).getTime();
      const tB = new Date(b.time || 0).getTime();
      return sortOrder === 'desc' ? tB - tA : tA - tB;
    });

    return list;
  }, [events, consoleSearch, sortOrder, quickLevel]);

  return (
    <TooltipProvider delayDuration={150}>
      <div className="space-y-2.5 rounded border dark:border-[#22252b] border-slate-200 dark:bg-[#181b1f] bg-white p-3 shadow-xs transition-colors">
        {/* Main Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pb-2 border-b dark:border-[#22252b] border-slate-200">
          {/* Left: Mode toggle & count */}
          <div className="flex items-center gap-2.5">
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
              <strong className="text-slate-800 dark:text-slate-200 font-semibold">{processedEvents.length}</strong> lines displayed
            </span>
          </div>

          {/* Right: Search, Sort & Format controls */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="absolute left-2.5 top-2 h-3 w-3 text-slate-400" />
              <Input
                type="text"
                value={consoleSearch}
                onChange={(e) => setConsoleSearch(e.target.value)}
                placeholder="Search in log lines..."
                className="pl-7 pr-7 h-7 w-44 sm:w-60 text-[11px] dark:bg-[#111217] bg-slate-50 dark:border-[#2c323f] border-slate-300 dark:text-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:border-[#3274d9]"
              />
              {consoleSearch && (
                <button
                  type="button"
                  onClick={() => setConsoleSearch('')}
                  className="absolute right-2 top-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs"
                >
                  ✕
                </button>
              )}
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
                    <WrapText className={`h-3 w-3 mr-1 ${tableWrap ? 'text-amber-500' : 'text-[#3274d9] dark:text-[#5794f2]'}`} />
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
                    <DropdownMenuTrigger asChild>
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
                    </DropdownMenuTrigger>
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
                      <span className="pl-2">Disable line wrapping (nowrap)</span>
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
                      <span className="pl-2">Enable line wrapping (wrap)</span>
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

        {/* Exclusive Feature: Quick Severity Filter Pills with Live Badges */}
        <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
          <button
            type="button"
            onClick={() => setQuickLevel('all')}
            className={`px-2.5 py-1 rounded text-xs font-medium transition cursor-pointer border ${
              quickLevel === 'all'
                ? 'bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 border-transparent shadow-xs'
                : 'dark:border-[#2c323f] border-slate-200 dark:bg-[#111217] bg-slate-50 dark:text-slate-400 text-slate-600 hover:border-slate-400'
            }`}
          >
            Tất cả logs <span className="ml-1 opacity-75 font-sans font-normal">({stats.total})</span>
          </button>

          <button
            type="button"
            onClick={() => setQuickLevel('error')}
            className={`px-2.5 py-1 rounded text-xs font-medium transition cursor-pointer border ${
              quickLevel === 'error'
                ? 'bg-[#f2495c] text-white border-transparent shadow-xs font-bold'
                : 'border-[#f2495c]/30 bg-[#f2495c]/10 text-[#f2495c] hover:bg-[#f2495c]/20'
            }`}
          >
            Errors <span className="ml-1 font-sans">({stats.errors})</span>
          </button>

          <button
            type="button"
            onClick={() => setQuickLevel('warn')}
            className={`px-2.5 py-1 rounded text-xs font-medium transition cursor-pointer border ${
              quickLevel === 'warn'
                ? 'bg-[#faad14] text-slate-950 border-transparent shadow-xs font-bold'
                : 'border-[#faad14]/30 bg-[#faad14]/10 text-amber-700 dark:text-[#faad14] hover:bg-[#faad14]/20'
            }`}
          >
            Warnings <span className="ml-1 font-sans">({stats.warnings})</span>
          </button>

          <button
            type="button"
            onClick={() => setQuickLevel('sql')}
            className={`px-2.5 py-1 rounded text-xs font-medium transition cursor-pointer border ${
              quickLevel === 'sql'
                ? 'bg-emerald-600 text-white border-transparent shadow-xs font-bold'
                : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20'
            }`}
          >
            SQL Queries <span className="ml-1 font-sans">({stats.sqls})</span>
          </button>

          <button
            type="button"
            onClick={() => setQuickLevel('slow')}
            className={`px-2.5 py-1 rounded text-xs font-medium transition cursor-pointer border ${
              quickLevel === 'slow'
                ? 'bg-orange-500 text-white border-transparent shadow-xs font-bold'
                : 'border-orange-500/30 bg-orange-500/10 text-orange-600 dark:text-orange-400 hover:bg-orange-500/20'
            }`}
          >
            Slow (≥1s) <span className="ml-1 font-sans">({stats.slows})</span>
          </button>

          <button
            type="button"
            onClick={() => setQuickLevel('info')}
            className={`px-2.5 py-1 rounded text-xs font-medium transition cursor-pointer border ${
              quickLevel === 'info'
                ? 'bg-[#5794f2] text-white border-transparent shadow-xs font-bold'
                : 'border-[#5794f2]/30 bg-[#5794f2]/10 text-[#3274d9] dark:text-[#5794f2] hover:bg-[#5794f2]/20'
            }`}
          >
            Info <span className="ml-1 font-sans">({stats.infos})</span>
          </button>

          {quickLevel !== 'all' && (
            <button
              type="button"
              onClick={() => setQuickLevel('all')}
              className="text-[11px] text-slate-400 hover:text-rose-500 hover:underline transition ml-auto cursor-pointer"
            >
              Reset filter
            </button>
          )}
        </div>

        {/* Log Viewer Content Area */}
        <ScrollArea className="h-[calc(100vh-340px)] w-full" ref={scrollRef}>
          {processedEvents.length === 0 ? (
            <div className="py-20 text-center text-slate-500 text-xs space-y-1">
              <div className="font-medium text-slate-700 dark:text-slate-300">Không có dòng log nào phù hợp.</div>
              <p className="text-[11px] text-slate-400">
                Thử thay đổi bộ lọc, từ khóa tìm kiếm hoặc kiểm tra lại khoảng thời gian đã chọn.
              </p>
            </div>
          ) : displayMode === 'table' ? (
            <div className="w-full overflow-x-auto">
              <table className="w-full text-left font-sans text-xs border-collapse">
                <thead>
                  <tr className="border-b dark:border-slate-800 border-slate-200 dark:text-slate-400 text-slate-600 dark:bg-slate-900/60 bg-slate-100 text-[11px]">
                    <th className="py-2 px-3 w-10 text-center">#</th>
                    <th className="py-2 px-3 w-48 whitespace-nowrap">
                      <Button
                        variant="ghost"
                        size="xs"
                        type="button"
                        onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
                        className="h-6 p-0 flex items-center gap-1 dark:hover:text-white hover:text-slate-900 transition cursor-pointer font-semibold text-[11px]"
                      >
                        <span>Time</span>
                        <ArrowUpDown className="h-3 w-3 text-cyan-500 dark:text-cyan-400" />
                      </Button>
                    </th>
                    <th className="py-2 px-3 w-28 whitespace-nowrap">detected_level</th>
                    <th className="py-2 px-3 text-left">Line</th>
                    <th className="py-2 px-3 w-64 min-w-[240px] text-left whitespace-nowrap">
                      Trace ID
                    </th>
                    <th className="py-2 px-3 w-20 text-center whitespace-nowrap">Inspect</th>
                  </tr>
                </thead>
                <tbody className="divide-y dark:divide-slate-800/60 divide-slate-200">
                  {processedEvents.map((evt, idx) => {
                    const lineContent = evt.rawJson || evt.message || '';
                    const formattedLine = lineContent.replace(/\\r\\n/g, '\n').replace(/\\n/g, '\n');
                    const isExpanded = expandedRowIdx === idx;
                    const isJson = lineContent && (lineContent.startsWith('{') || lineContent.startsWith('['));

                    return (
                      <tr
                        key={idx}
                        className="hover:dark:bg-slate-800/40 hover:bg-slate-100/70 transition group cursor-pointer"
                        onClick={() => evt.parentTrace && onInspect && onInspect(evt.parentTrace)}
                      >
                        <td className="py-2 px-3 text-center dark:text-slate-600 text-slate-400 text-[11px]">
                          {idx + 1}
                        </td>
                        <td className="py-2 px-3 dark:text-slate-400 text-slate-600 text-[11px] whitespace-nowrap font-mono">
                          {formatTime(evt.time)}
                        </td>
                        <td className="py-2 px-3 whitespace-nowrap">{getLevelBadge(evt.level)}</td>
                        <td className="py-2 px-3 dark:text-slate-300 text-slate-800 w-full max-w-0">
                          {isExpanded && isJson ? (
                            <div className="p-2 rounded bg-slate-100 dark:bg-black/60 border dark:border-slate-800 border-slate-200 my-1">
                              <HighlightedJson value={lineContent} />
                            </div>
                          ) : (
                            <div
                              className={
                                tableWrap
                                  ? 'whitespace-pre-wrap break-all leading-relaxed text-[11px] font-sans'
                                  : 'truncate w-full font-sans text-[11px] leading-relaxed'
                              }
                            >
                              {formattedLine}
                            </div>
                          )}
                        </td>
                        <td className="py-2 px-3 text-cyan-600 dark:text-cyan-400 text-[11px] select-all whitespace-nowrap font-mono w-64 min-w-[240px]">
                          {evt.parentTrace?.traceId ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (onInspect) onInspect(evt.parentTrace);
                              }}
                              className="text-cyan-600 dark:text-cyan-400 hover:text-cyan-500 hover:underline transition font-mono text-[11px] cursor-pointer"
                              title="Nhấp để mở chi tiết Trace Waterfall"
                            >
                              {evt.parentTrace.traceId}
                            </button>
                          ) : (
                            <span className="text-slate-400 dark:text-slate-600">-</span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center">
                            {evt.parentTrace && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (onInspect) onInspect(evt.parentTrace);
                                    }}
                                    className="h-6 w-6 p-0 text-slate-400 hover:text-cyan-500 dark:hover:text-cyan-400"
                                  >
                                    <Eye className="h-3.5 w-3.5" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Inspect Trace Waterfall</TooltipContent>
                              </Tooltip>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            /* Stream Mode: Terminal/Logs View */
            <div className={`p-1 space-y-1 ${logViewMode === 'nowrap' ? 'w-max min-w-full' : 'w-full min-w-0'}`}>
              {processedEvents.map((evt, idx) => {
                const rawContent = evt.rawJson || evt.message || '';
                const lineContent = typeof rawContent === 'string' ? rawContent : JSON.stringify(rawContent);

                if (logViewMode === 'pretty') {
                  return (
                    <div
                      key={idx}
                      className="font-sans text-xs dark:text-slate-300 text-slate-800 py-2.5 px-3 rounded hover:dark:bg-slate-800/30 hover:bg-slate-100/60 transition border-b dark:border-slate-800/70 border-slate-200"
                    >
                      <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400 select-none">|</span>
                          <span className="dark:text-slate-400 text-slate-600 font-mono text-[11px]">
                            {formatTime(evt.time)}
                          </span>
                          {getLevelBadge(evt.level)}
                          {evt.parentTrace?.traceId && (
                            <button
                              type="button"
                              onClick={() => evt.parentTrace && onInspect && onInspect(evt.parentTrace)}
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-cyan-600 dark:text-cyan-400 font-mono text-[11px] font-medium bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/25 transition cursor-pointer"
                              title="Mở Trace Waterfall"
                            >
                              <span>[{evt.parentTrace.traceId}]</span>
                              <ExternalLink className="h-2.5 w-2.5" />
                            </button>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleCopy(formatPrettyJson(lineContent), idx, 'JSON')}
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
                              {copiedIdx === idx ? 'Đã sao chép' : 'Sao chép formatted JSON'}
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
                              <TooltipContent>Mở Inspector Drawer</TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                      </div>
                      <div className="dark:text-slate-200 text-slate-800 whitespace-pre-wrap break-all dark:bg-black/50 bg-slate-100 p-3 rounded-lg border dark:border-slate-800/80 border-slate-200 text-[11px] leading-relaxed select-text font-mono">
                        <HighlightedJson value={lineContent} />
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={idx}
                    onClick={() => evt.parentTrace && onInspect && onInspect(evt.parentTrace)}
                    className={`group font-sans text-xs dark:text-slate-300 text-slate-800 py-1.5 px-2.5 rounded hover:dark:bg-slate-800/50 hover:bg-slate-100 cursor-pointer transition flex items-start gap-2 border-b dark:border-slate-900/50 border-slate-200/60 ${
                      logViewMode === 'nowrap' ? 'w-max min-w-full whitespace-nowrap' : 'w-full min-w-0'
                    }`}
                  >
                    <span className="text-slate-400 select-none shrink-0">|</span>
                    <span className="dark:text-slate-400 text-slate-600 text-[11px] shrink-0 font-mono">
                      {formatTime(evt.time)}
                    </span>
                    {getLevelBadge(evt.level)}
                    {evt.parentTrace?.traceId && (
                      <span className="text-cyan-600 dark:text-cyan-400 text-[11px] shrink-0 font-mono font-medium">
                        [{evt.parentTrace.traceId.slice(0, 8)}...]
                      </span>
                    )}
                    <span
                      className={
                        logViewMode === 'nowrap'
                          ? 'dark:text-slate-200 text-slate-800 group-hover:dark:text-white group-hover:text-black leading-relaxed font-mono text-[11px] whitespace-nowrap select-text shrink-0'
                          : 'flex-1 min-w-0 w-full dark:text-slate-200 text-slate-800 group-hover:dark:text-white group-hover:text-black leading-relaxed font-mono text-[11px] whitespace-pre-wrap break-all select-text'
                      }
                    >
                      {lineContent}
                    </span>
                    <div className="opacity-0 group-hover:opacity-100 transition flex items-center gap-1 shrink-0 ml-auto">
                      <Button
                        size="sm"
                        variant="ghost"
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopy(lineContent, idx, 'log line');
                        }}
                        className="h-5 w-5 p-0 text-slate-400 hover:text-slate-900 dark:hover:text-white"
                        title="Sao chép dòng log"
                      >
                        {copiedIdx === idx ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                      </Button>
                      {evt.parentTrace && (
                        <Button
                          size="sm"
                          variant="ghost"
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onInspect) onInspect(evt.parentTrace);
                          }}
                          className="h-5 w-5 p-0 text-cyan-600 dark:text-cyan-400"
                          title="Inspect trace"
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>
    </TooltipProvider>
  );
}

LogStreamView.propTypes = {
  events: PropTypes.array,
  onInspect: PropTypes.func,
};

export default LogStreamView;
