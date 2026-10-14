/** @fileoverview Tier 1 storage adapter communicating with remote Supabase PostgreSQL cloud database. */

import { supabase, supabaseUrl } from '../../supabaseClient';

const WORKSPACE_ID = 'my_anime_list';
const TIMEOUT_MS = 3000;

/**
 * Executes a promise raced against a timeout timer to prevent indefinite hanging.
 *
 * Steps:
 * 1. Create a timeout promise that rejects after specified milliseconds.
 * 2. Return Promise.race between the target promise and timeout.
 *
 * @param {Promise<any>} promise - Asynchronous operation to bound.
 * @param {number} [ms=3000] - Timeout threshold in milliseconds.
 * @param {string} [operation='Supabase operation'] - Descriptive label for timeout error.
 * @returns {Promise<any>} Result of the input promise.
 * @throws {Error} If execution exceeds the ms threshold.
 */
function withTimeout(promise, ms = TIMEOUT_MS, operation = 'Supabase operation') {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`${operation} timed out after ${ms}ms`)), ms);
    }),
  ]);
}

/**
 * Supabase storage adapter object implementing the standard storage interface.
 */
export const supabaseAdapter = {
  name: 'supabase',
  displayName: 'Supabase (Cloud)',

  /**
   * Evaluates whether Supabase database connection and table are reachable.
   *
   * Steps:
   * 1. Check if supabaseUrl and client exist.
   * 2. Query animes table with limit 1 within 2500ms timeout.
   * 3. Return true if query succeeds without error, false otherwise.
   *
   * @returns {Promise<boolean>} True if Supabase is healthy.
   * @throws {never}
   */
  async isHealthy() {
    try {
      if (!supabaseUrl || !supabase) return false;
      const test = supabase.from('animes').select('id').limit(1);
      const { error } = await withTimeout(test, 2500, 'Supabase health check');
      return !error;
    } catch {
      return false;
    }
  },

  /**
   * Retrieves all anime records for the workspace from Supabase.
   *
   * Steps:
   * 1. Query animes matching device_id ordered descending by created_at.
   * 2. Throw error if response contains an error.
   * 3. Map database columns to standardized application anime entity schema.
   *
   * @returns {Promise<Array<Object>>} List of anime objects.
   * @throws {Error} If network request fails or times out.
   */
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

  /**
   * Inserts a new anime record into Supabase.
   *
   * Steps:
   * 1. Format payload matching Supabase snake_case schema with workspace ID.
   * 2. Execute insert query and select single created row within timeout.
   * 3. Return formatted anime entity object.
   *
   * @param {Object} animeData - Anime attributes.
   * @returns {Promise<Object>} Persisted anime object.
   * @throws {Error} If insertion fails or times out.
   */
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

  /**
   * Updates an existing anime record in Supabase.
   *
   * Steps:
   * 1. Prepare partial updates payload mapping camelCase fields to snake_case.
   * 2. Execute update query on matching id within timeout.
   * 3. Return formatted updated entity.
   *
   * @param {number|string} id - Record identifier.
   * @param {Object} updates - Updated field properties.
   * @returns {Promise<Object>} Updated anime object.
   * @throws {Error} If update fails or times out.
   */
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

  /**
   * Deletes an anime record by identifier in Supabase.
   *
   * Steps:
   * 1. Execute delete query on matching id within timeout.
   * 2. Throw error if operation fails.
   * 3. Return true.
   *
   * @param {number|string} id - Record identifier.
   * @returns {Promise<boolean>} True if deleted.
   * @throws {Error} If deletion fails or times out.
   */
  async deleteAnime(id) {
    const query = supabase.from('animes').delete().eq('id', id);
    const { error } = await withTimeout(query, TIMEOUT_MS, 'Deleting anime from Supabase');
    if (error) throw error;
    return true;
  },
};
