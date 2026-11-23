import {
  logClient,
  SYSTEM_LOGS_BASE,
  getStoredLogAuth,
  setStoredLogAuth,
  clearStoredLogAuth,
} from '@/lib/log-client';

export const systemLogsService = {
  getStoredAuth() {
    return getStoredLogAuth();
  },

  isAuthenticated() {
    return !!this.getStoredAuth();
  },

  setStoredAuth(username: string, password?: string) {
    setStoredLogAuth(username, password);
  },

  clearAuth() {
    clearStoredLogAuth();
  },

  getAuthHeaders() {
    const auth = this.getStoredAuth();
    if (!auth) return {};
    const encoded = typeof btoa !== 'undefined' ? btoa(`${auth.username}:${auth.password}`) : Buffer.from(`${auth.username}:${auth.password}`).toString('base64');
    return {
      Authorization: `Basic ${encoded}`,
      'X-Log-User': auth.username,
      'X-Log-Pass': auth.password || '',
    };
  },

  async getDates() {
    try {
      const res = await logClient.get('/dates');
      return res.data;
    } catch (err: any) {
      if (err.response?.status === 401) throw new Error('UNAUTHORIZED', { cause: err });
      throw new Error(
        err.response?.data?.errorMessage || `Lỗi tải danh sách ngày (${err.message})`,
        { cause: err }
      );
    }
  },

  async getTraces({
    date,
    from,
    to,
    search,
    traceId,
    level,
    onlyErrors,
    onlySlow,
    onlySql,
    onlyInfo,
    onlyWarn,
    page = 1,
    pageSize = 20,
    limit = 0,
  }: any = {}) {
    try {
      const params: Record<string, any> = {};
      if (date) params.date = date;
      if (from) params.from = from;
      if (to) params.to = to;
      if (search) params.search = search;
      if (traceId) params.traceId = traceId;
      if (level) params.level = level;
      if (onlyErrors) params.onlyErrors = true;
      if (onlySlow) params.onlySlow = true;
      if (onlySql) params.onlySql = true;
      if (onlyInfo) params.onlyInfo = true;
      if (onlyWarn) params.onlyWarn = true;
      if (page) params.page = page;
      if (pageSize) params.pageSize = pageSize;
      if (limit) params.limit = limit;

      const res = await logClient.get('/traces', { params });
      return res.data;
    } catch (err: any) {
      if (err.response?.status === 401) throw new Error('UNAUTHORIZED', { cause: err });
      throw new Error(
        err.response?.data?.errorMessage || `Lỗi tải danh sách Traces (${err.message})`,
        { cause: err }
      );
    }
  },

  async getFiles(date?: string) {
    try {
      const res = await logClient.get('/files', {
        params: date ? { date } : {},
      });
      return res.data;
    } catch (err: any) {
      if (err.response?.status === 401) throw new Error('UNAUTHORIZED', { cause: err });
      throw new Error(
        err.response?.data?.errorMessage || `Lỗi tải danh sách file (${err.message})`,
        { cause: err }
      );
    }
  },

  getDownloadUrl(filePath: string) {
    const auth = this.getStoredAuth();
    const query = new URLSearchParams({ file: filePath });
    if (auth) {
      query.append('user', auth.username);
      if (auth.password) query.append('pass', auth.password);
    }
    return `${SYSTEM_LOGS_BASE}/download?${query.toString()}`;
  },

  async executeSql({ sql, paramsJson, mode = 'data', maxRows = 100 }: any) {
    try {
      const res = await logClient.post('/execute-sql', {
        sql,
        paramsJson,
        mode,
        maxRows,
      });
      return res.data;
    } catch (err: any) {
      if (err.response?.status === 401) throw new Error('UNAUTHORIZED', { cause: err });
      const msg = err.response?.data?.errorMessage || err.message || 'Lỗi thực thi SQL';
      throw new Error(msg, { cause: err });
    }
  },
};

export const systemLogsApi = systemLogsService;
export default systemLogsService;
