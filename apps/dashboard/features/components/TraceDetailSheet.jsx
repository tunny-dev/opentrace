import { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Copy,
  Check,
  Database,
  Activity,
  FileText,
  Maximize2,
  Minimize2,
  Sparkles,
  Flame,
  Clock,
  Layers,
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import { SqlQueryCard } from '@/features/system-logs/components/SqlQueryCard';
import { SqlStudioModal } from '@/features/system-logs/components/SqlStudioModal';
import { analyzeTrace, getSqlFingerprint } from '@/features/system-logs/utils/traceAnalytics';

export function TraceDetailSheet({ trace, isOpen, onClose }) {
  const [copiedKey, setCopiedKey] = useState(null);
  const [isMaximized, setIsMaximized] = useState(false);
  const [studioQueryIndex, setStudioQueryIndex] = useState(null);
  const [sqlFilter, setSqlFilter] = useState('all'); // 'all' | 'duplicates' | 'slow'

  // Default mode: disable line wrapping ('nowrap') as requested
  const [viewMode] = useState('nowrap');

  if (!trace) return null;

  const handleCopy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1800);
  };

  const {
    traceId,
    method = 'GET',
    path = '',
    statusCode = 200,
    totalDurationMs = 0,
    timestamp = '',
    clientIp = '',
    queryCount = 0,
    slowQueryCount = 0,
    hasError = false,
    events = [],
  } = trace;

  const sqlEvents = events.filter((e) => e.eventType === 'sql' || e.eventType === 'slow_sql');
  const traceAnalysis = analyzeTrace(trace);

  // Map each SQL query with duplicate detection info
  const enrichedSqlEvents = sqlEvents.map((evt, idx) => {
    const rawSql =
      evt.sql || (evt.message?.includes('| SQL:') ? evt.message.split('| SQL:')[1] : '');
    const fp = getSqlFingerprint(rawSql);
    const dupGroup = traceAnalysis.duplicateGroups.find((g) => g.fingerprint === fp);
    return {
      evt,
      originalIdx: idx,
      duplicateInfo: dupGroup
        ? {
            isDuplicate: true,
            count: dupGroup.count,
            totalDurationMs: dupGroup.totalDurationMs,
            isNPlusOne: dupGroup.count >= 3,
          }
        : null,
    };
  });

  const displayedSqlEvents = enrichedSqlEvents.filter(({ evt, duplicateInfo }) => {
    if (sqlFilter === 'duplicates') {
      return Boolean(duplicateInfo?.isDuplicate);
    }
    if (sqlFilter === 'slow') {
      return (Number(evt.durationMs) || 0) >= 1000 || evt.eventType === 'slow_sql';
    }
    return true;
  });

  const methodColors = {
    GET: 'bg-[#5794f2]/15 text-[#5794f2] border-[#5794f2]/30',
    POST: 'bg-[#73bf69]/15 text-[#73bf69] border-[#73bf69]/30',
    PUT: 'bg-[#faad14]/15 text-[#faad14] border-[#faad14]/30',
    DELETE: 'bg-[#f2495c]/15 text-[#f2495c] border-[#f2495c]/30',
    SYS: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
  };

  // Format code based on viewMode (defaults to nowrap)
  const getCodeClass = () => {
    if (viewMode === 'nowrap') {
      return 'whitespace-pre overflow-x-auto';
    }
    return 'whitespace-pre-wrap break-words';
  };

  // SQL Syntax Highlighter (T-SQL / SQL Server)
  const renderHighlightedSql = (sql) => {
    if (!sql) return null;

    const KEYWORDS = new Set([
      'SELECT',
      'FROM',
      'WHERE',
      'AND',
      'OR',
      'NOT',
      'INSERT',
      'INTO',
      'UPDATE',
      'SET',
      'DELETE',
      'CREATE',
      'DROP',
      'ALTER',
      'TABLE',
      'VIEW',
      'INDEX',
      'DECLARE',
      'AS',
      'JOIN',
      'INNER',
      'LEFT',
      'RIGHT',
      'FULL',
      'OUTER',
      'CROSS',
      'ON',
      'GROUP',
      'BY',
      'ORDER',
      'ASC',
      'DESC',
      'HAVING',
      'LIMIT',
      'OFFSET',
      'TOP',
      'WITH',
      'NOLOCK',
      'UNION',
      'ALL',
      'DISTINCT',
      'CASE',
      'WHEN',
      'THEN',
      'ELSE',
      'END',
      'IF',
      'BEGIN',
      'RETURN',
      'EXEC',
      'EXECUTE',
      'EXISTS',
      'IN',
      'IS',
      'NULL',
      'LIKE',
      'BETWEEN',
      'VALUES',
      'GO',
      'NOCOUNT',
      'MERGE',
      'MATCHED',
      'OUTPUT',
      'INSERTED',
      'DELETED',
      'TRUNCATE',
      'TRANSACTION',
      'COMMIT',
      'ROLLBACK',
      'TRY',
      'CATCH',
      'THROW',
    ]);

    const FUNCTIONS_TYPES = new Set([
      'VARCHAR',
      'NVARCHAR',
      'CHAR',
      'NCHAR',
      'INT',
      'BIGINT',
      'SMALLINT',
      'TINYINT',
      'DECIMAL',
      'NUMERIC',
      'FLOAT',
      'REAL',
      'DATETIME',
      'DATETIME2',
      'DATE',
      'TIME',
      'BIT',
      'UNIQUEIDENTIFIER',
      'MONEY',
      'SMALLMONEY',
      'VARBINARY',
      'BINARY',
      'IMAGE',
      'XML',
      'TEXT',
      'NTEXT',
      'UPPER',
      'LOWER',
      'LTRIM',
      'RTRIM',
      'TRIM',
      'ISNULL',
      'COALESCE',
      'NULLIF',
      'COUNT',
      'SUM',
      'AVG',
      'MIN',
      'MAX',
      'GETDATE',
      'SYSDATETIME',
      'DATEADD',
      'DATEDIFF',
      'DATEPART',
      'DATENAME',
      'CAST',
      'CONVERT',
      'LEN',
      'SUBSTRING',
      'REPLACE',
      'CONCAT',
      'CONCAT_WS',
      'ROW_NUMBER',
      'OVER',
      'PARTITION',
      'ROUND',
      'FLOOR',
      'CEILING',
      'ABS',
      'CHARINDEX',
      'PATINDEX',
      'STUFF',
      'FORMAT',
      'STRING_AGG',
      'STRING_SPLIT',
      'JSON_VALUE',
      'JSON_QUERY',
      'OPENJSON',
    ]);

    const regex =
      /(--[^\r\n]*|\/\*[\s\S]*?\*\/|'(?:''|[^'])*'|@\w+|[a-zA-Z_]\w*|\b\d+(?:\.\d+)?\b|[^\s\w'@]+|\s+)/g;
    const elements = [];
    let match;
    let key = 0;

    while ((match = regex.exec(sql)) !== null) {
      const token = match[0];
      if (token.startsWith('--') || token.startsWith('/*')) {
        elements.push(
          <span key={key++} className="text-[#8e94a0] italic select-text">
            {token}
          </span>
        );
      } else if (token.startsWith("'")) {
        elements.push(
          <span key={key++} className="text-[#73bf69] font-normal select-text">
            {token}
          </span>
        );
      } else if (token.startsWith('@')) {
        elements.push(
          <span key={key++} className="text-[#38bdf8] font-semibold select-text">
            {token}
          </span>
        );
      } else if (/^\d+(?:\.\d+)?$/.test(token)) {
        elements.push(
          <span key={key++} className="text-[#fb923c] font-normal select-text">
            {token}
          </span>
        );
      } else {
        const upper = token.toUpperCase();
        if (KEYWORDS.has(upper)) {
          elements.push(
            <span key={key++} className="text-[#5794f2] font-bold select-text">
              {token}
            </span>
          );
        } else if (FUNCTIONS_TYPES.has(upper)) {
          elements.push(
            <span key={key++} className="text-[#e5c07b] font-medium select-text">
              {token}
            </span>
          );
        } else {
          elements.push(
            <span key={key++} className="select-text">
              {token}
            </span>
          );
        }
      }
    }

    return elements;
  };

  // JSON Parameters Syntax Highlighter
  const renderHighlightedParams = (paramsJson) => {
    if (!paramsJson) return null;
    let formatted;
    try {
      const obj = typeof paramsJson === 'string' ? JSON.parse(paramsJson) : paramsJson;
      formatted = JSON.stringify(obj, null, 2);
    } catch {
      formatted = String(paramsJson);
    }

    const regex =
      /("(?:\\u[\da-fA-F]{4}|\\[^u]|[^\\"])*")(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?|[^\s"':,{}[\]]+|[{}[],:]|\s+/g;
    const elements = [];
    let match;
    let key = 0;

    while ((match = regex.exec(formatted)) !== null) {
      const token = match[0];
      const isKey = match[2];
      const isBoolOrNull = match[3];

      if (isKey) {
        elements.push(
          <span key={key++} className="text-[#38bdf8] font-semibold">
            {match[1]}
          </span>
        );
        elements.push(<span key={key++}>{isKey}</span>);
      } else if (token.startsWith('"')) {
        elements.push(
          <span key={key++} className="text-[#73bf69]">
            {token}
          </span>
        );
      } else if (isBoolOrNull) {
        elements.push(
          <span key={key++} className="text-[#c084fc] font-semibold">
            {token}
          </span>
        );
      } else if (/^-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?$/.test(token)) {
        elements.push(
          <span key={key++} className="text-[#fb923c]">
            {token}
          </span>
        );
      } else {
        elements.push(<span key={key++}>{token}</span>);
      }
    }

    return elements;
  };

  return (
    <TooltipProvider delayDuration={150}>
      <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <SheetContent
          side="right"
          className={`dark:bg-[#181b1f] bg-slate-50 dark:border-[#22252b] border-slate-200 dark:text-[#f4f5f7] text-slate-800 p-0 flex flex-col h-full shadow-2xl transition-all duration-300 ${
            isMaximized
              ? 'w-screen! max-w-none! inset-0'
              : 'w-[92vw]! max-w-[92vw]~ sm:max-w-[85vw]! lg:max-w-325~'
          }`}
        >
          <SheetHeader className="p-5 border-b dark:border-[#22252b] border-slate-200 dark:bg-[#111217] bg-white">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={`rounded px-2.5 py-0.5 text-xs font-bold font-sans border ${
                    methodColors[method] || methodColors.GET
                  }`}
                >
                  {method}
                </span>
                <span
                  className={`rounded px-2 py-0.5 text-xs font-bold font-sans border ${
                    statusCode >= 400 || hasError
                      ? 'border-[#f2495c]/40 text-[#f2495c] bg-[#f2495c]/10'
                      : 'border-[#73bf69]/40 text-[#73bf69] bg-[#73bf69]/10'
                  }`}
                >
                  {statusCode}
                </span>
                <span className="font-semibold dark:text-white text-slate-900 font-sans text-sm sm:text-base break-all">
                  {path}
                </span>
              </div>

              <div className="flex items-center gap-2 mr-8">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setIsMaximized(!isMaximized)}
                      className="h-8 text-xs dark:border-[#2c323f] border-slate-300 dark:bg-[#181b1f] bg-white dark:text-[#c7d0d9] text-slate-700 hover:dark:text-white hover:dark:bg-[#22252b]"
                    >
                      {isMaximized ? (
                        <>
                          <Minimize2 className="h-3.5 w-3.5 mr-1 text-[#5794f2]" /> Restore
                        </>
                      ) : (
                        <>
                          <Maximize2 className="h-3.5 w-3.5 mr-1 text-[#5794f2]" /> Maximize
                        </>
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {isMaximized ? 'Restore drawer size' : 'Expand to full screen'}
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCopy(JSON.stringify(trace, null, 2), 'trace-json')}
                      className="h-8 text-xs dark:border-[#2c323f] border-slate-300 dark:bg-[#181b1f] bg-white dark:text-[#c7d0d9] text-slate-700 hover:dark:text-white hover:dark:bg-[#22252b]"
                    >
                      {copiedKey === 'trace-json' ? (
                        <>
                          <Check className="h-3.5 w-3.5 mr-1 text-[#73bf69]" /> Copied
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5 mr-1 text-[#8e94a0]" /> Copy JSON
                        </>
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Copy trace JSON data</TooltipContent>
                </Tooltip>
              </div>
            </div>

            <SheetTitle className="text-xs dark:text-[#8e94a0] text-slate-500 flex items-center gap-2 mt-2">
              <span>Trace ID:</span>
              <code className="text-[#5794f2] font-sans text-xs select-all dark:bg-[#181b1f] bg-slate-100 px-2 py-0.5 rounded border dark:border-[#2c323f] border-slate-300">
                {traceId}
              </code>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleCopy(traceId, 'trace-id-header')}
                    className="h-5 px-1.5 text-xs text-[#8e94a0] hover:dark:text-white hover:text-slate-900"
                  >
                    {copiedKey === 'trace-id-header' ? (
                      <Check className="h-3 w-3 text-[#73bf69]" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Copy Trace ID</TooltipContent>
              </Tooltip>
            </SheetTitle>
            <SheetDescription className="text-xs dark:text-[#8e94a0] text-slate-500 font-sans">
              Timestamp: {timestamp} &bull; Client IP: {clientIp || '127.0.0.1'} &bull; Total
              Duration:{' '}
              <strong
                className={
                  totalDurationMs >= 1000 ? 'text-[#faad14]' : 'dark:text-white text-slate-900'
                }
              >
                {totalDurationMs} ms
              </strong>
            </SheetDescription>
          </SheetHeader>

          <Tabs defaultValue="sql" className="flex-1 flex flex-col min-h-0">
            <div className="border-b dark:border-[#22252b] border-slate-200 dark:bg-[#111217] bg-slate-50 px-5 pt-2">
              <TabsList className="dark:bg-[#181b1f] bg-white border dark:border-[#22252b] border-slate-200 h-9 p-0.5 rounded shadow-xs">
                <TabsTrigger
                  value="sql"
                  className="text-xs h-7.5 rounded data-[state=active]:bg-[#3274d9] data-[state=active]:text-white dark:data-[state=active]:bg-[#22252b] dark:data-[state=active]:text-[#5794f2] dark:data-[state=active]:border dark:data-[state=active]:border-[#3274d9] font-medium transition"
                >
                  <Database className="h-3.5 w-3.5 mr-1.5 text-[#5794f2]" />
                  Database Queries ({sqlEvents.length})
                </TabsTrigger>
                <TabsTrigger
                  value="labels"
                  className="text-xs h-7.5 rounded data-[state=active]:bg-[#3274d9] data-[state=active]:text-white dark:data-[state=active]:bg-[#22252b] dark:data-[state=active]:text-[#5794f2] dark:data-[state=active]:border dark:data-[state=active]:border-[#3274d9] font-medium transition"
                >
                  <Activity className="h-3.5 w-3.5 mr-1.5 text-[#73bf69]" />
                  Trace Labels ({Object.keys(trace).length})
                </TabsTrigger>
                <TabsTrigger
                  value="raw"
                  className="text-xs h-7.5 rounded data-[state=active]:bg-[#3274d9] data-[state=active]:text-white dark:data-[state=active]:bg-[#22252b] dark:data-[state=active]:text-[#5794f2] dark:data-[state=active]:border dark:data-[state=active]:border-[#3274d9] font-medium transition"
                >
                  <FileText className="h-3.5 w-3.5 mr-1.5 text-[#faad14]" />
                  Raw Stream ({events.length})
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="sql" className="flex-1 m-0 p-0 min-h-0">
              <ScrollArea className="h-[calc(100vh-175px)] p-6">
                {/* Layered Latency Distribution Panel */}
                <div className="rounded border dark:border-[#22252b] border-slate-200 dark:bg-[#111217] bg-white p-4 mb-4 shadow-sm">
                  <div className="flex items-center justify-between text-xs font-semibold dark:text-slate-200 text-slate-800 mb-2.5">
                    <span className="flex items-center gap-1.5">
                      <Layers className="h-4 w-4 text-[#3274d9]" />
                      Latency Distribution (Request Layers)
                    </span>
                    <div className="flex items-center gap-3 text-[11px] font-mono">
                      <span className="text-indigo-600 dark:text-indigo-400 font-medium flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-indigo-500 inline-block" />
                        DB: {traceAnalysis.dbPercent}% ({traceAnalysis.totalSqlMs}ms)
                      </span>
                      <span className="text-sky-600 dark:text-sky-400 font-medium flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-sky-500 inline-block" />
                        App: {traceAnalysis.appPercent}% ({traceAnalysis.appMs}ms)
                      </span>
                      <span className="text-[#8e94a0] border-l dark:border-[#2c323f] border-slate-200 pl-2">
                        Total:{' '}
                        <strong className="dark:text-white text-slate-900">
                          {totalDurationMs} ms
                        </strong>
                      </span>
                    </div>
                  </div>

                  <div className="h-2.5 w-full rounded-full overflow-hidden flex bg-slate-100 dark:bg-slate-800 mb-3.5 shadow-inner">
                    <div
                      className="h-full bg-indigo-500 dark:bg-indigo-600 transition-all"
                      style={{ width: `${traceAnalysis.dbPercent}%` }}
                      title={`Database: ${traceAnalysis.totalSqlMs}ms (${traceAnalysis.dbPercent}%)`}
                    />
                    <div
                      className="h-full bg-sky-500 dark:bg-sky-600 transition-all"
                      style={{ width: `${traceAnalysis.appPercent}%` }}
                      title={`Server Logic: ${traceAnalysis.appMs}ms (${traceAnalysis.appPercent}%)`}
                    />
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="p-3 rounded border dark:border-[#22252b] border-slate-200 dark:bg-[#181b1f] bg-slate-50">
                      <div className="text-[10px] uppercase text-[#8e94a0] font-semibold">
                        Total Duration
                      </div>
                      <div className="text-xl font-bold font-mono dark:text-white text-slate-900 mt-1">
                        {totalDurationMs} ms
                      </div>
                    </div>

                    <div className="p-3 rounded border dark:border-indigo-900/40 border-indigo-100 dark:bg-indigo-950/20 bg-indigo-50/50">
                      <div className="text-[10px] uppercase text-indigo-600 dark:text-indigo-400 font-semibold flex items-center gap-1">
                        <Database className="h-3 w-3" /> Database Time
                      </div>
                      <div className="text-xl font-bold font-mono text-indigo-600 dark:text-indigo-400 mt-1">
                        {traceAnalysis.totalSqlMs} ms{' '}
                        <span className="text-xs font-normal opacity-80">
                          ({traceAnalysis.dbPercent}%)
                        </span>
                      </div>
                    </div>

                    <div className="p-3 rounded border dark:border-sky-900/40 border-sky-100 dark:bg-sky-950/20 bg-sky-50/50">
                      <div className="text-[10px] uppercase text-sky-600 dark:text-sky-400 font-semibold flex items-center gap-1">
                        <Clock className="h-3 w-3" /> Server Logic
                      </div>
                      <div className="text-xl font-bold font-mono text-sky-600 dark:text-sky-400 mt-1">
                        {traceAnalysis.appMs} ms{' '}
                        <span className="text-xs font-normal opacity-80">
                          ({traceAnalysis.appPercent}%)
                        </span>
                      </div>
                    </div>

                    <div className="p-3 rounded border dark:border-[#22252b] border-slate-200 dark:bg-[#181b1f] bg-slate-50">
                      <div className="text-[10px] uppercase text-[#8e94a0] font-semibold">
                        SQL Queries
                      </div>
                      <div className="text-xl font-bold font-mono dark:text-white text-slate-900 mt-1">
                        {sqlEvents.length}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Repeated Query / N+1 Detection Alert */}
                {traceAnalysis.hasDuplicates && (
                  <div className="rounded border border-amber-500/40 bg-amber-500/10 p-3 mb-4 text-xs text-amber-500 flex items-start gap-2.5">
                    <Flame className="h-4 w-4 shrink-0 mt-0.5 text-amber-500" />
                    <div className="space-y-1">
                      <div className="font-bold flex items-center gap-2">
                        <span>Repeated Query / N+1 Problem Detected</span>
                        <Badge
                          variant="outline"
                          className="border-amber-500/40 text-amber-500 text-[10px] py-0"
                        >
                          {traceAnalysis.isNPlusOne ? 'High Severity (≥3x)' : 'Warning (2x)'}
                        </Badge>
                      </div>
                      <div className="dark:text-slate-300 text-slate-700 leading-relaxed font-sans text-[11px]">
                        Detected <strong>{traceAnalysis.duplicateGroups.length}</strong> statement
                        pattern(s) executed <strong>{traceAnalysis.totalDuplicateQueries}</strong>{' '}
                        times in this single request. Total duration spent on repeated queries:{' '}
                        <strong>
                          {traceAnalysis.duplicateGroups.reduce(
                            (acc, g) => acc + g.totalDurationMs,
                            0
                          )}{' '}
                          ms
                        </strong>
                        . Consider batching (
                        <code className="text-amber-400">WHERE ... IN (...)</code>) or
                        eager-loading.
                      </div>
                    </div>
                  </div>
                )}

                {/* Filter Toolbar & SQL Studio Action */}
                <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
                  <div className="flex items-center gap-1.5 text-xs">
                    <button
                      type="button"
                      onClick={() => setSqlFilter('all')}
                      className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors cursor-pointer ${
                        sqlFilter === 'all'
                          ? 'bg-[#3274d9] text-white'
                          : 'dark:text-[#8e94a0] text-slate-600 hover:dark:text-white hover:bg-slate-200/50 dark:hover:bg-[#22252b]'
                      }`}
                    >
                      All Queries ({sqlEvents.length})
                    </button>

                    {traceAnalysis.hasDuplicates && (
                      <button
                        type="button"
                        onClick={() => setSqlFilter('duplicates')}
                        className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
                          sqlFilter === 'duplicates'
                            ? 'bg-amber-500 text-slate-950 font-bold'
                            : 'text-amber-500 hover:bg-amber-500/10'
                        }`}
                      >
                        <Flame className="h-3 w-3" />
                        Repeated &amp; N+1 ({traceAnalysis.totalDuplicateQueries})
                      </button>
                    )}

                    {slowQueryCount > 0 && (
                      <button
                        type="button"
                        onClick={() => setSqlFilter('slow')}
                        className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
                          sqlFilter === 'slow'
                            ? 'bg-[#faad14] text-slate-950 font-bold'
                            : 'text-[#faad14] hover:bg-[#faad14]/10'
                        }`}
                      >
                        <Clock className="h-3 w-3" />
                        Slow ≥ 1s ({slowQueryCount})
                      </button>
                    )}
                  </div>

                  {sqlEvents.length > 0 && (
                    <Button
                      size="sm"
                      onClick={() => setStudioQueryIndex(0)}
                      className="h-7 px-3 text-xs bg-[#3274d9] hover:bg-[#2461c2] text-white font-semibold transition-colors shadow-sm flex items-center gap-1.5"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      Open SQL Studio &amp; Debugger
                    </Button>
                  )}
                </div>

                {displayedSqlEvents.length === 0 ? (
                  <div className="rounded border dark:border-[#22252b] border-slate-200 dark:bg-[#111217] bg-white p-12 text-center text-[#8e94a0] text-xs">
                    {sqlFilter === 'duplicates'
                      ? 'No repeated or duplicate queries match this filter.'
                      : sqlFilter === 'slow'
                        ? 'No queries exceed 1000ms duration.'
                        : 'No SQL query statements recorded in this Trace.'}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {displayedSqlEvents.map(({ evt, originalIdx, duplicateInfo }) => (
                      <SqlQueryCard
                        key={originalIdx}
                        evt={evt}
                        idx={originalIdx}
                        duplicateInfo={duplicateInfo}
                        getCodeClass={getCodeClass}
                        renderHighlightedSql={renderHighlightedSql}
                        renderHighlightedParams={renderHighlightedParams}
                        onOpenStudio={() => setStudioQueryIndex(originalIdx)}
                      />
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="labels" className="flex-1 m-0 p-0 min-h-0">
              <ScrollArea className="h-[calc(100vh-175px)] p-6">
                <div className="rounded border dark:border-[#22252b] border-slate-200 dark:bg-[#111217] bg-white overflow-hidden shadow-sm">
                  <div className="p-3.5 dark:bg-[#181b1f] bg-slate-100 border-b dark:border-[#22252b] border-slate-200 text-xs font-semibold dark:text-[#f4f5f7] text-slate-800 flex items-center justify-between">
                    <span>Metadata &amp; Identification (Trace Labels)</span>
                    <span className="text-[11px] font-normal text-[#8e94a0]">
                      Indexed key-value pairs
                    </span>
                  </div>
                  <div className="divide-y dark:divide-[#22252b] divide-slate-100 text-xs sm:text-sm">
                    <div className="grid grid-cols-3 p-3 hover:dark:bg-[#181b1f]/50 hover:bg-slate-50 transition-colors">
                      <span className="dark:text-[#8e94a0] text-slate-500 font-sans">app</span>
                      <span className="col-span-2 font-sans dark:text-[#c7d0d9] text-slate-800">
                        mes-api
                      </span>
                    </div>
                    <div className="grid grid-cols-3 p-3 hover:dark:bg-[#181b1f]/50 hover:bg-slate-50 transition-colors">
                      <span className="dark:text-[#8e94a0] text-slate-500 font-sans">trace_id</span>
                      <span className="col-span-2 font-sans dark:text-white text-slate-900 select-all font-semibold">
                        {traceId}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 p-3 hover:dark:bg-[#181b1f]/50 hover:bg-slate-50 transition-colors">
                      <span className="dark:text-[#8e94a0] text-slate-500 font-sans">
                        http_method
                      </span>
                      <span className="col-span-2 font-sans">
                        <span
                          className={`rounded px-2 py-0.5 text-xs font-semibold border ${methodColors[method] || methodColors.GET}`}
                        >
                          {method}
                        </span>
                      </span>
                    </div>
                    <div className="grid grid-cols-3 p-3 hover:dark:bg-[#181b1f]/50 hover:bg-slate-50 transition-colors">
                      <span className="dark:text-[#8e94a0] text-slate-500 font-sans">
                        http_path
                      </span>
                      <span className="col-span-2 font-sans dark:text-[#c7d0d9] text-slate-800 break-all">
                        {path}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 p-3 hover:dark:bg-[#181b1f]/50 hover:bg-slate-50 transition-colors">
                      <span className="dark:text-[#8e94a0] text-slate-500 font-sans">
                        status_code
                      </span>
                      <span className="col-span-2 font-sans">
                        <span
                          className={`rounded px-2 py-0.5 text-xs font-semibold border ${
                            statusCode >= 400 || hasError
                              ? 'border-[#f2495c]/40 text-[#f2495c] bg-[#f2495c]/10'
                              : 'border-[#73bf69]/40 text-[#73bf69] bg-[#73bf69]/10'
                          }`}
                        >
                          {statusCode}
                        </span>
                      </span>
                    </div>
                    <div className="grid grid-cols-3 p-3 hover:dark:bg-[#181b1f]/50 hover:bg-slate-50 transition-colors">
                      <span className="dark:text-[#8e94a0] text-slate-500 font-sans">
                        duration_ms
                      </span>
                      <span className="col-span-2 font-sans">
                        <span
                          className={
                            totalDurationMs >= 1000
                              ? 'text-[#faad14] font-semibold'
                              : 'dark:text-[#c7d0d9] text-slate-800'
                          }
                        >
                          {totalDurationMs} ms
                        </span>
                      </span>
                    </div>
                    <div className="grid grid-cols-3 p-3 hover:dark:bg-[#181b1f]/50 hover:bg-slate-50 transition-colors">
                      <span className="dark:text-[#8e94a0] text-slate-500 font-sans">
                        client_ip
                      </span>
                      <span className="col-span-2 font-sans dark:text-[#c7d0d9] text-slate-700">
                        {clientIp || '127.0.0.1'}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 p-3 hover:dark:bg-[#181b1f]/50 hover:bg-slate-50 transition-colors">
                      <span className="dark:text-[#8e94a0] text-slate-500 font-sans">
                        sql_queries
                      </span>
                      <span className="col-span-2 font-sans dark:text-[#5794f2] text-blue-600 font-semibold">
                        {queryCount}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 p-3 hover:dark:bg-[#181b1f]/50 hover:bg-slate-50 transition-colors">
                      <span className="dark:text-[#8e94a0] text-slate-500 font-sans">
                        has_error
                      </span>
                      <span
                        className={`col-span-2 font-sans font-semibold ${hasError ? 'text-[#f2495c]' : 'text-[#73bf69]'}`}
                      >
                        {hasError ? 'true' : 'false'}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 p-3 hover:dark:bg-[#181b1f]/50 hover:bg-slate-50 transition-colors">
                      <span className="dark:text-[#8e94a0] text-slate-500 font-sans">
                        storage_type
                      </span>
                      <span className="col-span-2 font-sans dark:text-[#8e94a0] text-slate-500">
                        Structured On-Disk Log Files (No DB Pollution)
                      </span>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="raw" className="flex-1 m-0 p-0 min-h-0">
              <ScrollArea className="h-[calc(100vh-175px)] p-6">
                <div className="rounded border dark:border-[#22252b] border-slate-200 dark:bg-[#111217] bg-slate-900 p-4 font-sans text-xs space-y-2">
                  {events.map((evt, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded hover:bg-white/3 transition flex items-start gap-2.5 border-b dark:border-[#22252b] border-slate-800 pb-2.5"
                    >
                      <span className="text-[#8e94a0] shrink-0 select-none">
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase shrink-0 ${
                          evt.eventType === 'error'
                            ? 'bg-[#f2495c]/20 text-[#f2495c]'
                            : evt.eventType === 'slow_sql'
                              ? 'bg-[#faad14]/20 text-[#faad14]'
                              : evt.eventType === 'sql'
                                ? 'bg-[#73bf69]/20 text-[#73bf69]'
                                : 'bg-[#5794f2]/20 text-[#5794f2]'
                        }`}
                      >
                        {evt.eventType}
                      </span>
                      <div
                        className={`flex-1 dark:text-[#c7d0d9] text-slate-300 ${getCodeClass()}`}
                      >
                        {evt.message}
                        {evt.exception && (
                          <div className="mt-2 text-[#f2495c] text-xs bg-[#f2495c]/10 p-2.5 rounded border border-[#f2495c]/30">
                            {evt.exception}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </SheetContent>
      </Sheet>

      {sqlEvents.length > 0 && (
        <SqlStudioModal
          isOpen={studioQueryIndex !== null}
          onClose={() => setStudioQueryIndex(null)}
          initialIndex={studioQueryIndex ?? 0}
          sqlEvents={sqlEvents}
          trace={trace}
        />
      )}
    </TooltipProvider>
  );
}

TraceDetailSheet.propTypes = {
  trace: PropTypes.object,
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};
