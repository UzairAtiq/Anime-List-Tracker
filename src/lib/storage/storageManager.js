/** @fileoverview Multi-tier storage manager coordinating graceful fallback between Supabase, SQLite WASM, and JSON. */

import { supabaseAdapter } from './adapters/supabaseAdapter';
import { sqliteAdapter } from './adapters/sqliteAdapter';
import { jsonAdapter } from './adapters/jsonAdapter';

/**
 * StorageManager orchestrates data access across three tiers:
 * Tier 1: Supabase (Cloud PostgreSQL)
 * Tier 2: SQLite (Local WebAssembly + IndexedDB)
 * Tier 3: JSON (Local Storage / In-memory)
 */
class StorageManager {
  /**
   * Initializes the storage manager state and listeners.
   */
  constructor() {
    this.activeTier = null;
    this.tierStatuses = {
      supabase: { status: 'pending', error: null },
      sqlite: { status: 'pending', error: null },
      json: { status: 'ready', error: null },
    };
    this.listeners = new Set();
  }

  /**
   * Registers a subscriber callback for storage manager state changes.
   *
   * Steps:
   * 1. Add listener function to internal set.
   * 2. Immediately invoke listener with current state snapshot.
   * 3. Return an unsubscribe cleanup function.
   *
   * @param {Function} listener - Callback invoked on state changes.
   * @returns {Function} Unsubscribe function.
   */
  subscribe(listener) {
    this.listeners.add(listener);
    listener(this.getState());
    return () => this.listeners.delete(listener);
  }

  /**
   * Notifies all active subscribers of the latest state.
   */
  notify() {
    const state = this.getState();
    this.listeners.forEach((listener) => {
      try {
        listener(state);
      } catch (err) {
        console.error('[StorageManager] Listener error:', err);
      }
    });
  }

  /**
   * Returns a snapshot of the current storage manager state.
   *
   * @returns {{ activeTier: string|null, activeTierName: string, tierStatuses: Object }} State snapshot.
   */
  getState() {
    return {
      activeTier: this.activeTier,
      activeTierName: this.getTierDisplayName(this.activeTier),
      tierStatuses: { ...this.tierStatuses },
    };
  }

  /**
   * Resolves a human-readable display label for a given storage tier.
   *
   * @param {string|null} tier - Tier identifier ('supabase' | 'sqlite' | 'json').
   * @returns {string} Human-readable tier name.
   */
  getTierDisplayName(tier) {
    switch (tier) {
      case 'supabase':
        return 'Supabase (Cloud)';
      case 'sqlite':
        return 'SQLite (Local DB)';
      case 'json':
        return 'JSON (Local Store)';
      default:
        return 'Initializing...';
    }
  }

  /**
   * Synchronizes operations to lower tiers in the background to maintain live mirrors.
   *
   * Steps:
   * 1. If active tier is Supabase, mirror change to SQLite.
   * 2. Always mirror change to JSON fallback store.
   *
   * @param {string} operation - CRUD operation ('add' | 'update' | 'delete' | 'syncAll').
   * @param {...any} args - Operation arguments.
   * @returns {Promise<void>}
   */
  async mirrorToFallbacks(operation, ...args) {
    if (this.activeTier === 'supabase') {
      try {
        if (operation === 'add') {
          await sqliteAdapter.addAnime(args[0]);
        } else if (operation === 'update') {
          await sqliteAdapter.updateAnime(args[0], args[1]);
        } else if (operation === 'delete') {
          await sqliteAdapter.deleteAnime(args[0]);
        } else if (operation === 'syncAll') {
          await sqliteAdapter.syncAll(args[0]);
        }
      } catch (e) {
        console.warn('[StorageManager] SQLite mirror skipped:', e.message);
      }
    }

    try {
      if (operation === 'add') {
        await jsonAdapter.addAnime(args[0]);
      } else if (operation === 'update') {
        await jsonAdapter.updateAnime(args[0], args[1]);
      } else if (operation === 'delete') {
        await jsonAdapter.deleteAnime(args[0]);
      } else if (operation === 'syncAll') {
        await jsonAdapter.syncAll(args[0]);
      }
    } catch (e) {
      console.warn('[StorageManager] JSON mirror skipped:', e.message);
    }
  }

  /**
   * Retrieves all anime records, evaluating tiers in priority cascade.
   *
   * Steps:
   * 1. Try Supabase; if successful, set activeTier to 'supabase' and mirror to fallbacks.
   * 2. On Supabase failure, record error and fall back to SQLite WASM.
   * 3. If SQLite succeeds, set activeTier to 'sqlite' and mirror to JSON.
   * 4. If SQLite fails, fall back to JSON storage as infallible 3rd tier.
   *
   * @returns {Promise<Array<Object>>} List of anime records.
   */
  async getAnimes() {
    try {
      const animes = await supabaseAdapter.getAnimes();
      this.activeTier = 'supabase';
      this.tierStatuses.supabase = { status: 'connected', error: null };
      this.notify();
      this.mirrorToFallbacks('syncAll', animes);
      return animes;
    } catch (supabaseError) {
      const errorMsg = supabaseError?.message || 'Unreachable or failed connection';
      this.tierStatuses.supabase = { status: 'failed', error: errorMsg };
    }

    try {
      const animes = await sqliteAdapter.getAnimes();
      this.activeTier = 'sqlite';
      this.tierStatuses.sqlite = { status: 'connected', error: null };
      this.notify();

      if (animes.length === 0) {
        const jsonAnimes = await jsonAdapter.getAnimes();
        if (jsonAnimes.length > 0) {
          await sqliteAdapter.syncAll(jsonAnimes);
          return jsonAnimes;
        }
      }

      this.mirrorToFallbacks('syncAll', animes);
      return animes;
    } catch (sqliteError) {
      const errorMsg = sqliteError?.message || 'Failed to initialize SQLite';
      this.tierStatuses.sqlite = { status: 'failed', error: errorMsg };
    }

    try {
      const animes = await jsonAdapter.getAnimes();
      this.activeTier = 'json';
      this.tierStatuses.json = { status: 'connected', error: null };
      this.notify();
      return animes;
    } catch (jsonError) {
      console.error('[StorageManager] Critical error in JSON storage:', jsonError);
      this.activeTier = 'json';
      this.notify();
      return [];
    }
  }

  /**
   * Adds an anime record, executing against the active tier with graceful degradation.
   *
   * Steps:
   * 1. If Supabase is active, try supabaseAdapter.addAnime.
   * 2. On failure, degrade to sqliteAdapter.addAnime.
   * 3. On failure, degrade to jsonAdapter.addAnime.
   * 4. Return created anime object.
   *
   * @param {Object} animeData - Anime attributes.
   * @returns {Promise<Object>} Added anime object.
   */
  async addAnime(animeData) {
    if (this.activeTier === 'supabase' || !this.activeTier) {
      try {
        const added = await supabaseAdapter.addAnime(animeData);
        this.activeTier = 'supabase';
        this.tierStatuses.supabase = { status: 'connected', error: null };
        this.notify();
        this.mirrorToFallbacks('add', added);
        return added;
      } catch (err) {
        this.tierStatuses.supabase = { status: 'failed', error: err.message };
        this.activeTier = 'sqlite';
      }
    }

    if (this.activeTier === 'sqlite') {
      try {
        const added = await sqliteAdapter.addAnime(animeData);
        this.activeTier = 'sqlite';
        this.tierStatuses.sqlite = { status: 'connected', error: null };
        this.notify();
        this.mirrorToFallbacks('add', added);
        return added;
      } catch (err) {
        this.tierStatuses.sqlite = { status: 'failed', error: err.message };
        this.activeTier = 'json';
      }
    }

    const added = await jsonAdapter.addAnime(animeData);
    this.activeTier = 'json';
    this.notify();
    return added;
  }

  /**
   * Updates an anime record, executing against the active tier with fallback degradation.
   *
   * Steps:
   * 1. Try active tier update.
   * 2. Degrade to next tier on failure.
   * 3. Mirror updates to fallbacks.
   * 4. Return updated anime entity.
   *
   * @param {number|string} id - Record identifier.
   * @param {Object} updates - Updated field properties.
   * @returns {Promise<Object|null>} Updated anime entity.
   */
  async updateAnime(id, updates) {
    if (this.activeTier === 'supabase') {
      try {
        const updated = await supabaseAdapter.updateAnime(id, updates);
        this.mirrorToFallbacks('update', id, updates);
        return updated;
      } catch (err) {
        this.tierStatuses.supabase = { status: 'failed', error: err.message };
        this.activeTier = 'sqlite';
      }
    }

    if (this.activeTier === 'sqlite') {
      try {
        const updated = await sqliteAdapter.updateAnime(id, updates);
        this.mirrorToFallbacks('update', id, updates);
        return updated;
      } catch (err) {
        this.tierStatuses.sqlite = { status: 'failed', error: err.message };
        this.activeTier = 'json';
      }
    }

    const updated = await jsonAdapter.updateAnime(id, updates);
    this.activeTier = 'json';
    this.notify();
    return updated;
  }

  /**
   * Deletes an anime record, executing against active tier with fallback degradation.
   *
   * Steps:
   * 1. Try active tier deletion.
   * 2. Degrade to next tier on failure.
   * 3. Mirror deletion to fallbacks.
   * 4. Return true.
   *
   * @param {number|string} id - Record identifier.
   * @returns {Promise<boolean>} True if deleted.
   */
  async deleteAnime(id) {
    if (this.activeTier === 'supabase') {
      try {
        await supabaseAdapter.deleteAnime(id);
        this.mirrorToFallbacks('delete', id);
        return true;
      } catch (err) {
        this.tierStatuses.supabase = { status: 'failed', error: err.message };
        this.activeTier = 'sqlite';
      }
    }

    if (this.activeTier === 'sqlite') {
      try {
        await sqliteAdapter.deleteAnime(id);
        this.mirrorToFallbacks('delete', id);
        return true;
      } catch (err) {
        this.tierStatuses.sqlite = { status: 'failed', error: err.message };
        this.activeTier = 'json';
      }
    }

    await jsonAdapter.deleteAnime(id);
    this.activeTier = 'json';
    this.notify();
    return true;
  }
}

export const storageManager = new StorageManager();
