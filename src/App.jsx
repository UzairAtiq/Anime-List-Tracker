import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getRandomEmoji } from './data/emojiList';
import { Card } from 'pixel-retroui';
import { useTheme } from './context/ThemeContext';
import ThemeSwitcher from './components/ThemeSwitcher';
import AnimeForm from './components/AnimeForm';
import AnimeList from './components/AnimeList';
import { useAnimeSync } from './hooks/useAnimeSync';

function App() {
  const { theme } = useTheme();
  const { animes, loading, syncing, storageState, addAnime, updateAnime, deleteAnime } = useAnimeSync();
  const [notification, setNotification] = useState(null);
  const [editingAnime, setEditingAnime] = useState(null);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(animes, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', 'anime_list.json');
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showNotification('Exported anime_list.json!', 'info');
  };

  const handleAddAnime = async (animeData) => {
    const newAnime = {
      ...animeData,
      emoji: getRandomEmoji(),
    };
    await addAnime(newAnime);
    showNotification(`Added "${animeData.name}"!`, 'success');
  };

  const handleEditAnime = async (id, animeData) => {
    await updateAnime(id, animeData);
    setEditingAnime(null);
    showNotification(`Updated "${animeData.name}"!`, 'success');
  };

  const handleToggleComplete = async (id) => {
    const anime = animes.find(a => a.id === id);
    const newCompleted = !anime.completed;
    await updateAnime(id, { completed: newCompleted });
    showNotification(
      newCompleted ? `Completed "${anime?.name}"! 🎉` : `Marked "${anime.name}" as incomplete`,
      'info'
    );
  };

  const handleDeleteAnime = async (id) => {
    const anime = animes.find(a => a.id === id);
    await deleteAnime(id);
    showNotification(`Deleted "${anime?.name}"`, 'error');
  };

  return (
    <div 
      className="min-h-screen relative"
      style={{ 
        backgroundColor: theme.bg,
        color: theme.textColor 
      }}
    >
      {/* Notification Toast */}
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

      {/* Syncing Indicator */}
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
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="text-xl"
            >
              ⚡
            </motion.div>
            <span className="font-black uppercase tracking-wide text-xs">Syncing...</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading Screen */}
      {loading && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: theme.bg }}>
          <motion.div
            className="text-center"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <motion.div
              className="text-6xl mb-4"
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              📺
            </motion.div>
            <p className="font-black uppercase tracking-wide text-xl" style={{ color: theme.textColor }}>
              Loading your anime...
            </p>
          </motion.div>
        </div>
      )}

      {/* Main Terminal Container */}
      <motion.div 
        className="max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-8"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Terminal Border - Using RetroUI Card */}
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
            style={{
              borderWidth: '2px',
            }}
          >
            {/* Header */}
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
              
              {/* Storage Architecture Tier Status */}
              <div 
                className="pt-2 pb-1 flex flex-wrap items-center justify-between gap-2 text-xs font-mono"
                style={{ color: theme.textColor }}
              >
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-black uppercase tracking-wider text-[11px] opacity-75">DB Tier:</span>
                  
                  {/* Tier 1: Supabase */}
                  <span
                    className="px-2 py-0.5 border text-[10px] sm:text-[11px] font-black uppercase transition-all"
                    style={{
                      borderColor: theme.borderColor,
                      backgroundColor: storageState.activeTier === 'supabase' ? theme.textColor : 'transparent',
                      color: storageState.activeTier === 'supabase' ? theme.bg : theme.textColor,
                      opacity: storageState.tierStatuses.supabase.status === 'failed' ? 0.45 : 1,
                      textDecoration: storageState.tierStatuses.supabase.status === 'failed' ? 'line-through' : 'none',
                    }}
                    title={storageState.tierStatuses.supabase.error || 'Tier 1: Supabase Cloud Database'}
                  >
                    1. Supabase {storageState.activeTier === 'supabase' ? '● ACTIVE' : (storageState.tierStatuses.supabase.status === 'failed' ? '✗' : '')}
                  </span>

                  <span className="opacity-50">➔</span>

                  {/* Tier 2: SQLite */}
                  <span
                    className="px-2 py-0.5 border text-[10px] sm:text-[11px] font-black uppercase transition-all"
                    style={{
                      borderColor: theme.borderColor,
                      backgroundColor: storageState.activeTier === 'sqlite' ? theme.textColor : 'transparent',
                      color: storageState.activeTier === 'sqlite' ? theme.bg : theme.textColor,
                      opacity: storageState.tierStatuses.sqlite.status === 'failed' ? 0.45 : 1,
                      textDecoration: storageState.tierStatuses.sqlite.status === 'failed' ? 'line-through' : 'none',
                    }}
                    title="Tier 2: SQLite WebAssembly (In-browser Relational DB with IndexedDB persistence)"
                  >
                    2. SQLite (WASM) {storageState.activeTier === 'sqlite' ? '● ACTIVE' : ''}
                  </span>

                  <span className="opacity-50">➔</span>

                  {/* Tier 3: JSON */}
                  <span
                    className="px-2 py-0.5 border text-[10px] sm:text-[11px] font-black uppercase transition-all"
                    style={{
                      borderColor: theme.borderColor,
                      backgroundColor: storageState.activeTier === 'json' ? theme.textColor : 'transparent',
                      color: storageState.activeTier === 'json' ? theme.bg : theme.textColor,
                    }}
                    title="Tier 3: Local JSON File / Store"
                  >
                    3. JSON {storageState.activeTier === 'json' ? '● ACTIVE' : 'STANDBY'}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleExportJSON}
                  className="px-2 py-0.5 border text-[10px] sm:text-[11px] font-black uppercase hover:opacity-80 transition-opacity flex items-center gap-1"
                  style={{
                    borderColor: theme.borderColor,
                    color: theme.textColor,
                  }}
                  title="Export database as JSON file"
                >
                  <span>💾</span> Export JSON
                </button>
              </div>

              <motion.div 
                className="h-px border-t-2 mt-2"
                style={{ borderColor: theme.borderColor }}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.5, duration: 0.4 }}
              />
            </motion.header>

            {/* Main Content */}
            <motion.main
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              {/* Add Anime Button */}
              <motion.div 
                className="mb-4 sm:mb-6 flex justify-center"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.7, type: "spring", stiffness: 200 }}
              >
                <AnimeForm 
                  onAdd={handleAddAnime} 
                  onEdit={handleEditAnime}
                  editAnime={editingAnime}
                  isEditMode={!!editingAnime}
                />
              </motion.div>

              {/* Anime List */}
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

            {/* Footer */}
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
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}

export default App;
