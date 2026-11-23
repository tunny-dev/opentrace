import { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  Play,
  BarChart3,
  Copy,
  Check,
  Clock,
  AlertTriangle,
  Table,
  Search,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  FileCode,
  ShieldAlert,
  SlidersHorizontal,
  Sparkles,
  Flame,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { systemLogsApi } from '@/services/system-logs.service';
import {
  inlineSqlParameters,
  getRowValue,
  wrapWithStatistics,
} from '@/features/system-logs/utils/sqlHelpers';

export function SqlQueryCard({
  evt,
  idx,
  getCodeClass,
  renderHighlightedSql,
  renderHighlightedParams,
  onOpenStudio,
  duplicateInfo,
}) {
  const [loadingMode, setLoadingMode] = useState(null); // 'data' | 'analyze' | null
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [resultTab, setResultTab] = useState('data'); // 'data' | 'analyze' | 'inlined'
  const [isResultOpen, setIsResultOpen] = useState(true);
  const [filterText, setFilterText] = useState('');
  const [copiedKey, setCopiedKey] = useState(null);

  const handleCopy = (text, key) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1800);
  };

  const handleExecute = async (mode) => {
    try {
      setLoadingMode(mode);
      setError(null);
      const res = await systemLogsApi.executeSql({
        sql: evt.sql,
        paramsJson: evt.paramsJson,
        mode,
        maxRows: 100,
      });
      setResult(res);
      setResultTab(mode === 'analyze' ? 'analyze' : 'data');
      setIsResultOpen(true);
    } catch (err) {
      setError(err.message || 'Lỗi thực thi SQL');
      setIsResultOpen(true);
    } finally {
      setLoadingMode(null);
    }
  };

  // Instant inlined SQL calculation
  const executableSql = useMemo(() => {
    if (result?.inlinedSql) return result.inlinedSql;
    return inlineSqlParameters(evt.sql, evt.paramsJson);
  }, [evt.sql, evt.paramsJson, result?.inlinedSql]);

  // Query wrapped with SET STATISTICS IO, TIME ON / OFF
  const statsExecutableSql = useMemo(() => {
    return wrapWithStatistics(executableSql);
  }, [executableSql]);

  // Filtered rows for Data Grid
  const resultRows = result?.rows;
  const filteredRows = useMemo(() => {
    if (!resultRows || !Array.isArray(resultRows)) return [];
    if (!filterText.trim()) return resultRows;
    const query = filterText.toLowerCase();
    return resultRows.filter((row) =>
      Object.values(row).some((val) =>
        String(val ?? '')
          .toLowerCase()
          .includes(query)
      )
    );
  }, [resultRows, filterText]);

  const elapsedMs = result?.elapsedMs ?? result?.executionElapsedMs ?? 0;
  const stats = result?.stats ?? result?.ioStatistics ?? null;
  const hasMore = result?.hasMoreRows ?? result?.isCapped ?? false;
  const warnings = stats?.warnings ?? result?.warnings ?? [];
  const rawMessages = Array.isArray(stats?.rawMessages)
    ? stats.rawMessages.join('\n')
    : (stats?.rawMessages ?? '');

  return (
    <div className="rounded border dark:border-[#22252b] border-slate-200 dark:bg-[#111217] bg-white p-4 space-y-3 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs border-b dark:border-[#22252b] border-slate-200 pb-2.5">
        <div className="flex items-center gap-2">
          <span className="flex h-5 w-5 items-center justify-center rounded bg-[#3274d9]/20 text-[11px] font-bold text-[#5794f2]">
            #{idx + 1}
          </span>
          <span className="font-semibold dark:text-[#f4f5f7] text-slate-800 text-xs">
            {evt.eventType === 'slow_sql' ? 'SLOW QUERY (≥ 1000ms)' : 'DATABASE QUERY (SQL)'}
          </span>
          {duplicateInfo?.isDuplicate && (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/15 text-amber-500 border border-amber-500/30">
                  <Flame className="h-3 w-3" />
                  {duplicateInfo.count}x Repeated ({duplicateInfo.totalDurationMs}ms total)
                </span>
              </TooltipTrigger>
              <TooltipContent>
                This statement pattern is repeated {duplicateInfo.count} times in this trace
                (possible N+1 query loop).
              </TooltipContent>
            </Tooltip>
          )}
          <span className="text-[11px] text-[#8e94a0] font-sans">
            +{evt.relativeOffsetMs}ms offset
          </span>
        </div>

        <div className="flex items-center flex-wrap gap-1.5">
          <span
            className={`font-sans text-[11px] px-2 py-0.5 rounded border flex items-center gap-1 mr-1 ${
              evt.durationMs >= 1000
                ? 'border-[#faad14]/40 text-[#faad14] bg-[#faad14]/10 font-bold'
                : 'dark:border-[#2c323f] border-slate-300 dark:text-[#c7d0d9] text-slate-700 dark:bg-[#181b1f] bg-slate-50'
            }`}
          >
            <Clock className="h-3 w-3" />
            {evt.durationMs} ms
          </span>

          <Button
            size="sm"
            onClick={() => handleExecute('data')}
            disabled={loadingMode !== null}
            className="h-6 px-2.5 text-xs bg-[#3274d9] hover:bg-[#2461c2] text-white border-0 font-medium shadow-none transition-colors"
          >
            {loadingMode === 'data' ? (
              <>
                <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                Running...
              </>
            ) : (
              <>
                <Play className="h-3 w-3 mr-1 fill-current" />
                Run Query
              </>
            )}
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => handleExecute('analyze')}
            disabled={loadingMode !== null}
            className="h-6 px-2.5 text-xs border-[#faad14]/40 text-[#faad14] hover:bg-[#faad14]/10 dark:bg-[#181b1f] bg-white transition-colors"
          >
            {loadingMode === 'analyze' ? (
              <>
                <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <BarChart3 className="h-3 w-3 mr-1" />
                Analyze Stats
              </>
            )}
          </Button>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleCopy(executableSql, `inlined-${idx}`)}
                className="h-6 px-2 text-xs dark:text-[#73bf69] text-emerald-600 hover:dark:bg-[#73bf69]/10 hover:bg-emerald-50"
              >
                {copiedKey === `inlined-${idx}` ? (
                  <>
                    <Check className="h-3 w-3 mr-1 text-[#73bf69]" /> Inlined Copied
                  </>
                ) : (
                  <>
                    <FileCode className="h-3 w-3 mr-1" /> Copy Executable
                  </>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              Copy query with parameter values inlined (Ready for SSMS / DBeaver)
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleCopy(statsExecutableSql, `stats-${idx}`)}
                className="h-6 px-2 text-xs text-[#faad14] hover:dark:bg-[#faad14]/10 hover:bg-amber-50"
              >
                {copiedKey === `stats-${idx}` ? (
                  <>
                    <Check className="h-3 w-3 mr-1 text-[#faad14]" /> Stats SQL Copied
                  </>
                ) : (
                  <>
                    <BarChart3 className="h-3 w-3 mr-1" /> Copy + Stats
                  </>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              Copy query wrapped with SET STATISTICS IO, TIME ON/OFF for SSMS
            </TooltipContent>
          </Tooltip>

          {onOpenStudio && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onOpenStudio}
                  className="h-6 px-2 text-xs text-[#5794f2] hover:dark:bg-[#5794f2]/10 hover:bg-blue-50 transition-colors"
                >
                  <Sparkles className="h-3 w-3 mr-1" /> Studio
                </Button>
              </TooltipTrigger>
              <TooltipContent>Open in MES SQL Studio &amp; Debugger</TooltipContent>
            </Tooltip>
          )}

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleCopy(evt.sql, `sql-${idx}`)}
                className="h-6 px-2 text-xs dark:text-[#8e94a0] text-slate-600 hover:dark:text-white hover:text-slate-900"
              >
                {copiedKey === `sql-${idx}` ? (
                  <>
                    <Check className="h-3 w-3 mr-1 text-[#73bf69]" /> Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3 mr-1" /> Copy SQL
                  </>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>Copy parameterized SQL</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {evt.sql && (
        <div
          className={`relative rounded-md border dark:border-[#22252b] border-slate-700 dark:bg-[#0c1017] bg-[#0c1017] p-4 font-mono text-xs text-slate-200 leading-relaxed shadow-inner max-h-125 select-text ${getCodeClass()}`}
        >
          {renderHighlightedSql(evt.sql)}
        </div>
      )}

      {evt.paramsJson && (
        <div className="rounded-md border dark:border-[#22252b] border-slate-200 dark:bg-[#181b1f] bg-slate-50 p-3">
          <div className="text-[11px] font-bold uppercase dark:text-[#8e94a0] text-slate-600 mb-1.5 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <SlidersHorizontal className="h-3 w-3" /> Parameters &amp; Query Variables:
            </span>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleCopy(evt.paramsJson, `params-${idx}`)}
                  className="h-5 px-1.5 text-xs text-[#8e94a0] hover:dark:text-white hover:text-slate-900"
                >
                  {copiedKey === `params-${idx}` ? 'Copied' : 'Copy Params'}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Copy JSON parameters</TooltipContent>
            </Tooltip>
          </div>
          <div
            className={`block font-mono text-xs dark:bg-[#0c1017] bg-[#0c1017] text-slate-200 p-3 rounded-md border dark:border-[#22252b] border-slate-700 leading-relaxed select-text ${getCodeClass()}`}
          >
            {renderHighlightedParams(evt.paramsJson)}
          </div>
        </div>
      )}

      {error && (
        <div className="rounded border border-[#f2495c]/40 bg-[#f2495c]/10 p-3 text-xs text-[#f2495c] flex items-start gap-2.5">
          <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-bold">Execution Blocked / Error:</div>
            <div className="font-sans break-all">{error}</div>
          </div>
        </div>
      )}

      {result && (
        <div className="rounded border dark:border-[#22252b] border-slate-300 dark:bg-[#14161b] bg-slate-50 overflow-hidden shadow-md">
          <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 border-b dark:border-[#22252b] border-slate-200 dark:bg-[#181b1f] bg-slate-100 text-xs">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setResultTab('data')}
                className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  resultTab === 'data'
                    ? 'bg-[#3274d9] text-white'
                    : 'dark:text-[#8e94a0] text-slate-600 hover:dark:text-white'
                }`}
              >
                <Table className="h-3 w-3" />
                Data Results ({result.rowCount || 0}
                {hasMore ? ' capped' : ''})
              </button>

              <button
                type="button"
                onClick={() => setResultTab('analyze')}
                className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  resultTab === 'analyze'
                    ? 'bg-[#faad14] text-slate-950 font-bold'
                    : 'dark:text-[#8e94a0] text-slate-600 hover:dark:text-white'
                }`}
              >
                <BarChart3 className="h-3 w-3" />
                Performance &amp; IO Stats
                {stats && (
                  <span className="ml-1 text-[10px] px-1 rounded bg-black/20">
                    Reads: {stats.totalLogicalReads}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setResultTab('inlined')}
                className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  resultTab === 'inlined'
                    ? 'bg-[#73bf69] text-slate-950 font-bold'
                    : 'dark:text-[#8e94a0] text-slate-600 hover:dark:text-white'
                }`}
              >
                <FileCode className="h-3 w-3" />
                Executable Script
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] text-[#8e94a0] font-sans">
                Elapsed: <strong className="text-[#73bf69]">{elapsedMs}ms</strong>
              </span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsResultOpen(!isResultOpen)}
                className="h-6 w-6 p-0 text-[#8e94a0]"
              >
                {isResultOpen ? (
                  <ChevronUp className="h-3.5 w-3.5" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5" />
                )}
              </Button>
            </div>
          </div>

          {isResultOpen && (
            <div className="p-3">
              {resultTab === 'data' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <div className="relative flex-1 max-w-xs">
                      <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-[#8e94a0]" />
                      <input
                        type="text"
                        value={filterText}
                        onChange={(e) => setFilterText(e.target.value)}
                        placeholder="Filter in results..."
                        className="w-full pl-7 pr-2 py-1 text-xs rounded border dark:border-[#22252b] border-slate-300 dark:bg-[#0c1017] bg-white dark:text-slate-200 text-slate-900 placeholder-[#8e94a0] focus:outline-none focus:border-[#3274d9]"
                      />
                    </div>
                    <div className="text-[11px] text-[#8e94a0]">
                      Showing {filteredRows.length} of {result.rowCount || 0} rows
                      {hasMore && ' (maximum 100 rows preview)'}
                    </div>
                  </div>

                  {!result.columns || result.columns.length === 0 ? (
                    <div className="rounded border dark:border-[#22252b] border-slate-200 dark:bg-[#0c1017] bg-white p-8 text-center text-xs text-[#8e94a0]">
                      Query executed successfully with 0 columns returned.
                    </div>
                  ) : filteredRows.length === 0 ? (
                    <div className="rounded border dark:border-[#22252b] border-slate-200 dark:bg-[#0c1017] bg-white p-8 text-center text-xs text-[#8e94a0]">
                      No rows match the filter criteria.
                    </div>
                  ) : (
                    <div className="rounded border dark:border-[#22252b] border-slate-300 dark:bg-[#0c1017] bg-white overflow-auto max-h-95 shadow-inner">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead className="sticky top-0 z-10 dark:bg-[#181b1f] bg-slate-100 border-b dark:border-[#22252b] border-slate-300 shadow-sm">
                          <tr>
                            <th className="p-2 text-[11px] font-bold text-[#8e94a0] border-r dark:border-[#22252b] border-slate-200 w-10 text-center font-mono">
                              #
                            </th>
                            {result.columns.map((col, cIdx) => (
                              <th
                                key={`${col || 'col'}_${cIdx}`}
                                className="p-2 text-[11px] font-bold dark:text-[#f4f5f7] text-slate-700 whitespace-nowrap border-r dark:border-[#22252b] border-slate-200"
                              >
                                {col ? (
                                  col
                                ) : (
                                  <span className="italic dark:text-[#8e94a0] text-slate-400 font-normal">
                                    (No column name)
                                  </span>
                                )}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y dark:divide-[#22252b] divide-slate-200">
                          {filteredRows.map((row, rIdx) => (
                            <tr
                              key={rIdx}
                              className="hover:dark:bg-[#181b1f] hover:bg-slate-100 dark:even:bg-[#14161b]/40 even:bg-slate-50/50 transition-colors"
                            >
                              <td className="p-2 text-[11px] text-[#8e94a0] font-mono tabular-nums text-center border-r dark:border-[#22252b] border-slate-200">
                                {rIdx + 1}
                              </td>
                              {result.columns.map((col, cIdx) => {
                                const val = getRowValue(row, col);
                                const isNull = val === null || val === undefined;
                                return (
                                  <td
                                    key={`${col || 'col'}_${cIdx}`}
                                    className="p-2 whitespace-nowrap border-r dark:border-[#22252b] border-slate-200 text-xs select-text font-mono"
                                  >
                                    {isNull ? (
                                      <span className="text-[10px] text-[#8e94a0] italic bg-slate-800/40 px-1 py-0.5 rounded">
                                        NULL
                                      </span>
                                    ) : (
                                      <span className="dark:text-[#c7d0d9] text-slate-800">
                                        {String(val)}
                                      </span>
                                    )}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {resultTab === 'analyze' && (
                <div className="space-y-3">
                  {warnings && warnings.length > 0 && (
                    <div className="space-y-1">
                      {warnings.map((warn, wIdx) => (
                        <div
                          key={wIdx}
                          className="rounded border border-[#faad14]/40 bg-[#faad14]/10 p-2.5 text-xs text-[#faad14] flex items-center gap-2"
                        >
                          <AlertTriangle className="h-4 w-4 shrink-0" />
                          <span>{warn}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div className="rounded border dark:border-[#22252b] border-slate-200 dark:bg-[#111217] bg-white p-3 text-center">
                      <div className="text-[11px] font-semibold dark:text-[#8e94a0] text-slate-500 uppercase">
                        Logical Reads
                      </div>
                      <div
                        className={`text-xl font-bold font-sans mt-0.5 ${
                          (stats?.totalLogicalReads || 0) > 1000
                            ? 'text-[#faad14]'
                            : 'text-[#73bf69]'
                        }`}
                      >
                        {(stats?.totalLogicalReads ?? 0).toLocaleString()}
                      </div>
                    </div>

                    <div className="rounded border dark:border-[#22252b] border-slate-200 dark:bg-[#111217] bg-white p-3 text-center">
                      <div className="text-[11px] font-semibold dark:text-[#8e94a0] text-slate-500 uppercase">
                        Scan Count
                      </div>
                      <div
                        className={`text-xl font-bold font-sans mt-0.5 ${
                          (stats?.totalScanCount || 0) > 1 ? 'text-[#faad14]' : 'text-[#5794f2]'
                        }`}
                      >
                        {stats?.totalScanCount ?? 0}
                      </div>
                    </div>

                    <div className="rounded border dark:border-[#22252b] border-slate-200 dark:bg-[#111217] bg-white p-3 text-center">
                      <div className="text-[11px] font-semibold dark:text-[#8e94a0] text-slate-500 uppercase">
                        CPU Time
                      </div>
                      <div className="text-xl font-bold font-sans mt-0.5 dark:text-[#f4f5f7] text-slate-800">
                        {stats?.cpuTimeMs ?? 0} ms
                      </div>
                    </div>

                    <div className="rounded border dark:border-[#22252b] border-slate-200 dark:bg-[#111217] bg-white p-3 text-center">
                      <div className="text-[11px] font-semibold dark:text-[#8e94a0] text-slate-500 uppercase">
                        Elapsed Time
                      </div>
                      <div className="text-xl font-bold font-sans mt-0.5 text-[#5794f2]">
                        {stats?.elapsedTimeMs || elapsedMs} ms
                      </div>
                    </div>
                  </div>

                  {stats?.tables && stats.tables.length > 0 ? (
                    <div className="rounded border dark:border-[#22252b] border-slate-200 dark:bg-[#111217] bg-white overflow-hidden">
                      <div className="p-2.5 dark:bg-[#181b1f] bg-slate-100 border-b dark:border-[#22252b] border-slate-200 text-xs font-semibold dark:text-[#f4f5f7] text-slate-800 flex items-center justify-between">
                        <span>Table I/O Breakdown</span>
                        <span className="text-[11px] text-[#8e94a0]">
                          {stats.tables.length} table(s) accessed
                        </span>
                      </div>
                      <table className="w-full text-left text-xs border-collapse font-sans">
                        <thead className="dark:bg-[#14161b] bg-slate-50 border-b dark:border-[#22252b] border-slate-200 text-[#8e94a0]">
                          <tr>
                            <th className="p-2 font-semibold">Table</th>
                            <th className="p-2 font-semibold text-right">Scan Count</th>
                            <th className="p-2 font-semibold text-right">Logical Reads</th>
                            <th className="p-2 font-semibold text-right">Physical Reads</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y dark:divide-[#22252b] divide-slate-100">
                          {stats.tables.map((t, tIdx) => (
                            <tr key={tIdx} className="hover:dark:bg-[#181b1f]/50 hover:bg-slate-50">
                              <td className="p-2 font-semibold dark:text-white text-slate-900">
                                {t.tableName}
                              </td>
                              <td className="p-2 text-right font-sans">
                                <span
                                  className={
                                    t.scanCount > 1
                                      ? 'text-[#faad14] font-bold'
                                      : 'dark:text-[#c7d0d9] text-slate-700'
                                  }
                                >
                                  {t.scanCount}
                                </span>
                              </td>
                              <td className="p-2 text-right font-sans">
                                <span
                                  className={
                                    t.logicalReads > 500
                                      ? 'text-[#faad14] font-bold'
                                      : 'text-[#73bf69]'
                                  }
                                >
                                  {t.logicalReads.toLocaleString()}
                                </span>
                              </td>
                              <td className="p-2 text-right font-sans dark:text-[#8e94a0] text-slate-500">
                                {t.physicalReads}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="rounded border dark:border-[#22252b] border-slate-200 dark:bg-[#111217] bg-white p-4 text-center text-xs text-[#8e94a0]">
                      No detailed table I/O breakdown returned (Query may have hit cache or internal
                      system catalogs).
                    </div>
                  )}

                  {rawMessages && (
                    <div className="text-[11px] text-[#8e94a0]">
                      <details className="cursor-pointer">
                        <summary className="hover:dark:text-white text-slate-400">
                          View raw SQL Server STATISTICS messages
                        </summary>
                        <pre className="mt-1 p-2 rounded bg-black/40 text-[11px] font-mono text-slate-300 whitespace-pre-wrap overflow-x-auto leading-relaxed border dark:border-[#22252b] border-slate-700">
                          {rawMessages}
                        </pre>
                      </details>
                    </div>
                  )}
                </div>
              )}

              {resultTab === 'inlined' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs flex-wrap gap-2">
                    <span className="text-[11px] text-[#8e94a0] font-sans">
                      Parameters have been substituted into the query. Ready to run in SSMS,
                      DBeaver, or Azure Data Studio:
                    </span>
                    <div className="flex items-center gap-1.5">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCopy(statsExecutableSql, `tab-stats-${idx}`)}
                        className="h-6 px-2 text-xs border-[#faad14]/40 text-[#faad14] hover:bg-[#faad14]/10 font-semibold"
                      >
                        {copiedKey === `tab-stats-${idx}` ? (
                          <>
                            <Check className="h-3 w-3 mr-1 text-[#faad14]" /> Stats Copied!
                          </>
                        ) : (
                          <>
                            <BarChart3 className="h-3 w-3 mr-1" /> Copy with Stats
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleCopy(executableSql, `tab-inlined-${idx}`)}
                        className="h-6 px-2 text-xs bg-[#73bf69] hover:bg-[#5fa855] text-slate-950 font-bold"
                      >
                        {copiedKey === `tab-inlined-${idx}` ? (
                          <>
                            <Check className="h-3 w-3 mr-1" /> Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3 mr-1" /> Copy Script
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                  <div
                    className={`rounded-md border dark:border-[#22252b] border-slate-700 dark:bg-[#0c1017] bg-[#0c1017] p-4 font-mono text-xs text-slate-200 leading-relaxed max-h-95 overflow-auto select-text ${getCodeClass()}`}
                  >
                    {renderHighlightedSql(executableSql)}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

SqlQueryCard.propTypes = {
  evt: PropTypes.shape({
    sql: PropTypes.string,
    paramsJson: PropTypes.string,
    durationMs: PropTypes.number,
    relativeOffsetMs: PropTypes.number,
    eventType: PropTypes.string,
  }).isRequired,
  idx: PropTypes.number.isRequired,
  getCodeClass: PropTypes.func.isRequired,
  renderHighlightedSql: PropTypes.func.isRequired,
  renderHighlightedParams: PropTypes.func.isRequired,
  onOpenStudio: PropTypes.func,
  duplicateInfo: PropTypes.shape({
    isDuplicate: PropTypes.bool,
    count: PropTypes.number,
    totalDurationMs: PropTypes.number,
    isNPlusOne: PropTypes.bool,
  }),
};
