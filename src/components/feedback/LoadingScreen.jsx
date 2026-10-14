/** @fileoverview Renders a fullscreen retro animated loading overlay when data is being initialized. */

import { motion, AnimatePresence } from 'framer-motion';

/**
 * Fullscreen retro loading screen displayed while storage engine hydrates data.
 *
 * Steps:
 * 1. Check if loading flag is true.
 * 2. If loading, render fullscreen backdrop styled with theme background.
 * 3. Render rotating television icon with 360-degree continuous animation.
 * 4. Display retro uppercase loading message.
 *
 * @param {Object} props - Component properties.
 * @param {boolean} props.loading - Whether the application is loading data.
 * @param {Object} props.theme - Active UI theme object.
 * @returns {JSX.Element|null} Loading overlay or null.
 */
export default function LoadingScreen({ loading, theme }) {
  if (!loading) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{ backgroundColor: theme.bg }}
    >
      <motion.div
        className="text-center"
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <motion.div
          className="text-6xl mb-4"
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        >
          📺
        </motion.div>
        <p
          className="font-black uppercase tracking-wide text-xl"
          style={{ color: theme.textColor }}
        >
          Loading your anime...
        </p>
      </motion.div>
    </div>
  );
}
