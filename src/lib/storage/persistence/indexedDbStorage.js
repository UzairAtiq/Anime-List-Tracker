/** @fileoverview Handles binary persistence of SQLite database state in the browser IndexedDB object store. */

const IDB_NAME = 'anime_tracker_sqlite_db';
const IDB_STORE = 'sqlite_state';
const IDB_KEY = 'database_bytes';

/**
 * Opens or upgrades the IndexedDB database connection for SQLite state storage.
 *
 * Steps:
 * 1. Verify window.indexedDB API availability.
 * 2. Open IDB connection named 'anime_tracker_sqlite_db' at version 1.
 * 3. On upgrade needed, create object store 'sqlite_state' if not present.
 * 4. Resolve on success or reject on error.
 *
 * @returns {Promise<IDBDatabase>} Opened IndexedDB database connection.
 * @throws {Error} If window.indexedDB is unavailable or opening fails.
 */
export function openIndexedDB() {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB not supported in this environment'));
    }
    const request = indexedDB.open(IDB_NAME, 1);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Retrieves previously stored SQLite database bytes from IndexedDB.
 *
 * Steps:
 * 1. Open the IndexedDB database.
 * 2. Begin a readonly transaction on the 'sqlite_state' store.
 * 3. Fetch the record matching 'database_bytes'.
 * 4. Resolve with the Uint8Array or null if not found.
 *
 * @returns {Promise<Uint8Array|null>} Stored database binary bytes or null.
 * @throws {Error} When database transaction fails.
 */
export async function loadIndexedDbBytes() {
  const idb = await openIndexedDB();
  return new Promise((resolve, reject) => {
    const tx = idb.transaction(IDB_STORE, 'readonly');
    const store = tx.objectStore(IDB_STORE);
    const req = store.get(IDB_KEY);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Persists an exported SQLite database Uint8Array into IndexedDB.
 *
 * Steps:
 * 1. Open the IndexedDB database.
 * 2. Begin a readwrite transaction on the 'sqlite_state' store.
 * 3. Put the binary Uint8Array under the key 'database_bytes'.
 * 4. Resolve when the write operation completes.
 *
 * @param {Uint8Array} bytes - Binary SQLite database bytes to store.
 * @returns {Promise<boolean>} True if written successfully.
 * @throws {Error} When write transaction fails.
 */
export async function persistIndexedDbBytes(bytes) {
  const idb = await openIndexedDB();
  return new Promise((resolve, reject) => {
    const tx = idb.transaction(IDB_STORE, 'readwrite');
    const store = tx.objectStore(IDB_STORE);
    const req = store.put(bytes, IDB_KEY);
    req.onsuccess = () => resolve(true);
    req.onerror = () => reject(req.error);
  });
}
