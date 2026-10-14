/** @fileoverview Renders the terminal application footer displaying tech stack details. */

import { motion } from 'framer-motion';

/**
 * Terminal application footer component.
 *
 * Steps:
 * 1. Render animated top divider line.
 * 2. Render tech stack description text.
 *
 * @param {Object} props - Component properties.
 * @param {Object} props.theme - Active UI theme object.
 * @returns {JSX.Element} Footer component.
 */
export default function Footer({ theme }) {
  return (
    <motion.footer
      className="mt-12 pt-6 text-center text-xs uppercase tracking-wider font-black opacity-60"
      initial={{ opacity: 0 }}
      animate={{ opacity: 0.6 }}
      transition={{ delay: 1 }}
    >
      <motion.div
        className="mb-4 h-px border-t-2"
        style={{ borderColor: theme.borderColor }}
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ delay: 0.9, duration: 0.4 }}
      />
      <p style={{ color: theme.textColor }}>
        React.js • Tailwind • Framer Motion
      </p>
    </motion.footer>
  );
}
