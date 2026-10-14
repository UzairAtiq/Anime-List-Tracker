/** @fileoverview Renders a retro search bar input and result counter for anime filtering. */

import { motion } from 'framer-motion';
import { Input } from 'pixel-retroui';

/**
 * Search input and result counter component.
 *
 * Steps:
 * 1. Render search label with magnifying glass icon.
 * 2. Render pixel-retroui text Input connected to searchQuery.
 * 3. Conditionally display active result count label when a search query is present.
 * 4. Render horizontal divider line.
 *
 * @param {Object} props - Component properties.
 * @param {string} props.searchQuery - Current search query text.
 * @param {Function} props.setSearchQuery - Query update function.
 * @param {number} props.totalCount - Total number of animes in collection.
 * @param {number} props.filteredCount - Number of matching animes after filter.
 * @param {Object} props.theme - Active UI theme object.
 * @returns {JSX.Element} Search bar component.
 */
export default function AnimeSearchBar({
  searchQuery,
  setSearchQuery,
  totalCount,
  filteredCount,
  theme,
}) {
  return (
    <div>
      <div className="mb-6">
        <label
          className="block text-sm uppercase tracking-wide mb-2 font-black"
          style={{ color: theme.textColor }}
        >
          🔍 Search Anime
        </label>
        <Input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Type to search..."
          bg={theme.bg}
          textColor={theme.textColor}
          borderColor={theme.borderColor}
          className="w-full px-4 py-3 uppercase tracking-wide font-mono text-sm border-2 font-black"
        />
      </div>

      {searchQuery ? (
        <motion.div
          className="mb-4 text-xs uppercase tracking-wide font-black opacity-80"
          style={{ color: theme.textColor }}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 0.8, y: 0 }}
        >
          Results: {filteredCount} / {totalCount}
        </motion.div>
      ) : null}

      <motion.div
        className="mb-4 h-px border-t-2"
        style={{ borderColor: theme.borderColor }}
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ delay: 0.2, duration: 0.3 }}
      />
    </div>
  );
}
