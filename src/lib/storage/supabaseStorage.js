// Supabase Storage Adapter (Primary Tier)
// Communicates with remote Supabase PostgreSQL with fast timeout detection and graceful degradation.

import { supabase, supabaseUrl } from '../supabase';

const WORKSPACE_ID = 'my_anime_list';
const TIMEOUT_MS = 3000;

function withTimeout(promise, ms = TIMEOUT_MS, operation = 'Supabase operation') {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`${operation} timed out after ${ms}ms`)), ms)
    ),
  ]);
}

export const supabaseStorage = {
  name: 'supabase',
  displayName: 'Supabase (Cloud)',

  async isHealthy() {
    try {
      if (!supabaseUrl || !supabase) return false;
      const test = supabase
        .from('animes')
        .select('id')
        .limit(1);

      const { error } = await withTimeout(test, 2500, 'Supabase health check');
      if (error) {
        console.warn('[SupabaseStorage] Health check failed with error:', error.message);
        return false;
      }
      return true;
    } catch (e) {
      console.warn('[SupabaseStorage] Health check failed:', e.message);
      return false;
    }
  },

  async getAnimes() {
    const query = supabase
      .from('animes')
      .select('*')
      .eq('device_id', WORKSPACE_ID)
      .order('created_at', { ascending: false });

    const { data, error } = await withTimeout(query, TIMEOUT_MS, 'Fetching from Supabase');
    if (error) throw error;
    if (!data) return [];

    return data.map((anime) => ({
      id: anime.id,
      name: anime.name,
      totalEpisodes: Number(anime.total_episodes) || 0,
      watchedEpisodes: Number(anime.watched_episodes) || 0,
      completed: Boolean(anime.completed),
      emoji: anime.emoji || '📺',
      createdAt: anime.created_at || new Date().toISOString(),
    }));
  },

  async addAnime(animeData) {
    const newAnime = {
      name: animeData.name.trim(),
      total_episodes: Number(animeData.totalEpisodes) || 0,
      watched_episodes: Number(animeData.watchedEpisodes) || 0,
      completed: Boolean(animeData.completed),
      emoji: animeData.emoji || '📺',
      device_id: WORKSPACE_ID,
    };

    const query = supabase
      .from('animes')
      .insert([newAnime])
      .select()
      .single();

    const { data, error } = await withTimeout(query, TIMEOUT_MS, 'Adding anime to Supabase');
    if (error) throw error;
    if (!data) throw new Error('No data returned from Supabase insert');

    return {
      id: data.id,
      name: data.name,
      totalEpisodes: Number(data.total_episodes) || 0,
      watchedEpisodes: Number(data.watched_episodes) || 0,
      completed: Boolean(data.completed),
      emoji: data.emoji || '📺',
      createdAt: data.created_at || new Date().toISOString(),
    };
  },

  async updateAnime(id, updates) {
    const payload = {};
    if (updates.name !== undefined) payload.name = updates.name.trim();
    if (updates.totalEpisodes !== undefined) payload.total_episodes = Number(updates.totalEpisodes) || 0;
    if (updates.watchedEpisodes !== undefined) payload.watched_episodes = Number(updates.watchedEpisodes) || 0;
    if (updates.completed !== undefined) payload.completed = Boolean(updates.completed);
    if (updates.emoji !== undefined) payload.emoji = updates.emoji;

    const query = supabase
      .from('animes')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    const { data, error } = await withTimeout(query, TIMEOUT_MS, 'Updating anime in Supabase');
    if (error) throw error;

    return {
      id: data.id,
      name: data.name,
      totalEpisodes: Number(data.total_episodes) || 0,
      watchedEpisodes: Number(data.watched_episodes) || 0,
      completed: Boolean(data.completed),
      emoji: data.emoji,
      createdAt: data.created_at,
    };
  },

  async deleteAnime(id) {
    const query = supabase
      .from('animes')
      .delete()
      .eq('id', id);

    const { error } = await withTimeout(query, TIMEOUT_MS, 'Deleting anime from Supabase');
    if (error) throw error;
    return true;
  },
};
