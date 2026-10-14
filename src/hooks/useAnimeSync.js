/** @fileoverview React hook bridging UI components to the StorageManager multi-tier persistence engine. */

import { useState, useEffect, useCallback } from 'react';
import { storageManager } from '../lib/storage/storageManager';

/**
 * Custom hook providing reactive anime records state and CRUD operations via StorageManager.
 *
 * Steps:
 * 1. Maintain local state for animes collection, loading status, syncing flag, and storage engine state.
 * 2. Subscribe to StorageManager state notifications to reflect live tier status.
 * 3. On mount, load initial anime records across the storage cascade.
 * 4. Provide addAnime, updateAnime, and deleteAnime functions with optimistic state updates.
 * 5. Return state and control handlers.
 *
 * @returns {{ animes: Array<Object>, loading: boolean, syncing: boolean, storageState: Object, addAnime: (data: Object) => Promise<Object|undefined>, updateAnime: (id: number|string, updates: Object) => Promise<void>, deleteAnime: (id: number|string) => Promise<void>, refreshAnimes: () => Promise<void> }} Anime state and operations.
 */
export function useAnimeSync() {
  const [animes, setAnimes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [storageState, setStorageState] = useState(storageManager.getState());

  useEffect(() => {
    const unsubscribe = storageManager.subscribe((state) => {
      setStorageState(state);
    });
    return unsubscribe;
  }, []);

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

  const updateAnime = async (id, updates) => {
    try {
      setSyncing(true);
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
      loadAnimes();
    } finally {
      setSyncing(false);
    }
  };

  const deleteAnime = async (id) => {
    try {
      setSyncing(true);
      setAnimes((prev) => prev.filter((anime) => String(anime.id) !== String(id)));
      await storageManager.deleteAnime(id);
    } catch (error) {
      console.error('[useAnimeSync] Error deleting anime:', error);
      loadAnimes();
    } finally {
      setSyncing(false);
    }
  };

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
