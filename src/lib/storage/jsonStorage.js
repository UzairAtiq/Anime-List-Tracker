// JSON Storage Adapter (Tertiary Fallback)
// Stores anime data as JSON in localStorage, with an in-memory fallback.

const STORAGE_KEY = 'anime_tracker_json_data';
const LEGACY_STORAGE_KEY = 'animeList';

// In-memory fallback if localStorage is unavailable
let memoryStore = null;

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

function readRaw() {
  if (isLocalStorageAvailable()) {
    const data = window.localStorage.getItem(STORAGE_KEY);
    if (data) return data;
    // Check legacy key
    const legacy = window.localStorage.getItem(LEGACY_STORAGE_KEY);
    if (legacy) {
      window.localStorage.setItem(STORAGE_KEY, legacy);
      return legacy;
    }
    return null;
  }
  return memoryStore;
}

function writeRaw(jsonString) {
  if (isLocalStorageAvailable()) {
    try {
      window.localStorage.setItem(STORAGE_KEY, jsonString);
      window.localStorage.setItem(LEGACY_STORAGE_KEY, jsonString);
    } catch (e) {
      console.warn('[JSONStorage] localStorage write failed, falling back to memory store', e);
      memoryStore = jsonString;
    }
  } else {
    memoryStore = jsonString;
  }
}

export const jsonStorage = {
  name: 'json',
  displayName: 'JSON Storage',

  async isHealthy() {
    return true; // Always healthy as final fallback
  },

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
      console.error('[JSONStorage] Failed to read animes:', err);
      return [];
    }
  },

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

  async deleteAnime(id) {
    const current = await this.getAnimes();
    const updated = current.filter((anime) => String(anime.id) !== String(id));
    writeRaw(JSON.stringify(updated, null, 2));
    return true;
  },

  async syncAll(animes) {
    writeRaw(JSON.stringify(animes, null, 2));
  },

  getRawJSON() {
    return readRaw() || '[]';
  },
};
