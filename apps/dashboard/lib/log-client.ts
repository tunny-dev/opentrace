import axios from 'axios';
import { API_BASE_URL } from '@/config/api';
import { storage } from '@/core/utils/storage';

export const SYSTEM_LOGS_BASE = `${API_BASE_URL.replace(/\/api$/, '')}/api/system-logs`;
export const AUTH_STORAGE_KEY = 'mes_cimdev_log_auth';

export function getStoredLogAuth(): { username: string; password?: string } | null {
  return storage.session.getJSON(AUTH_STORAGE_KEY);
}

export function setStoredLogAuth(username: string, password?: string) {
  return storage.session.setJSON(AUTH_STORAGE_KEY, { username, password });
}

export function clearStoredLogAuth() {
  storage.session.removeItem(AUTH_STORAGE_KEY);
}

export const logClient = axios.create({
  baseURL: SYSTEM_LOGS_BASE,
  timeout: 45_000,
});

logClient.interceptors.request.use((config) => {
  const auth = getStoredLogAuth();
  if (auth?.username && auth?.password) {
    const encoded = typeof btoa !== 'undefined' ? btoa(`${auth.username}:${auth.password}`) : Buffer.from(`${auth.username}:${auth.password}`).toString('base64');
    config.headers.Authorization = `Basic ${encoded}`;
    config.headers['X-Log-User'] = auth.username;
    config.headers['X-Log-Pass'] = auth.password;
  }
  return config;
});

export default logClient;
