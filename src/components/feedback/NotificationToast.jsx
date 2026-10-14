/** @fileoverview Renders an animated retro toast overlay for user action feedback. */

import { motion, AnimatePresence } from 'framer-motion';

/**
 * Renders an animated notification toast banner at the top of the viewport.
 *
 * Steps:
 * 1. Conditionally render if notification object is present within AnimatePresence.
 * 2. Animate entrance from top of screen with opacity and vertical slide.
 * 3. Color border based on notification type ('error' vs default theme border).
 * 4. Display status symbol prefix ('✓', '✗', or 'ℹ') followed by message text.
 *
 * @param {Object} props - Component properties.
 * @param {{ message: string, type: string }|null} props.notification - Active notification payload.
 * @param {Object} props.theme - Active UI theme object.
 * @returns {JSX.Element} Animated toast element.
 */
export default function NotificationToast({ notification, theme }) {
  return (
    <AnimatePresence>
      {notification && (
        <motion.div
          initial={{ opacity: 0, y: -100, x: '-50%' }}
          animate={{ opacity: 1, y: 20 }}
          exit={{ opacity: 0, y: -100 }}
          className="fixed top-0 left-1/2 z-50 border-2 px-6 py-3"
          style={{
            backgroundColor: theme.bg,
            borderColor: notification.type === 'error' ? '#ff0000' : theme.borderColor,
            color: theme.textColor,
          }}
        >
          <span className="font-black uppercase tracking-wide text-sm">
            {notification.type === 'success' && '✓ '}
            {notification.type === 'error' && '✗ '}
            {notification.type === 'info' && 'ℹ '}
            {notification.message}
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
