import { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  AlertCircle,
  AlertTriangle,
  ShieldAlert,
  Search,
  Filter,
  Eye,
  Copy,
  Check,
  ChevronDown,
  ChevronRight,
  Layers,
  CheckCircle2,
  Bug,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TooltipProvider } from '@/components/ui/tooltip';
import { aggregateErrors } from '@/features/system-logs/utils/errorAnalytics';

export function ErrorTrackingTab({ traces = [], onInspectTrace, onFilterErrorInTraces }) {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all' | 'critical' | 'client'
  const [sortBy, setSortBy] = useState('occurrences'); // 'occurrences' | 'lastSeen'
  const [expandedIssues, setExpandedIssues] = useState(new Set());
  const [resolvedIssues, setResolvedIssues] = useState(new Set());
  const [copiedKey, setCopiedKey] = useState(null);

  const handleCopy = (text, key, e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1800);
  };

  const toggleExpand = (id) => {
    setExpandedIssues((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleResolve = (id, e) => {
    e.stopPropagation();
    setResolvedIssues((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Aggregate errors
  const { issues, metrics } = useMemo(() => {
    return aggregateErrors(traces);
  }, [traces]);

  // Filter & Sort issues
  const filteredIssues = useMemo(() => {
    let result = [...issues];

    if (filterType === 'critical') {
      result = result.filter((i) => i.isCritical);
    } else if (filterType === 'client') {
      result = result.filter((i) => i.statusCode >= 400 && i.statusCode < 500);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (i) =>
          i.title.toLowerCase().includes(q) ||
          i.errorType.toLowerCase().includes(q) ||
          i.rawMessage.toLowerCase().includes(q) ||
          (Array.isArray(i.impactedRoutes) ? i.impactedRoutes : []).some((r) =>
            r.toLowerCase().includes(q)
          )
      );
    }

    result.sort((a, b) => {
      const timeA = new Date(String(a.lastSeen).replace(/(\.\d{3})\d+Z?$/, '$1Z')).getTime() || 0;
      const timeB = new Date(String(b.lastSeen).replace(/(\.\d{3})\d+Z?$/, '$1Z')).getTime() || 0;

      if (sortBy === 'lastSeen') {
        return timeB - timeA;
      }
      if (a.occurrences !== b.occurrences) {
        return b.occurrences - a.occurrences;
      }
      return timeB - timeA;
    });

    return result;
  }, [issues, filterType, search, sortBy]);

  // Prettify Stack Trace lines: highlight app code vs framework code
  const renderFormattedStackTrace = (stack) => {
    if (!stack) return null;
    const lines = stack.split('\n');

    return (
      <div className="font-mono text-xs leading-relaxed space-y-0.5 select-text">
        {lines.map((line, idx) => {
          const isAppCode =
            line.includes('Senao') ||
            line.includes('MES') ||
            line.includes('Controllers') ||
            line.includes('Services') ||
            line.includes('src/') ||
            line.includes('App_Code');

          return (
            <div
              key={idx}
              className={`py-0.5 px-1.5 rounded transition ${
                isAppCode
                  ? 'bg-rose-500/15 text-rose-300 font-semibold dark:border dark:border-rose-500/30'
                  : 'text-slate-400 opacity-80 hover:opacity-100'
              }`}
            >
              {line}
            </div>
          );
        })}
      </div>
    );
  };

  const formatTimestamp = (iso) => {
    if (!iso) return '';
    try {
      const d = new Date(iso);
      if (isNaN(d.getTime())) return iso;
      return d.toLocaleTimeString() + ' ' + d.toLocaleDateString();
    } catch {
      return iso;
    }
  };

  return (
    <TooltipProvider delayDuration={150}>
      <div className="space-y-4">
        {/* Top Summary Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="rounded border dark:border-[#22252b] border-slate-200 dark:bg-[#181b1f] bg-white p-3.5 shadow-xs">
            <div className="flex items-center justify-between text-xs dark:text-[#8e94a0] text-slate-500 font-medium">
              <span>Total Error Events</span>
              <AlertCircle className="h-4 w-4 text-[#f2495c]" />
            </div>
            <div
              className={`text-2xl font-bold font-mono mt-1 ${metrics.totalErrorsCount > 0 ? 'text-[#f2495c]' : 'text-[#73bf69]'}`}
            >
              {metrics.totalErrorsCount}
            </div>
            <div className="text-[11px] text-[#8e94a0] mt-0.5 truncate">
              {metrics.totalErrorsCount > 0
                ? 'Detected in current APM window'
                : 'Zero errors recorded'}
            </div>
          </div>

          <div className="rounded border dark:border-[#22252b] border-slate-200 dark:bg-[#181b1f] bg-white p-3.5 shadow-xs">
            <div className="flex items-center justify-between text-xs dark:text-[#8e94a0] text-slate-500 font-medium">
              <span>Distinct Triaged Issues</span>
              <Bug className="h-4 w-4 text-[#faad14]" />
            </div>
            <div className="text-2xl font-bold font-mono dark:text-white text-slate-900 mt-1">
              {metrics.distinctIssuesCount}
            </div>
            <div className="text-[11px] text-[#8e94a0] mt-0.5 truncate">
              Unique exception &amp; error signatures
            </div>
          </div>

          <div className="rounded border dark:border-[#22252b] border-slate-200 dark:bg-[#181b1f] bg-white p-3.5 shadow-xs">
            <div className="flex items-center justify-between text-xs dark:text-[#8e94a0] text-slate-500 font-medium">
              <span>Critical Server Issues</span>
              <ShieldAlert className="h-4 w-4 text-rose-500" />
            </div>
            <div
              className={`text-2xl font-bold font-mono mt-1 ${metrics.criticalIssuesCount > 0 ? 'text-rose-500' : 'text-[#73bf69]'}`}
            >
              {metrics.criticalIssuesCount}
            </div>
            <div className="text-[11px] text-[#8e94a0] mt-0.5 truncate">
              5xx Server or SQL Exceptions
            </div>
          </div>

          <div className="rounded border dark:border-[#22252b] border-slate-200 dark:bg-[#181b1f] bg-white p-3.5 shadow-xs">
            <div className="flex items-center justify-between text-xs dark:text-[#8e94a0] text-slate-500 font-medium">
              <span>Affected Routes</span>
              <Layers className="h-4 w-4 text-purple-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-purple-400 mt-1">
              {metrics.affectedRoutesCount}
            </div>
            <div className="text-[11px] text-[#8e94a0] mt-0.5 truncate">
              Endpoint paths impacted by errors
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded border dark:border-[#22252b] border-slate-200 dark:bg-[#181b1f] bg-white">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative min-w-55 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[#8e94a0]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search error message, exception or route..."
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded border dark:border-[#22252b] border-slate-300 dark:bg-[#111217] bg-white dark:text-slate-100 text-slate-900 placeholder-[#8e94a0] focus:outline-none focus:border-[#3274d9]"
              />
            </div>

            <div className="flex items-center gap-1 text-xs">
              <button
                type="button"
                onClick={() => setFilterType('all')}
                className={`px-2.5 py-1 text-xs font-medium rounded transition cursor-pointer ${
                  filterType === 'all'
                    ? 'bg-[#3274d9] text-white shadow-xs'
                    : 'dark:text-[#8e94a0] text-slate-600 hover:dark:text-white'
                }`}
              >
                All Issues ({issues.length})
              </button>
              {metrics.criticalIssuesCount > 0 && (
                <button
                  type="button"
                  onClick={() => setFilterType('critical')}
                  className={`px-2.5 py-1 text-xs font-medium rounded transition cursor-pointer flex items-center gap-1 ${
                    filterType === 'critical'
                      ? 'bg-[#f2495c] text-white shadow-xs font-semibold'
                      : 'text-[#f2495c] hover:bg-[#f2495c]/10'
                  }`}
                >
                  <AlertTriangle className="h-3 w-3" />
                  Critical 5xx ({metrics.criticalIssuesCount})
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1 text-xs">
            <span className="text-[#8e94a0] font-sans mr-1">Sort:</span>
            {[
              { id: 'occurrences', label: 'Occurrences' },
              { id: 'lastSeen', label: 'Most Recent' },
            ].map((s) => (
              <Button
                key={s.id}
                size="sm"
                variant={sortBy === s.id ? 'default' : 'outline'}
                onClick={() => setSortBy(s.id)}
                className={`h-7 px-2.5 text-xs rounded transition-colors ${
                  sortBy === s.id
                    ? 'bg-[#3274d9] text-white shadow-xs font-semibold'
                    : 'dark:border-[#22252b] border-slate-300 dark:bg-[#111217] bg-white dark:text-[#c7d0d9] text-slate-700 hover:dark:bg-[#22252b]'
                }`}
              >
                {s.label}
                {sortBy === s.id && <span className="ml-1 text-[10px]">↓</span>}
              </Button>
            ))}
          </div>
        </div>

        {filteredIssues.length === 0 ? (
          <div className="rounded border dark:border-[#22252b] border-slate-200 dark:bg-[#181b1f] bg-white p-12 text-center text-xs text-[#8e94a0]">
            No errors or exceptions match the criteria. Everything is healthy!
          </div>
        ) : (
          <div className="space-y-3">
            {filteredIssues.map((issue) => {
              const isExpanded = expandedIssues.has(issue.id);
              const isResolved = resolvedIssues.has(issue.id);

              return (
                <div
                  key={issue.id}
                  className={`rounded border transition-all overflow-hidden ${
                    isResolved
                      ? 'opacity-60 border-slate-200 dark:border-[#22252b] dark:bg-[#14161b] bg-slate-50'
                      : issue.isCritical
                        ? 'border-[#f2495c]/40 dark:bg-[#181b1f] bg-rose-50/40 hover:dark:border-[#f2495c]/60'
                        : 'border-[#faad14]/30 dark:bg-[#181b1f] bg-amber-50/30 hover:dark:border-[#faad14]/50'
                  }`}
                >
                  <div
                    onClick={() => toggleExpand(issue.id)}
                    className="p-4 cursor-pointer flex flex-col lg:flex-row lg:items-center justify-between gap-3 hover:dark:bg-[#1e2229] hover:bg-slate-100/50 transition"
                  >
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <button type="button" className="text-[#8e94a0] hover:text-white mt-0.5">
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 text-[#5794f2]" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </button>

                      <div className="space-y-1.5 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`rounded px-2 py-0.5 text-xs font-bold font-mono border ${
                              issue.isCritical
                                ? 'bg-rose-500/15 text-rose-500 border-rose-500/30'
                                : 'bg-amber-500/15 text-amber-500 border-amber-500/30'
                            }`}
                          >
                            {issue.errorType}
                          </span>

                          <Badge
                            variant={issue.statusCode >= 500 ? 'destructive' : 'secondary'}
                            className="font-mono text-[10px]"
                          >
                            HTTP {issue.statusCode}
                          </Badge>

                          {isResolved && (
                            <Badge
                              variant="outline"
                              className="border-emerald-500/40 text-emerald-500 bg-emerald-500/10 text-[10px]"
                            >
                              Resolved
                            </Badge>
                          )}

                          <span className="text-[11px] text-[#8e94a0] font-sans">
                            Last seen: {formatTimestamp(issue.lastSeen)}
                          </span>
                        </div>

                        <div className="font-semibold dark:text-white text-slate-900 font-mono text-xs sm:text-sm truncate">
                          {issue.title}
                        </div>

                        <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                          <span className="text-[10px] text-[#8e94a0] uppercase font-sans">
                            Routes:
                          </span>
                          {issue.impactedRoutes.slice(0, 3).map((r) => (
                            <span
                              key={r}
                              className="px-1.5 py-0.2 rounded text-[10px] font-mono dark:bg-[#111217] bg-slate-100 text-slate-300 border dark:border-[#22252b] border-slate-200"
                            >
                              {r}
                            </span>
                          ))}
                          {issue.impactedRoutes.length > 3 && (
                            <span className="text-[10px] text-[#8e94a0]">
                              +{issue.impactedRoutes.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 justify-between lg:justify-end border-t lg:border-t-0 dark:border-[#22252b] border-slate-200 pt-2 lg:pt-0">
                      <div className="text-right">
                        <div className="font-mono font-bold text-base text-rose-500">
                          {issue.occurrences}
                        </div>
                        <div className="text-[10px] text-[#8e94a0] uppercase">Events</div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => toggleResolve(issue.id, e)}
                          className={`h-7 px-2 text-xs rounded transition-colors ${
                            isResolved
                              ? 'text-emerald-500 border-emerald-500/40'
                              : 'text-slate-400 hover:text-emerald-500'
                          }`}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                          {isResolved ? 'Resolved' : 'Mark Resolved'}
                        </Button>

                        {onFilterErrorInTraces && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              onFilterErrorInTraces(issue.errorType);
                            }}
                            className="h-7 px-2.5 text-xs dark:border-[#2c323f] border-slate-300 dark:bg-[#111217] bg-white text-[#3274d9] dark:text-[#5794f2] hover:bg-[#3274d9] hover:text-white dark:hover:bg-[#3274d9] dark:hover:text-white rounded"
                          >
                            <Filter className="h-3 w-3 mr-1" />
                            Filter Traces
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t dark:border-[#22252b] border-slate-200 p-4 space-y-3 dark:bg-[#0c1017] bg-slate-900/90 text-slate-200">
                      <div className="flex items-center justify-between text-xs pb-1 border-b dark:border-[#22252b] border-slate-800">
                        <span className="font-semibold text-slate-300">
                          Exception Details &amp; Stack Trace:
                        </span>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) =>
                              handleCopy(
                                issue.exceptionStack || issue.rawMessage,
                                `stack-${issue.id}`,
                                e
                              )
                            }
                            className="h-6 px-2 text-xs text-slate-400 hover:text-white"
                          >
                            {copiedKey === `stack-${issue.id}` ? (
                              <>
                                <Check className="h-3 w-3 mr-1 text-[#73bf69]" /> Copied Stack
                              </>
                            ) : (
                              <>
                                <Copy className="h-3 w-3 mr-1" /> Copy Stack Trace
                              </>
                            )}
                          </Button>

                          {onInspectTrace && issue.sampleTrace && (
                            <Button
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                onInspectTrace(issue.sampleTrace);
                              }}
                              className="h-6 px-2.5 text-xs bg-[#3274d9] hover:bg-[#2461c2] text-white font-semibold"
                            >
                              <Eye className="h-3 w-3 mr-1" /> Inspect Sample Trace
                            </Button>
                          )}
                        </div>
                      </div>

                      <div className="p-3 rounded bg-black/40 border border-slate-800 font-mono text-xs text-rose-300 whitespace-pre-wrap leading-relaxed select-text">
                        {issue.rawMessage}
                      </div>

                      {issue.exceptionStack && (
                        <div className="p-3 rounded bg-black/50 border border-slate-800 overflow-x-auto max-h-87.5">
                          {renderFormattedStackTrace(issue.exceptionStack)}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}

ErrorTrackingTab.propTypes = {
  traces: PropTypes.arrayOf(PropTypes.object),
  onInspectTrace: PropTypes.func,
  onFilterErrorInTraces: PropTypes.func,
};
