import { saveLogToStorage, getStoredLogsFromDb, clearStoredLogsFromDb } from './log-storage';

const LEVEL_RANK: Record<string, number> = { debug: 0, info: 1, warn: 2, error: 3, silent: 4 };

const LEVEL_COLORS: Record<string, string> = {
  debug: '#64748b',
  info: '#0284c7',
  warn: '#d97706',
  error: '#ef4444',
};

const NS_COLORS: Record<string, string> = {
  api: '#8b5cf6',
  auth: '#10b981',
  router: '#f59e0b',
  ui: '#06b6d4',
  app: '#475569',
  runtime: '#f43f5e',
  default: '#334155',
};

const CONSOLE_METHOD: Record<string, 'debug' | 'info' | 'warn' | 'error'> = {
  debug: 'debug',
  info: 'info',
  warn: 'warn',
  error: 'error',
};

const STORAGE_KEY = 'MES_LOG_LEVEL';

function resolveDefaultLevel() {
  if (typeof window !== 'undefined') {
    const stored = window.localStorage.getItem(STORAGE_KEY)?.toLowerCase();
    if (stored && stored in LEVEL_RANK) return stored;
  }
  const envLevel = process.env.NEXT_PUBLIC_LOG_LEVEL?.toLowerCase();
  if (envLevel && envLevel in LEVEL_RANK) return envLevel;
  return process.env.NODE_ENV === 'development' ? 'debug' : 'info';
}

function parseEvent(rawEvent: any) {
  const str = String(rawEvent || '');
  const colonIndex = str.indexOf(':');
  if (colonIndex > 0) {
    return {
      ns: str.slice(0, colonIndex).trim().toLowerCase(),
      action: str.slice(colonIndex + 1).trim(),
    };
  }
  return { ns: 'app', action: str };
}

function buildEntry(level: string, event: any, data?: any) {
  return {
    ts: new Date().toISOString(),
    level,
    event,
    ...(data !== undefined && data !== null ? { data } : {}),
  };
}

class Logger {
  #level: string;
  #buffer: any[] = [];
  #maxBuffer = 150;

  constructor(level = resolveDefaultLevel()) {
    this.#level = level;
  }

  /**
   * Thay đổi level ghi log (debug | info | warn | error | silent)
   * Tự động lưu vào localStorage để giữ thiết lập qua các lần reload trang (F5).
   */
  setLevel(level: string) {
    const normalized = String(level).toLowerCase();
    if (!(normalized in LEVEL_RANK)) {
      console.warn(
        `[LOGGER] Cấp độ không hợp lệ: "${level}". Chọn: debug | info | warn | error | silent`
      );
      return;
    }
    this.#level = normalized;
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, normalized);
    }
    console.log(
      `%c[LOGGER]%c Đã đổi Log Level sang: %c${normalized.toUpperCase()}%c`,
      'color: #0284c7; font-weight: bold;',
      '',
      `color: ${LEVEL_COLORS[normalized] || '#000'}; font-weight: bold;`,
      ''
    );
  }

  getLevel() {
    return this.#level;
  }

  /** Lấy danh sách log gần nhất từ RAM */
  getRecentLogs() {
    return [...this.#buffer];
  }

  /** Lấy log lưu trữ bền vững từ IndexedDB (F5 không mất) */
  async getPersistedLogs(limit = 300) {
    return getStoredLogsFromDb(limit);
  }

  /** Xoá sạch log trong RAM và IndexedDB */
  async clearAllLogs() {
    this.#buffer = [];
    await clearStoredLogsFromDb();
    console.log('[LOGGER] Đã xoá sạch toàn bộ log (RAM & IndexedDB).');
  }

  /** Xoá sạch log buffer trong bộ nhớ RAM */
  clearLogs() {
    this.#buffer = [];
    console.log('[LOGGER] Đã xoá bộ nhớ đệm log RAM.');
  }

  /** Xuất log dưới dạng JSON chuỗi */
  exportLogsJson() {
    return JSON.stringify(this.#buffer, null, 2);
  }

  /** Tải file log .json về máy */
  async downloadLogs(fromIndexedDB = true) {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    const logs = fromIndexedDB ? await this.getPersistedLogs() : this.#buffer;
    const blob = new Blob([JSON.stringify(logs, null, 2)], {
      type: 'application/json;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mes-fe-logs-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  /** In menu trợ giúp các lệnh trên Console F12 */
  help() {
    console.group('%c[LOGGER] Trợ giúp thao tác Console F12', 'color: #0284c7; font-weight: bold;');
    console.log('• __LOGGER__.setLevel("debug")    : Bật full log (kể cả request/response)');
    console.log('• __LOGGER__.setLevel("info")     : Chỉ xem log thông thường & cảnh báo');
    console.log('• __LOGGER__.setLevel("warn")     : Chỉ xem cảnh báo và lỗi');
    console.log('• __LOGGER__.getLevel()           : Kiểm tra level hiện tại');
    console.log('• __LOGGER__.getRecentLogs()      : Lấy mảng log gần nhất từ RAM');
    console.log('• __LOGGER__.downloadLogs()       : Tải file .json lịch sử log về máy');
    console.log('• __LOGGER__.clearAllLogs()       : Xoá sạch toàn bộ log');
    console.groupEnd();
  }

  debug(event: any, data?: any) {
    this.#write('debug', event, data);
  }

  info(event: any, data?: any) {
    this.#write('info', event, data);
  }

  warn(event: any, data?: any) {
    this.#write('warn', event, data);
  }

  error(event: any, data?: any) {
    this.#write('error', event, data);
  }

  child(namespace: string) {
    return new ChildLogger(this, namespace);
  }

  #write(level: string, event: any, data?: any) {
    const entry = buildEntry(level, event, data);

    // Lưu RAM Buffer (phục vụ ErrorBoundary & download nhanh)
    this.#buffer.push(entry);
    if (this.#buffer.length > this.#maxBuffer) {
      this.#buffer.shift();
    }

    // Lưu ngầm IndexedDB
    saveLogToStorage(entry);

    // Kiểm tra level trước khi in ra Console
    if (LEVEL_RANK[level] < LEVEL_RANK[this.#level]) return;

    this.#renderToConsole(level, event, data);
  }

  #renderToConsole(level: string, event: any, data?: any) {
    const { ns, action } = parseEvent(event);
    const time = new Date().toLocaleTimeString('vi-VN', { hour12: false });
    const lvlColor = LEVEL_COLORS[level] || '#475569';
    const nsColor = NS_COLORS[ns] || NS_COLORS.default;

    const titleFormat = `%c${time}%c %c${level.toUpperCase()}%c %c[${ns.toUpperCase()}]%c ${action}`;
    const titleStyles = [
      'color: #94a3b8; font-size: 11px;',
      '',
      `background: ${lvlColor}; color: #ffffff; padding: 1px 5px; border-radius: 3px; font-weight: bold; font-size: 10px;`,
      '',
      `background: ${nsColor}; color: #ffffff; padding: 1px 5px; border-radius: 3px; font-weight: bold; font-size: 10px;`,
      'color: inherit; font-weight: 500;',
    ];

    if (data !== undefined && data !== null) {
      const groupFn = level === 'error' ? console.group : console.groupCollapsed;
      groupFn(titleFormat, ...titleStyles);
      console.log(data);
      console.groupEnd();
    } else {
      const method = CONSOLE_METHOD[level] || 'log';
      console[method](titleFormat, ...titleStyles);
    }
  }
}

class ChildLogger {
  #parent: Logger;
  #ns: string;

  constructor(parent: Logger, namespace: string) {
    this.#parent = parent;
    this.#ns = namespace;
  }

  debug(event: any, data?: any) {
    this.#parent.debug(`${this.#ns}:${event}`, data);
  }
  info(event: any, data?: any) {
    this.#parent.info(`${this.#ns}:${event}`, data);
  }
  warn(event: any, data?: any) {
    this.#parent.warn(`${this.#ns}:${event}`, data);
  }
  error(event: any, data?: any) {
    this.#parent.error(`${this.#ns}:${event}`, data);
  }
}

export const logger = new Logger();

if (typeof window !== 'undefined') {
  (window as any).__LOGGER__ = logger;
}
