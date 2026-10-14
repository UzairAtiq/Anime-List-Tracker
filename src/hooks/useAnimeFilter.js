/** @fileoverview Provides a custom React hook for filtering an anime collection by search query. */

import { useState, useMemo } from 'react';

/**
 * Custom hook to manage anime search query state and filtered results.
 *
 * Steps:
 * 1. Maintain local searchQuery state string.
 * 2. In useMemo, filter the provided animes list case-insensitively by name.
 * 3. Return the query string, query updater, and filtered anime collection.
 *
 * @param {Array<Object>} animes - Source collection of anime records.
 * @returns {{ searchQuery: string, setSearchQuery: (query: string) => void, filteredAnimes: Array<Object> }} Filter state and computed list.
 */
export function useAnimeFilter(animes = []) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredAnimes = useMemo(() => {
    const trimmed = searchQuery.trim().toLowerCase();
    if (!trimmed) return animes;
    return animes.filter((anime) =>
      (anime?.name || '').toLowerCase().includes(trimmed)
    );
  }, [animes, searchQuery]);

  return {
    searchQuery,
    setSearchQuery,
    filteredAnimes,
  };
}
