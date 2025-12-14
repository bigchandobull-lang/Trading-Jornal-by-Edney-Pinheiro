import { Trade } from '../types';

const DB_NAME = 'TradeJournalDB';
const DB_VERSION = 1;
const TRADES_STORE = 'trades';
const KEYVAL_STORE = 'keyval';

let db: IDBDatabase;

const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (db) return resolve(db);

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => reject(`IndexedDB error: ${(event.target as any).errorCode}`);
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };
    request.onupgradeneeded = () => {
      const dbInstance = request.result;
      if (!dbInstance.objectStoreNames.contains(TRADES_STORE)) {
        const tradesStore = dbInstance.createObjectStore(TRADES_STORE, { keyPath: 'id' });
        tradesStore.createIndex('date', 'date', { unique: false });
      }
      if (!dbInstance.objectStoreNames.contains(KEYVAL_STORE)) {
        dbInstance.createObjectStore(KEYVAL_STORE);
      }
    };
  });
};

// --- Key-Value Store Helpers ---
export const set = async <T>(key: string, value: T): Promise<void> => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(KEYVAL_STORE, 'readwrite');
        const store = transaction.objectStore(KEYVAL_STORE);
        const request = store.put(value, key);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};

export const get = async <T>(key: string): Promise<T | undefined> => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(KEYVAL_STORE, 'readonly');
        const store = transaction.objectStore(KEYVAL_STORE);
        const request = store.get(key);
        request.onsuccess = () => resolve(request.result as T | undefined);
        request.onerror = () => reject(request.error);
    });
};

export const del = async (key: string): Promise<void> => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(KEYVAL_STORE, 'readwrite');
        const store = transaction.objectStore(KEYVAL_STORE);
        const request = store.delete(key);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};


// --- Trades Store Helpers ---
export const getAllTrades = async (): Promise<Trade[]> => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(TRADES_STORE, 'readonly');
        const store = transaction.objectStore(TRADES_STORE);
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

export const addTradeDB = async (trade: Trade): Promise<void> => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(TRADES_STORE, 'readwrite');
        const store = transaction.objectStore(TRADES_STORE);
        const request = store.add(trade);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};

export const updateTradeDB = async (trade: Trade): Promise<void> => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(TRADES_STORE, 'readwrite');
        const store = transaction.objectStore(TRADES_STORE);
        const request = store.put(trade);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};

export const deleteTradeDB = async (id: string): Promise<void> => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(TRADES_STORE, 'readwrite');
        const store = transaction.objectStore(TRADES_STORE);
        const request = store.delete(id);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};

export const bulkAddTradesDB = async (trades: Trade[]): Promise<void> => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(TRADES_STORE, 'readwrite');
        const store = transaction.objectStore(TRADES_STORE);
        trades.forEach(trade => store.put(trade));
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
    });
};

export const clearTradesDB = async (): Promise<void> => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(TRADES_STORE, 'readwrite');
        const store = transaction.objectStore(TRADES_STORE);
        const request = store.clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};
