/** @fileoverview Renders the anime list container with integrated search filtering and staggered item animations. */

import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';
import { useAnimeFilter } from '../../hooks/useAnimeFilter';
import AnimeCard from './AnimeCard';
import AnimeSearchBar from './AnimeSearchBar';
import AnimeEmptyState from './AnimeEmptyState';
import AnimeNoMatchState from './AnimeNoMatchState';

/**
 * Anime list view component with search filtering and item orchestration.
 *
 * Steps:
 * 1. Filter input animes by search query using useAnimeFilter hook.
 * 2. If the entire collection is empty, render AnimeEmptyState view.
 * 3. Render AnimeSearchBar with active counts.
 * 4. If query matches 0 records, render AnimeNoMatchState.
 * 5. Otherwise, map filtered items into animated AnimeCard components within AnimatePresence.
 *
 * @param {Object} props - Component properties.
 * @param {Array<Object>} props.animes - Source list of anime records.
 * @param {Function} props.onToggleComplete - Completion toggle callback.
 * @param {Function} props.onDelete - Deletion callback.
 * @param {Function} props.onEdit - Edit trigger callback.
 * @returns {JSX.Element} Anime list view.
 */
export default function AnimeList({ animes = [], onToggleComplete, onDelete, onEdit }) {
  const { theme } = useTheme();
  const { searchQuery, setSearchQuery, filteredAnimes } = useAnimeFilter(animes);

  if (animes.length === 0) {
    return <AnimeEmptyState theme={theme} />;
  }

  return (
    <motion.div
      className="border-2 p-4"
      style={{ borderColor: theme.borderColor }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <AnimeSearchBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        totalCount={animes.length}
        filteredCount={filteredAnimes.length}
        theme={theme}
      />

      {filteredAnimes.length === 0 ? (
        <AnimeNoMatchState theme={theme} />
      ) : (
        <div className="space-y-0">
          <AnimatePresence mode="popLayout">
            {filteredAnimes.map((anime, index) => (
              <motion.div
                key={anime.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.05 }}
              >
                <AnimeCard
                  anime={anime}
                  onToggleComplete={onToggleComplete}
                  onDelete={onDelete}
                  onEdit={onEdit}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}
