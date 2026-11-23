const PREFIX = 'sfcs-';

function keyOf(key: string) {
  return `${PREFIX}${key}`;
}

function isAvailable(type: 'localStorage' | 'sessionStorage' = 'localStorage') {
  try {
    return typeof window !== 'undefined' && Boolean(window[type]);
  } catch {
    return false;
  }
}

function createStorageWrapper(type: 'localStorage' | 'sessionStorage' = 'localStorage') {
  return {
    getItem(key: string): string | null {
      try {
        if (!isAvailable(type)) return null;
        return window[type].getItem(keyOf(key));
      } catch (error) {
        console.error(error);
        return null;
      }
    },
    setItem(key: string, value: any): boolean {
      try {
        if (!isAvailable(type)) return false;
        window[type].setItem(keyOf(key), String(value));
        return true;
      } catch (error) {
        console.error(error);
        return false;
      }
    },
    removeItem(key: string): void {
      try {
        if (!isAvailable(type)) return;
        window[type].removeItem(keyOf(key));
      } catch (error) {
        console.error(error);
      }
    },
    getJSON<T = any>(key: string, fallback: T | null = null): T | null {
      const raw = this.getItem(key);
      if (raw === null) return fallback;
      try {
        return JSON.parse(raw);
      } catch {
        return raw as unknown as T;
      }
    },
    setJSON(key: string, value: any): boolean {
      try {
        if (!isAvailable(type)) return false;
        window[type].setItem(keyOf(key), JSON.stringify(value));
        return true;
      } catch (error) {
        console.error(error);
        return false;
      }
    },
  };
}

export const storage = createStorageWrapper('localStorage') as ReturnType<typeof createStorageWrapper> & {
  local: ReturnType<typeof createStorageWrapper>;
  session: ReturnType<typeof createStorageWrapper>;
};
storage.local = storage;
storage.session = createStorageWrapper('sessionStorage');
export default storage;
