/** @fileoverview Provides pure validation and sanitization functions for anime form submissions. */

/**
 * Validates anime form input data according to business rules.
 *
 * Steps:
 * 1. Initialize an empty errors dictionary.
 * 2. Validate that the anime name exists and contains non-whitespace characters.
 * 3. If both total episodes and watched episodes are provided, parse and compare them.
 * 4. Add an error if watched episodes exceeds total episodes.
 * 5. Return an object with validation flag and error mapping.
 *
 * @param {Object} formData - Form input values.
 * @param {string} [formData.name] - The name of the anime.
 * @param {string|number} [formData.totalEpisodes] - Total episodes count.
 * @param {string|number} [formData.watchedEpisodes] - Watched episodes count.
 * @returns {{ isValid: boolean, errors: Record<string, string> }} Validation outcome and error dictionary.
 * @throws {never} Pure function, does not throw.
 */
export function validateAnimeForm(formData) {
  const errors = {};

  const trimmedName = (formData?.name || '').trim();
  if (!trimmedName) {
    errors.name = 'Name required';
  }

  if (formData?.totalEpisodes && formData?.watchedEpisodes) {
    const total = parseInt(formData.totalEpisodes, 10);
    const watched = parseInt(formData.watchedEpisodes, 10);
    if (!Number.isNaN(total) && !Number.isNaN(watched) && watched > total) {
      errors.watchedEpisodes = 'Cannot exceed total';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Normalizes and sanitizes anime form data before persistence.
 *
 * Steps:
 * 1. Trim leading and trailing whitespace from the anime name.
 * 2. Convert totalEpisodes to integer, defaulting to 0 if invalid.
 * 3. Convert watchedEpisodes to integer, defaulting to 0 if invalid.
 * 4. Ensure completed is explicitly boolean.
 * 5. Return the sanitized data payload.
 *
 * @param {Object} formData - Raw form data.
 * @param {string} formData.name - Anime title.
 * @param {string|number} [formData.totalEpisodes] - Raw total episodes.
 * @param {string|number} [formData.watchedEpisodes] - Raw watched episodes.
 * @param {boolean} [formData.completed] - Completion state.
 * @returns {{ name: string, totalEpisodes: number, watchedEpisodes: number, completed: boolean }} Sanitized anime data.
 * @throws {never} Pure function, does not throw.
 */
export function sanitizeAnimeInput(formData) {
  return {
    name: (formData.name || '').trim(),
    totalEpisodes: parseInt(formData.totalEpisodes, 10) || 0,
    watchedEpisodes: parseInt(formData.watchedEpisodes, 10) || 0,
    completed: Boolean(formData.completed),
  };
}
