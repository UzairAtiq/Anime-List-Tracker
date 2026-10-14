/** @fileoverview Renders the top terminal header with application title, theme controls, and database tier bar. */

import { motion } from 'framer-motion';
import ThemeSwitcher from '../theme/ThemeSwitcher';
import StorageTierBar from './StorageTierBar';

/**
 * Terminal application header component.
 *
 * Steps:
 * 1. Render animated header container with border styling.
 * 2. Render title with rotating television emoji.
 * 3. Mount ThemeSwitcher controls.
 * 4. Mount StorageTierBar status bar and export button.
 * 5. Render horizontal divider line.
 *
 * @param {Object} props - Component properties.
 * @param {Object} props.theme - Active UI theme object.
 * @param {Object} props.storageState - StorageManager state snapshot.
 * @param {Function} props.onExportJSON - Handler for exporting data to JSON file.
 * @returns {JSX.Element} Terminal header component.
 */
export default function Header({ theme, storageState, onExportJSON }) {
  return (
    <motion.header
      className="mb-6 sm:mb-8 border-2 p-3 sm:p-4"
      style={{ borderColor: theme.borderColor }}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <div className="flex items-center justify-between mb-3 flex-wrap gap-3 sm:gap-4">
        <motion.div
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <h1
            className="text-2xl sm:text-4xl font-black uppercase tracking-wide mb-2 flex items-center gap-2 sm:gap-3"
            style={{ color: theme.textColor }}
          >
            <motion.span
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            >
              📺
            </motion.span>
            Anime Tracker
          </h1>
        </motion.div>
        <motion.div
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <ThemeSwitcher />
        </motion.div>
      </div>

      <StorageTierBar
        storageState={storageState}
        theme={theme}
        onExportJSON={onExportJSON}
      />

      <motion.div
        className="h-px border-t-2 mt-2"
        style={{ borderColor: theme.borderColor }}
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ delay: 0.5, duration: 0.4 }}
      />
    </motion.header>
  );
}
