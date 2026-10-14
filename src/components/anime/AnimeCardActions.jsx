/** @fileoverview Renders interactive action controls for an anime card (complete, edit, delete). */

import { motion } from 'framer-motion';
import { Button } from 'pixel-retroui';
import { useDeleteConfirm } from '../../hooks/useDeleteConfirm';

/**
 * Action button controls for an anime card.
 *
 * Steps:
 * 1. Initialize 2-step delete confirmation state using useDeleteConfirm hook.
 * 2. Render completion toggle button with checkmark icon when completed.
 * 3. Render Edit button to trigger edit modal.
 * 4. Render Delete button that requires double confirmation before executing onDelete.
 *
 * @param {Object} props - Component properties.
 * @param {Object} props.anime - Anime entity record.
 * @param {Object} props.theme - Active UI theme object.
 * @param {Function} props.onToggleComplete - Completion toggle callback.
 * @param {Function} props.onEdit - Edit trigger callback.
 * @param {Function} props.onDelete - Deletion callback.
 * @returns {JSX.Element} Card actions element.
 */
export default function AnimeCardActions({ anime, theme, onToggleComplete, onEdit, onDelete }) {
  const { isConfirming, requestDelete } = useDeleteConfirm(() => onDelete(anime.id));

  return (
    <div className="flex items-center gap-2">
      {/* Toggle Complete Button */}
      <motion.button
        type="button"
        onClick={() => onToggleComplete(anime.id)}
        className="w-8 h-8 flex items-center justify-center transition-all border-2 flex-shrink-0"
        style={{
          backgroundColor: anime.completed ? theme.borderColor : theme.bg,
          color: anime.completed ? theme.bg : theme.textColor,
          borderColor: theme.borderColor,
          borderWidth: '2px',
        }}
        whileHover={{ scale: 1.1, rotate: 5 }}
        whileTap={{ scale: 0.9 }}
        aria-label={anime.completed ? 'Mark as incomplete' : 'Mark as complete'}
      >
        {anime.completed && (
          <motion.span
            className="text-sm font-black"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 500 }}
          >
            ✓
          </motion.span>
        )}
      </motion.button>

      {/* Edit Button */}
      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
        <Button
          onClick={() => onEdit(anime)}
          bg={theme.bg}
          textColor={theme.textColor}
          borderColor={theme.borderColor}
          shadow={theme.borderColor}
          className="px-2 sm:px-3 py-1 text-xs uppercase font-black border-2 whitespace-nowrap"
        >
          Edit
        </Button>
      </motion.div>

      {/* Delete Button with 2-step confirmation */}
      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
        <Button
          onClick={requestDelete}
          bg={theme.bg}
          textColor={isConfirming ? '#ff0000' : theme.textColor}
          borderColor={isConfirming ? '#ff0000' : theme.borderColor}
          shadow={isConfirming ? '#ff0000' : theme.borderColor}
          className="px-2 sm:px-3 py-1 text-xs uppercase font-black border-2 whitespace-nowrap"
        >
          {isConfirming ? '⚠ Yes' : 'Delete'}
        </Button>
      </motion.div>
    </div>
  );
}
