// SQLite Storage Adapter (Secondary Fallback)
// Runs real SQLite in-browser via WebAssembly (sql.js) and persists binary DB state in IndexedDB.

import initSqlJs from 'sql.js';

const IDB_NAME = 'anime_tracker_sqlite_db';
const IDB_STORE = 'sqlite_state';
const IDB_KEY = 'database_bytes';
const LOCAL_STORAGE_KEY = 'anime_tracker_sqlite_b64';

let sqlModule = null;
let dbInstance = null;
let initPromise = null;

// IndexedDB Helper
function openIndexedDB() {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB not supported'));
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

async function loadPersistedBytes() {
  try {
    const idb = await openIndexedDB();
    return new Promise((resolve) => {
      const tx = idb.transaction(IDB_STORE, 'readonly');
      const store = tx.objectStore(IDB_STORE);
      const req = store.get(IDB_KEY);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  } catch (idbErr) {
    console.warn('[SQLiteStorage] IndexedDB load failed, trying localStorage:', idbErr);
    try {
      const b64 = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (b64) {
        const binStr = atob(b64);
        const len = binStr.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binStr.charCodeAt(i);
        }
        return bytes;
      }
    } catch {
      // ignore
    }
    return null;
  }
}

async function persistBytes(bytes) {
  try {
    const idb = await openIndexedDB();
    return new Promise((resolve, reject) => {
      const tx = idb.transaction(IDB_STORE, 'readwrite');
      const store = tx.objectStore(IDB_STORE);
      const req = store.put(bytes, IDB_KEY);
      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  } catch (idbErr) {
    try {
      // Fallback: convert to binary string and base64
      let binary = '';
      const len = bytes.byteLength;
      for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      localStorage.setItem(LOCAL_STORAGE_KEY, btoa(binary));
    } catch (lsErr) {
      console.warn('[SQLiteStorage] Failed to persist SQLite bytes to localStorage:', lsErr);
    }
  }
}

async function getOrInitDb() {
  if (dbInstance) return dbInstance;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    if (!sqlModule) {
      const initFn = typeof initSqlJs === 'function' ? initSqlJs : initSqlJs?.default;
      if (!initFn) {
        throw new Error('initSqlJs function not available from sql.js module');
      }
      sqlModule = await initFn({
        locateFile: (file) => `/${file}`,
      });
    }

    const savedBytes = await loadPersistedBytes();
    if (savedBytes && savedBytes.length > 0) {
      try {
        dbInstance = new sqlModule.Database(savedBytes);
      } catch (err) {
        console.warn('[SQLiteStorage] Existing DB corrupted, creating fresh database:', err);
        dbInstance = new sqlModule.Database();
      }
    } else {
      dbInstance = new sqlModule.Database();
    }

    // Initialize Schema
    dbInstance.run(`
      CREATE TABLE IF NOT EXISTS animes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        total_episodes INTEGER DEFAULT 0,
        watched_episodes INTEGER DEFAULT 0,
        completed INTEGER DEFAULT 0,
        emoji TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_animes_name ON animes(name);
    `);

    // Auto-save initial schema
    await persistBytes(dbInstance.export());
    return dbInstance;
  })();

  return initPromise;
}

export const sqliteStorage = {
  name: 'sqlite',
  displayName: 'SQLite (Local WASM)',

  async isHealthy() {
    try {
      const db = await getOrInitDb();
      const res = db.exec('SELECT 1;');
      return Boolean(res && res.length > 0);
    } catch (e) {
      console.error('[SQLiteStorage] Health check failed:', e);
      return false;
    }
  },

  async getAnimes() {
    const db = await getOrInitDb();
    const query = `
      SELECT id, name, total_episodes, watched_episodes, completed, emoji, created_at 
      FROM animes 
      ORDER BY id DESC;
    `;
    const res = db.exec(query);
    if (!res || res.length === 0 || !res[0].values) {
      return [];
    }

    return res[0].values.map((row) => ({
      id: row[0],
      name: row[1],
      totalEpisodes: Number(row[2]) || 0,
      watchedEpisodes: Number(row[3]) || 0,
      completed: Boolean(row[4]),
      emoji: row[5] || '📺',
      createdAt: row[6] || new Date().toISOString(),
    }));
  },

  async addAnime(animeData) {
    const db = await getOrInitDb();
    const name = (animeData.name || '').trim();
    const totalEpisodes = Number(animeData.totalEpisodes) || 0;
    const watchedEpisodes = Number(animeData.watchedEpisodes) || 0;
    const completed = animeData.completed ? 1 : 0;
    const emoji = animeData.emoji || '📺';
    const createdAt = new Date().toISOString();

    db.run(
      `INSERT INTO animes (name, total_episodes, watched_episodes, completed, emoji, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?);`,
      [name, totalEpisodes, watchedEpisodes, completed, emoji, createdAt, createdAt]
    );

    const idRes = db.exec('SELECT last_insert_rowid() AS id;');
    const newId = idRes[0]?.values[0]?.[0] || Date.now();

    await persistBytes(db.export());

    return {
      id: newId,
      name,
      totalEpisodes,
      watchedEpisodes,
      completed: Boolean(completed),
      emoji,
      createdAt,
    };
  },

  async updateAnime(id, updates) {
    const db = await getOrInitDb();
    const fields = [];
    const values = [];

    if (updates.name !== undefined) {
      fields.push('name = ?');
      values.push(updates.name.trim());
    }
    if (updates.totalEpisodes !== undefined) {
      fields.push('total_episodes = ?');
      values.push(Number(updates.totalEpisodes) || 0);
    }
    if (updates.watchedEpisodes !== undefined) {
      fields.push('watched_episodes = ?');
      values.push(Number(updates.watchedEpisodes) || 0);
    }
    if (updates.completed !== undefined) {
      fields.push('completed = ?');
      values.push(updates.completed ? 1 : 0);
    }
    if (updates.emoji !== undefined) {
      fields.push('emoji = ?');
      values.push(updates.emoji);
    }

    fields.push('updated_at = ?');
    values.push(new Date().toISOString());

    values.push(id);

    const sql = `UPDATE animes SET ${fields.join(', ')} WHERE id = ?;`;
    db.run(sql, values);

    await persistBytes(db.export());

    // Fetch updated record
    const res = db.exec('SELECT id, name, total_episodes, watched_episodes, completed, emoji, created_at FROM animes WHERE id = ?;', [id]);
    if (res && res[0]?.values?.[0]) {
      const row = res[0].values[0];
      return {
        id: row[0],
        name: row[1],
        totalEpisodes: Number(row[2]) || 0,
        watchedEpisodes: Number(row[3]) || 0,
        completed: Boolean(row[4]),
        emoji: row[5],
        createdAt: row[6],
      };
    }
    return null;
  },

  async deleteAnime(id) {
    const db = await getOrInitDb();
    db.run('DELETE FROM animes WHERE id = ?;', [id]);
    await persistBytes(db.export());
    return true;
  },

  async syncAll(animes) {
    const db = await getOrInitDb();
    db.run('DELETE FROM animes;');
    for (const item of animes) {
      db.run(
        `INSERT INTO animes (id, name, total_episodes, watched_episodes, completed, emoji, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?);`,
        [
          item.id || null,
          item.name || '',
          Number(item.totalEpisodes) || 0,
          Number(item.watchedEpisodes) || 0,
          item.completed ? 1 : 0,
          item.emoji || '📺',
          item.createdAt || new Date().toISOString(),
        ]
      );
    }
    await persistBytes(db.export());
  },
};
