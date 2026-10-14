/** @fileoverview Main application root component composing terminal layout, feedback, and anime views. */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from 'pixel-retroui';
import { useTheme } from './context/ThemeContext';
import { useAnimeSync } from './hooks/useAnimeSync';
import { useNotification } from './hooks/useNotification';
import { exportAnimeListToJSON } from './lib/exportUtils';
import { getRandomEmoji } from './constants/emojis';
import NotificationToast from './components/feedback/NotificationToast';
import SyncIndicator from './components/feedback/SyncIndicator';
import LoadingScreen from './components/feedback/LoadingScreen';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import AnimeFormModal from './components/anime/AnimeFormModal';
import AnimeList from './components/anime/AnimeList';

/**
 * Root view component of the Anime List Tracker application.
 *
 * Steps:
 * 1. Initialize theme, anime synchronization, and notification hooks.
 * 2. Track currently editing anime record state.
 * 3. Define event handlers for adding, updating, toggling, and deleting anime records.
 * 4. Mount feedback overlays (NotificationToast, SyncIndicator, LoadingScreen).
 * 5. Compose terminal layout Card containing Header, AnimeFormModal, AnimeList, and Footer.
 *
 * @returns {JSX.Element} The composed application view.
 */
function App() {
  const { theme } = useTheme();
  const { animes, loading, syncing, storageState, addAnime, updateAnime, deleteAnime } = useAnimeSync();
  const { notification, showNotification } = useNotification();
  const [editingAnime, setEditingAnime] = useState(null);

  /**
   * Handles user request to download the anime list as a JSON file.
   */
  const handleExportJSON = () => {
    try {
      exportAnimeListToJSON(animes, 'anime_list.json');
      showNotification('Exported anime_list.json!', 'info');
    } catch (err) {
      console.error('[App] Export JSON failed:', err);
      showNotification('Failed to export JSON', 'error');
    }
  };

  /**
   * Handles adding a new anime record with an assigned random emoji.
   *
   * @param {Object} animeData - Sanitized anime input data.
   */
  const handleAddAnime = async (animeData) => {
    const newAnime = {
      ...animeData,
      emoji: getRandomEmoji(),
    };
    await addAnime(newAnime);
    showNotification(`Added "${animeData.name}"!`, 'success');
  };

  /**
   * Handles saving updates to an existing anime record.
   *
   * @param {number|string} id - Record identifier.
   * @param {Object} animeData - Sanitized updated attributes.
   */
  const handleEditAnime = async (id, animeData) => {
    await updateAnime(id, animeData);
    setEditingAnime(null);
    showNotification(`Updated "${animeData.name}"!`, 'success');
  };

  /**
   * Toggles the completion status of an anime record.
   *
   * @param {number|string} id - Record identifier.
   */
  const handleToggleComplete = async (id) => {
    const anime = animes.find((a) => a.id === id);
    const newCompleted = !anime?.completed;
    await updateAnime(id, { completed: newCompleted });
    showNotification(
      newCompleted ? `Completed "${anime?.name}"! 🎉` : `Marked "${anime?.name}" as incomplete`,
      'info'
    );
  };

  /**
   * Deletes an anime record.
   *
   * @param {number|string} id - Record identifier.
   */
  const handleDeleteAnime = async (id) => {
    const anime = animes.find((a) => a.id === id);
    await deleteAnime(id);
    showNotification(`Deleted "${anime?.name}"`, 'error');
  };

  return (
    <div
      className="min-h-screen relative"
      style={{
        backgroundColor: theme.bg,
        color: theme.textColor,
      }}
    >
      {/* Toast Feedback Overlay */}
      <NotificationToast notification={notification} theme={theme} />

      {/* Syncing Indicator Badge */}
      <SyncIndicator syncing={syncing} theme={theme} />

      {/* Loading Screen Overlay */}
      <LoadingScreen loading={loading} theme={theme} />

      {/* Main Terminal Window Container */}
      <motion.div
        className="max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-8"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <Card
            bg={theme.bg}
            textColor={theme.textColor}
            borderColor={theme.borderColor}
            shadowColor={undefined}
            className="p-3 sm:p-6 border-2"
            style={{ borderWidth: '2px' }}
          >
            {/* Header Component */}
            <Header
              theme={theme}
              storageState={storageState}
              onExportJSON={handleExportJSON}
            />

            {/* Main Interactive Content */}
            <motion.main
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              {/* Add Anime Trigger and Modal */}
              <motion.div
                className="mb-4 sm:mb-6 flex justify-center"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.7, type: 'spring', stiffness: 200 }}
              >
                <AnimeFormModal
                  onAdd={handleAddAnime}
                  onEdit={handleEditAnime}
                  editAnime={editingAnime}
                  isEditMode={Boolean(editingAnime)}
                />
              </motion.div>

              {/* Anime List Display */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
              >
                <AnimeList
                  animes={animes}
                  onToggleComplete={handleToggleComplete}
                  onDelete={handleDeleteAnime}
                  onEdit={setEditingAnime}
                />
              </motion.div>
            </motion.main>

            {/* Terminal Footer */}
            <Footer theme={theme} />
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}

export default App;
