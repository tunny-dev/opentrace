import { useState, useEffect, useMemo } from 'react';
import {
  Laptop,
  Search,
  RefreshCw,
  Download,
  Trash2,
  Copy,
  Check,
  ChevronRight,
  ChevronDown,
  SlidersHorizontal,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { logger } from '@/core/utils/logger';

const LEVEL_CONFIG = {
  error: {
    label: 'ERROR',
    color: 'bg-rose-500/15 text-rose-500 dark:text-rose-400 border-rose-500/30',
  },
  warn: {
    label: 'WARN',
    color: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
  },
  info: { label: 'INFO', color: 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30' },
  debug: {
    label: 'DEBUG',
    color: 'bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/30',
  },
};

export function ClientLogsTab() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [selectedNs, setSelectedNs] = useState('all');
  const [expandedIds, setExpandedIds] = useState(new Set());
  const [copiedId, setCopiedId] = useState(null);
  const [currentLevel, setCurrentLevel] = useState(() => logger.getLevel());

  const loadLogs = async () => {
    setLoading(true);
    try {
      const stored = await logger.getPersistedLogs(300);
      setLogs(stored);
    } catch (err) {
      console.error('Không thể đọc log từ IndexedDB', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const handleLevelChange = (lvl) => {
    logger.setLevel(lvl);
    setCurrentLevel(lvl);
    loadLogs();
  };

  const handleClearAll = async () => {
    if (window.confirm('Bạn có chắc chắn muốn xoá sạch toàn bộ log của máy tính này không?')) {
      await logger.clearAllLogs();
      setLogs([]);
      setExpandedIds(new Set());
    }
  };

  const handleDownload = () => {
    logger.downloadLogs(true);
  };

  const toggleExpand = (id) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCopy = (text, id, e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(typeof text === 'string' ? text : JSON.stringify(text, null, 2));
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  // Trích xuất các namespaces có trong log
  const namespaces = useMemo(() => {
    const set = new Set();
    logs.forEach((item) => {
      const ev = String(item.event || '');
      const colon = ev.indexOf(':');
      if (colon > 0) set.add(ev.slice(0, colon).trim().toLowerCase());
      else set.add('app');
    });
    return Array.from(set);
  }, [logs]);

  // Bộ lọc
  const filteredLogs = useMemo(() => {
    return logs.filter((item) => {
      if (selectedLevel !== 'all' && item.level !== selectedLevel) return false;

      const ev = String(item.event || '');
      const colon = ev.indexOf(':');
      const itemNs = colon > 0 ? ev.slice(0, colon).trim().toLowerCase() : 'app';
      if (selectedNs !== 'all' && itemNs !== selectedNs) return false;

      if (search.trim()) {
        const query = search.toLowerCase();
        const eventMatch = ev.toLowerCase().includes(query);
        const dataMatch = item.data
          ? JSON.stringify(item.data).toLowerCase().includes(query)
          : false;
        if (!eventMatch && !dataMatch) return false;
      }

      return true;
    });
  }, [logs, selectedLevel, selectedNs, search]);

  return (
    <div className="space-y-3.5">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3.5 rounded-lg border dark:border-[#22252b] border-slate-200 dark:bg-[#181b1f] bg-white shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-500">
            <Laptop className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold dark:text-white text-slate-800">
                Frontend Client Logs
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                IndexedDB Persistent (F5 an toàn)
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Nhật ký phía trình duyệt máy trạm (API calls, route navigation, runtime crash)
            </p>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mr-2">
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span>Mức ghi:</span>
            <select
              value={currentLevel}
              onChange={(e) => handleLevelChange(e.target.value)}
              className="h-7 text-xs rounded border border-slate-300 dark:border-[#2b2e35] bg-transparent px-2 font-medium focus:outline-none dark:text-slate-200"
            >
              <option value="debug" className="dark:bg-[#181b1f]">
                DEBUG (Tất cả)
              </option>
              <option value="info" className="dark:bg-[#181b1f]">
                INFO (Mặc định)
              </option>
              <option value="warn" className="dark:bg-[#181b1f]">
                WARN (Cảnh báo)
              </option>
              <option value="error" className="dark:bg-[#181b1f]">
                ERROR (Chỉ lỗi)
              </option>
            </select>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={loadLogs}
            disabled={loading}
            className="h-7 text-xs gap-1.5 border-slate-300 dark:border-[#2b2e35]"
          >
            <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
            Làm mới
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={handleDownload}
            className="h-7 text-xs gap-1.5 border-slate-300 dark:border-[#2b2e35]"
          >
            <Download className="h-3 w-3" />
            Tải JSON
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={handleClearAll}
            className="h-7 text-xs gap-1.5 text-rose-500 hover:text-rose-600 border-rose-500/30 hover:bg-rose-500/10"
          >
            <Trash2 className="h-3 w-3" />
            Xoá sạch
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-2.5">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <Input
            placeholder="Tìm kiếm theo event, url API, mã lỗi..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 pl-8 text-xs border-slate-300 dark:border-[#2c323f] dark:bg-[#181b1f] bg-white"
          />
        </div>

        {/* Filter theo Level */}
        <div className="flex items-center gap-1 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {['all', 'error', 'warn', 'info', 'debug'].map((lvl) => (
            <button
              key={lvl}
              onClick={() => setSelectedLevel(lvl)}
              className={`h-7 px-2.5 rounded text-xs font-medium border transition-colors capitalize shrink-0 cursor-pointer ${
                selectedLevel === lvl
                  ? 'bg-[#3274d9] text-white border-[#3274d9] shadow-xs'
                  : 'dark:bg-[#181b1f] bg-white dark:border-[#2c323f] border-slate-200 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#22252b]'
              }`}
            >
              {lvl === 'all' ? 'Tất cả' : lvl.toUpperCase()}
            </button>
          ))}
        </div>

        {namespaces.length > 0 && (
          <select
            value={selectedNs}
            onChange={(e) => setSelectedNs(e.target.value)}
            className="h-8 text-xs rounded border border-slate-300 dark:border-[#2c323f] dark:bg-[#181b1f] bg-white px-2 text-slate-700 dark:text-slate-200 focus:outline-none"
          >
            <option value="all">Mọi phân hệ ({namespaces.length})</option>
            {namespaces.map((ns) => (
              <option key={ns} value={ns}>
                [{ns.toUpperCase()}]
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="rounded-lg border dark:border-[#22252b] border-slate-200 dark:bg-[#181b1f] bg-white overflow-hidden shadow-sm">
        <div className="flex items-center justify-between px-3 py-2 border-b dark:border-[#22252b] border-slate-200 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 dark:bg-[#14161a] bg-slate-50">
          <span>Thời gian &amp; Sự kiện</span>
          <span>
            Hiển thị: {filteredLogs.length} / {logs.length} bản ghi
          </span>
        </div>

        {filteredLogs.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            {logs.length === 0
              ? 'Chưa có bản ghi log nào được lưu trên máy này.'
              : 'Không tìm thấy log nào khớp với bộ lọc hiện tại.'}
          </div>
        ) : (
          <div className="divide-y dark:divide-[#22252b] divide-slate-100 font-mono text-xs max-h-[600px] overflow-y-auto">
            {filteredLogs.map((item, idx) => {
              const uniqueKey = item.id || `${item.ts}-${idx}`;
              const isExpanded = expandedIds.has(uniqueKey);
              const lvl = item.level?.toLowerCase() || 'info';
              const cfg = LEVEL_CONFIG[lvl] || LEVEL_CONFIG.info;
              const hasData = item.data !== undefined && item.data !== null;

              const colon = String(item.event || '').indexOf(':');
              const ns = colon > 0 ? String(item.event).slice(0, colon).toUpperCase() : 'APP';
              const action = colon > 0 ? String(item.event).slice(colon + 1) : item.event;

              return (
                <div
                  key={uniqueKey}
                  className="p-2.5 hover:bg-slate-50 dark:hover:bg-[#1f2329] transition-colors"
                >
                  <div
                    className={`flex items-start justify-between gap-2 ${hasData ? 'cursor-pointer' : ''}`}
                    onClick={() => hasData && toggleExpand(uniqueKey)}
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      {hasData ? (
                        isExpanded ? (
                          <ChevronDown className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        ) : (
                          <ChevronRight className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        )
                      ) : (
                        <span className="w-3.5 shrink-0" />
                      )}

                      <span className="text-[11px] text-slate-400 dark:text-slate-500 shrink-0">
                        {new Date(item.ts).toLocaleTimeString('vi-VN', { hour12: false })}
                      </span>

                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded border font-semibold shrink-0 ${cfg.color}`}
                      >
                        {cfg.label}
                      </span>

                      <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold bg-slate-200 dark:bg-[#2b2e35] text-slate-700 dark:text-slate-300 shrink-0">
                        [{ns}]
                      </span>

                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {action}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {hasData && (
                        <button
                          onClick={(e) => handleCopy(item.data, uniqueKey, e)}
                          title="Sao chép dữ liệu JSON"
                          className="p-1 rounded hover:bg-slate-200 dark:hover:bg-[#2b2e35] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        >
                          {copiedId === uniqueKey ? (
                            <Check className="h-3.5 w-3.5 text-emerald-500" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {hasData && isExpanded && (
                    <div className="mt-2 ml-6 p-2.5 rounded bg-slate-900 text-slate-200 text-[11px] overflow-x-auto border border-slate-800">
                      <pre className="whitespace-pre-wrap">
                        {JSON.stringify(item.data, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
