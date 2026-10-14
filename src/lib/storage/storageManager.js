// Multi-tier Database Storage Manager
// Cascading fallback architecture: Supabase (Cloud) -> SQLite (Local WASM) -> JSON (Local Store)

import { supabaseStorage } from './supabaseStorage';
import { sqliteStorage } from './sqliteStorage';
import { jsonStorage } from './jsonStorage';

class StorageManager {
  constructor() {
    this.activeTier = null; // 'supabase' | 'sqlite' | 'json'
    this.tierStatuses = {
      supabase: { status: 'pending', error: null },
      sqlite: { status: 'pending', error: null },
      json: { status: 'ready', error: null },
    };
    this.listeners = new Set();
  }

  subscribe(listener) {
    this.listeners.add(listener);
    // Call immediately with current state
    listener(this.getState());
    return () => this.listeners.delete(listener);
  }

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

  getState() {
    return {
      activeTier: this.activeTier,
      activeTierName: this.getTierDisplayName(this.activeTier),
      tierStatuses: { ...this.tierStatuses },
    };
  }

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

  // Background mirror helper: keeps local fallbacks in sync with whatever data is loaded/modified
  async mirrorToFallbacks(operation, ...args) {
    // Mirror to SQLite if active tier was Supabase
    if (this.activeTier === 'supabase') {
      try {
        if (operation === 'add') {
          await sqliteStorage.addAnime(args[0]);
        } else if (operation === 'update') {
          await sqliteStorage.updateAnime(args[0], args[1]);
        } else if (operation === 'delete') {
          await sqliteStorage.deleteAnime(args[0]);
        } else if (operation === 'syncAll') {
          await sqliteStorage.syncAll(args[0]);
        }
      } catch (e) {
        console.warn('[StorageManager] Mirror to SQLite skipped:', e.message);
      }
    }

    // Always mirror to JSON fallback
    try {
      if (operation === 'add') {
        await jsonStorage.addAnime(args[0]);
      } else if (operation === 'update') {
        await jsonStorage.updateAnime(args[0], args[1]);
      } else if (operation === 'delete') {
        await jsonStorage.deleteAnime(args[0]);
      } else if (operation === 'syncAll') {
        await jsonStorage.syncAll(args[0]);
      }
    } catch (e) {
      console.warn('[StorageManager] Mirror to JSON skipped:', e.message);
    }
  }

  async getAnimes() {
    // 1. Try Supabase
    try {
      console.log('[StorageManager] Attempting Tier 1: Supabase...');
      const animes = await supabaseStorage.getAnimes();
      this.activeTier = 'supabase';
      this.tierStatuses.supabase = { status: 'connected', error: null };
      this.notify();
      console.log(`[StorageManager] Supabase connected successfully (${animes.length} items).`);
      // Background mirror to SQLite & JSON
      this.mirrorToFallbacks('syncAll', animes);
      return animes;
    } catch (supabaseError) {
      const errorMsg = supabaseError?.message || 'Unreachable or failed connection';
      console.warn('[StorageManager] Tier 1 (Supabase) failed:', errorMsg);
      this.tierStatuses.supabase = { status: 'failed', error: errorMsg };
    }

    // 2. Try SQLite
    try {
      console.log('[StorageManager] Falling back to Tier 2: SQLite (WASM)...');
      const animes = await sqliteStorage.getAnimes();
      this.activeTier = 'sqlite';
      this.tierStatuses.sqlite = { status: 'connected', error: null };
      this.notify();
      console.log(`[StorageManager] SQLite active (${animes.length} items).`);

      // If SQLite is empty, check if JSON fallback has data from previous sessions to seed SQLite
      if (animes.length === 0) {
        const jsonAnimes = await jsonStorage.getAnimes();
        if (jsonAnimes.length > 0) {
          console.log(`[StorageManager] Seeding SQLite from existing JSON store (${jsonAnimes.length} items)...`);
          await sqliteStorage.syncAll(jsonAnimes);
          return jsonAnimes;
        }
      }

      // Background mirror to JSON
      this.mirrorToFallbacks('syncAll', animes);
      return animes;
    } catch (sqliteError) {
      const errorMsg = sqliteError?.message || 'Failed to initialize SQLite';
      console.warn('[StorageManager] Tier 2 (SQLite) failed:', errorMsg);
      this.tierStatuses.sqlite = { status: 'failed', error: errorMsg };
    }

    // 3. Fallback to JSON
    console.log('[StorageManager] Falling back to Tier 3: JSON Storage...');
    try {
      const animes = await jsonStorage.getAnimes();
      this.activeTier = 'json';
      this.tierStatuses.json = { status: 'connected', error: null };
      this.notify();
      console.log(`[StorageManager] JSON Storage active (${animes.length} items).`);
      return animes;
    } catch (jsonError) {
      console.error('[StorageManager] Critical error in JSON storage:', jsonError);
      this.activeTier = 'json';
      this.notify();
      return [];
    }
  }

  async addAnime(animeData) {
    // Tier 1: Supabase
    if (this.activeTier === 'supabase' || !this.activeTier) {
      try {
        const added = await supabaseStorage.addAnime(animeData);
        this.activeTier = 'supabase';
        this.tierStatuses.supabase = { status: 'connected', error: null };
        this.notify();
        this.mirrorToFallbacks('add', added);
        return added;
      } catch (err) {
        console.warn('[StorageManager] Supabase addAnime failed, falling back to SQLite:', err.message);
        this.tierStatuses.supabase = { status: 'failed', error: err.message };
        this.activeTier = 'sqlite';
      }
    }

    // Tier 2: SQLite
    if (this.activeTier === 'sqlite') {
      try {
        const added = await sqliteStorage.addAnime(animeData);
        this.activeTier = 'sqlite';
        this.tierStatuses.sqlite = { status: 'connected', error: null };
        this.notify();
        this.mirrorToFallbacks('add', added);
        return added;
      } catch (err) {
        console.warn('[StorageManager] SQLite addAnime failed, falling back to JSON:', err.message);
        this.tierStatuses.sqlite = { status: 'failed', error: err.message };
        this.activeTier = 'json';
      }
    }

    // Tier 3: JSON
    const added = await jsonStorage.addAnime(animeData);
    this.activeTier = 'json';
    this.notify();
    return added;
  }

  async updateAnime(id, updates) {
    if (this.activeTier === 'supabase') {
      try {
        const updated = await supabaseStorage.updateAnime(id, updates);
        this.mirrorToFallbacks('update', id, updates);
        return updated;
      } catch (err) {
        console.warn('[StorageManager] Supabase updateAnime failed, degrading to SQLite:', err.message);
        this.tierStatuses.supabase = { status: 'failed', error: err.message };
        this.activeTier = 'sqlite';
      }
    }

    if (this.activeTier === 'sqlite') {
      try {
        const updated = await sqliteStorage.updateAnime(id, updates);
        this.mirrorToFallbacks('update', id, updates);
        return updated;
      } catch (err) {
        console.warn('[StorageManager] SQLite updateAnime failed, degrading to JSON:', err.message);
        this.tierStatuses.sqlite = { status: 'failed', error: err.message };
        this.activeTier = 'json';
      }
    }

    const updated = await jsonStorage.updateAnime(id, updates);
    this.activeTier = 'json';
    this.notify();
    return updated;
  }

  async deleteAnime(id) {
    if (this.activeTier === 'supabase') {
      try {
        await supabaseStorage.deleteAnime(id);
        this.mirrorToFallbacks('delete', id);
        return true;
      } catch (err) {
        console.warn('[StorageManager] Supabase deleteAnime failed, degrading to SQLite:', err.message);
        this.tierStatuses.supabase = { status: 'failed', error: err.message };
        this.activeTier = 'sqlite';
      }
    }

    if (this.activeTier === 'sqlite') {
      try {
        await sqliteStorage.deleteAnime(id);
        this.mirrorToFallbacks('delete', id);
        return true;
      } catch (err) {
        console.warn('[StorageManager] SQLite deleteAnime failed, degrading to JSON:', err.message);
        this.tierStatuses.sqlite = { status: 'failed', error: err.message };
        this.activeTier = 'json';
      }
    }

    await jsonStorage.deleteAnime(id);
    this.activeTier = 'json';
    this.notify();
    return true;
  }
}

export const storageManager = new StorageManager();
