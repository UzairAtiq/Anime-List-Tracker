/** @fileoverview Renders a retro bracket progress bar indicating episode completion percentage. */

import { motion } from 'framer-motion';

/**
 * Retro bracket progress bar component.
 *
 * Steps:
 * 1. Calculate percentage progress bounded between 0% and 100%.
 * 2. Render left bracket indicator.
 * 3. Animate width of progress fill using Framer Motion with theme colors.
 * 4. Render right bracket indicator and percentage text label.
 *
 * @param {Object} props - Component properties.
 * @param {number} props.watchedEpisodes - Count of watched episodes.
 * @param {number} props.totalEpisodes - Total series episode count.
 * @param {Object} props.theme - Active UI theme object.
 * @returns {JSX.Element|null} Progress bar element, or null if totalEpisodes is 0.
 */
export default function AnimeCardProgress({ watchedEpisodes, totalEpisodes, theme }) {
  if (!totalEpisodes || totalEpisodes <= 0) return null;

  const progress = Math.min(100, Math.max(0, (watchedEpisodes / totalEpisodes) * 100));

  return (
    <div className="flex items-center gap-2 w-full sm:w-auto">
      <span className="text-xs font-black" style={{ color: theme.textColor }}>
        [
      </span>
      <div
        className="flex-1 sm:w-24 h-3 overflow-hidden border-2"
        style={{
          backgroundColor: theme.bg,
          borderColor: theme.borderColor,
          borderWidth: '2px',
        }}
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="h-full"
          style={{ backgroundColor: theme.borderColor }}
        />
      </div>
      <span className="text-xs font-black" style={{ color: theme.textColor }}>
        ]
      </span>
      <motion.span
        className="text-xs font-black"
        style={{ color: theme.textColor }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        {Math.round(progress)}%
      </motion.span>
    </div>
  );
}
