/**
 * Quản lý lưu trữ log Frontend bằng IndexedDB.
 */
const DB_NAME = 'mes_client_logs_db';
const DB_VERSION = 1;
const STORE_NAME = 'logs';
const MAX_LOGS = 300;

function openDB(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      resolve(null);
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event: any) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
        store.createIndex('ts', 'ts', { unique: false });
        store.createIndex('level', 'level', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => {
      console.warn('[LogStorage] Không thể mở IndexedDB:', request.error);
      resolve(null);
    };
  });
}

/**
 * Lưu 1 entry log vào IndexedDB (chạy ngầm).
 * Tự động cắt tỉa khi vượt quá MAX_LOGS.
 */
export async function saveLogToStorage(entry: any) {
  try {
    const db = await openDB();
    if (!db) return;

    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    // Lưu entry mới
    store.add(entry);

    // Kiểm tra số lượng và cắt tỉa log cũ nhất nếu vượt quá MAX_LOGS
    const countReq = store.count();
    countReq.onsuccess = () => {
      const count = countReq.result;
      if (count > MAX_LOGS) {
        const deleteCount = count - MAX_LOGS;
        const cursorReq = store.openCursor();
        let deleted = 0;
        cursorReq.onsuccess = (e: any) => {
          const cursor = e.target.result;
          if (cursor && deleted < deleteCount) {
            cursor.delete();
            deleted++;
            cursor.continue();
          }
        };
      }
    };
  } catch {
    // Không làm gián đoạn ứng dụng nếu storage có lỗi
  }
}

/**
 * Lấy toàn bộ log từ IndexedDB (mới nhất lên đầu)
 */
export async function getStoredLogsFromDb(limit = MAX_LOGS): Promise<any[]> {
  try {
    const db = await openDB();
    if (!db) return [];

    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const results = request.result || [];
        // Sắp xếp mới nhất lên đầu
        results.sort((a: any, b: any) => new Date(b.ts).getTime() - new Date(a.ts).getTime());
        resolve(results.slice(0, limit));
      };

      request.onerror = () => resolve([]);
    });
  } catch {
    return [];
  }
}

/**
 * Xóa sạch toàn bộ log trong IndexedDB
 */
export async function clearStoredLogsFromDb() {
  try {
    const db = await openDB();
    if (!db) return;

    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.clear();
  } catch {
    // ignore
  }
}
