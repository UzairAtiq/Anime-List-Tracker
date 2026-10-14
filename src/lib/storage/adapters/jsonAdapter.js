/** @fileoverview Tier 3 storage adapter storing serialized anime records as JSON in localStorage or memory. */

const STORAGE_KEY = 'anime_tracker_json_data';
const LEGACY_STORAGE_KEY = 'animeList';

let memoryStore = null;

/**
 * Checks whether window.localStorage is accessible and writable.
 *
 * Steps:
 * 1. Attempt to write a test key to localStorage.
 * 2. Remove the test key.
 * 3. Return true if successful, false if restricted.
 *
 * @returns {boolean} True if localStorage is functional.
 */
function isLocalStorageAvailable() {
  try {
    const testKey = '__storage_test__';
    window.localStorage.setItem(testKey, testKey);
    window.localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

/**
 * Reads raw JSON string from localStorage or memory store.
 *
 * Steps:
 * 1. If localStorage available, read primary storage key.
 * 2. If primary key missing, check legacy key.
 * 3. Fall back to memoryStore.
 *
 * @returns {string|null} Raw JSON string or null.
 */
function readRaw() {
  if (isLocalStorageAvailable()) {
    const data = window.localStorage.getItem(STORAGE_KEY);
    if (data) return data;
    const legacy = window.localStorage.getItem(LEGACY_STORAGE_KEY);
    if (legacy) {
      window.localStorage.setItem(STORAGE_KEY, legacy);
      return legacy;
    }
    return null;
  }
  return memoryStore;
}

/**
 * Writes raw JSON string to localStorage and memory store.
 *
 * Steps:
 * 1. Write to localStorage if available.
 * 2. Keep memoryStore synchronized.
 *
 * @param {string} jsonString - Serialized JSON string to store.
 */
function writeRaw(jsonString) {
  if (isLocalStorageAvailable()) {
    try {
      window.localStorage.setItem(STORAGE_KEY, jsonString);
      window.localStorage.setItem(LEGACY_STORAGE_KEY, jsonString);
    } catch (e) {
      console.warn('[JsonAdapter] localStorage write failed, using memory store:', e);
      memoryStore = jsonString;
    }
  } else {
    memoryStore = jsonString;
  }
}

/**
 * JSON storage adapter object implementing standard storage interface.
 */
export const jsonAdapter = {
  name: 'json',
  displayName: 'JSON Storage',

  /**
   * Health check for JSON storage adapter.
   *
   * @returns {Promise<boolean>} Always returns true.
   */
  async isHealthy() {
    return true;
  },

  /**
   * Parses and returns all anime records from JSON storage.
   *
   * Steps:
   * 1. Read raw JSON string.
   * 2. Parse JSON into array.
   * 3. Normalize field names and types for each item.
   * 4. Return array of anime records.
   *
   * @returns {Promise<Array<Object>>} List of anime records.
   */
  async getAnimes() {
    try {
      const raw = readRaw();
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed.map((item) => ({
        id: item.id || Date.now(),
        name: String(item.name || ''),
        totalEpisodes: Number(item.totalEpisodes ?? item.total_episodes) || 0,
        watchedEpisodes: Number(item.watchedEpisodes ?? item.watched_episodes) || 0,
        completed: Boolean(item.completed),
        emoji: item.emoji || '📺',
        createdAt: item.createdAt || item.created_at || new Date().toISOString(),
      }));
    } catch (err) {
      console.error('[JsonAdapter] Failed to parse animes JSON:', err);
      return [];
    }
  },

  /**
   * Appends an anime record to the JSON storage collection.
   *
   * Steps:
   * 1. Load current anime records.
   * 2. Construct new anime object with timestamp ID if needed.
   * 3. Prepend new anime to list.
   * 4. Write back JSON string.
   * 5. Return created anime object.
   *
   * @param {Object} animeData - Anime attributes.
   * @returns {Promise<Object>} Added anime record.
   */
  async addAnime(animeData) {
    const current = await this.getAnimes();
    const newAnime = {
      id: animeData.id || Date.now(),
      name: animeData.name.trim(),
      totalEpisodes: Number(animeData.totalEpisodes) || 0,
      watchedEpisodes: Number(animeData.watchedEpisodes) || 0,
      completed: Boolean(animeData.completed),
      emoji: animeData.emoji || '📺',
      createdAt: new Date().toISOString(),
    };

    const updated = [newAnime, ...current];
    writeRaw(JSON.stringify(updated, null, 2));
    return newAnime;
  },

  /**
   * Updates an anime record in the JSON collection.
   *
   * Steps:
   * 1. Load current list of anime records.
   * 2. Map through array, merging updates on matching id.
   * 3. Write updated array back to storage.
   * 4. Return updated anime entity.
   *
   * @param {number|string} id - Record identifier.
   * @param {Object} updates - Updated field properties.
   * @returns {Promise<Object|null>} Updated anime entity.
   */
  async updateAnime(id, updates) {
    const current = await this.getAnimes();
    let updatedItem = null;
    const updated = current.map((anime) => {
      if (String(anime.id) === String(id)) {
        updatedItem = {
          ...anime,
          ...updates,
          totalEpisodes: updates.totalEpisodes !== undefined ? Number(updates.totalEpisodes) : anime.totalEpisodes,
          watchedEpisodes: updates.watchedEpisodes !== undefined ? Number(updates.watchedEpisodes) : anime.watchedEpisodes,
          completed: updates.completed !== undefined ? Boolean(updates.completed) : anime.completed,
          updatedAt: new Date().toISOString(),
        };
        return updatedItem;
      }
      return anime;
    });

    writeRaw(JSON.stringify(updated, null, 2));
    return updatedItem;
  },

  /**
   * Deletes an anime record by identifier from JSON storage.
   *
   * Steps:
   * 1. Load current list of anime records.
   * 2. Filter out record with matching id.
   * 3. Write filtered list back to storage.
   * 4. Return true.
   *
   * @param {number|string} id - Record identifier.
   * @returns {Promise<boolean>} True if deleted.
   */
  async deleteAnime(id) {
    const current = await this.getAnimes();
    const updated = current.filter((anime) => String(anime.id) !== String(id));
    writeRaw(JSON.stringify(updated, null, 2));
    return true;
  },

  /**
   * Overwrites the stored JSON collection with the provided anime records.
   *
   * Steps:
   * 1. Serialize input animes to JSON string.
   * 2. Write to storage.
   *
   * @param {Array<Object>} animes - Anime list to store.
   * @returns {Promise<void>}
   */
  async syncAll(animes) {
    writeRaw(JSON.stringify(animes, null, 2));
  },

  /**
   * Returns raw unparsed JSON string from storage.
   *
   * @returns {string} Raw JSON string.
   */
  getRawJSON() {
    return readRaw() || '[]';
  },
};
