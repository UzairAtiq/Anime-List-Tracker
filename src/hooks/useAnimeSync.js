import { useState, useEffect, useCallback } from 'react';
import { storageManager } from '../lib/storage/storageManager';

export function useAnimeSync() {
  const [animes, setAnimes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [storageState, setStorageState] = useState(storageManager.getState());

  // Subscribe to storage manager changes
  useEffect(() => {
    const unsubscribe = storageManager.subscribe((state) => {
      setStorageState(state);
    });
    return unsubscribe;
  }, []);

  // Load animes using cascading storage manager
  const loadAnimes = useCallback(async () => {
    try {
      setLoading(true);
      const data = await storageManager.getAnimes();
      setAnimes(data);
    } catch (error) {
      console.error('[useAnimeSync] Failed to load animes:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Add anime with guaranteed fallback
  const addAnime = async (animeData) => {
    try {
      setSyncing(true);
      const savedAnime = await storageManager.addAnime(animeData);
      if (savedAnime) {
        setAnimes((prev) => [savedAnime, ...prev.filter((a) => String(a.id) !== String(savedAnime.id))]);
        return savedAnime;
      }
    } catch (error) {
      console.error('[useAnimeSync] Error adding anime:', error);
    } finally {
      setSyncing(false);
    }
  };

  // Update anime with guaranteed fallback
  const updateAnime = async (id, updates) => {
    try {
      setSyncing(true);
      // Optimistic update
      setAnimes((prev) =>
        prev.map((anime) =>
          String(anime.id) === String(id) ? { ...anime, ...updates } : anime
        )
      );

      const updated = await storageManager.updateAnime(id, updates);
      if (updated) {
        setAnimes((prev) =>
          prev.map((anime) =>
            String(anime.id) === String(id) ? { ...anime, ...updated } : anime
          )
        );
      }
    } catch (error) {
      console.error('[useAnimeSync] Error updating anime:', error);
      // Reload on failure
      loadAnimes();
    } finally {
      setSyncing(false);
    }
  };

  // Delete anime with guaranteed fallback
  const deleteAnime = async (id) => {
    try {
      setSyncing(true);
      // Optimistic remove
      setAnimes((prev) => prev.filter((anime) => String(anime.id) !== String(id)));
      await storageManager.deleteAnime(id);
    } catch (error) {
      console.error('[useAnimeSync] Error deleting anime:', error);
      loadAnimes();
    } finally {
      setSyncing(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadAnimes();
  }, [loadAnimes]);

  return {
    animes,
    loading,
    syncing,
    storageState,
    addAnime,
    updateAnime,
    deleteAnime,
    refreshAnimes: loadAnimes,
  };
}
