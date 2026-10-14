/** @fileoverview Renders a single anime card display item with hover animations and responsive layout. */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from 'pixel-retroui';
import { useTheme } from '../../context/ThemeContext';
import AnimeCardProgress from './AnimeCardProgress';
import AnimeCardActions from './AnimeCardActions';

/**
 * Individual anime card display component.
 *
 * Steps:
 * 1. Retrieve current UI theme from context.
 * 2. Track hover state to apply retro shadow and border effects.
 * 3. Render emoji badge with interactive rotation on hover.
 * 4. Render anime title and completion or progress state.
 * 5. Mount AnimeCardProgress bar and AnimeCardActions buttons.
 *
 * @param {Object} props - Component properties.
 * @param {Object} props.anime - Anime entity record.
 * @param {Function} props.onToggleComplete - Completion toggle callback.
 * @param {Function} props.onDelete - Delete callback.
 * @param {Function} props.onEdit - Edit trigger callback.
 * @returns {JSX.Element} Card component.
 */
export default function AnimeCard({ anime, onToggleComplete, onDelete, onEdit }) {
  const { theme } = useTheme();
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: -100, scale: 0.8 }}
      layout
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 30,
      }}
      className="mb-3"
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      <motion.div
        animate={{
          borderColor: isHovered ? theme.textColor : theme.borderColor,
          boxShadow: isHovered ? `4px 4px 0px ${theme.borderColor}` : 'none',
        }}
        transition={{ duration: 0.2 }}
      >
        <Card
          bg={theme.bg}
          textColor={theme.textColor}
          borderColor={isHovered ? theme.textColor : theme.borderColor}
          shadowColor={undefined}
          className="p-4 border-2"
          style={{
            borderWidth: '2px',
            borderStyle: 'solid',
            backgroundColor: theme.bg,
          }}
        >
          <div className="flex items-center gap-4 flex-col sm:flex-row">
            {/* Anime Emoji Badge */}
            <motion.div
              className="flex-shrink-0 w-12 h-12 flex items-center justify-center text-2xl border-2"
              style={{
                backgroundColor: theme.bg,
                borderColor: theme.borderColor,
                borderWidth: '2px',
              }}
              whileHover={{ scale: 1.2, rotate: [0, -10, 10, -10, 0] }}
              transition={{ duration: 0.5 }}
            >
              {anime.emoji}
            </motion.div>

            {/* Info and Controls */}
            <div className="flex-1 min-w-0 font-mono w-full">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <motion.div
                  className="w-full sm:flex-1 sm:min-w-[200px]"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <span
                    className="text-base sm:text-lg font-black uppercase tracking-wide break-words"
                    style={{ color: theme.textColor }}
                  >
                    {anime.name}
                  </span>
                </motion.div>

                <motion.div
                  className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-6 w-full sm:w-auto"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  {anime.completed ? (
                    <motion.span
                      className="text-sm uppercase tracking-wide font-black"
                      style={{ color: theme.textColor }}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 500 }}
                    >
                      ✨ Completed
                    </motion.span>
                  ) : (
                    <span
                      className="text-sm uppercase tracking-wide font-black"
                      style={{ color: theme.textColor }}
                    >
                      Watched: {anime.watchedEpisodes} / {anime.totalEpisodes || '?'}
                    </span>
                  )}

                  {!anime.completed && (
                    <AnimeCardProgress
                      watchedEpisodes={anime.watchedEpisodes}
                      totalEpisodes={anime.totalEpisodes}
                      theme={theme}
                    />
                  )}

                  <AnimeCardActions
                    anime={anime}
                    theme={theme}
                    onToggleComplete={onToggleComplete}
                    onEdit={onEdit}
                    onDelete={onDelete}
                  />
                </motion.div>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
}
