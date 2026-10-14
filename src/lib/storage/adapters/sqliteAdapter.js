/** @fileoverview Tier 2 storage adapter running in-browser SQLite WebAssembly via sql.js with binary persistence. */

import initSqlJs from 'sql.js';
import { loadIndexedDbBytes, persistIndexedDbBytes } from '../persistence/indexedDbStorage';
import { loadLocalStorageBytes, persistLocalStorageBytes } from '../persistence/localStorageBackup';

let sqlModule = null;
let dbInstance = null;
let initPromise = null;

/**
 * Persists SQLite binary export to IndexedDB, falling back to localStorage if necessary.
 *
 * Steps:
 * 1. Attempt to store bytes in IndexedDB.
 * 2. If IndexedDB fails, fall back to base64 localStorage persistence.
 *
 * @param {Uint8Array} bytes - Binary database bytes.
 * @returns {Promise<void>}
 */
async function saveBytes(bytes) {
  try {
    await persistIndexedDbBytes(bytes);
  } catch (err) {
    console.warn('[SqliteAdapter] IndexedDB save failed, using localStorage:', err);
    persistLocalStorageBytes(bytes);
  }
}

/**
 * Initializes and caches the SQLite WASM database instance.
 *
 * Steps:
 * 1. Return cached database instance if already loaded.
 * 2. If initialization is in progress, return the active promise.
 * 3. Load sql.js WASM module from /sql-wasm-browser.wasm.
 * 4. Try loading persisted bytes from IndexedDB, then localStorage.
 * 5. Instantiate new or restored SQL.Database.
 * 6. Execute CREATE TABLE and index queries.
 * 7. Persist initial schema and return database instance.
 *
 * @returns {Promise<Object>} The active SQLite database connection.
 * @throws {Error} If WASM fails to load or compile.
 */
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

    let savedBytes = null;
    try {
      savedBytes = await loadIndexedDbBytes();
    } catch {
      savedBytes = null;
    }

    if (!savedBytes) {
      savedBytes = loadLocalStorageBytes();
    }

    if (savedBytes && savedBytes.length > 0) {
      try {
        dbInstance = new sqlModule.Database(savedBytes);
      } catch (err) {
        console.warn('[SqliteAdapter] Existing DB corrupted, creating fresh database:', err);
        dbInstance = new sqlModule.Database();
      }
    } else {
      dbInstance = new sqlModule.Database();
    }

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

    await saveBytes(dbInstance.export());
    return dbInstance;
  })();

  return initPromise;
}

/**
 * SQLite WASM storage adapter implementing standard storage interface.
 */
export const sqliteAdapter = {
  name: 'sqlite',
  displayName: 'SQLite (Local WASM)',

  /**
   * Performs health check by running a test SELECT query on the SQLite engine.
   *
   * Steps:
   * 1. Initialize or get SQLite database.
   * 2. Execute 'SELECT 1;' query.
   * 3. Return true if query yields result, false on any error.
   *
   * @returns {Promise<boolean>} True if SQLite is healthy.
   * @throws {never}
   */
  async isHealthy() {
    try {
      const db = await getOrInitDb();
      const res = db.exec('SELECT 1;');
      return Boolean(res && res.length > 0);
    } catch {
      return false;
    }
  },

  /**
   * Queries all animes from SQLite ordered descending by id.
   *
   * Steps:
   * 1. Get database instance.
   * 2. Run SELECT query on animes table.
   * 3. Map resulting row values to anime entity objects.
   *
   * @returns {Promise<Array<Object>>} List of anime records.
   * @throws {Error} If query fails.
   */
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

  /**
   * Inserts an anime record into the SQLite database.
   *
   * Steps:
   * 1. Get database instance.
   * 2. Execute parameterized INSERT SQL statement.
   * 3. Query last_insert_rowid() to get new record ID.
   * 4. Export binary database and persist to storage.
   * 5. Return created anime object.
   *
   * @param {Object} animeData - Anime attributes.
   * @returns {Promise<Object>} Created anime record.
   * @throws {Error} If execution fails.
   */
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

    await saveBytes(db.export());

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

  /**
   * Updates an existing anime record in SQLite.
   *
   * Steps:
   * 1. Dynamically construct UPDATE SQL statement for provided fields.
   * 2. Run update query with parameters.
   * 3. Persist exported binary database.
   * 4. Query and return the updated row.
   *
   * @param {number|string} id - Record identifier.
   * @param {Object} updates - Updated field properties.
   * @returns {Promise<Object|null>} Updated anime entity.
   * @throws {Error} If update fails.
   */
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

    await saveBytes(db.export());

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

  /**
   * Deletes an anime record by identifier from SQLite.
   *
   * Steps:
   * 1. Execute DELETE SQL statement.
   * 2. Persist updated database binary.
   * 3. Return true.
   *
   * @param {number|string} id - Record identifier.
   * @returns {Promise<boolean>} True if deleted.
   * @throws {Error} If delete fails.
   */
  async deleteAnime(id) {
    const db = await getOrInitDb();
    db.run('DELETE FROM animes WHERE id = ?;', [id]);
    await saveBytes(db.export());
    return true;
  },

  /**
   * Replaces all records in the SQLite animes table with the provided list.
   *
   * Steps:
   * 1. Delete all existing rows.
   * 2. Insert each anime from the provided collection.
   * 3. Persist database binary.
   *
   * @param {Array<Object>} animes - Anime list to bulk sync.
   * @returns {Promise<void>}
   */
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
    await saveBytes(db.export());
  },
};
