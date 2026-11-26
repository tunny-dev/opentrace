import { useState, useMemo, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Calendar as CalendarIcon, Search, Copy, Check, ClipboardPaste } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar as CalendarUI } from '@/components/ui/calendar';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

function AngleDoubleLeftIcon({ className = 'w-4 h-4' }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      fill="currentColor"
    >
      <path d="M11.46,8.29a1,1,0,0,0-1.42,0l-3,3a1,1,0,0,0,0,1.42l3,3a1,1,0,0,0,1.42,0,1,1,0,0,0,0-1.42L9.16,12l2.3-2.29A1,1,0,0,0,11.46,8.29ZM14.66,12,17,9.71a1,1,0,0,0-1.42-1.42l-3,3a1,1,0,0,0,0,1.42l3,3a1,1,0,0,0,1.42,0,1,1,0,0,0,0-1.42Z" />
    </svg>
  );
}

function ClockNineIcon({ className = 'w-4 h-4' }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      fill="currentColor"
    >
      <path d="M12,6a.99974.99974,0,0,0-1,1v4H9a1,1,0,0,0,0,2h3a.99974.99974,0,0,0,1-1V7A.99974.99974,0,0,0,12,6Zm0-4A10,10,0,1,0,22,12,10.01146,10.01146,0,0,0,12,2Zm0,18a8,8,0,1,1,8-8A8.00917,8.00917,0,0,1,12,20Z" />
    </svg>
  );
}

function AngleDownIcon({ className = 'w-3.5 h-3.5' }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      fill="currentColor"
    >
      <path d="M17,9.17a1,1,0,0,0-1.41,0L12,12.71,8.46,9.17a1,1,0,0,0-1.41,0,1,1,0,0,0,0,1.42l4.24,4.24a1,1,0,0,0,1.42,0L17,10.59A1,1,0,0,0,17,9.17Z" />
    </svg>
  );
}

function AngleDoubleRightIcon({ className = 'w-4 h-4' }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      fill="currentColor"
    >
      <path d="M8.46,8.29A1,1,0,1,0,7,9.71L9.34,12,7,14.29a1,1,0,0,0,0,1.42,1,1,0,0,0,1.42,0l3-3a1,1,0,0,0,0-1.42Zm8.5,3-3-3a1,1,0,0,0-1.42,1.42L14.84,12l-2.3,2.29a1,1,0,0,0,0,1.42,1,1,0,0,0,1.42,0l3-3A1,1,0,0,0,17,11.29Z" />
    </svg>
  );
}

function SearchMinusIcon({ className = 'w-4 h-4' }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      fill="currentColor"
    >
      <path d="M21.71,20.29,18,16.61A9,9,0,1,0,16.61,18l3.68,3.68a1,1,0,0,0,1.42,0A1,1,0,0,0,21.71,20.29ZM11,18a7,7,0,1,1,7-7A7,7,0,0,1,11,18Zm4-8H7a1,1,0,0,0,0,2h8a1,1,0,0,0,0-2Z" />
    </svg>
  );
}

const QUICK_RANGES = [
  { label: 'Last 5 minutes', from: 'now-5m', to: 'now', spanMs: 5 * 60 * 1000 },
  { label: 'Last 15 minutes', from: 'now-15m', to: 'now', spanMs: 15 * 60 * 1000 },
  { label: 'Last 30 minutes', from: 'now-30m', to: 'now', spanMs: 30 * 60 * 1000 },
  { label: 'Last 1 hour', from: 'now-1h', to: 'now', spanMs: 60 * 60 * 1000 },
  { label: 'Last 3 hours', from: 'now-3h', to: 'now', spanMs: 3 * 3600 * 1000 },
  { label: 'Last 6 hours', from: 'now-6h', to: 'now', spanMs: 6 * 3600 * 1000 },
  { label: 'Last 12 hours', from: 'now-12h', to: 'now', spanMs: 12 * 3600 * 1000 },
  { label: 'Last 24 hours', from: 'now-24h', to: 'now', spanMs: 24 * 3600 * 1000 },
  { label: 'Last 2 days', from: 'now-2d', to: 'now', spanMs: 2 * 86400 * 1000 },
  { label: 'Last 7 days', from: 'now-7d', to: 'now', spanMs: 7 * 86400 * 1000 },
  { label: 'Last 30 days', from: 'now-30d', to: 'now', spanMs: 30 * 86400 * 1000 },
  { label: 'Today', from: 'now/d', to: 'now', spanMs: 86400 * 1000 },
  { label: 'Yesterday', from: 'now-1d/d', to: 'now-1d/d', spanMs: 86400 * 1000 },
];

function formatDateOnly(d) {
  if (!d || !(d instanceof Date) || isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatDateTime(d) {
  if (!d || !(d instanceof Date) || isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const h = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  const s = String(d.getSeconds()).padStart(2, '0');
  return `${y}-${m}-${day} ${h}:${min}:${s}`;
}

function resolveRangeDates(fromStr, toStr, fallbackSpanMs = 3600 * 1000) {
  const now = Date.now();
  let toMs = now;
  let fromMs = now - fallbackSpanMs;

  if (toStr && toStr !== 'now') {
    if (toStr === 'now/d') {
      toMs = new Date(new Date().setHours(23, 59, 59, 999)).getTime();
    } else if (toStr.endsWith('/d')) {
      const daysMatch = toStr.match(/now-(\d+)d\/d/i);
      const days = daysMatch ? parseInt(daysMatch[1], 10) : 1;
      const target = new Date(now - days * 86400000);
      toMs = new Date(target.setHours(23, 59, 59, 999)).getTime();
    } else {
      const parsedTo = new Date(toStr.replace(/-/g, '/')).getTime();
      if (!isNaN(parsedTo)) toMs = parsedTo;
    }
  }

  if (fromStr) {
    if (fromStr === 'now') {
      fromMs = now;
    } else if (fromStr === 'now/d') {
      fromMs = new Date(new Date().setHours(0, 0, 0, 0)).getTime();
    } else if (fromStr.endsWith('/d')) {
      const daysMatch = fromStr.match(/now-(\d+)d\/d/i);
      const days = daysMatch ? parseInt(daysMatch[1], 10) : 1;
      const target = new Date(now - days * 86400000);
      fromMs = new Date(target.setHours(0, 0, 0, 0)).getTime();
    } else if (fromStr.startsWith('now-')) {
      const match = fromStr.match(/^now-(\d+)([smhd])$/);
      if (match) {
        const val = parseInt(match[1], 10);
        const unit = match[2];
        const mult = unit === 's' ? 1000 : unit === 'm' ? 60000 : unit === 'h' ? 3600000 : 86400000;
        fromMs = toMs - val * mult;
      } else {
        fromMs = toMs - fallbackSpanMs;
      }
    } else {
      const parsedFrom = new Date(fromStr.replace(/-/g, '/')).getTime();
      if (!isNaN(parsedFrom)) fromMs = parsedFrom;
    }
  }

  return { fromMs, toMs, span: toMs - fromMs > 0 ? toMs - fromMs : fallbackSpanMs };
}

export function TimeRangePicker({ timeRange, onChangeTimeRange, availableDates = [] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [calendarRange, setCalendarRange] = useState({ from: undefined, to: undefined });
  const [searchFilter, setSearchFilter] = useState('');
  const [copied, setCopied] = useState(false);

  // Local draft inputs for Absolute time range
  const [draftFrom, setDraftFrom] = useState(timeRange?.from || 'now-1h');
  const [draftTo, setDraftTo] = useState(timeRange?.to || 'now');

  // Keep draft in sync when timeRange prop changes
  useEffect(() => {
    if (timeRange?.from) setDraftFrom(timeRange.from);
    if (timeRange?.to) setDraftTo(timeRange.to);
  }, [timeRange]);

  // Active label display
  const activeLabel = useMemo(() => {
    if (!timeRange) return 'Last 1 hour';
    if (timeRange.label) return timeRange.label;
    const match = QUICK_RANGES.find((r) => r.from === timeRange.from && r.to === timeRange.to);
    if (match) return match.label;
    return `${timeRange.from} to ${timeRange.to}`;
  }, [timeRange]);

  // Filtered quick ranges
  const filteredQuickRanges = useMemo(() => {
    const q = searchFilter.trim().toLowerCase();
    if (!q) return QUICK_RANGES;
    return QUICK_RANGES.filter((r) => r.label.toLowerCase().includes(q));
  }, [searchFilter]);

  // Handle Quick Range Click
  const handleSelectQuickRange = (range) => {
    onChangeTimeRange({
      from: range.from,
      to: range.to,
      label: range.label,
      spanMs: range.spanMs,
    });
    setIsOpen(false);
  };

  // Handle Select Specific Server Date
  const handleSelectServerDate = (dStr) => {
    onChangeTimeRange({
      from: `${dStr} 00:00:00`,
      to: `${dStr} 23:59:59`,
      label: dStr,
      date: dStr,
    });
    setIsOpen(false);
  };

  // Handle Apply Absolute Range
  const handleApplyAbsolute = () => {
    onChangeTimeRange({
      from: draftFrom.trim() || 'now-1h',
      to: draftTo.trim() || 'now',
      label: `${draftFrom} to ${draftTo}`,
    });
    setIsOpen(false);
  };

  // Handle Copy Range
  const handleCopyRange = () => {
    navigator.clipboard.writeText(`${draftFrom} -> ${draftTo}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  // Handle Paste Range
  const handlePasteRange = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text.includes('->')) {
        const [f, t] = text.split('->');
        if (f) setDraftFrom(f.trim());
        if (t) setDraftTo(t.trim());
      } else if (text) {
        setDraftFrom(text.trim());
      }
    } catch {
      // clipboard access denied
    }
  };

  // Time navigation: Step Backward («)
  const handleStepBackward = () => {
    const { fromMs, toMs, span } = resolveRangeDates(
      timeRange?.from || draftFrom,
      timeRange?.to || draftTo,
      timeRange?.spanMs || 3600 * 1000
    );
    const newFrom = new Date(fromMs - span);
    const newTo = new Date(toMs - span);
    const fromStr = formatDateTime(newFrom);
    const toStr = formatDateTime(newTo);
    setDraftFrom(fromStr);
    setDraftTo(toStr);
    onChangeTimeRange({
      from: fromStr,
      to: toStr,
      label: `${fromStr} to ${toStr}`,
      spanMs: span,
    });
  };

  // Time navigation: Step Forward (»)
  const handleStepForward = () => {
    const { fromMs, toMs, span } = resolveRangeDates(
      timeRange?.from || draftFrom,
      timeRange?.to || draftTo,
      timeRange?.spanMs || 3600 * 1000
    );
    const now = Date.now();
    let newToMs = toMs + span;
    let newFromMs = fromMs + span;
    if (newToMs > now) {
      newToMs = now;
      newFromMs = Math.max(0, now - span);
    }
    const newFrom = new Date(newFromMs);
    const newTo = new Date(newToMs);
    const fromStr = formatDateTime(newFrom);
    const toStr = formatDateTime(newTo);
    setDraftFrom(fromStr);
    setDraftTo(toStr);
    onChangeTimeRange({
      from: fromStr,
      to: toStr,
      label: `${fromStr} to ${toStr}`,
      spanMs: span,
    });
  };

  // Time navigation: Zoom out (🔍-)
  const handleZoomOut = () => {
    const { toMs, span } = resolveRangeDates(
      timeRange?.from || draftFrom,
      timeRange?.to || draftTo,
      timeRange?.spanMs || 3600 * 1000
    );
    const doubleSpan = span * 2;
    const now = Date.now();
    let newToMs = toMs + Math.round(span / 2);
    if (newToMs > now) newToMs = now;
    const newFromMs = newToMs - doubleSpan;
    const newFrom = new Date(newFromMs);
    const newTo = new Date(newToMs);
    const fromStr = formatDateTime(newFrom);
    const toStr = formatDateTime(newTo);
    setDraftFrom(fromStr);
    setDraftTo(toStr);
    onChangeTimeRange({
      from: fromStr,
      to: toStr,
      label: `${fromStr} to ${toStr}`,
      spanMs: doubleSpan,
    });
  };

  // Browser Timezone string (e.g. UTC+07:00)
  const tzOffset = useMemo(() => {
    const offset = -new Date().getTimezoneOffset();
    const sign = offset >= 0 ? '+' : '-';
    const hrs = String(Math.floor(Math.abs(offset) / 60)).padStart(2, '0');
    const mins = String(Math.abs(offset) % 60).padStart(2, '0');
    return `UTC${sign}${hrs}:${mins}`;
  }, []);

  const tzShort = useMemo(() => {
    try {
      const str = new Intl.DateTimeFormat('en-US', { timeZoneName: 'short' }).format(new Date());
      const parts = str.split(' ');
      return parts[parts.length - 1] || 'ICT';
    } catch {
      return 'ICT';
    }
  }, []);

  const hoverRange = useMemo(() => {
    const { fromMs, toMs } = resolveRangeDates(
      timeRange?.from || draftFrom,
      timeRange?.to || draftTo,
      timeRange?.spanMs || 3600 * 1000
    );
    return {
      fromStr: formatDateTime(new Date(fromMs)),
      toStr: formatDateTime(new Date(toMs)),
    };
  }, [timeRange, draftFrom, draftTo]);

  return (
    <div className="relative inline-flex items-center">
      <div className="button-group inline-flex items-stretch rounded border border-slate-300 dark:border-[#2c323f] bg-slate-50 dark:bg-[#181b1f] shadow-xs select-none h-8 box-border">
        <button
          type="button"
          onClick={handleStepBackward}
          title="Move time range backwards"
          aria-label="Move time range backwards"
          className="px-2.5 flex items-center justify-center border-r border-slate-300 dark:border-[#2c323f] hover:bg-slate-200/70 hover:dark:bg-[#22252b] text-slate-700 dark:text-[#c7d0d9] transition cursor-pointer rounded-l-[3px]"
        >
          <AngleDoubleLeftIcon className="w-4 h-4" />
        </button>

        <div
          className="relative flex items-stretch"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <Popover
            open={isOpen}
            onOpenChange={(open) => {
              setIsOpen(open);
              if (open) setIsHovered(false);
            }}
          >
            <PopoverTrigger asChild>
              <button
                type="button"
                aria-label={`Time range selected: ${activeLabel}`}
                className="px-3 flex items-center gap-2 border-r border-slate-300 dark:border-[#2c323f] hover:bg-slate-200/70 hover:dark:bg-[#22252b] text-slate-900 dark:text-[#f4f5f7] font-medium text-xs transition cursor-pointer"
              >
                <ClockNineIcon className="w-4 h-4 text-slate-700 dark:text-[#c7d0d9]" />
                <span className="font-semibold text-xs tracking-tight">{activeLabel}</span>
                <AngleDownIcon className="w-3.5 h-3.5 text-slate-700 dark:text-[#c7d0d9]" />
              </button>
            </PopoverTrigger>

            <PopoverContent
              align="start"
              sideOffset={6}
              className="w-[94vw] max-w-170 p-0 dark:bg-[#181b1f] bg-white border dark:border-[#2c323f] border-slate-200 shadow-2xl rounded-lg overflow-hidden text-xs z-50"
            >
              <div className="grid grid-cols-1 sm:grid-cols-12 min-h-80">
                <div className="sm:col-span-5 p-4 flex flex-col justify-between border-b sm:border-b-0 sm:border-r dark:border-[#22252b] border-slate-200 space-y-3 dark:bg-[#14161a] bg-slate-50/50">
                  <div className="space-y-3">
                    <div className="text-xs font-bold uppercase tracking-wider dark:text-slate-300 text-slate-700">
                      Absolute time range
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-sans dark:text-slate-400 text-slate-500">
                        From:
                      </label>
                      <div className="flex items-center rounded-md border dark:border-slate-700 border-slate-300 dark:bg-[#090d16] bg-slate-50 overflow-hidden focus-within:border-cyan-500">
                        <Input
                          type="text"
                          value={draftFrom}
                          onChange={(e) => setDraftFrom(e.target.value)}
                          placeholder="now-1h"
                          className="h-7 border-0 bg-transparent px-2.5 text-xs font-sans dark:text-slate-200 text-slate-900 focus-visible:ring-0"
                        />
                        <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                          <PopoverTrigger asChild>
                            <button
                              type="button"
                              title="Select date range"
                              className="px-2 text-slate-400 hover:text-cyan-500 transition cursor-pointer"
                            >
                              <CalendarIcon className="h-3.5 w-3.5" />
                            </button>
                          </PopoverTrigger>
                          <PopoverContent
                            side="left"
                            align="start"
                            className="w-auto p-3 dark:bg-[#0f172a] bg-white border dark:border-slate-800 border-slate-200 shadow-2xl z-50"
                          >
                            <div className="flex items-center justify-between pb-2 mb-2 border-b dark:border-slate-800 border-slate-200 text-xs font-semibold dark:text-slate-200 text-slate-800">
                              <span className="flex items-center gap-1.5">
                                <CalendarIcon className="h-3.5 w-3.5 text-cyan-500" />
                                Select a time range
                              </span>
                              <button
                                type="button"
                                onClick={() => setIsCalendarOpen(false)}
                                className="h-5 w-5 rounded text-slate-400 hover:text-slate-600 dark:hover:text-white flex items-center justify-center text-xs"
                              >
                                ✕
                              </button>
                            </div>
                            <CalendarUI
                              mode="range"
                              selected={calendarRange}
                              onSelect={(range) => {
                                setCalendarRange(range || { from: undefined, to: undefined });
                                if (range?.from) {
                                  setDraftFrom(`${formatDateOnly(range.from)} 00:00:00`);
                                }
                                if (range?.to) {
                                  setDraftTo(`${formatDateOnly(range.to)} 23:59:59`);
                                }
                              }}
                              numberOfMonths={1}
                              className="rounded-md"
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-sans dark:text-slate-400 text-slate-500">
                        To:
                      </label>
                      <div className="flex items-center rounded-md border dark:border-slate-700 border-slate-300 dark:bg-[#090d16] bg-slate-50 overflow-hidden focus-within:border-cyan-500">
                        <Input
                          type="text"
                          value={draftTo}
                          onChange={(e) => setDraftTo(e.target.value)}
                          placeholder="now"
                          className="h-7 border-0 bg-transparent px-2.5 text-xs font-sans dark:text-slate-200 text-slate-900 focus-visible:ring-0"
                        />
                        <button
                          type="button"
                          onClick={() => setIsCalendarOpen(true)}
                          title="Select date range"
                          className="px-2 text-slate-400 hover:text-cyan-500 transition cursor-pointer"
                        >
                          <CalendarIcon className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleCopyRange}
                            className="h-7 w-7 p-0 dark:border-slate-700 border-slate-300 dark:bg-slate-800/80 bg-white"
                          >
                            {copied ? (
                              <Check className="h-3.5 w-3.5 text-emerald-500" />
                            ) : (
                              <Copy className="h-3.5 w-3.5 text-slate-400" />
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Copy time range string</TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handlePasteRange}
                            className="h-7 w-7 p-0 dark:border-slate-700 border-slate-300 dark:bg-slate-800/80 bg-white"
                          >
                            <ClipboardPaste className="h-3.5 w-3.5 text-slate-400" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Paste from clipboard</TooltipContent>
                      </Tooltip>

                      <Button
                        size="sm"
                        onClick={handleApplyAbsolute}
                        className="h-7 flex-1 bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs shadow-sm"
                      >
                        Apply time range
                      </Button>
                    </div>
                  </div>

                  <div className="text-[11px] dark:text-slate-400 text-slate-500 leading-relaxed border-t dark:border-slate-800/80 border-slate-200 pt-2.5">
                    <p>
                      Enter relative expressions like{' '}
                      <code className="text-cyan-500 font-sans">now-5m</code>,{' '}
                      <code className="text-cyan-500 font-sans">now-1h</code>,{' '}
                      <code className="text-cyan-500 font-sans">now-24h</code>, or exact dates.
                    </p>
                  </div>
                </div>

                <div className="sm:col-span-7 flex flex-col justify-between">
                  <div className="p-3 border-b dark:border-slate-800/80 border-slate-200">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
                      <Input
                        type="text"
                        value={searchFilter}
                        onChange={(e) => setSearchFilter(e.target.value)}
                        placeholder="Search quick ranges"
                        className="pl-8 h-7 text-xs dark:bg-[#090d16] bg-slate-50 dark:border-slate-700 border-slate-300 dark:text-slate-200 text-slate-900 placeholder:text-slate-400"
                      />
                    </div>
                  </div>

                  <ScrollArea className="h-64 px-2 py-1">
                    <div className="space-y-0.5">
                      {filteredQuickRanges.map((range) => {
                        const isActive =
                          timeRange?.from === range.from && timeRange?.to === range.to;
                        return (
                          <div
                            key={range.label}
                            onClick={() => handleSelectQuickRange(range)}
                            className={`relative flex items-center px-3 py-1.5 rounded text-xs cursor-pointer transition select-none ${
                              isActive
                                ? 'dark:bg-slate-800 bg-slate-100 dark:text-white text-slate-900 font-semibold'
                                : 'hover:dark:bg-slate-800/50 hover:bg-slate-50 dark:text-slate-300 text-slate-700'
                            }`}
                          >
                            {/* Orange indicator bar on left matching Image 2 */}
                            {isActive && (
                              <span className="absolute left-0 top-1 bottom-1 w-1 rounded-r bg-amber-500" />
                            )}
                            <span className={isActive ? 'pl-1' : ''}>{range.label}</span>
                          </div>
                        );
                      })}

                      {availableDates.length > 0 && (
                        <div className="pt-2 mt-2 border-t dark:border-slate-800/80 border-slate-200">
                          <div className="text-[10px] font-bold uppercase tracking-wider dark:text-slate-500 text-slate-400 px-3 py-1">
                            Server Log Dates:
                          </div>
                          {availableDates.map((dStr) => {
                            const isActive = timeRange?.date === dStr;
                            return (
                              <div
                                key={dStr}
                                onClick={() => handleSelectServerDate(dStr)}
                                className={`relative flex items-center justify-between px-3 py-1.5 rounded text-xs font-sans cursor-pointer transition select-none ${
                                  isActive
                                    ? 'dark:bg-slate-800 bg-slate-100 dark:text-cyan-400 text-cyan-600 font-bold'
                                    : 'hover:dark:bg-slate-800/50 hover:bg-slate-50 dark:text-slate-400 text-slate-600'
                                }`}
                              >
                                {isActive && (
                                  <span className="absolute left-0 top-1 bottom-1 w-1 rounded-r bg-cyan-500" />
                                )}
                                <span className={isActive ? 'pl-1' : ''}>{dStr}</span>
                                <span className="text-[10px] text-slate-400 font-sans">
                                  Full Day
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              </div>

              <div className="flex items-center justify-between px-4 py-2 border-t dark:border-[#22252b] border-slate-200 dark:bg-[#111217] bg-slate-50 text-[11px] dark:text-[#8e94a0] text-slate-500 font-sans">
                <div className="flex items-center gap-2">
                  <span>Browser Time {tzShort}</span>
                  <span className="text-[#5794f2] font-semibold">{tzOffset}</span>
                </div>
                <div className="text-[11px] text-[#8e94a0] flex items-center gap-1">
                  <span>SpurTrace Timezone</span>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {isHovered && !isOpen && (
            <div className="absolute top-[calc(100%+6px)] left-1/2 -translate-x-1/2 z-50 pointer-events-none animate-in fade-in zoom-in-95 duration-100 flex flex-col items-center">
              <div className="w-2.5 h-2.5 bg-white dark:bg-[#181b1f] border-t border-l border-slate-200 dark:border-[#2c323f] rotate-45 -mb-1.5 shadow-sm" />
              <div className="bg-white dark:bg-[#181b1f] text-slate-800 dark:text-[#f4f5f7] border border-slate-200 dark:border-[#2c323f] rounded-lg shadow-xl px-4 py-2.5 text-center font-sans whitespace-nowrap min-w-47.5">
                <div className="text-[13px] font-normal leading-tight text-slate-800 dark:text-[#f4f5f7]">
                  {hoverRange.fromStr}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-[#8e94a0] py-0.5">to</div>
                <div className="text-[13px] font-normal leading-tight text-slate-800 dark:text-[#f4f5f7]">
                  {hoverRange.toStr}
                </div>
                <div className="text-[11px] pt-1.5 flex items-center justify-center gap-1">
                  <span className="text-[#c15c17] dark:text-[#f59e0b] font-semibold">
                    Browser Time
                  </span>
                  <span className="text-slate-500 dark:text-[#8e94a0]">{tzShort}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={handleStepForward}
          title="Move time range forwards"
          aria-label="Move time range forwards"
          className="px-2.5 flex items-center justify-center border-r border-slate-300 dark:border-[#2c323f] hover:bg-slate-200/70 hover:dark:bg-[#22252b] text-slate-700 dark:text-[#c7d0d9] transition cursor-pointer"
        >
          <AngleDoubleRightIcon className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={handleZoomOut}
          title="Zoom out time range"
          aria-label="Zoom out time range"
          className="px-2.5 flex items-center justify-center hover:bg-slate-200/70 hover:dark:bg-[#22252b] text-slate-700 dark:text-[#c7d0d9] transition cursor-pointer rounded-r-sm"
        >
          <SearchMinusIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

TimeRangePicker.propTypes = {
  timeRange: PropTypes.shape({
    from: PropTypes.string,
    to: PropTypes.string,
    label: PropTypes.string,
    spanMs: PropTypes.number,
    date: PropTypes.string,
  }),
  onChangeTimeRange: PropTypes.func.isRequired,
  availableDates: PropTypes.array,
};
