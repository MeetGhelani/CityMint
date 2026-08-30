const DB_NAME = 'CityMintDB';
const DB_VERSION = 1;

let dbInstance: IDBDatabase | null = null;

export function initDB(): Promise<IDBDatabase> {
  if (dbInstance) return Promise.resolve(dbInstance);

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = request.result;
      
      // Store active games
      if (!db.objectStoreNames.contains('games')) {
        db.createObjectStore('games', { keyPath: 'id' });
      }
      
      // Store settings (key-value)
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings');
      }

      // Store transactions queue for Supabase sync
      if (!db.objectStoreNames.contains('syncQueue')) {
        db.createObjectStore('syncQueue', { keyPath: 'id' });
      }

      // Store game history summaries
      if (!db.objectStoreNames.contains('history')) {
        db.createObjectStore('history', { keyPath: 'id' });
      }
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

// Helper to run a transaction
function runTx<T>(
  storeName: string,
  mode: IDBTransactionMode,
  callback: (store: IDBObjectStore) => IDBRequest | void,
  customPromise?: (store: IDBObjectStore, resolve: (val: T) => void, reject: (err: any) => void) => void
): Promise<T> {
  return initDB().then((db) => {
    return new Promise<T>((resolve, reject) => {
      const tx = db.transaction(storeName, mode);
      const store = tx.objectStore(storeName);

      if (customPromise) {
        customPromise(store, resolve, reject);
      } else {
        const req = callback(store);
        if (req) {
          req.onsuccess = () => resolve(req.result as T);
          req.onerror = () => reject(req.error);
        } else {
          tx.oncomplete = () => resolve(undefined as T);
          tx.onerror = () => reject(tx.error);
        }
      }
    });
  });
}

// Game Store Actions
export function localSaveGame(game: any): Promise<void> {
  return runTx('games', 'readwrite', (store) => store.put(game));
}

export function localGetGame(id: string): Promise<any> {
  return runTx('games', 'readonly', (store) => store.get(id));
}

export function localDeleteGame(id: string): Promise<void> {
  return runTx('games', 'readwrite', (store) => store.delete(id));
}

export function localGetAllGames(): Promise<any[]> {
  return runTx<any[]>('games', 'readonly', () => {}, (store, resolve, reject) => {
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// Settings Store Actions
export function localSaveSetting(key: string, value: any): Promise<void> {
  return runTx('settings', 'readwrite', (store) => store.put(value, key));
}

export function localGetSetting<T>(key: string, defaultValue: T): Promise<T> {
  return runTx<T>('settings', 'readonly', (store) => store.get(key)).then((val) => {
    return val !== undefined ? val : defaultValue;
  });
}

// Sync Queue Actions
export function localAddToSyncQueue(item: { id: string; gameId: string; payload: any; timestamp: string }): Promise<void> {
  return runTx('syncQueue', 'readwrite', (store) => store.put(item));
}

export function localGetSyncQueue(): Promise<any[]> {
  return runTx<any[]>('syncQueue', 'readonly', () => {}, (store, resolve, reject) => {
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export function localRemoveFromSyncQueue(id: string): Promise<void> {
  return runTx('syncQueue', 'readwrite', (store) => store.delete(id));
}

// History Store Actions
export function localSaveHistory(historyItem: any): Promise<void> {
  return runTx('history', 'readwrite', (store) => store.put(historyItem));
}

export function localGetHistory(): Promise<any[]> {
  return runTx<any[]>('history', 'readonly', () => {}, (store, resolve, reject) => {
    const req = store.getAll();
    req.onsuccess = () => {
      // Sort history by date descending
      const sorted = (req.result || []).sort((a: any, b: any) => {
        return new Date(b.date || b.createdAt).getTime() - new Date(a.date || a.createdAt).getTime();
      });
      resolve(sorted);
    };
    req.onerror = () => reject(req.error);
  });
}
