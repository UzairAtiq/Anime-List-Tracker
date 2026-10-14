/** @fileoverview Renders a retro animated placeholder view when the anime list is empty. */

import { motion } from 'framer-motion';

/**
 * Empty anime list placeholder view.
 *
 * Steps:
 * 1. Render animated container with theme text styling.
 * 2. Render oscillating crescent moon emoji with rotation and scaling keyframes.
 * 3. Render "List Empty" header and "Add anime to continue" subtext.
 *
 * @param {Object} props - Component properties.
 * @param {Object} props.theme - Active UI theme object.
 * @returns {JSX.Element} Empty list placeholder view.
 */
export default function AnimeEmptyState({ theme }) {
  return (
    <motion.div
      className="text-center py-20"
      style={{ color: theme.textColor }}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        className="text-6xl mb-4"
        animate={{
          rotate: [0, 10, -10, 10, 0],
          scale: [1, 1.1, 1, 1.1, 1],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          repeatDelay: 1,
        }}
      >
        🌙
      </motion.div>
      <motion.p
        className="text-2xl uppercase tracking-wide font-black mb-2"
        style={{ color: theme.textColor }}
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        List Empty
      </motion.p>
      <motion.p
        className="text-sm uppercase tracking-wide font-black opacity-80"
        style={{ color: theme.textColor }}
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 0.8 }}
        transition={{ delay: 0.3 }}
      >
        Add anime to continue
      </motion.p>
    </motion.div>
  );
}
