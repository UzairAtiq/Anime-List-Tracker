/** @fileoverview Renders a floating retro indicator badge when background storage synchronization is active. */

import { motion, AnimatePresence } from 'framer-motion';

/**
 * Floating badge indicating background database synchronization.
 *
 * Steps:
 * 1. Conditionally render within AnimatePresence when syncing is true.
 * 2. Position badge at bottom-right of viewport with retro border.
 * 3. Render rotating lightning bolt icon and "Syncing..." text.
 *
 * @param {Object} props - Component properties.
 * @param {boolean} props.syncing - Active sync state.
 * @param {Object} props.theme - Active UI theme object.
 * @returns {JSX.Element} Sync indicator badge.
 */
export default function SyncIndicator({ syncing, theme }) {
  return (
    <AnimatePresence>
      {syncing && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className="fixed bottom-4 right-4 z-50 border-2 px-4 py-2 flex items-center gap-2"
          style={{
            backgroundColor: theme.bg,
            borderColor: theme.borderColor,
            color: theme.textColor,
          }}
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="text-xl"
          >
            ⚡
          </motion.div>
          <span className="font-black uppercase tracking-wide text-xs">Syncing...</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
