/** @fileoverview Renders a retro placeholder view when a search query matches zero anime records. */

import { motion } from 'framer-motion';

/**
 * No search match placeholder view.
 *
 * Steps:
 * 1. Render animated container with theme text styling.
 * 2. Render continuously rotating magnifying glass icon.
 * 3. Render "No Match Found" title and "Try different search" instruction.
 *
 * @param {Object} props - Component properties.
 * @param {Object} props.theme - Active UI theme object.
 * @returns {JSX.Element} No match placeholder view.
 */
export default function AnimeNoMatchState({ theme }) {
  return (
    <motion.div
      className="text-center py-12"
      style={{ color: theme.textColor }}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
    >
      <motion.div
        animate={{ rotate: [0, 360] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        className="text-4xl mb-4"
      >
        🔍
      </motion.div>
      <p
        className="text-xl uppercase tracking-wide font-black mb-2"
        style={{ color: theme.textColor }}
      >
        No Match Found
      </p>
      <p
        className="text-sm uppercase tracking-wide font-black opacity-80"
        style={{ color: theme.textColor }}
      >
        Try different search
      </p>
    </motion.div>
  );
}
